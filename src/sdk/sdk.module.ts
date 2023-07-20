import { Global, Module } from '@nestjs/common';
import { accountProvider, sdkProvider } from './sdk.providers';
import { SdkService } from './sdk.service';

@Global()
@Module({
  providers: [accountProvider, sdkProvider, SdkService],
  exports: [SdkService],
})
export class SdkModule {}
