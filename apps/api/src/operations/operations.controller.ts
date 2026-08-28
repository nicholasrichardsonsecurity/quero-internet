import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { OperationsService } from './operations.service';

@Controller('operations')
@UseGuards(PermissionsGuard)
export class OperationsController {
  constructor(
    private readonly authService: AuthService,
    private readonly operations: OperationsService
  ) {}

  @Get('overview')
  @RequirePermissions(PERMISSIONS.OPERATION_READ)
  async overview(@Headers('authorization') authorization: string | undefined) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.operations.overview(context);
  }
}
