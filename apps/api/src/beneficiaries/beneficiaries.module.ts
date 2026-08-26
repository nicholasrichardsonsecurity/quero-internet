import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApplicationsController } from './applications.controller';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';

@Module({
  imports: [AuthModule],
  controllers: [BeneficiariesController, ApplicationsController],
  providers: [BeneficiariesService]
})
export class BeneficiariesModule {}
