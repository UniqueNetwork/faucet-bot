import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeyringAccount, KeyringProvider } from '@unique-nft/accounts/keyring';
import { SignatureType } from '@unique-nft/accounts';
import { IClient, Sdk } from '@unique-nft/sdk';

@Injectable()
export class SdkService {
  private sdk: IClient;
  private account: KeyringAccount;

  constructor(private readonly configService: ConfigService) {}

  private async createSdk() {
    const keyringProvider = new KeyringProvider({
      type: SignatureType.Sr25519,
    });
    await keyringProvider.init();

    this.account = keyringProvider.addSeed(this.configService.get('seed'));
    const restUrl = this.configService.get('restUrl');

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
      await this.sdk.balance.transfer.submitWaitResult({
        address,
        destination,
        amount,
      });

      const balance = await this.sdk.balance.get({
        address: destination,
      });

      return {
        ok: true,
        balance,
      };
    } catch (err) {
      console.error(err, JSON.stringify(err.details, null, 2));
      return {
        ok: false,
      };
    }
  }
}
