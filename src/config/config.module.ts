import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
import { CacheConfig, createCacheConfig } from './cache.config';

export type Config = {
  port: number;
  seed: string;
  restUrl: string;
  telegramToken: string;
  dropAmount: number;

  cache: CacheConfig;
};

const loadConfig = (): Config => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  seed: process.env.SEED,
  restUrl: process.env.REST_URL,
  telegramToken: process.env.TELEGRAM_TOKEN,
  dropAmount: +process.env.DROP_AMOUNT || 3000,

  cache: createCacheConfig(process.env),
});

export const GlobalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [loadConfig],
});
