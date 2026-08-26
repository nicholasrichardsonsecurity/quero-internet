import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { BeneficiariesService } from './beneficiaries.service';

@Controller('applications')
@UseGuards(PermissionsGuard)
export class ApplicationsController {
  constructor(
    private readonly authService: AuthService,
    private readonly beneficiariesService: BeneficiariesService
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
}
