import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { IntegrationProvider as PrismaIntegrationProvider, IntegrationSyncStatus } from '@prisma/client';
import { createHash } from 'node:crypto';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { INTEGRATION_PROVIDERS, type IntegrationAdapter, type IntegrationProvider } from './integration.types';
import { SimulatedIxcAdapter, SimulatedSgpAdapter } from './simulated.adapters';

@Injectable()
export class IntegrationsService {
  private readonly adapters: Record<IntegrationProvider, IntegrationAdapter>;

  constructor(private readonly prisma: PrismaService, ixc: SimulatedIxcAdapter, sgp: SimulatedSgpAdapter) {
    this.adapters = { IXC: ixc, SGP: sgp };
  }

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
    await this.resolveTenant(context);
    return this.adapters[this.resolveProvider(value)].health();
  }

  async syncPreview(context: AuthenticatedSession, value: string, idempotencyKey: string | undefined, input: { tenantId?: string }) {
    const provider = this.resolveProvider(value);
    const tenantId = await this.resolveTenant(context, input.tenantId);
    const key = idempotencyKey?.trim();
    if (!key || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(key)) throw new BadRequestException('x-idempotency-key inválido ou ausente.');

    const customers = await this.adapters[provider].listCustomers(tenantId);
    const resultHash = createHash('sha256').update(JSON.stringify(customers)).digest('hex');
    const existing = await this.prisma.integrationSyncRun.findUnique({
      where: { tenantId_provider_idempotencyKey: { tenantId, provider: provider as PrismaIntegrationProvider, idempotencyKey: key } }
    });
    if (existing) return { provider, mode: 'SIMULATED_READ_ONLY', writesEnabled: false, reused: true, syncRunId: existing.id, resultHash: existing.resultHash, recordCount: existing.recordCount, customers };

    const run = await this.prisma.integrationSyncRun.create({
      data: { tenantId, organizationId: context.organizationId, provider: provider as PrismaIntegrationProvider, idempotencyKey: key, status: IntegrationSyncStatus.COMPLETED, mode: 'SIMULATED_READ_ONLY', recordCount: customers.length, resultHash }
    });
    await this.prisma.auditLog.create({
      data: { tenantId, organizationId: context.organizationId, actorUserId: context.user.id, action: 'INTEGRATION_SYNC_PREVIEWED', entityType: 'INTEGRATION_SYNC_RUN', entityId: run.id, correlationId: key }
    });
    return { provider, mode: 'SIMULATED_READ_ONLY', writesEnabled: false, reused: false, syncRunId: run.id, resultHash, recordCount: customers.length, customers };
  }
}
