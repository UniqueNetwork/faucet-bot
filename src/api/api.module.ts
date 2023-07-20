import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { BalancesService } from './balances/balances.service';
import { BalancesNotifications } from './balances/balances.notifications';

@Module({
  controllers: [ApiController],
  providers: [BalancesService, BalancesNotifications],
})
export class ApiModule {}
