import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IClient } from '@unique-nft/sdk';
import { InjectAccount, InjectSdk } from './providers';
import { Account } from '@unique-nft/accounts';

@Injectable()
export class SdkService implements OnModuleInit {
  private readonly logger = new Logger(SdkService.name);
  private readonly dropAmount: number;

  constructor(
    @InjectSdk private readonly sdk: IClient,
    @InjectAccount private readonly account: Account,
    configService: ConfigService,
  ) {
    this.dropAmount = configService.get<number>('dropAmount');
  }

  async onModuleInit(): Promise<void> {
    const address = this.account.getAddress();
    const {
      freeBalance: { formatted, amount },
    } = await this.sdk.balance.get({ address });

    this.logger.log(`Bot substrate address is ${address}`);
    this.logger.log(`Bot has ${formatted} (${amount}) free balance`);
    this.logger.log(`Bot going to drop ${this.dropAmount} on each request`);
  }

  public async sendTo(destination: string) {
    const amount = this.dropAmount;
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
