import { randomBytes } from 'node:crypto';
import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedSession } from '../auth/auth.service';
import type { PrismaService } from '../database/prisma.service';
import { IntegrationConnectionsService, TEST_INTERVAL_MS } from './connections.service';
import { DatabaseConnectionStore } from './erp/connection-store';
import { ErpAdapterRegistry } from './erp/erp-connections';
import { SecretCipher } from './erp/secret-cipher';

const ORG = '22222222-2222-4222-8222-222222222222';
const context = { tenantIds: ['11111111-1111-4111-8111-111111111111'], organizationId: ORG, user: { id: 'u1' } } as unknown as AuthenticatedSession;
const publicFetch = jest.fn();

function setup(row: Record<string, unknown> | null = null, realReads = false) {
  const cipher = new SecretCipher(randomBytes(32).toString('base64'));
  const state = { row };
  const prisma = {
    integrationConnection: {
      findUnique: jest.fn(async ({ where }: { where: { organizationId_provider: { provider: string } } }) =>
        state.row && state.row.provider === where.organizationId_provider.provider ? state.row : null),
      findMany: jest.fn(async () => (state.row ? [state.row] : [])),
      upsert: jest.fn(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
        state.row = { id: 'c1', organizationId: ORG, provider: create.provider, ...(state.row ?? create), ...(state.row ? update : {}) };
        return state.row;
      }),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => { state.row = { ...state.row, ...data }; return state.row; }),
      delete: jest.fn(async () => { state.row = null; })
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) }
  };
  const registry = new ErpAdapterRegistry(realReads, [], publicFetch, new DatabaseConnectionStore(prisma as unknown as PrismaService, cipher));
  return { prisma, state, cipher, service: new IntegrationConnectionsService(prisma as unknown as PrismaService, registry, cipher) };
}

// DNS real não deve ser consultado nos testes: o service chama o guard, então usamos IP literal público.
const IXC_URL = 'https://203.0.113.10';

describe('IntegrationConnectionsService', () => {
  beforeEach(() => publicFetch.mockReset());

  it('salva com token cifrado e nunca devolve o token', async () => {
    const { service, state, prisma } = setup();
    const view = await service.save(context, 'ixc', { baseUrl: `${IXC_URL}/webservice/v1/`, user: '12', token: '12:segredo-do-ixc' });

    expect(state.row).toMatchObject({ baseUrl: IXC_URL, apiUser: '12', tokenLast4: 'segredo-do-ixc'.slice(-4), status: 'UNTESTED' });
    expect(String(state.row?.tokenCiphertext)).toMatch(/^v1:/);
    expect(JSON.stringify(state.row)).not.toContain('segredo-do-ixc');
    expect(JSON.stringify(view)).not.toContain('segredo');
    expect(view.connections.find((c) => c.provider === 'IXC')).toMatchObject({ configured: true, source: 'SCREEN', tokenLast4: 'segredo-do-ixc'.slice(-4) });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: 'INTEGRATION_CONNECTION_CREATED', entityType: 'INTEGRATION_CONNECTION' }) });
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain('segredo');
  });

  it('atualizar sem token mantém o token e zera o último teste', async () => {
    const { service, state } = setup();
    await service.save(context, 'IXC', { baseUrl: IXC_URL, token: '12:segredo-do-ixc' });
    const cipherBefore = state.row?.tokenCiphertext;
    state.row = { ...state.row, status: 'OK', lastTestedAt: new Date() };
    await service.save(context, 'IXC', { baseUrl: IXC_URL, user: '99' });
    expect(state.row).toMatchObject({ tokenCiphertext: cipherBefore, apiUser: '99', status: 'UNTESTED', lastTestedAt: null });
  });

  it('exige token na criação e app no SGP', async () => {
    const { service } = setup();
    await expect(service.save(context, 'IXC', { baseUrl: IXC_URL })).rejects.toThrow(/token/i);
    await expect(service.save(context, 'SGP', { baseUrl: IXC_URL, token: 'token-sgp-123' })).rejects.toThrow(/app/);
  });

  it('recusa endereço interno e provedor inválido', async () => {
    const { service } = setup();
    await expect(service.save(context, 'IXC', { baseUrl: 'https://10.0.0.5', token: 'abcdefgh1' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.save(context, 'IXC', { baseUrl: 'http://203.0.113.10', token: 'abcdefgh1' })).rejects.toThrow(/https/);
    await expect(service.save(context, 'XYZ', { baseUrl: IXC_URL, token: 'abcdefgh1' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('testa a conexão com o token decifrado e grava o resultado', async () => {
    const { service, state } = setup();
    await service.save(context, 'SGP', { baseUrl: IXC_URL, app: 'QUERO', token: 'token-sgp-123' });
    publicFetch.mockResolvedValue(new Response(JSON.stringify({ contratos: [] }), { status: 200 }));

    const result = await service.test(context, 'SGP');

    expect(result.ok).toBe(true);
    expect(new URLSearchParams(String(publicFetch.mock.calls[0][1].body)).get('token')).toBe('token-sgp-123');
    expect(state.row).toMatchObject({ status: 'OK' });
  });

  it('teste que falha grava FAILED sem vazar corpo do ERP', async () => {
    const { service, state } = setup();
    await service.save(context, 'SGP', { baseUrl: IXC_URL, app: 'QUERO', token: 'token-sgp-123' });
    publicFetch.mockResolvedValue(new Response('<html>token-sgp-123 negado</html>', { status: 403 }));
    const result = await service.test(context, 'SGP');
    expect(result).toEqual({ ok: false, message: 'ERP respondeu 403.' });
    expect(state.row).toMatchObject({ status: 'FAILED', lastTestMessage: 'ERP respondeu 403.' });
  });

  it('limita a frequência de testes', async () => {
    const { service, state } = setup();
    await service.save(context, 'SGP', { baseUrl: IXC_URL, app: 'QUERO', token: 'token-sgp-123' });
    state.row = { ...state.row, lastTestedAt: new Date(Date.now() - TEST_INTERVAL_MS / 2) };
    await expect(service.test(context, 'SGP')).rejects.toBeInstanceOf(HttpException);
    expect(publicFetch).not.toHaveBeenCalled();
  });

  it('testar ou remover sem conexão dá 404; remover apaga e audita', async () => {
    const { service, prisma, state } = setup();
    await expect(service.test(context, 'IXC')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(context, 'IXC')).rejects.toBeInstanceOf(NotFoundException);
    await service.save(context, 'IXC', { baseUrl: IXC_URL, token: '12:segredo-do-ixc' });
    await service.remove(context, 'IXC');
    expect(state.row).toBeNull();
    expect(prisma.auditLog.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ action: 'INTEGRATION_CONNECTION_REMOVED' }) });
  });

  it('só enxerga a conexão da própria organização', async () => {
    const { service, prisma } = setup();
    await service.list(context);
    expect(prisma.integrationConnection.findMany).toHaveBeenCalledWith({ where: { organizationId: ORG } });
  });
});
