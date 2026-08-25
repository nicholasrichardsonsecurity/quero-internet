import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { hasAllPermissions, type Permission } from './permissions';
import { REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ headers?: { authorization?: string } }>();
    const session = await this.authService.resolveAuthorization(request.headers?.authorization);

    if (!hasAllPermissions(session.roles, required)) {
      throw new ForbiddenException('Permissão insuficiente para executar esta operação.');
    }

    return true;
  }
}
