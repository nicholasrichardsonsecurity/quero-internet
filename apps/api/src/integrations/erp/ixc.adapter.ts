// Adaptador IXC Provedor (IXCSoft), somente leitura.
//
// Portado de provedor-telecom/servidor/src/integracoes/ixc.js e reduzido ao que o programa
// precisa: confirmar se o contrato vinculado ao serviço está ativo no ERP.
//
// API: POST https://SEU-IXC/webservice/v1/<tabela>
//   Authorization: Basic base64("<id do usuário>:<token>")  ·  ixcsoft: listar
//   Corpo: { qtype: "tabela.coluna", query, oper: "=", page: "1", rp: "1" } -> { total, registros }
//
// ⚠️ Conferir em homologação: códigos de status podem variar por versão do IXC.
import { ErpIntegrationError, type ErpServiceObservation, type ErpServiceStatus, type IntegrationAdapter, type IntegrationHealth } from '../integration.types';
import { erpRequest, field, isoDate, mapLimited, text, type FetchLike } from './http';

export type IxcConnection = { baseUrl: string; user?: string; token: string };

const CONTRACT_ENDED = new Set(['I', 'D']); // Inativo, Desistiu
const INTERNET_STATUS: Record<string, ErpServiceStatus> = {
  A: 'ACTIVE',
  CM: 'SUSPENDED', // bloqueio manual
  CA: 'SUSPENDED', // bloqueio automático
  FA: 'SUSPENDED', // financeiro em atraso
  D: 'ENDED' // desativado
};

/** O IXC mostra o token já como "ID:hash"; aceitamos com ou sem o ID na frente. */
export function ixcAuthorization(user: string | undefined, token: string): string {
  const t = token.trim();
  const credential = /^\d+:/.test(t) ? t : `${(user ?? '').trim()}:${t}`;
  return 'Basic ' + Buffer.from(credential).toString('base64');
}

export function ixcServiceStatus(contract: unknown): ErpServiceStatus {
  const status = String(field(contract, 'status') ?? '');
  if (CONTRACT_ENDED.has(status)) return 'ENDED';
  return INTERNET_STATUS[String(field(contract, 'status_internet') ?? '')] ?? 'UNKNOWN';
}

export class IxcAdapter implements IntegrationAdapter {
  readonly provider = 'IXC' as const;
  readonly mode = 'SUPERVISED_READ_ONLY' as const;
  private readonly base: string;
  private readonly authorization: string;

  constructor(connection: IxcConnection, private readonly fetchImpl: FetchLike = fetch) {
    this.base = connection.baseUrl.trim().replace(/\/+$/, '').replace(/\/webservice\/v1$/, '');
    this.authorization = ixcAuthorization(connection.user, connection.token);
  }

  private async list(table: string, qtype: string, query: string, oper = '='): Promise<{ total: number; records: unknown[] }> {
    const body = await erpRequest(this.fetchImpl, `${this.base}/webservice/v1/${table}`, {
      method: 'POST',
      headers: { Authorization: this.authorization, 'Content-Type': 'application/json', ixcsoft: 'listar' },
      body: JSON.stringify({ qtype, query, oper, page: '1', rp: '1' })
    });
    if (field(body, 'type') === 'error') throw new ErpIntegrationError('IXC recusou a consulta.');
    const records = field(body, 'registros');
    return { total: Number(field(body, 'total') ?? 0), records: Array.isArray(records) ? records : [] };
  }

  async health(): Promise<IntegrationHealth> {
    const base = { provider: this.provider, mode: this.mode, writesEnabled: false as const, checkedAt: new Date().toISOString() };
    try {
      await this.list('cliente', 'cliente.id', '0', '>');
      return { ...base, status: 'available', message: 'Conectado ao IXC (somente leitura).' };
    } catch (error) {
      return { ...base, status: 'unavailable', message: error instanceof Error ? error.message : 'Falha desconhecida.' };
    }
  }

  async observeServices(externalIds: readonly string[]): Promise<ErpServiceObservation[]> {
    return mapLimited(externalIds, 4, async (externalId) => {
      const { records } = await this.list('cliente_contrato', 'cliente_contrato.id', externalId);
      const contract = records.find((r) => String(field(r, 'id')) === externalId);
      if (!contract) return { externalId, found: false, planName: null, serviceStatus: 'UNKNOWN', activatedAt: null };
      return {
        externalId,
        found: true,
        planName: text(field(contract, 'contrato', 'descricao_aux_plano_venda')),
        serviceStatus: ixcServiceStatus(contract),
        activatedAt: isoDate(field(contract, 'data_ativacao', 'data'))
      };
    });
  }
}
