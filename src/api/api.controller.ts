import { Controller, Get, Logger, Post } from '@nestjs/common';
import { BalancesService } from './balances/balances.service';

@Controller('api')
export class ApiController {
  private logger = new Logger(ApiController.name);
  constructor(private readonly balancesService: BalancesService) {}

  @Post('/balances')
  private showBalances() {
    this.logger.log('Show balances');
    try {
      return this.balancesService.showBalances();
    } catch (err) {
      this.logger.log(`Show balances Error ${err.message}`, err);
    }
  }
}
