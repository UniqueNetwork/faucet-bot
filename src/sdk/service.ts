import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Account } from '@unique-nft/accounts';
import { KeyringProvider } from '@unique-nft/accounts/keyring';
import { SignatureType } from '@unique-nft/accounts';
import { IClient, Sdk } from '@unique-nft/sdk';
import { KeyringPair } from '@polkadot/keyring/types';

@Injectable()
export class SdkService {
  private sdk: IClient;
  private account: Account<KeyringPair>;

  private readonly logger = new Logger(SdkService.name);

  constructor(private readonly configService: ConfigService) {}

  private async createSdk() {
    const keyringProvider = new KeyringProvider({
      type: SignatureType.Sr25519,
    });

    await keyringProvider.init();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.account = keyringProvider.addSeed(
      this.configService.get<string>('seed'),
    );

    const restUrl = this.configService.get<string>('restUrl');

    this.sdk = new Sdk({
      signer: this.account,
      baseUrl: restUrl,
    });
  }

  public async sendTo(destination: string) {
    if (!this.sdk) {
      await this.createSdk();
    }
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
