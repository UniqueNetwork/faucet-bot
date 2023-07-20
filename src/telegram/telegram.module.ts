import { Module } from '@nestjs/common';
import { FaucetService } from './faucet.service';
import { TelegramService } from './telegram.service';

@Module({
  imports: [],
  providers: [FaucetService, TelegramService],
})
export class TelegramModule {}
