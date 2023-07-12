import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
import { CacheConfig, createCacheConfig } from './cache.config';
import { BalancesConfig, createBalancesConfig } from './balances.config';

export interface SlackConfig {
  token: string;
  channelName: string;
  mentionUsers: string[];
}

export type Config = {
  port: number;
  seed: string;
  restUrl: string;
  telegramToken: string;
  dropAmount: number;
  adminAddresses: string[];

  cache: CacheConfig;

  adminUsers: number[];
  slack: SlackConfig;
  balances: BalancesConfig;
};

const loadConfig = (): Config => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  seed: process.env.SEED,
  restUrl: process.env.REST_URL,
  telegramToken: process.env.TELEGRAM_TOKEN,
  dropAmount: +process.env.DROP_AMOUNT || 3000,
  adminAddresses: process.env.ADMIN_ADDRESSES
    ? process.env.ADMIN_ADDRESSES.split(',')
        .map((address) => address.trim())
        .filter((address) => !!address)
        .map((address) => address.toLowerCase())
    : [],

  cache: createCacheConfig(process.env),
  adminUsers: process.env.ADMIN_USERS
    ? process.env.ADMIN_USERS.split(',')
        .map((user) => +user)
        .filter((user) => !!user)
    : [],
  slack: {
    token: process.env.SLACK_TOKEN,
    channelName: process.env.SLACK_CHANNEL_NAME,
    mentionUsers: process.env.SLACK_MENTION_USERS
      ? process.env.SLACK_MENTION_USERS.split(',')
      : [],
  },

  balances: createBalancesConfig(),
});

export const GlobalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [loadConfig],
});
