import type { ServiceStatus } from '@prisma/client';
import type { ErpServiceObservation } from './integration.types';

export type LocalService = { id: string; status: ServiceStatus; externalServiceReference: string | null };

export type ReconciliationOutcome = 'MATCH' | 'DIVERGENT' | 'NOT_FOUND_IN_ERP' | 'NO_EXTERNAL_REFERENCE';

export type ReconciliationItem = {
  activeServiceId: string;
  externalId: string | null;
  localStatus: ServiceStatus;
  erpStatus: ErpServiceObservation['serviceStatus'] | null;
  outcome: ReconciliationOutcome;
};

/**
 * Compara o status do serviço no programa com o observado no ERP. Só aponta divergências:
 * nunca altera o serviço (o ERP não é fonte única de verdade, ver AGENTS.md).
 */
export function reconcile(services: readonly LocalService[], observations: readonly ErpServiceObservation[]) {
  const byId = new Map(observations.map((o) => [o.externalId, o]));
  const items: ReconciliationItem[] = services.map((service) => {
    const externalId = service.externalServiceReference?.trim() || null;
    if (!externalId) return { activeServiceId: service.id, externalId, localStatus: service.status, erpStatus: null, outcome: 'NO_EXTERNAL_REFERENCE' };
    const observed = byId.get(externalId);
    if (!observed?.found) return { activeServiceId: service.id, externalId, localStatus: service.status, erpStatus: null, outcome: 'NOT_FOUND_IN_ERP' };
    const outcome: ReconciliationOutcome = observed.serviceStatus === service.status ? 'MATCH' : 'DIVERGENT';
    return { activeServiceId: service.id, externalId, localStatus: service.status, erpStatus: observed.serviceStatus, outcome };
  });
  const count = (o: ReconciliationOutcome) => items.filter((i) => i.outcome === o).length;
  return {
    summary: {
      total: items.length,
      match: count('MATCH'),
      divergent: count('DIVERGENT'),
      notFoundInErp: count('NOT_FOUND_IN_ERP'),
      noExternalReference: count('NO_EXTERNAL_REFERENCE')
    },
    items
  };
}
