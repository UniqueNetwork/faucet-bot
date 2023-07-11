import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Address } from '@unique-nft/utils';
import { formatDuration } from './utils';
import { ConfigService } from '@nestjs/config';
import { SdkService } from '../sdk/service';
import { CacheConfig } from '../config/cache.config';

@Injectable()
export class FaucetService {
  private readonly ttl: number;
  private readonly currentProgress: Map<number, boolean> = new Map();
  private readonly adminAddresses: string[];

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly sdk: SdkService,
  ) {
    this.ttl = this.configService.get<CacheConfig>('cache').ttl;
    this.adminAddresses = this.configService.get('adminAddresses');
  }

  public async onReceiveAddress(ctx, address: string) {
    if (Address.is.substrateAddress(address)) {
      await this.tryDrop(ctx, address);
    } else if (Address.is.ethereumAddress(address)) {
      const substrateMirror = Address.mirror.ethereumToSubstrate(address);
      await this.tryDrop(ctx, substrateMirror);
    }
  }

  async tryDrop(ctx, address: string) {
    if (this.currentProgress.get(ctx.message.from.id)) {
      this.reply(ctx, 'Wait for the completion of the current transaction');
      return;
    }

    const timeNow = Math.floor(Date.now() / 1000);

    if (!(await this.availableByTtl(ctx, address, timeNow))) {
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
      return false;
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

  async availableByTtl(ctx, address: string, timeNow: number) {
    if (this.adminAddresses.includes(address.toLowerCase())) return true;

    const lastTry = await this.cache.get(address);
    const timeLeft = (lastTry?.ctime || 0) + this.ttl - timeNow;
    if (timeLeft > 0) {
      const timeLeftFormat = formatDuration(timeLeft);
      await this.reply(
        ctx,
        `I'm sorry, but you can complete the next transaction in ${timeLeftFormat}`,
      );
      return false;
    }

    return true;
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
}
