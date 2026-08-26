import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApplicationsController } from './applications.controller';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';
import { EligibilityReviewService } from './eligibility-review.service';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [AuthModule],
  controllers: [BeneficiariesController, ApplicationsController, ReferralsController],
  providers: [BeneficiariesService, EligibilityReviewService, ReferralsService]
})
export class BeneficiariesModule {}
