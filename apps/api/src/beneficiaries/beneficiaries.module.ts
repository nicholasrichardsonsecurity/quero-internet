import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApplicationsController } from './applications.controller';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';
import { EligibilityReviewService } from './eligibility-review.service';
import { FtthFeasibilityController } from './ftth-feasibility.controller';
import { FtthFeasibilityService } from './ftth-feasibility.service';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [AuthModule],
  controllers: [BeneficiariesController, ApplicationsController, ReferralsController, FtthFeasibilityController],
  providers: [BeneficiariesService, EligibilityReviewService, ReferralsService, FtthFeasibilityService]
})
export class BeneficiariesModule {}
