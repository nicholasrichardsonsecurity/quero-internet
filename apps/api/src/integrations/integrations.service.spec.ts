import { BadGatewayException } from '@nestjs/common';
import type { AuthenticatedSession } from '../auth/auth.service';
import type { PrismaService } from '../database/prisma.service';
import { ErpAdapterRegistry } from './erp/erp-connections';
import { ErpIntegrationError, type IntegrationAdapter } from './integration.types';
import { IntegrationsService } from './integrations.service';

const TENANT = '11111111-1111-4111-8111-111111111111';
const ORG = '22222222-2222-4222-8222-222222222222';
const context = { tenantIds: [TENANT], organizationId: ORG, user: { id: 'u1' } } as unknown as AuthenticatedSession;

function setup(adapter: Partial<IntegrationAdapter>, existingRun: unknown = null) {
  const prisma = {
    organization: { findUnique: jest.fn().mockResolvedValue({ tenantLinks: [{ tenantId: TENANT }] }) },
    integrationSyncRun: { findUnique: jest.fn().mockResolvedValue(existingRun), create: jest.fn().mockResolvedValue({ id: 'run-1' }) },
    activeService: { findMany: jest.fn().mockResolvedValue([{ id: 's1', status: 'ACTIVE', externalServiceReference: '10' }]) },
    auditLog: { create: jest.fn().mockResolvedValue({}) }
  };
  const registry = { resolve: jest.fn().mockReturnValue({ provider: 'IXC', mode: 'SUPERVISED_READ_ONLY', ...adapter }) } as unknown as ErpAdapterRegistry;
  return { prisma, registry, service: new IntegrationsService(prisma as unknown as PrismaService, registry) };
}

describe('IntegrationsService.syncPreview', () => {
  it('lê só os serviços do provedor da sessão e audita a prévia', async () => {
    const observeServices = jest.fn().mockResolvedValue([{ externalId: '10', found: true, planName: 'X', serviceStatus: 'SUSPENDED', activatedAt: null }]);
    const { prisma, registry, service } = setup({ observeServices });

    const result = await service.syncPreview(context, 'ixc', 'preview-0001', {});

    expect(registry.resolve).toHaveBeenCalledWith(ORG, 'IXC');
    expect(prisma.activeService.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: TENANT, providerOrganizationId: ORG })
    }));
    expect(observeServices).toHaveBeenCalledWith(['10']);
    expect(result).toMatchObject({ mode: 'SUPERVISED_READ_ONLY', writesEnabled: false, reused: false, summary: { divergent: 1 } });
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('repetição da chave não chama o ERP', async () => {
    const observeServices = jest.fn();
    const { service } = setup({ observeServices }, { id: 'run-0', mode: 'SUPERVISED_READ_ONLY', resultHash: 'h', recordCount: 3 });
    await expect(service.syncPreview(context, 'IXC', 'preview-0001', {})).resolves.toMatchObject({ reused: true, syncRunId: 'run-0' });
    expect(observeServices).not.toHaveBeenCalled();
  });

  it('falha do ERP vira 502 sem gravar execução', async () => {
    const { prisma, service } = setup({ observeServices: jest.fn().mockRejectedValue(new ErpIntegrationError('ERP respondeu 401.')) });
    await expect(service.syncPreview(context, 'IXC', 'preview-0001', {})).rejects.toBeInstanceOf(BadGatewayException);
    expect(prisma.integrationSyncRun.create).not.toHaveBeenCalled();
  });
});
