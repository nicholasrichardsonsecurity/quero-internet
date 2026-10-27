import { BadGatewayException, BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { IntegrationProvider as PrismaIntegrationProvider, IntegrationSyncStatus, ServiceStatus } from '@prisma/client';
import { createHash } from 'node:crypto';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { ErpAdapterRegistry } from './erp/erp-connections';
import { ErpIntegrationError, INTEGRATION_PROVIDERS, type IntegrationProvider } from './integration.types';
import { reconcile } from './reconciliation';

/** Teto por prévia: protege o ERP do provedor e mantém a resposta pequena. */
export const SYNC_PREVIEW_LIMIT = 200;

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ErpAdapterRegistry) private readonly registry: ErpAdapterRegistry
  ) {}

  private resolveProvider(value: string): IntegrationProvider {
    const provider = value.trim().toUpperCase() as IntegrationProvider;
    if (!INTEGRATION_PROVIDERS.includes(provider)) throw new BadRequestException('Provedor de integração inválido. Use IXC ou SGP.');
    return provider;
  }

  private async resolveTenant(context: AuthenticatedSession, requestedTenantId?: string) {
    const tenantId = requestedTenantId ?? (context.tenantIds.length === 1 ? context.tenantIds[0] : undefined);
    if (!tenantId) throw new BadRequestException('tenantId é obrigatório quando há múltiplos tenants.');
    if (!context.tenantIds.includes(tenantId)) throw new ForbiddenException('Tenant fora do contexto autorizado.');
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { tenantLinks: { where: { tenantId }, select: { tenantId: true } } }
    });
    if (!organization?.tenantLinks.length) throw new ForbiddenException('Organização fora do tenant autorizado.');
    return tenantId;
  }

  async health(context: AuthenticatedSession, value: string) {
    const provider = this.resolveProvider(value);
    await this.resolveTenant(context);
    return (await this.registry.resolve(context.organizationId, provider)).health();
  }

  /**
   * Prévia de conciliação: lê no ERP os contratos vinculados aos serviços ativos do provedor
   * e aponta divergências. Não escreve no ERP nem altera serviços.
   */
  async syncPreview(context: AuthenticatedSession, value: string, idempotencyKey: string | undefined, input: { tenantId?: string }) {
    const provider = this.resolveProvider(value);
    const tenantId = await this.resolveTenant(context, input.tenantId);
    const key = idempotencyKey?.trim();
    if (!key || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(key)) throw new BadRequestException('x-idempotency-key inválido ou ausente.');

    const adapter = await this.registry.resolve(context.organizationId, provider);
    const existing = await this.prisma.integrationSyncRun.findUnique({
      where: { tenantId_provider_idempotencyKey: { tenantId, provider: provider as PrismaIntegrationProvider, idempotencyKey: key } }
    });
    if (existing) {
      // Repetição da mesma chave não chama o ERP de novo.
      return { provider, mode: existing.mode, writesEnabled: false, reused: true, syncRunId: existing.id, resultHash: existing.resultHash, recordCount: existing.recordCount };
    }

    const services = await this.prisma.activeService.findMany({
      where: { tenantId, providerOrganizationId: context.organizationId, status: { not: ServiceStatus.ENDED } },
      select: { id: true, status: true, externalServiceReference: true },
      orderBy: { createdAt: 'asc' },
      take: SYNC_PREVIEW_LIMIT
    });
    const externalIds = [...new Set(services.map((s) => s.externalServiceReference?.trim()).filter((v): v is string => Boolean(v)))];

    let observations;
    try {
      observations = await adapter.observeServices(externalIds);
    } catch (error) {
      if (error instanceof ErpIntegrationError) throw new BadGatewayException(`Falha na leitura do ${provider}: ${error.message}`);
      throw error;
    }

    const result = reconcile(services, observations);
    const resultHash = createHash('sha256').update(JSON.stringify(result)).digest('hex');
    const run = await this.prisma.integrationSyncRun.create({
      data: { tenantId, organizationId: context.organizationId, provider: provider as PrismaIntegrationProvider, idempotencyKey: key, status: IntegrationSyncStatus.COMPLETED, mode: adapter.mode, recordCount: result.items.length, resultHash }
    });
    await this.prisma.auditLog.create({
      data: { tenantId, organizationId: context.organizationId, actorUserId: context.user.id, action: 'INTEGRATION_SYNC_PREVIEWED', entityType: 'INTEGRATION_SYNC_RUN', entityId: run.id, correlationId: key }
    });
    return { provider, mode: adapter.mode, writesEnabled: false, reused: false, syncRunId: run.id, resultHash, recordCount: result.items.length, truncated: services.length === SYNC_PREVIEW_LIMIT, ...result };
  }
}
