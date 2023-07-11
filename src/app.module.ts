import { Module } from '@nestjs/common';
import { TelegramService } from './telegram/telegram.service';
import { GlobalConfigModule } from './config/config.module';
import { CacheModule } from './cache.module';
import { SdkService } from './sdk/service';
import { FaucetService } from './telegram/faucet.service';
import { BalancesService } from './telegram/balances.service';

@Module({
  imports: [GlobalConfigModule, CacheModule],
  controllers: [],
  providers: [SdkService, TelegramService, FaucetService, BalancesService],
})
export class AppModule {}
