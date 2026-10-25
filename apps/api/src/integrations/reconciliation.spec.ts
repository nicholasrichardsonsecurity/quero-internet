import { reconcile } from './reconciliation';

describe('reconcile', () => {
  it('classifica cada serviço do programa contra o ERP', () => {
    const result = reconcile(
      [
        { id: 's1', status: 'ACTIVE', externalServiceReference: '10' },
        { id: 's2', status: 'ACTIVE', externalServiceReference: '11' },
        { id: 's3', status: 'SUSPENDED', externalServiceReference: '12' },
        { id: 's4', status: 'ACTIVE', externalServiceReference: null },
        { id: 's5', status: 'INTERRUPTED', externalServiceReference: ' 13 ' }
      ],
      [
        { externalId: '10', found: true, planName: 'A', serviceStatus: 'ACTIVE', activatedAt: null },
        { externalId: '11', found: true, planName: 'A', serviceStatus: 'SUSPENDED', activatedAt: null },
        { externalId: '12', found: false, planName: null, serviceStatus: 'UNKNOWN', activatedAt: null },
        { externalId: '13', found: true, planName: 'A', serviceStatus: 'ACTIVE', activatedAt: null }
      ]
    );
    expect(result.items.map((i) => i.outcome)).toEqual(['MATCH', 'DIVERGENT', 'NOT_FOUND_IN_ERP', 'NO_EXTERNAL_REFERENCE', 'DIVERGENT']);
    expect(result.summary).toEqual({ total: 5, match: 1, divergent: 2, notFoundInErp: 1, noExternalReference: 1 });
  });
});
