import { z } from 'zod';
import { IxcAdapter } from './ixc.adapter';
import { SgpAdapter } from './sgp.adapter';
import { SimulatedAdapter } from '../simulated.adapters';
import type { IntegrationAdapter, IntegrationProvider } from '../integration.types';
import type { FetchLike } from './http';
import type { ConnectionStore } from './connection-store';
import { guardedFetch } from './url-guard';

const httpsUrl = z.string().url().refine((v) => v.startsWith('https://'), 'A URL do ERP precisa ser https.');
const organizationId = z.string().uuid();

const connectionSchema = z.discriminatedUnion('provider', [
  z.object({ provider: z.literal('IXC'), organizationId, baseUrl: httpsUrl, user: z.string().optional(), token: z.string().min(8) }),
  z.object({ provider: z.literal('SGP'), organizationId, baseUrl: httpsUrl, token: z.string().min(8), app: z.string().min(1) })
]);

export type ErpConnection = z.infer<typeof connectionSchema>;

/**
 * Conexões com ERPs por organização provedora.
 *
 * - `ERP_REAL_READS_ENABLED=true` é o kill switch: desligado (padrão), tudo roda simulado.
 * - A conexão de cada organização é cadastrada na tela de Integrações (token cifrado no banco).
 * - `ERP_CONNECTIONS_JSON` é reserva de implantação, usada quando a organização não cadastrou nada.
 *   O token nunca aparece em log nem em resposta da API.
 */
export class ErpAdapterRegistry {
  private readonly connections: ErpConnection[];

  constructor(
    readonly realReadsEnabled: boolean,
    connections: ErpConnection[],
    private readonly fetchImpl: FetchLike = guardedFetch(),
    private readonly store?: ConnectionStore
  ) {
    this.connections = connections;
  }

  static fromEnvironment(env: NodeJS.ProcessEnv = process.env, fetchImpl: FetchLike = guardedFetch(), store?: ConnectionStore): ErpAdapterRegistry {
    const enabled = env.ERP_REAL_READS_ENABLED === 'true';
    const raw = env.ERP_CONNECTIONS_JSON?.trim();
    if (!raw) return new ErpAdapterRegistry(enabled, [], fetchImpl, store);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('ERP_CONNECTIONS_JSON não é JSON válido.');
    }
    const result = z.array(connectionSchema).safeParse(parsed);
    // A mensagem cita só caminhos de campo, nunca valores (podem conter token).
    if (!result.success) throw new Error(`ERP_CONNECTIONS_JSON inválido: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`);
    return new ErpAdapterRegistry(enabled, result.data, fetchImpl, store);
  }

  /** Reserva de implantação (ERP_CONNECTIONS_JSON), sem tocar no banco nem decifrar nada. */
  environmentConnection(organizationId: string, provider: IntegrationProvider): ErpConnection | null {
    return this.connections.find((c) => c.organizationId === organizationId && c.provider === provider) ?? null;
  }

  /** Conexão cadastrada na tela tem prioridade; a do ambiente é só reserva. */
  async connectionFor(organizationId: string, provider: IntegrationProvider): Promise<ErpConnection | null> {
    return (await this.store?.find(organizationId, provider)) ?? this.environmentConnection(organizationId, provider);
  }

  /** Adaptador real de uma conexão já carregada (teste de conexão e leitura). */
  adapterFor(connection: ErpConnection): IntegrationAdapter {
    return connection.provider === 'IXC' ? new IxcAdapter(connection, this.fetchImpl) : new SgpAdapter(connection, this.fetchImpl);
  }

  async resolve(organizationId: string, provider: IntegrationProvider): Promise<IntegrationAdapter> {
    if (!this.realReadsEnabled) return new SimulatedAdapter(provider);
    const connection = await this.connectionFor(organizationId, provider);
    return connection ? this.adapterFor(connection) : new SimulatedAdapter(provider);
  }
}
