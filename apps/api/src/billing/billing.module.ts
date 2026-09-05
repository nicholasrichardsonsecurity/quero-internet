import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BillingController } from './billing.controller';
import { InternalBillingController } from './internal-billing.controller';
import { InternalBillingService } from './internal-billing.service';
import { BillingService } from './billing.service';
@Module({imports:[DatabaseModule],controllers:[BillingController, InternalBillingController],providers:[BillingService, InternalBillingService]})
export class BillingModule {}
