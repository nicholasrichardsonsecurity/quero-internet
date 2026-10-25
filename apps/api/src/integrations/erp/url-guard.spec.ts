import { ErpIntegrationError } from '../integration.types';
import { assertPublicHttpsUrl, guardedFetch, isPrivateAddress } from './url-guard';

const publicDns = async () => ['203.0.113.10'];

describe('assertPublicHttpsUrl', () => {
  it('aceita https público', async () => {
    await expect(assertPublicHttpsUrl('https://ixc.provedor.com.br', publicDns)).resolves.toBeInstanceOf(URL);
    await expect(assertPublicHttpsUrl('https://ixc.provedor.com.br:443/', publicDns)).resolves.toBeInstanceOf(URL);
  });

  it.each([
    ['http://ixc.provedor.com.br', /https/],
    ['https://user:senha@ixc.provedor.com.br', /usuário ou senha/],
    ['https://ixc.provedor.com.br:8443', /porta padrão/],
    ['https://localhost', /público/],
    ['https://erp.local', /público/],
    ['https://127.0.0.1', /público/],
    ['https://10.0.0.5', /público/],
    ['https://169.254.169.254', /público/],
    ['https://[::1]', /público/],
    ['https://[fd00::1]', /público/],
    ['https://[::ffff:192.168.0.1]', /público/],
    ['isso não é url', /inválido/]
  ])('recusa %s', async (url, message) => {
    await expect(assertPublicHttpsUrl(url, publicDns)).rejects.toThrow(message);
  });

  it('recusa nome que resolve para rede interna (DNS rebinding simples)', async () => {
    await expect(assertPublicHttpsUrl('https://erp.exemplo.com', async () => ['203.0.113.10', '10.1.1.1'])).rejects.toBeInstanceOf(ErpIntegrationError);
  });

  it('classifica faixas privadas', () => {
    for (const ip of ['0.0.0.0', '10.1.2.3', '100.64.0.1', '127.0.0.1', '169.254.1.1', '172.16.0.1', '172.31.255.255', '192.168.1.1', '224.0.0.1']) expect(isPrivateAddress(ip)).toBe(true);
    for (const ip of ['8.8.8.8', '172.32.0.1', '203.0.113.10']) expect(isPrivateAddress(ip)).toBe(false);
  });
});

describe('guardedFetch', () => {
  it('revalida o destino e não segue redirecionamento', async () => {
    const inner = jest.fn().mockResolvedValue(new Response('{}'));
    await guardedFetch(inner, publicDns)('https://ixc.provedor.com.br/x', { method: 'POST' });
    expect(inner).toHaveBeenCalledWith('https://ixc.provedor.com.br/x', expect.objectContaining({ redirect: 'manual' }));
    await expect(guardedFetch(inner, async () => ['10.0.0.1'])('https://ixc.provedor.com.br/x', {})).rejects.toBeInstanceOf(ErpIntegrationError);
    expect(inner).toHaveBeenCalledTimes(1);
  });
});
