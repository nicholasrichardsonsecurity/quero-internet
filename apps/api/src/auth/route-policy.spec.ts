import 'reflect-metadata';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PUBLIC_ROUTE_KEY, REQUIRED_PERMISSIONS_KEY } from './require-permissions.decorator';
import type { AuthService } from './auth.service';

type Ctor = { name: string; prototype: Record<string, unknown> };

function controllerFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return controllerFiles(full);
    return entry.name.endsWith('.controller.ts') ? [full] : [];
  });
}

function loadControllers(): Ctor[] {
  return controllerFiles(join(__dirname, '..')).flatMap((file) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga dinâmica de todos os controllers do código
    const mod = require(file) as Record<string, unknown>;
    return Object.values(mod).filter((v): v is Ctor => typeof v === 'function' && Reflect.hasMetadata(PATH_METADATA, v));
  });
}

function routes(controller: Ctor) {
  return Object.getOwnPropertyNames(controller.prototype)
    .filter((name) => name !== 'constructor')
    .map((name) => ({ name, handler: controller.prototype[name] as object }))
    .filter(({ handler }) => typeof handler === 'function' && Reflect.hasMetadata(METHOD_METADATA, handler));
}

describe('Inventário de rotas (deny-by-default)', () => {
  const controllers = loadControllers();

  it('encontra todos os controllers do código', () => {
    const declared = controllerFiles(join(__dirname, '..'))
      .map((file) => (readFileSync(file, 'utf8').match(/@Controller\(/g) ?? []).length)
      .reduce((a, b) => a + b, 0);
    expect(controllers.length).toBe(declared);
  });

  it('toda rota declara permissão ou motivo público', () => {
    const semPolitica: string[] = [];
    for (const controller of controllers) {
      for (const { name, handler } of routes(controller)) {
        const perms = Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, handler) ?? Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, controller);
        const pub = Reflect.getMetadata(PUBLIC_ROUTE_KEY, handler) ?? Reflect.getMetadata(PUBLIC_ROUTE_KEY, controller);
        if (!(perms?.length) && !pub) semPolitica.push(`${controller.name}.${name}`);
      }
    }
    expect(semPolitica).toEqual([]);
  });

  it('rotas públicas ficam restritas à lista aprovada', () => {
    const publicas = controllers.flatMap((controller) =>
      routes(controller)
        .filter(({ handler }) => Reflect.getMetadata(PUBLIC_ROUTE_KEY, handler) ?? Reflect.getMetadata(PUBLIC_ROUTE_KEY, controller))
        .map(({ name }) => `${controller.name}.${name}`)
    ).sort();
    expect(publicas).toEqual([
      'AuthController.login',
      'BillingController.createCharge',
      'BillingController.receiveAsaasWebhook',
      'HealthController.health',
      'HealthController.ready',
      'InternalBillingController.receive',
      'InternalReconciliationController.run',
      'ObservabilityController.metrics'
    ]);
  });
});

describe('PermissionsGuard', () => {
  const resolveAuthorization = jest.fn();
  const guard = new PermissionsGuard(new Reflector(), { resolveAuthorization } as unknown as AuthService);

  function contextFor(handler: () => void, roles: string[] = []): ExecutionContext {
    resolveAuthorization.mockResolvedValue({ roles });
    class Dummy {}
    return {
      getHandler: () => handler,
      getClass: () => Dummy,
      switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: 'Bearer x' } }) })
    } as unknown as ExecutionContext;
  }

  beforeEach(() => resolveAuthorization.mockReset());

  it('nega rota sem política declarada, sem nem consultar a sessão', async () => {
    await expect(guard.canActivate(contextFor(() => undefined, ['ORGANIZATION_OWNER']))).rejects.toBeInstanceOf(ForbiddenException);
    expect(resolveAuthorization).not.toHaveBeenCalled();
  });

  it('libera rota pública sem sessão', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(PUBLIC_ROUTE_KEY, 'health-probe', handler);
    await expect(guard.canActivate(contextFor(handler))).resolves.toBe(true);
    expect(resolveAuthorization).not.toHaveBeenCalled();
  });

  it('exige todas as permissões declaradas', async () => {
    const handler = () => undefined;
    Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, ['eligibility:decide'], handler);
    await expect(guard.canActivate(contextFor(handler, ['MUNICIPAL_OPERATOR']))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(guard.canActivate(contextFor(handler, ['MUNICIPAL_MANAGER']))).resolves.toBe(true);
  });
});
