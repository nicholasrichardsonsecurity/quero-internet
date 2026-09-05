import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MunicipalBillingController } from './municipal-billing.controller';
import { MunicipalBillingService } from './municipal-billing.service';

@Module({
  imports: [AuthModule],
  controllers: [MunicipalBillingController],
  providers: [MunicipalBillingService]
})
export class MunicipalBillingModule {}
