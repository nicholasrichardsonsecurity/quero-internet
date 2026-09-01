import { Body, Controller, Get, Headers, Post, Put, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(PermissionsGuard)
@RequirePermissions(PERMISSIONS.AUDIT_READ)
export class NotificationsController {
  constructor(private readonly authService: AuthService, private readonly notificationsService: NotificationsService) {}

  @Get('templates')
  templates() {
    return this.notificationsService.templates();
  }

  @Put('consents')
  async consent(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { tenantId?: string; recipientRef?: string; channel?: string; purpose?: string; granted?: boolean }
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.notificationsService.setConsent(context, body);
  }

  @Post('dispatch-preview')
  async dispatchPreview(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @Body() body: { tenantId?: string; recipientRef?: string; templateCode?: string; channel?: string }
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.notificationsService.dispatchPreview(context, idempotencyKey, body);
  }
}
