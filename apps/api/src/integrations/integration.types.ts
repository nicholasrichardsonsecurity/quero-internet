export const INTEGRATION_PROVIDERS = ['IXC', 'SGP'] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export type NormalizedCustomer = {
  externalId: string;
  name: string;
  planName: string;
  serviceStatus: 'ACTIVE' | 'SUSPENDED' | 'INTERRUPTED';
  activatedAt: string;
};

export type IntegrationHealth = {
  provider: IntegrationProvider;
  mode: 'SIMULATED_READ_ONLY';
  writesEnabled: false;
  status: 'available';
  checkedAt: string;
};

export type IntegrationAdapter = {
  provider: IntegrationProvider;
  health(): IntegrationHealth;
  listCustomers(tenantId: string): Promise<NormalizedCustomer[]>;
};
