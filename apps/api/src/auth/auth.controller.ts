import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.authService.resolveAuthorization(authorization);
  }

  @Post('context')
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
  @HttpCode(204)
  async logout(@Headers('authorization') authorization?: string): Promise<void> {
    await this.authService.logout(authorization);
  }
}
