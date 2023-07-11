import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { ConfigService } from '@nestjs/config';
import {
  AddressConfig,
  BalancesChainConfig,
  BalancesConfig,
} from '../config/config.module';
import { BalanceResponse } from '@unique-nft/sdk';
import * as BigNumber from 'big-number';
import { WebClient } from '@slack/web-api';

interface BalanceData {
  name: string;
  address: string;
  balance: BalanceResponse;
}

interface ChainBalanceData {
  name: string;
  balances: BalanceData[];
}

const htmlTemplate = `{index}) {name} - <b>{balance}</b>
<code>{address}</code>`;
const markdownTemplate = `{index}) {name} - *{balance}*
\`{address}\``;

@Injectable()
export class BalancesService {
  private balanceConfig: BalancesConfig;
  private adminUsers: number[];

  private web: WebClient;
  constructor(config: ConfigService) {
    this.balanceConfig = config.get<BalancesConfig>('balances');
    this.adminUsers = config.get<number[]>('adminUsers');

    this.web = new WebClient(config.get('slackToken'));

    setInterval(() => {
      this.checkBalances();
    }, 5 * 3_600_000);
    // this.checkBalances();
  }

  private async getContractAddress(
    balanceConfig: BalancesChainConfig,
  ): Promise<string> {
    const url = `${balanceConfig.marketUrl}/settings`;
    const settings = await fetch(url).then((res) => res.json());
    const contracts = settings.blockchain?.unique?.contracts;
    const lastContract = contracts[contracts.length - 1];
    return lastContract.address;
  }

  private async getBalance(restUrl: string, address: string) {
    const url = `${restUrl}/balance?address=${address}`;
    return fetch(url).then((res) => res.json());
  }

  private async getBalances(
    balanceConfig: BalancesChainConfig,
  ): Promise<ChainBalanceData> {
    const contractAddress = await this.getContractAddress(balanceConfig);

    const addresses: AddressConfig[] = [
      ...balanceConfig.addressList,
      {
        name: 'contract',
        address: contractAddress,
      },
    ];

    const balances = await Promise.all(
      addresses.map((config: AddressConfig) => {
        return this.getBalance(balanceConfig.restUrl, config.address).then(
          (value) => {
            return {
              name: config.name,
              address: config.address,
              balance: value.availableBalance,
            };
          },
        );
      }),
    );

    return {
      name: balanceConfig.name,
      balances,
    };
  }

  private balancesToString(balances: BalanceData[], template) {
    return balances
      .map((data, index) => {
        return template
          .replace('{index}', `${index + 1}`)
          .replace('{name}', data.name)
          .replace('{address}', data.address)
          .replace(
            '{balance}',
            data.balance.formatted + ' ' + data.balance.unit,
          );
      })
      .join('\n\n');
  }

  public async showBalances(ctx) {
    const userId = ctx.from.id;
    if (!this.adminUsers.includes(userId)) {
      return ctx.reply(`User ${userId} is not admin`);
    }
    const chainBalances = await Promise.all([
      this.getBalances(this.balanceConfig.unique),
      this.getBalances(this.balanceConfig.quartz),
    ]);
    const message = chainBalances
      .map((chainBalanceData: ChainBalanceData) => {
        return `${chainBalanceData.name}:
${this.balancesToString(chainBalanceData.balances, htmlTemplate)}`;
      })
      .join('\n\n');

    return ctx.reply(message, {
      parse_mode: 'HTML',
    });
  }

  private async checkBalances() {
    const criticalValue = BigNumber(this.balanceConfig.criticalValue);

    const chainBalances = await Promise.all([
      this.getBalances(this.balanceConfig.unique),
      this.getBalances(this.balanceConfig.quartz),
    ]);

    const criticalBalances = chainBalances
      .map((chainBalance) => {
        return {
          name: chainBalance.name,
          balances: chainBalance.balances.filter((balanceData: BalanceData) => {
            return BigNumber(balanceData.balance.raw).lt(criticalValue);
          }),
        };
      })
      .filter((chainBalance) => chainBalance.balances.length);

    if (!criticalBalances.length) return;

    const message = criticalBalances
      .map((chainBalanceData: ChainBalanceData) => {
        return `${chainBalanceData.name}:
${this.balancesToString(chainBalanceData.balances, markdownTemplate)}`;
      })
      .join('\n\n');

    const mentions = this.balanceConfig.mentionSlackUsers
      .map((id) => `<@${id}>`)
      .join(' ');

    try {
      await this.web.chat.postMessage({
        link_names: true,
        text: `Not enough money on the account
        
${message}


${mentions}`,
        channel: '#test-bot-alerts',
      });
    } catch (err) {
      console.log('err', err.message, JSON.stringify(err, null, 2));
    }
  }
}
