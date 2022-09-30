import { Module } from '@nestjs/common';
import { TelegramService } from './telegram/service';
import { GlobalConfigModule } from './config/config.module';
import { CacheModule } from './cache.module';
import { SdkService } from './sdk/service';

@Module({
  imports: [GlobalConfigModule, CacheModule],
  controllers: [],
  providers: [SdkService, TelegramService],
})
export class AppModule {}
