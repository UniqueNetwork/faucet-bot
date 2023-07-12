import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { Update } from 'typegram';
import { Address } from '@unique-nft/utils';
import { FaucetService } from './faucet.service';
import { BalancesService } from './balances.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);

  @Inject(FaucetService)
  private faucetService: FaucetService;

  @Inject(BalancesService)
  private balancesService: BalancesService;

  private bot: Telegraf<Context<Update>>;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.bot = new Telegraf(this.configService.get('telegramToken'));

    this.bot.on('message', this.onMessage.bind(this));

    await this.bot.launch();

    const { username } = this.bot.botInfo;
    this.logger.log(`Bot started - https://t.me/${username} (@${username})`);
  }

  async onMessage(ctx) {
    const text = ctx.message?.text || '';

    if (text === '/balances') {
      return this.balancesService.showBalances(ctx);
    }

    const isAddress =
      Address.is.substrateAddress(text) || Address.is.ethereumAddress(text);
    if (isAddress) {
      await this.faucetService.onReceiveAddress(ctx, text);
    } else {
      await ctx.reply('Submit valid Substrate or Ethereum address');
    }
  }
}
