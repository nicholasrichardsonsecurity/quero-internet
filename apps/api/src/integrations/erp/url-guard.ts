import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { ErpIntegrationError } from '../integration.types';
import type { FetchLike } from './http';

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
}

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  const dotted = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return isPrivateIPv4(dotted[1]);
  // O parser de URL normaliza ::ffff:192.168.0.1 para ::ffff:c0a8:1.
  const hex = v6.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const high = parseInt(hex[1], 16), low = parseInt(hex[2], 16);
    return isPrivateIPv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || /^fe[89ab]/.test(v6);
}

type Resolver = (hostname: string) => Promise<string[]>;
const systemResolver: Resolver = async (hostname) => (await lookup(hostname, { all: true })).map((entry) => entry.address);

/**
 * O endereço do ERP é digitado pelo provedor, então o servidor não pode ser usado para alcançar
 * a rede interna (SSRF): só https, porta 443, sem usuário/senha na URL e só endereços públicos.
 */
export async function assertPublicHttpsUrl(value: string, resolve: Resolver = systemResolver): Promise<URL> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ErpIntegrationError('Endereço do ERP inválido.');
  }
  if (url.protocol !== 'https:') throw new ErpIntegrationError('O endereço do ERP precisa começar com https://.');
  if (url.username || url.password) throw new ErpIntegrationError('Não coloque usuário ou senha no endereço do ERP.');
  if (url.port && url.port !== '443') throw new ErpIntegrationError('Use a porta padrão (443) no endereço do ERP.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new ErpIntegrationError('O endereço do ERP precisa ser público.');
  }
  let addresses: string[];
  try {
    addresses = isIP(host) ? [host] : await resolve(host);
  } catch {
    throw new ErpIntegrationError('Não foi possível encontrar o endereço do ERP (DNS).');
  }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) throw new ErpIntegrationError('O endereço do ERP precisa ser público.');
  return url;
}

/** fetch que revalida o destino a cada chamada e nunca segue redirecionamento. */
export function guardedFetch(inner: FetchLike = fetch, resolve?: Resolver): FetchLike {
  return async (url, init) => {
    await assertPublicHttpsUrl(url, resolve);
    return inner(url, { ...init, redirect: 'manual' });
  };
}
