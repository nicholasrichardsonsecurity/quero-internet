import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProviderBillingController } from './provider-billing.controller';
import { ProviderBillingService } from './provider-billing.service';

@Module({
  imports: [AuthModule],
  controllers: [ProviderBillingController],
  providers: [ProviderBillingService]
})
export class ProviderBillingModule {}
