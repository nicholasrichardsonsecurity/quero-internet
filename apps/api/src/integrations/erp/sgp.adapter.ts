// Adaptador SGP, somente leitura.
//
// Portado de provedor-telecom/servidor/src/integracoes/sgp.js e reduzido ao que o programa
// precisa: confirmar se o contrato vinculado ao serviço está ativo no ERP.
//
// API: POST https://SEU-SGP/api/ura/<rota>/ (form-urlencoded), com token e app no corpo.
//   Gerar em: Administração → Integrações → Tokens (liberar só as rotas usadas abaixo).
//
// ⚠️ Conferir em homologação: nomes de campos variam por versão do SGP; o filtro por
// `contrato` em consultacliente precisa estar liberado no token.
import { type ErpServiceObservation, type ErpServiceStatus, type IntegrationAdapter, type IntegrationHealth } from '../integration.types';
import { erpRequest, field, isoDate, mapLimited, text, type FetchLike } from './http';

export type SgpConnection = { baseUrl: string; token: string; app: string };

export const SGP_ROUTES = { consultaCliente: '/api/ura/consultacliente/' } as const;

/** Traduz o texto de status do SGP. Cuidado: "Inativo" contém "ativo". */
export function sgpServiceStatus(contract: unknown): ErpServiceStatus {
  const raw = String(field(contract, 'statusInternetDisplay', 'status_internet', 'contratoStatusDisplay', 'status_display', 'status') ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  if (!raw) return 'UNKNOWN';
  if (/cancel|inativ|encerr|desist/.test(raw)) return 'ENDED';
  if (/suspen|bloque|reduz|inadimpl/.test(raw)) return 'SUSPENDED';
  if (/^ativo|^online|^liberad/.test(raw)) return 'ACTIVE';
  return 'UNKNOWN';
}

const contractsOf = (body: unknown): unknown[] => {
  const list = field(body, 'contratos');
  return Array.isArray(list) ? list : Array.isArray(body) ? body : [];
};

export class SgpAdapter implements IntegrationAdapter {
  readonly provider = 'SGP' as const;
  readonly mode = 'SUPERVISED_READ_ONLY' as const;
  private readonly base: string;

  constructor(private readonly connection: SgpConnection, private readonly fetchImpl: FetchLike = fetch) {
    this.base = connection.baseUrl.trim().replace(/\/+$/, '');
  }

  private call(route: string, params: Record<string, string>): Promise<unknown> {
    const body = new URLSearchParams({ token: this.connection.token, app: this.connection.app, ...params });
    return erpRequest(this.fetchImpl, `${this.base}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body
    });
  }

  async health(): Promise<IntegrationHealth> {
    const base = { provider: this.provider, mode: this.mode, writesEnabled: false as const, checkedAt: new Date().toISOString() };
    try {
      // CPF inexistente: com token e app corretos, o SGP responde sem erro.
      await this.call(SGP_ROUTES.consultaCliente, { cpfcnpj: '00000000000' });
      return { ...base, status: 'available', message: 'Conectado ao SGP (somente leitura).' };
    } catch (error) {
      return { ...base, status: 'unavailable', message: error instanceof Error ? error.message : 'Falha desconhecida.' };
    }
  }

  async observeServices(externalIds: readonly string[]): Promise<ErpServiceObservation[]> {
    return mapLimited(externalIds, 4, async (externalId) => {
      const body = await this.call(SGP_ROUTES.consultaCliente, { contrato: externalId });
      const contract = contractsOf(body).find((c) => String(field(c, 'contratoId', 'contrato', 'id')) === externalId);
      if (!contract) return { externalId, found: false, planName: null, serviceStatus: 'UNKNOWN', activatedAt: null };
      return {
        externalId,
        found: true,
        planName: text(field(contract, 'planoInternet', 'planointernet', 'plano', 'servico_plano')),
        serviceStatus: sgpServiceStatus(contract),
        activatedAt: isoDate(field(contract, 'contratoDataAtivacao', 'dataAtivacao', 'data_ativacao'))
      };
    });
  }
}
