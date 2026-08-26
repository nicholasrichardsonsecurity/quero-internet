import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { BeneficiariesService } from './beneficiaries.service';
import { EligibilityReviewService } from './eligibility-review.service';

@Controller('applications')
@UseGuards(PermissionsGuard)
export class ApplicationsController {
  constructor(
    private readonly authService: AuthService,
    private readonly beneficiariesService: BeneficiariesService,
    private readonly eligibilityReviewService: EligibilityReviewService
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.BENEFICIARY_READ)
  async list(
    @Headers('authorization') authorization: string | undefined,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('programId') programId?: string
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.beneficiariesService.listApplications(context, tenantId, status, programId);
  }

  @Patch(':applicationId/status')
  @RequirePermissions(PERMISSIONS.BENEFICIARY_WRITE)
  async changeStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('applicationId') applicationId: string,
    @Body() body: { status?: string; reason?: string }
  ) {
    if (!body.status || !Object.values(ApplicationStatus).includes(body.status as ApplicationStatus)) {
      throw new BadRequestException('Status de solicitação inválido.');
    }

    const context = await this.authService.resolveAuthorization(authorization);
    return this.eligibilityReviewService.transition(
      context,
      applicationId,
      body.status as ApplicationStatus,
      body.reason
    );
  }
}
