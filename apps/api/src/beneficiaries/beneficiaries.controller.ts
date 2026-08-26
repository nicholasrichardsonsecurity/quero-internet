import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { BeneficiariesService } from './beneficiaries.service';

@Controller('beneficiaries')
@UseGuards(PermissionsGuard)
export class BeneficiariesController {
  constructor(
    private readonly authService: AuthService,
    private readonly beneficiariesService: BeneficiariesService
  ) {}

  @Post()
  @RequirePermissions(PERMISSIONS.BENEFICIARY_WRITE)
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: {
      tenantId?: string;
      fullName?: string;
      identityDocument?: string;
      birthDate?: string;
      phone?: string;
      email?: string;
    }
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.beneficiariesService.createBeneficiary(context, {
      tenantId: body.tenantId,
      fullName: body.fullName ?? '',
      identityDocument: body.identityDocument ?? '',
      birthDate: body.birthDate,
      phone: body.phone,
      email: body.email
    });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.BENEFICIARY_READ)
  async list(
    @Headers('authorization') authorization: string | undefined,
    @Query('tenantId') tenantId?: string
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.beneficiariesService.listBeneficiaries(context, tenantId);
  }

  @Post(':beneficiaryId/applications')
  @RequirePermissions(PERMISSIONS.BENEFICIARY_WRITE)
  async submitApplication(
    @Headers('authorization') authorization: string | undefined,
    @Param('beneficiaryId') beneficiaryId: string,
    @Body() body: { programId?: string }
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.beneficiariesService.createApplication(context, beneficiaryId, {
      programId: body.programId ?? ''
    });
  }
}
