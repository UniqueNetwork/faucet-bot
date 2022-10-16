import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IClient } from '@unique-nft/sdk';
import { InjectAccount, InjectSdk } from './providers';

@Injectable()
export class SdkService {
  private readonly logger = new Logger(SdkService.name);

  constructor(
    @InjectSdk private readonly sdk: IClient,
    @InjectAccount private readonly account,
    private readonly configService: ConfigService,
  ) {}

  public async sendTo(destination: string) {
    const amount = this.configService.get('dropAmount');
    const address = this.account.instance.address;

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
