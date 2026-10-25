export const INTEGRATION_PROVIDERS = ['IXC', 'SGP'] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export type IntegrationMode = 'SIMULATED_READ_ONLY' | 'SUPERVISED_READ_ONLY';

/** Situação do serviço no ERP, já traduzida para o vocabulário do programa. */
export type ErpServiceStatus = 'ACTIVE' | 'SUSPENDED' | 'INTERRUPTED' | 'ENDED' | 'UNKNOWN';

/**
 * Observação mínima de um contrato no ERP. Sem CPF, endereço, IP, login PPPoE ou
 * qualquer dado de topologia: só o necessário para conciliar o serviço do programa.
 */
export type ErpServiceObservation = {
  externalId: string;
  found: boolean;
  planName: string | null;
  serviceStatus: ErpServiceStatus;
  activatedAt: string | null;
};

export type IntegrationHealth = {
  provider: IntegrationProvider;
  mode: IntegrationMode;
  writesEnabled: false;
  status: 'available' | 'unavailable';
  message: string;
  checkedAt: string;
};

/** Porta (ACL) que todo adaptador de ERP implementa. Somente leitura. */
export type IntegrationAdapter = {
  provider: IntegrationProvider;
  mode: IntegrationMode;
  health(): Promise<IntegrationHealth>;
  observeServices(externalIds: readonly string[]): Promise<ErpServiceObservation[]>;
};

export class ErpIntegrationError extends Error {}
