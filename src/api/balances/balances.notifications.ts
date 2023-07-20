import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { BalancesConfig } from '../../config/balances.config';
import { SlackConfig } from '../../config/config.module';
import { ConfigService } from '@nestjs/config';
import * as BigNumber from 'big-number';
import { BalanceData, ChainBalanceData, markdownTemplate } from './types';
import { BalancesService } from './balances.service';

@Injectable()
export class BalancesNotifications implements OnModuleInit {
  private logger = new Logger(BalancesNotifications.name);

  private balanceConfig: BalancesConfig;
  private slackConfig: SlackConfig;
  private adminUsers: number[];

  private web: WebClient;

  constructor(config: ConfigService, private balancesService: BalancesService) {
    this.balanceConfig = config.get<BalancesConfig>('balances');
    this.adminUsers = config.get<number[]>('adminUsers');
    this.slackConfig = config.get<SlackConfig>('slack');
  }

  async onModuleInit(): Promise<void> {
    const slackNotificationsAvailable =
      this.slackConfig.token &&
      this.balanceConfig.criticalValue &&
      this.slackConfig.channelName;

    if (!slackNotificationsAvailable) return;

    this.web = new WebClient(this.slackConfig.token);
    setInterval(async () => {
      await this.checkBalances();
    }, 5 * 3_600_000);

    await this.checkBalances();
  }

  private async checkBalances() {
    const criticalValue = BigNumber(this.balanceConfig.criticalValue);
    this.logger.log(`check balances, critical value: ${criticalValue}`);

    const chainBalances = await Promise.all([
      this.balancesService.getBalances(this.balanceConfig.unique),
      this.balancesService.getBalances(this.balanceConfig.quartz),
    ]);

    this.logger.log('chain balances', JSON.stringify(chainBalances, null, 2));

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
${this.balancesService.balancesToString(
  chainBalanceData.balances,
  markdownTemplate,
)}`;
      })
      .join('\n\n');

    const mentions = this.slackConfig.mentionUsers
      .map((id) => `<@${id}>`)
      .join(' ');

    try {
      const postMessageResult = await this.web.chat.postMessage({
        link_names: true,
        text: `Not enough money on the account
        
${message}


${mentions}`,
        channel: this.slackConfig.channelName,
      });
      this.logger.log('post message result', postMessageResult);
    } catch (err) {
      this.logger.error(
        'post message error',
        err.message,
        JSON.stringify(err, null, 2),
      );
    }
  }
}
