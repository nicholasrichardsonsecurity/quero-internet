import type { IntegrationAdapter, IntegrationHealth, IntegrationProvider, NormalizedCustomer } from './integration.types';

abstract class SimulatedAdapter implements IntegrationAdapter {
  abstract readonly provider: IntegrationProvider;

  health(): IntegrationHealth {
    return { provider: this.provider, mode: 'SIMULATED_READ_ONLY', writesEnabled: false, status: 'available', checkedAt: new Date().toISOString() };
  }

  async listCustomers(tenantId: string): Promise<NormalizedCustomer[]> {
    return [{
      externalId: `${this.provider.toLowerCase()}-demo-${tenantId.slice(0, 8)}`,
      name: `Beneficiário de demonstração ${this.provider}`,
      planName: this.provider === 'IXC' ? 'Fibra 300' : 'Conecta Cidade 300',
      serviceStatus: 'ACTIVE',
      activatedAt: '2026-01-15T12:00:00.000Z'
    }];
  }
}

export class SimulatedIxcAdapter extends SimulatedAdapter { readonly provider = 'IXC' as const; }
export class SimulatedSgpAdapter extends SimulatedAdapter { readonly provider = 'SGP' as const; }
