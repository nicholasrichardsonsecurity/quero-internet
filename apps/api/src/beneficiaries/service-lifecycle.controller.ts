import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { isServiceStatus } from './service-lifecycle-state';
import { ServiceLifecycleService } from './service-lifecycle.service';

@Controller('provider-referrals/:referralId/service')
@UseGuards(PermissionsGuard)
export class ServiceLifecycleController {
  constructor(private readonly authService: AuthService, private readonly service: ServiceLifecycleService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.SERVICE_WRITE)
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Param('referralId') referralId: string
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.service.createForReferral(context, referralId);
  }

  @Patch('status')
  @RequirePermissions(PERMISSIONS.SERVICE_WRITE)
  async transition(
    @Headers('authorization') authorization: string | undefined,
    @Param('referralId') referralId: string,
    @Body() body: { nextStatus?: string; reason?: string }
  ) {
    if (!body.nextStatus || !isServiceStatus(body.nextStatus)) {
      throw new BadRequestException('Status de serviço inválido.');
    }

    const context = await this.authService.resolveAuthorization(authorization);
    return this.service.transition(context, referralId, {
      nextStatus: body.nextStatus,
      reason: body.reason
    });
  }

  @Get()
  @RequirePermissions(PERMISSIONS.SERVICE_READ)
  async get(
    @Headers('authorization') authorization: string | undefined,
    @Param('referralId') referralId: string
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.service.getForReferral(context, referralId);
  }
}
