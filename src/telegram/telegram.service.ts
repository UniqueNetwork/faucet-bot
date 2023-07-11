import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { Update } from 'typegram';
import { Address } from '@unique-nft/utils';
import { FaucetService } from './faucet.service';
import { BalancesService } from './balances.service';

@Injectable()
export class TelegramService {
  @Inject(FaucetService)
  private faucetService: FaucetService;

  @Inject(BalancesService)
  private balancesService: BalancesService;

  private bot: Telegraf<Context<Update>>;

  constructor(private readonly configService: ConfigService) {
    this.startBot();
  }

  startBot() {
    this.bot = new Telegraf(this.configService.get('telegramToken'));

    this.bot.on('message', this.onMessage.bind(this));

    this.bot.launch();
  }

  async onMessage(ctx) {
    const text = ctx.message?.text || '';

    if (text === '/balances') {
      return this.balancesService.showBalances(ctx);
    }

    const isAddress =
      Address.is.substrateAddress(text) || Address.is.ethereumAddress(text);
    if (isAddress) {
      this.faucetService.onReceiveAddress(ctx, text);
    } else {
      await ctx.reply('Submit valid Substrate or Ethereum address');
    }
  }
}
