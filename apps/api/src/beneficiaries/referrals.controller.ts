import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProviderReferralStatus } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { ReferralsService } from './referrals.service';

@Controller()
@UseGuards(PermissionsGuard)
export class ReferralsController {
  constructor(
    private readonly authService: AuthService,
    private readonly referralsService: ReferralsService
  ) {}

  @Post('applications/:applicationId/referrals')
  @RequirePermissions(PERMISSIONS.REFERRAL_WRITE)
  async refer(
    @Headers('authorization') authorization: string | undefined,
    @Param('applicationId') applicationId: string,
    @Body() body: { providerOrganizationId?: string }
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.referralsService.referApplication(context, applicationId, body.providerOrganizationId ?? '');
  }

  @Get('provider-referrals')
  @RequirePermissions(PERMISSIONS.REFERRAL_READ)
  async listProviderReferrals(
    @Headers('authorization') authorization: string | undefined,
    @Query('status') status?: string
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.referralsService.listProviderReferrals(context, status);
  }

  @Patch('provider-referrals/:referralId/status')
  @RequirePermissions(PERMISSIONS.REFERRAL_WRITE)
  async respond(
    @Headers('authorization') authorization: string | undefined,
    @Param('referralId') referralId: string,
    @Body() body: { status?: string; reason?: string }
  ) {
    if (!body.status || !Object.values(ProviderReferralStatus).includes(body.status as ProviderReferralStatus)) {
      throw new BadRequestException('Status de encaminhamento inválido.');
    }

    const context = await this.authService.resolveAuthorization(authorization);
    return this.referralsService.respondToReferral(
      context,
      referralId,
      body.status as ProviderReferralStatus,
      body.reason
    );
  }
}
