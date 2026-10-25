import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { hasAllPermissions, type Permission } from './permissions';
import { PUBLIC_ROUTE_KEY, REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator';

/**
 * Guard global (APP_GUARD) e deny-by-default: toda rota precisa declarar
 * @RequirePermissions(...) ou @PublicRoute(motivo). Rota sem nenhum dos dois é negada.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<string>(PUBLIC_ROUTE_KEY, targets)) return true;

    const required = this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSIONS_KEY, targets);
    if (!required || required.length === 0) {
      throw new ForbiddenException('Rota sem política de autorização declarada.');
    }

    const request = context.switchToHttp().getRequest<{ headers?: { authorization?: string } }>();
    const session = await this.authService.resolveAuthorization(request.headers?.authorization);

    if (!hasAllPermissions(session.roles, required)) {
      throw new ForbiddenException('Permissão insuficiente para executar esta operação.');
    }

    return true;
  }
}
