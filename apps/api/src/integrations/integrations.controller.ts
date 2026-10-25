import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly authService: AuthService, private readonly integrationsService: IntegrationsService) {}

  @Get(':provider/health')
  @RequirePermissions(PERMISSIONS.PROVIDER_READ)
  async health(@Headers('authorization') authorization: string | undefined, @Param('provider') provider: string) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.integrationsService.health(context, provider);
  }

  @Post(':provider/sync-preview')
  @RequirePermissions(PERMISSIONS.INTEGRATION_SYNC)
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
