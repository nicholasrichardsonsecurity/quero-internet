import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post, Put } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { IntegrationConnectionsService } from './connections.service';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly authService: AuthService,
    private readonly integrationsService: IntegrationsService,
    private readonly connectionsService: IntegrationConnectionsService
  ) {}

  @Get('connections')
  @RequirePermissions(PERMISSIONS.PROVIDER_READ)
  async connections(@Headers('authorization') authorization: string | undefined) {
    return this.connectionsService.list(await this.authService.resolveAuthorization(authorization));
  }

  @Put(':provider/connection')
  @RequirePermissions(PERMISSIONS.INTEGRATION_MANAGE)
  async saveConnection(
    @Headers('authorization') authorization: string | undefined,
    @Param('provider') provider: string,
    @Body() body: unknown
  ) {
    return this.connectionsService.save(await this.authService.resolveAuthorization(authorization), provider, body);
  }

  @Post(':provider/connection/test')
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.INTEGRATION_MANAGE)
  async testConnection(@Headers('authorization') authorization: string | undefined, @Param('provider') provider: string) {
    return this.connectionsService.test(await this.authService.resolveAuthorization(authorization), provider);
  }

  @Delete(':provider/connection')
  @RequirePermissions(PERMISSIONS.INTEGRATION_MANAGE)
  async removeConnection(@Headers('authorization') authorization: string | undefined, @Param('provider') provider: string) {
    return this.connectionsService.remove(await this.authService.resolveAuthorization(authorization), provider);
  }

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
