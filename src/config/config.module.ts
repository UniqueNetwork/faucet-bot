import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
import { CacheConfig, createCacheConfig } from './cache.config';

export type Config = {
  port: number;
  seed: string;
  restUrl: string;
  telegramToken: string;
  dropAmount: number;
  adminAddresses: string[];

  cache: CacheConfig;
};

const loadConfig = (): Config => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  seed: process.env.SEED,
  restUrl: process.env.REST_URL,
  telegramToken: process.env.TELEGRAM_TOKEN,
  dropAmount: +process.env.DROP_AMOUNT || 3000,
  adminAddresses: process.env.ADMIN_ADDRESSES
    ? process.env.ADMIN_ADDRESSES.split(',')
        .filter((address) => !!address)
        .map((address) => address.toLowerCase())
    : [],

  cache: createCacheConfig(process.env),
});

export const GlobalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [loadConfig],
});
