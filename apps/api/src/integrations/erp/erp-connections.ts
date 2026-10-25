import { z } from 'zod';
import { IxcAdapter } from './ixc.adapter';
import { SgpAdapter } from './sgp.adapter';
import { SimulatedAdapter } from '../simulated.adapters';
import type { IntegrationAdapter, IntegrationProvider } from '../integration.types';
import type { FetchLike } from './http';

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
 * - `ERP_CONNECTIONS_JSON` lista as conexões homologadas. Credenciais ficam só no ambiente
 *   (cofre de segredos do deploy) e nunca no banco, em log ou em resposta da API.
 */
export class ErpAdapterRegistry {
  private readonly connections: ErpConnection[];

  constructor(readonly realReadsEnabled: boolean, connections: ErpConnection[], private readonly fetchImpl: FetchLike = fetch) {
    this.connections = connections;
  }

  static fromEnvironment(env: NodeJS.ProcessEnv = process.env, fetchImpl: FetchLike = fetch): ErpAdapterRegistry {
    const enabled = env.ERP_REAL_READS_ENABLED === 'true';
    const raw = env.ERP_CONNECTIONS_JSON?.trim();
    if (!raw) return new ErpAdapterRegistry(enabled, [], fetchImpl);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('ERP_CONNECTIONS_JSON não é JSON válido.');
    }
    const result = z.array(connectionSchema).safeParse(parsed);
    // A mensagem cita só caminhos de campo, nunca valores (podem conter token).
    if (!result.success) throw new Error(`ERP_CONNECTIONS_JSON inválido: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`);
    return new ErpAdapterRegistry(enabled, result.data, fetchImpl);
  }

  resolve(organizationId: string, provider: IntegrationProvider): IntegrationAdapter {
    if (!this.realReadsEnabled) return new SimulatedAdapter(provider);
    const connection = this.connections.find((c) => c.organizationId === organizationId && c.provider === provider);
    if (!connection) return new SimulatedAdapter(provider);
    return connection.provider === 'IXC'
      ? new IxcAdapter(connection, this.fetchImpl)
      : new SgpAdapter(connection, this.fetchImpl);
  }
}
