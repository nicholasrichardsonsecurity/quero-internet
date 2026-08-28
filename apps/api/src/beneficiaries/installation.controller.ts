import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InstallationStatus } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { InstallationService } from './installation.service';
import { isInstallationStatus } from './installation-state';

@Controller('provider-referrals/:referralId/installation')
@UseGuards(PermissionsGuard)
export class InstallationController {
  constructor(private readonly authService: AuthService, private readonly service: InstallationService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.INSTALLATION_WRITE)
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Param('referralId') referralId: string
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.service.createForReferral(context, referralId);
  }

  @Patch('status')
  @RequirePermissions(PERMISSIONS.INSTALLATION_WRITE)
  async transition(
    @Headers('authorization') authorization: string | undefined,
    @Param('referralId') referralId: string,
    @Body() body: {
      nextStatus?: string;
      scheduledAt?: string;
      reason?: string;
      installationSummary?: string;
      externalServiceReference?: string;
    }
  ) {
    if (!body.nextStatus || !isInstallationStatus(body.nextStatus)) {
      throw new BadRequestException('Status de instalação inválido.');
    }
    if (body.nextStatus === InstallationStatus.INSTALLATION_PENDING) {
      throw new BadRequestException('Não é permitido retornar a ordem ao estado inicial.');
    }

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : undefined;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('scheduledAt inválido.');

    const context = await this.authService.resolveAuthorization(authorization);
    return this.service.transition(context, referralId, {
      nextStatus: body.nextStatus as InstallationStatus,
      scheduledAt,
      reason: body.reason,
      installationSummary: body.installationSummary,
      externalServiceReference: body.externalServiceReference
    });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.INSTALLATION_READ)
  async get(
    @Headers('authorization') authorization: string | undefined,
    @Param('referralId') referralId: string
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.service.getForReferral(context, referralId);
  }
}
