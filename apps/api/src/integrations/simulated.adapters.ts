import type { ErpServiceObservation, IntegrationAdapter, IntegrationHealth, IntegrationProvider } from './integration.types';

/** Usado quando a leitura real está desligada ou o provedor não tem conexão configurada. */
export class SimulatedAdapter implements IntegrationAdapter {
  readonly mode = 'SIMULATED_READ_ONLY' as const;

  constructor(readonly provider: IntegrationProvider) {}

  async health(): Promise<IntegrationHealth> {
    return {
      provider: this.provider,
      mode: this.mode,
      writesEnabled: false,
      status: 'available',
      message: 'Modo simulado: nenhuma chamada ao ERP.',
      checkedAt: new Date().toISOString()
    };
  }

  async observeServices(externalIds: readonly string[]): Promise<ErpServiceObservation[]> {
    return externalIds.map((externalId) => ({
      externalId,
      found: true,
      planName: this.provider === 'IXC' ? 'Fibra 300' : 'Conecta Cidade 300',
      serviceStatus: 'ACTIVE',
      activatedAt: '2026-01-15'
    }));
  }
}
