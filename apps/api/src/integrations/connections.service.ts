import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IntegrationProvider as PrismaIntegrationProvider } from '@prisma/client';
import { z } from 'zod';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { connectionContext } from './erp/connection-store';
import { ErpAdapterRegistry, type ErpConnection } from './erp/erp-connections';
import { SecretCipher } from './erp/secret-cipher';
import { assertPublicHttpsUrl } from './erp/url-guard';
import { ErpIntegrationError, INTEGRATION_PROVIDERS, type IntegrationProvider } from './integration.types';

/** Intervalo mínimo entre testes da mesma conexão: protege o ERP do provedor. */
export const TEST_INTERVAL_MS = 10_000;

const baseSchema = z.object({
  baseUrl: z.string().trim().min(1, 'Informe o endereço do ERP.').max(300),
  user: z.string().trim().max(60).optional(),
  app: z.string().trim().max(60).optional(),
  token: z.string().trim().min(8, 'O token parece curto demais.').max(512).optional()
});

export type ConnectionView = {
  provider: IntegrationProvider;
  configured: boolean;
  source: 'SCREEN' | 'ENVIRONMENT' | null;
  baseUrl: string | null;
  apiUser: string | null;
  apiApp: string | null;
  tokenLast4: string | null;
  status: 'UNTESTED' | 'OK' | 'FAILED' | null;
  lastTestedAt: string | null;
  lastTestMessage: string | null;
};

@Injectable()
export class IntegrationConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ErpAdapterRegistry) private readonly registry: ErpAdapterRegistry,
    @Inject(SecretCipher) private readonly cipher: SecretCipher
  ) {}

  private provider(value: string): IntegrationProvider {
    const provider = value.trim().toUpperCase() as IntegrationProvider;
    if (!INTEGRATION_PROVIDERS.includes(provider)) throw new BadRequestException('Provedor de integração inválido. Use IXC ou SGP.');
    return provider;
  }

  private async audit(context: AuthenticatedSession, action: string, entityId: string | null) {
    await this.prisma.auditLog.create({
      data: {
        tenantId: context.tenantIds.length === 1 ? context.tenantIds[0] : null,
        organizationId: context.organizationId,
        actorUserId: context.user.id,
        action,
        entityType: 'INTEGRATION_CONNECTION',
        entityId
      }
    });
  }

  async list(context: AuthenticatedSession) {
    const rows = await this.prisma.integrationConnection.findMany({ where: { organizationId: context.organizationId } });
    const connections: ConnectionView[] = INTEGRATION_PROVIDERS.map((provider) => {
      const row = rows.find((r) => r.provider === provider);
      if (row) {
        return {
          provider, configured: true, source: 'SCREEN' as const, baseUrl: row.baseUrl, apiUser: row.apiUser, apiApp: row.apiApp,
          tokenLast4: row.tokenLast4, status: row.status as ConnectionView['status'],
          lastTestedAt: row.lastTestedAt?.toISOString() ?? null, lastTestMessage: row.lastTestMessage
        };
      }
      const env = this.registry.environmentConnection(context.organizationId, provider);
      return {
        provider, configured: Boolean(env), source: env ? 'ENVIRONMENT' as const : null, baseUrl: env?.baseUrl ?? null,
        apiUser: null, apiApp: null, tokenLast4: null, status: null, lastTestedAt: null, lastTestMessage: null
      };
    });
    return { realReadsEnabled: this.registry.realReadsEnabled, encryptionConfigured: this.cipher.configured, connections };
  }

  async save(context: AuthenticatedSession, providerValue: string, input: unknown) {
    const provider = this.provider(providerValue);
    const parsed = baseSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((i) => i.message).join(' '));
    const { token, user, app } = parsed.data;
    let baseUrl = parsed.data.baseUrl.replace(/\/+$/, '');
    if (provider === 'IXC') baseUrl = baseUrl.replace(/\/webservice\/v1$/, '');
    if (provider === 'SGP' && !app) throw new BadRequestException('Informe o nome do app cadastrado no token do SGP.');

    try {
      await assertPublicHttpsUrl(baseUrl);
    } catch (error) {
      throw new BadRequestException(error instanceof ErpIntegrationError ? error.message : 'Endereço do ERP inválido.');
    }

    const existing = await this.prisma.integrationConnection.findUnique({
      where: { organizationId_provider: { organizationId: context.organizationId, provider: provider as PrismaIntegrationProvider } }
    });
    if (!existing && !token) throw new BadRequestException('Informe o token do ERP.');

    const data = {
      baseUrl,
      apiUser: provider === 'IXC' ? user || null : null,
      apiApp: provider === 'SGP' ? app! : null,
      updatedByUserId: context.user.id,
      // Qualquer mudança invalida o último teste.
      status: 'UNTESTED', lastTestedAt: null, lastTestMessage: null,
      ...(token ? {
        tokenCiphertext: this.cipher.encrypt(token, connectionContext(context.organizationId, provider)),
        tokenLast4: token.slice(-4)
      } : {})
    };
    const row = await this.prisma.integrationConnection.upsert({
      where: { organizationId_provider: { organizationId: context.organizationId, provider: provider as PrismaIntegrationProvider } },
      create: { ...data, organizationId: context.organizationId, provider: provider as PrismaIntegrationProvider, tokenCiphertext: data.tokenCiphertext!, tokenLast4: data.tokenLast4! },
      update: data
    });
    await this.audit(context, existing ? 'INTEGRATION_CONNECTION_UPDATED' : 'INTEGRATION_CONNECTION_CREATED', row.id);
    return this.list(context);
  }

  async test(context: AuthenticatedSession, providerValue: string) {
    const provider = this.provider(providerValue);
    const row = await this.prisma.integrationConnection.findUnique({
      where: { organizationId_provider: { organizationId: context.organizationId, provider: provider as PrismaIntegrationProvider } }
    });
    if (!row) throw new NotFoundException('Nenhuma conexão cadastrada para este provedor.');
    if (row.lastTestedAt && Date.now() - row.lastTestedAt.getTime() < TEST_INTERVAL_MS) {
      throw new HttpException('Aguarde alguns segundos para testar de novo.', HttpStatus.TOO_MANY_REQUESTS);
    }

    let connection: ErpConnection | null;
    try {
      connection = await this.registry.connectionFor(context.organizationId, provider);
    } catch {
      throw new BadRequestException('Não foi possível ler o token salvo. Informe o token de novo e salve.');
    }
    if (!connection) throw new NotFoundException('Nenhuma conexão cadastrada para este provedor.');
    const health = await this.registry.adapterFor(connection).health();
    const ok = health.status === 'available';
    await this.prisma.integrationConnection.update({
      where: { id: row.id },
      data: { status: ok ? 'OK' : 'FAILED', lastTestedAt: new Date(), lastTestMessage: health.message.slice(0, 200) }
    });
    await this.audit(context, ok ? 'INTEGRATION_CONNECTION_TEST_OK' : 'INTEGRATION_CONNECTION_TEST_FAILED', row.id);
    return { ok, message: health.message };
  }

  async remove(context: AuthenticatedSession, providerValue: string) {
    const provider = this.provider(providerValue);
    const row = await this.prisma.integrationConnection.findUnique({
      where: { organizationId_provider: { organizationId: context.organizationId, provider: provider as PrismaIntegrationProvider } }
    });
    if (!row) throw new NotFoundException('Nenhuma conexão cadastrada para este provedor.');
    await this.prisma.integrationConnection.delete({ where: { id: row.id } });
    await this.audit(context, 'INTEGRATION_CONNECTION_REMOVED', row.id);
    return this.list(context);
  }
}
