import { ErpIntegrationError } from '../integration.types';
import { ErpAdapterRegistry } from './erp-connections';
import { IxcAdapter, ixcAuthorization, ixcServiceStatus } from './ixc.adapter';
import { SgpAdapter, sgpServiceStatus } from './sgp.adapter';
import type { FetchLike } from './http';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ORG = '7f8d2a52-6a4e-4b1f-9a3e-2d3c4b5a6f70';

describe('IxcAdapter', () => {
  it('monta Basic com ou sem o ID já no token', () => {
    expect(ixcAuthorization('12', 'abc')).toBe('Basic ' + Buffer.from('12:abc').toString('base64'));
    expect(ixcAuthorization(undefined, '12:abc')).toBe('Basic ' + Buffer.from('12:abc').toString('base64'));
  });

  it('traduz status de contrato e de internet', () => {
    expect(ixcServiceStatus({ status: 'A', status_internet: 'A' })).toBe('ACTIVE');
    expect(ixcServiceStatus({ status: 'A', status_internet: 'FA' })).toBe('SUSPENDED');
    expect(ixcServiceStatus({ status: 'A', status_internet: 'CM' })).toBe('SUSPENDED');
    expect(ixcServiceStatus({ status: 'I', status_internet: 'A' })).toBe('ENDED');
    expect(ixcServiceStatus({ status: 'A', status_internet: 'XX' })).toBe('UNKNOWN');
  });

  it('consulta cada contrato só com listar e devolve DTO mínimo', async () => {
    const fetchMock = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async (_url, init) => {
      const { query } = JSON.parse(String(init.body)) as { query: string };
      return json(query === '10'
        ? { total: 1, registros: [{ id: '10', status: 'A', status_internet: 'A', contrato: 'Fibra 500', data_ativacao: '2026-02-01', cnpj_cpf: '123.456.789-00', endereco: 'Rua X' }] }
        : { total: 0, registros: [] });
    });
    const adapter = new IxcAdapter({ baseUrl: 'https://ixc.exemplo.com.br/webservice/v1/', user: '12', token: 'segredo-123' }, fetchMock);

    const result = await adapter.observeServices(['10', '99']);

    expect(result).toEqual([
      { externalId: '10', found: true, planName: 'Fibra 500', serviceStatus: 'ACTIVE', activatedAt: '2026-02-01' },
      { externalId: '99', found: false, planName: null, serviceStatus: 'UNKNOWN', activatedAt: null }
    ]);
    expect(JSON.stringify(result)).not.toMatch(/123\.456|Rua X/);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://ixc.exemplo.com.br/webservice/v1/cliente_contrato');
    expect((init.headers as Record<string, string>).ixcsoft).toBe('listar');
    expect(init.method).toBe('POST');
  });

  it('health não vaza corpo de erro nem credencial', async () => {
    const adapter = new IxcAdapter({ baseUrl: 'https://ixc.exemplo.com.br', user: '12', token: 'segredo-123' }, async () => new Response('<html>token segredo-123 inválido</html>', { status: 401 }));
    const health = await adapter.health();
    expect(health).toMatchObject({ provider: 'IXC', mode: 'SUPERVISED_READ_ONLY', writesEnabled: false, status: 'unavailable', message: 'ERP respondeu 401.' });
  });
});

describe('SgpAdapter', () => {
  it('traduz status sem confundir "Inativo" com "Ativo"', () => {
    expect(sgpServiceStatus({ statusInternetDisplay: 'Ativo' })).toBe('ACTIVE');
    expect(sgpServiceStatus({ statusInternetDisplay: 'Inativo' })).toBe('ENDED');
    expect(sgpServiceStatus({ contratoStatusDisplay: 'Suspenso' })).toBe('SUSPENDED');
    expect(sgpServiceStatus({ statusInternetDisplay: 'Velocidade Reduzida' })).toBe('SUSPENDED');
    expect(sgpServiceStatus({ status: 'Cancelado' })).toBe('ENDED');
    expect(sgpServiceStatus({})).toBe('UNKNOWN');
  });

  it('consulta por contrato com token e app no corpo', async () => {
    const fetchMock = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () => json({
      contratos: [{ contratoId: 55, planoInternet: 'Conecta 300', statusInternetDisplay: 'Ativo', contratoDataAtivacao: '15/01/2026', contratoCentralSenha: 'x' }]
    }));
    const adapter = new SgpAdapter({ baseUrl: 'https://isp.sgp.net.br/', token: 'token-sgp-1', app: 'QUERO' }, fetchMock);

    await expect(adapter.observeServices(['55'])).resolves.toEqual([
      { externalId: '55', found: true, planName: 'Conecta 300', serviceStatus: 'ACTIVE', activatedAt: '2026-01-15' }
    ]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://isp.sgp.net.br/api/ura/consultacliente/');
    const body = new URLSearchParams(String(init.body));
    expect(body.get('contrato')).toBe('55');
    expect(body.get('app')).toBe('QUERO');
  });

  it('erro de rede vira ErpIntegrationError com mensagem genérica', async () => {
    const adapter = new SgpAdapter({ baseUrl: 'https://isp.sgp.net.br', token: 'token-sgp-1', app: 'QUERO' }, async () => { throw new TypeError('getaddrinfo ENOTFOUND isp.sgp.net.br'); });
    await expect(adapter.observeServices(['1'])).rejects.toEqual(new ErpIntegrationError('Falha de rede ao falar com o ERP.'));
  });
});

describe('ErpAdapterRegistry', () => {
  const connections = JSON.stringify([
    { provider: 'IXC', organizationId: ORG, baseUrl: 'https://ixc.exemplo.com.br', user: '1', token: 'segredo-123' },
    { provider: 'SGP', organizationId: ORG, baseUrl: 'https://isp.sgp.net.br', token: 'token-sgp-1', app: 'QUERO' }
  ]);

  it('kill switch desligado (padrão) mantém tudo simulado', async () => {
    const registry = ErpAdapterRegistry.fromEnvironment({ ERP_CONNECTIONS_JSON: connections });
    expect((await registry.resolve(ORG, 'IXC')).mode).toBe('SIMULATED_READ_ONLY');
  });

  it('ligado, usa o adaptador real só para a organização configurada', async () => {
    const registry = ErpAdapterRegistry.fromEnvironment({ ERP_REAL_READS_ENABLED: 'true', ERP_CONNECTIONS_JSON: connections });
    expect(await registry.resolve(ORG, 'IXC')).toBeInstanceOf(IxcAdapter);
    expect(await registry.resolve(ORG, 'SGP')).toBeInstanceOf(SgpAdapter);
    expect((await registry.resolve('00000000-0000-4000-8000-000000000000', 'IXC')).mode).toBe('SIMULATED_READ_ONLY');
  });

  it('recusa URL sem https e não cita valores na mensagem', () => {
    const bad = JSON.stringify([{ provider: 'IXC', organizationId: ORG, baseUrl: 'http://ixc.local', token: 'segredo-123' }]);
    expect(() => ErpAdapterRegistry.fromEnvironment({ ERP_CONNECTIONS_JSON: bad })).toThrow(/0\.baseUrl/);
    expect(() => ErpAdapterRegistry.fromEnvironment({ ERP_CONNECTIONS_JSON: bad })).not.toThrow(/segredo/);
  });
});
