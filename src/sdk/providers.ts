import { Inject, Provider } from '@nestjs/common';
import { IClient, Sdk } from '@unique-nft/sdk';
import { KeyringProvider } from '@unique-nft/accounts/keyring';
import { Account, SignatureType } from '@unique-nft/accounts';
import { ConfigService } from '@nestjs/config';

export const InjectAccount = Inject('Account');
export const InjectSdk = Inject('Sdk');

export const accountProvider: Provider = {
  provide: 'Account',
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const keyringProvider = new KeyringProvider({
      type: SignatureType.Sr25519,
    });

    await keyringProvider.init();

    return keyringProvider.addSeed(configService.get<string>('seed'));
  },
};

export const sdkProvider: Provider = {
  provide: 'Sdk',
  inject: ['Account', ConfigService],
  useFactory: async (
    account: Account,
    configService: ConfigService,
  ): Promise<IClient> => {
    const restUrl = configService.get<string>('restUrl');

    return new Sdk({
      signer: account,
      baseUrl: restUrl,
    });
  },
};
