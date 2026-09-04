import { normalizedPaymentState, retryDecision } from './reconciliation-policy';

const now = new Date('2026-01-01T00:00:00.000Z');

describe('reconciliation policy', () => {
  it('backs off transient provider failures', () => {
    const result = retryDecision(503, 2, now);
    expect(result.retry).toBe(true);
    expect(result.nextAttemptAt?.toISOString()).toBe('2026-01-01T00:00:04.000Z');
  });

  it('does not retry permanent provider failures', () => {
    expect(retryDecision(404, 0, now).reason).toBe('permanent');
    expect(retryDecision(503, 5, now).reason).toBe('permanent');
  });

  it('normalizes payment states before delivery', () => {
    expect(normalizedPaymentState('PAYMENT_RECEIVED', 'RECEIVED')).toBe('PAID');
    expect(normalizedPaymentState('PAYMENT_REFUNDED', 'RECEIVED')).toBe('REFUNDED');
  });
});
