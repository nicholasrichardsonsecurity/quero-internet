import { SetMetadata } from '@nestjs/common';
import type { Permission } from './permissions';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';
export const PUBLIC_ROUTE_KEY = 'public_route';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

/**
 * Libera a rota da sessão de usuário. Só para login, sondas de saúde e rotas que se
 * autenticam por segredo de serviço (webhooks, chamadas internas). O motivo é obrigatório
 * e aparece no teste de inventário de rotas.
 */
export const PublicRoute = (reason: 'login' | 'health-probe' | 'service-token' | 'webhook-secret' | 'metrics') =>
  SetMetadata(PUBLIC_ROUTE_KEY, reason);
