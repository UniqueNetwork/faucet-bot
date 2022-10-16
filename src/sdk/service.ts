import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IClient } from '@unique-nft/sdk';
import { InjectAccount, InjectSdk } from './providers';
import { Account } from '@unique-nft/accounts';

@Injectable()
export class SdkService implements OnModuleInit {
  private readonly logger = new Logger(SdkService.name);

  constructor(
    @InjectSdk private readonly sdk: IClient,
    @InjectAccount private readonly account: Account,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const address = this.account.getAddress();
    const { freeBalance } = await this.sdk.balance.get({ address });

    this.logger.log(
      `Bot (${address}) has ${freeBalance.formatted} (${freeBalance.amount}) free balance`,
    );
  }

  public async sendTo(destination: string) {
    const amount = this.configService.get('dropAmount');
    const address = this.account.getAddress();

    try {
      const result = await this.sdk.balance.transfer.submitWaitResult({
        address,
        destination,
        amount,
      });

      const balance = await this.sdk.balance.get({
        address: destination,
      });

      return {
        ok: !result.isError,
        balance,
      };
    } catch (error) {
      this.logger.error(error);

      return { ok: false };
    }
  }
}
