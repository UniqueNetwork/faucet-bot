import { Module } from '@nestjs/common';
import { TelegramService } from './telegram/service';
import { GlobalConfigModule } from './config/config.module';
import { CacheModule } from './cache.module';
import { SdkService } from './sdk/service';
import { accountProvider, sdkProvider } from './sdk/providers';

@Module({
  imports: [GlobalConfigModule, CacheModule],
  controllers: [],
  providers: [accountProvider, sdkProvider, SdkService, TelegramService],
})
export class AppModule {}
