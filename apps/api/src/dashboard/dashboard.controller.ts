import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PERMISSIONS } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(PermissionsGuard)
export class DashboardController {
  constructor(
    private readonly authService: AuthService,
    private readonly dashboardService: DashboardService
  ) {}

  @Get('operational')
  @RequirePermissions(PERMISSIONS.DASHBOARD_READ)
  async operational(@Headers('authorization') authorization: string | undefined) {
    const context = await this.authService.resolveAuthorization(authorization);
    return this.dashboardService.getOperationalDashboard(context);
  }
}
