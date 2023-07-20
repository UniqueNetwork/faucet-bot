import { Module } from '@nestjs/common';
import { GlobalConfigModule } from './config/config.module';
import { CacheModule } from './cache.module';
import { ApiModule } from './api/api.module';
import { TelegramModule } from './telegram/telegram.module';
import { SdkModule } from './sdk/sdk.module';

@Module({
  imports: [
    GlobalConfigModule,
    CacheModule,
    SdkModule,
    TelegramModule,
    ApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
