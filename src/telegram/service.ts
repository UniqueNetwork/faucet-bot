import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { Update } from 'typegram';
import { UniqueUtils } from '@unique-nft/api';
import { SdkService } from '../sdk/service';
import { CacheConfig } from '../config/cache.config';
import { formatDuration } from './utils';

@Injectable()
export class TelegramService {
  private bot: Telegraf<Context<Update>>;

  private readonly ttl: number;

  private readonly currentProgress: Map<number, boolean> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly sdk: SdkService,
  ) {
    this.ttl = this.configService.get<CacheConfig>('cache').ttl;

    this.startBot();
  }

  startBot() {
    this.bot = new Telegraf(this.configService.get('telegramToken'));

    this.bot.on('message', this.onMessage.bind(this));

    this.bot.launch();
  }

  async onMessage(ctx) {
    const address = ctx.message.text;
    if (UniqueUtils.Address.is.substrateAddress(address)) {
      await this.tryDrop(ctx, address);
    } else if (UniqueUtils.Address.is.ethereumAddress(address)) {
      const substrateMirror =
        UniqueUtils.Address.mirror.ethereumToSubstrate(address);
      await this.tryDrop(ctx, substrateMirror);
    } else {
      this.reply(ctx, 'Submit valid Substrate or Ethereum address');
    }
  }

  private reply(ctx, message: string, options?) {
    try {
      return ctx.reply(message, {
        ...options,
        reply_to_message_id: ctx.message.message_id,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async tryDrop(ctx, address: string) {
    if (this.currentProgress.get(ctx.message.from.id)) {
      this.reply(ctx, 'Wait for the completion of the current transaction');
      return;
    }

    const timeNow = Math.floor(Date.now() / 1000);

    const lastTry = await this.cache.get(address);
    const timeLeft = (lastTry?.ctime || 0) + this.ttl - timeNow;
    if (timeLeft > 0) {
      const timeLeftFormat = formatDuration(timeLeft);
      await this.reply(
        ctx,
        `I'm sorry, but you can complete the next transaction in ${timeLeftFormat}`,
      );
      return;
    }

    this.currentProgress.set(ctx.message.from.id, true);
    try {
      const sent = await this.dropToAddress(ctx, address);
      if (sent) {
        await this.cache.set(address, {
          ctime: timeNow,
        });
      }
    } finally {
      this.currentProgress.delete(ctx.message.from.id);
    }
  }

  async dropToAddress(ctx, address: string) {
    await this.reply(ctx, "Just a moment, I'm executing the transaction...");

    const { ok, balance } = await this.sdk.sendTo(address);

    if (!ok) {
      await this.reply(ctx, 'Transaction failed, please try again later');
    }

    await this.reply(
      ctx,
      `The payment successful.
Current balance: ${balance.availableBalance.formatted}`,
      {
        reply_markup: {
          resize_keyboard: true,
          keyboard: [[{ text: ctx.message.text }]],
        },
      },
    );

    return ok;
  }
}
