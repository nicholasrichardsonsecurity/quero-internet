import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
@UseGuards(PermissionsGuard)
@RequirePermissions(PERMISSIONS.PROVIDER_READ)
export class IntegrationsController {
  constructor(private readonly authService: AuthService, private readonly integrationsService: IntegrationsService) {}

  @Get(':provider/health')
  async health(@Headers('authorization') authorization: string | undefined, @Param('provider') provider: string) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.integrationsService.health(context, provider);
  }

  @Post(':provider/sync-preview')
  async syncPreview(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @Param('provider') provider: string,
    @Body() body: { tenantId?: string }
  ) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.integrationsService.syncPreview(context, provider, idempotencyKey, body);
  }
}
