import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PERMISSIONS } from './permissions';
import { PublicRoute, RequirePermissions } from './require-permissions.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @PublicRoute('login')
  async login(@Body() body: { email?: string; password?: string; organizationId?: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('E-mail e senha são obrigatórios.');
    }

    return this.authService.login(body.email, body.password, body.organizationId);
  }

  @Get('me')
  @RequirePermissions(PERMISSIONS.SESSION_READ)
  me(@Headers('authorization') authorization?: string) {
    return this.authService.resolveAuthorization(authorization);
  }

  @Post('context')
  @RequirePermissions(PERMISSIONS.ORGANIZATION_SWITCH)
  switchContext(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { organizationId?: string }
  ) {
    if (!body.organizationId) {
      throw new BadRequestException('organizationId é obrigatório.');
    }

    return this.authService.switchOrganization(authorization, body.organizationId);
  }

  @Post('logout')
  @RequirePermissions(PERMISSIONS.SESSION_REVOKE)
  @HttpCode(204)
  async logout(@Headers('authorization') authorization?: string): Promise<void> {
    await this.authService.logout(authorization);
  }
}
