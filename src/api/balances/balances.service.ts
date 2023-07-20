import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { ConfigService } from '@nestjs/config';
import {
  AddressConfig,
  BalancesChainConfig,
  BalancesConfig,
} from '../../config/balances.config';
import { BalanceData, ChainBalanceData, markdownTemplate } from './types';

@Injectable()
export class BalancesService {
  private balanceConfig: BalancesConfig;

  constructor(config: ConfigService) {
    this.balanceConfig = config.get<BalancesConfig>('balances');
  }

  private async getContractAddress(
    balanceConfig: BalancesChainConfig,
  ): Promise<string | null> {
    if (!balanceConfig.marketUrl) return null;

    const url = `${balanceConfig.marketUrl}/settings`;
    const settings = await fetch(url).then((res) => res.json());
    const contracts = settings.blockchain?.unique?.contracts;
    if (!contracts?.length) return null;

    const lastContract = contracts[contracts.length - 1];
    return lastContract.address;
  }

  private async getBalance(restUrl: string, address: string) {
    if (!restUrl) return null;
    const url = `${restUrl}/balance?address=${address}`;
    return fetch(url).then((res) => res.json());
  }

  public async getBalances(
    balanceConfig: BalancesChainConfig,
  ): Promise<ChainBalanceData> {
    const contractAddress = await this.getContractAddress(balanceConfig);

    const addresses: AddressConfig[] = [...balanceConfig.addressList];
    if (contractAddress) {
      addresses.push({
        name: 'contract',
        address: contractAddress,
      });
    }

    const balances = await Promise.all(
      addresses.map((config: AddressConfig) => {
        return this.getBalance(balanceConfig.restUrl, config.address).then(
          (value) => {
            return value
              ? {
                  name: config.name,
                  address: config.address,
                  balance: value.availableBalance,
                }
              : undefined;
          },
        );
      }),
    );

    return {
      name: balanceConfig.name,
      balances: balances.filter((b) => !!b),
    };
  }

  public balancesToString(balances: BalanceData[], template) {
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

  public async showBalances() {
    const chainBalances = await Promise.all([
      this.getBalances(this.balanceConfig.unique),
      this.getBalances(this.balanceConfig.quartz),
    ]);
    const message = chainBalances
      .map((chainBalanceData: ChainBalanceData) => {
        return `${chainBalanceData.name}:
${this.balancesToString(chainBalanceData.balances, markdownTemplate)}`;
      })
      .join('\n\n');

    return message;
  }
}
