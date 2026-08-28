import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApplicationsController } from './applications.controller';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';
import { EligibilityReviewService } from './eligibility-review.service';
import { FtthFeasibilityController } from './ftth-feasibility.controller';
import { FtthFeasibilityService } from './ftth-feasibility.service';
import { InstallationController } from './installation.controller';
import { InstallationService } from './installation.service';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { ServiceLifecycleController } from './service-lifecycle.controller';
import { ServiceLifecycleService } from './service-lifecycle.service';

@Module({
  imports: [AuthModule],
  controllers: [
    BeneficiariesController,
    ApplicationsController,
    ReferralsController,
    FtthFeasibilityController,
    InstallationController,
    ServiceLifecycleController
  ],
  providers: [
    BeneficiariesService,
    EligibilityReviewService,
    ReferralsService,
    FtthFeasibilityService,
    InstallationService,
    ServiceLifecycleService
  ]
})
export class BeneficiariesModule {}
