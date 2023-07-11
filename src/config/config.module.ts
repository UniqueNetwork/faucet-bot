import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
import { CacheConfig, createCacheConfig } from './cache.config';

export interface AddressConfig {
  name: string;
  address: string;
}
export interface BalancesChainConfig {
  name: string;
  marketUrl: string;
  restUrl: string;
  addressList: AddressConfig[];
}

export interface BalancesConfig {
  criticalValue: string;
  mentionSlackUsers: string[];
  unique: BalancesChainConfig;
  quartz: BalancesChainConfig;
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
  slackToken: string;
  balances: BalancesConfig;
};

function parseBalances(
  name: string,
  marketUrl: string,
  restUrl: string,
  addressEnv: string,
): BalancesChainConfig {
  return {
    name,
    marketUrl,
    restUrl,
    addressList: addressEnv.split(',').map((line) => {
      const [name, address] = line.split(':');
      return {
        name,
        address,
      };
    }),
  };
}

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
  slackToken: process.env.SLACK_TOKEN,

  balances: {
    criticalValue: process.env.BALANCE_CRITICAL_VALUE,
    mentionSlackUsers: process.env.BALANCE_MENTION_SLACK_USERS
      ? process.env.BALANCE_MENTION_SLACK_USERS.split(',')
      : [],
    unique: parseBalances(
      'unique',
      process.env.UNIQUE_MAPI,
      process.env.UNIQUE_REST,
      process.env.UNIQUE_ADDRESS,
    ),
    quartz: parseBalances(
      'quartz',
      process.env.QUARTZ_MAPI,
      process.env.QUARTZ_REST,
      process.env.QUARTZ_ADDRESS,
    ),
  },
});

export const GlobalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [loadConfig],
});
