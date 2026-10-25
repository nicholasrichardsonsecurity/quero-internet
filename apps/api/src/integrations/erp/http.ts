import { ErpIntegrationError } from '../integration.types';

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type ErpHttpResult = { status: number; body: unknown };

/**
 * Requisição ao ERP com tempo limite. Nunca devolve corpo de erro bruto nem cabeçalhos:
 * a mensagem leva só o status, para não vazar token, CPF ou HTML do ERP em log/resposta.
 */
export async function erpRequest(fetchImpl: FetchLike, url: string, init: RequestInit, timeoutMs = 15_000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw new ErpIntegrationError(`ERP respondeu ${response.status}.`);
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ErpIntegrationError('ERP respondeu em formato inesperado (não JSON).');
    }
  } catch (error) {
    if (error instanceof ErpIntegrationError) throw error;
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new ErpIntegrationError(aborted ? 'ERP não respondeu a tempo.' : 'Falha de rede ao falar com o ERP.');
  } finally {
    clearTimeout(timer);
  }
}

/** Lê o primeiro campo preenchido entre vários nomes possíveis (as APIs variam por versão). */
export function field(record: unknown, ...names: string[]): unknown {
  if (!record || typeof record !== 'object') return undefined;
  const obj = record as Record<string, unknown>;
  for (const name of names) {
    const value = obj[name];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

export function text(value: unknown): string | null {
  return value === undefined || value === null || value === '' ? null : String(value);
}

/** "DD/MM/AAAA" ou "AAAA-MM-DD..." -> "AAAA-MM-DD"; datas zeradas do ERP viram null. */
export function isoDate(value: unknown): string | null {
  if (!value) return null;
  const s = String(value);
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  const iso = br ? `${br[3]}-${br[2]}-${br[1]}` : s.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  return iso && !iso.startsWith('0000') ? iso : null;
}

/** Executa tarefas com concorrência limitada, preservando a ordem do resultado. */
export async function mapLimited<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}
