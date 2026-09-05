export type RetryDecision = {
  retry: boolean;
  nextAttemptAt: Date | null;
  reason: 'transient' | 'permanent' | 'success';
};

export function retryDecision(status: number | null, attempts: number, now = new Date(), maxAttempts = 5): RetryDecision {
  if (status === null || status >= 500 || status === 429) {
    if (attempts >= maxAttempts) return { retry: false, nextAttemptAt: null, reason: 'permanent' };
    const delayMs = Math.min(60 * 60 * 1000, 2 ** attempts * 1000);
    return { retry: true, nextAttemptAt: new Date(now.getTime() + delayMs), reason: 'transient' };
  }
  if (status >= 400) return { retry: false, nextAttemptAt: null, reason: 'permanent' };
  return { retry: false, nextAttemptAt: null, reason: 'success' };
}

export function normalizedPaymentState(eventName: string, providerStatus?: string): string {
  if (eventName === 'PAYMENT_REFUNDED') return 'REFUNDED';
  if (eventName === 'PAYMENT_CHARGEBACK_REQUESTED') return 'CHARGEBACK';
  if (eventName === 'PAYMENT_OVERDUE') return 'OVERDUE';
  if (eventName === 'PAYMENT_DELETED') return 'CANCELED';
  if (eventName === 'PAYMENT_RESTORED') return 'RESTORED';
  if (providerStatus === 'RECEIVED' || providerStatus === 'CONFIRMED') return 'PAID';
  return 'PENDING_RECONCILIATION';
}

export const DEFAULT_RECONCILIATION_INTERVAL_MS = 60_000;
export const MIN_RECONCILIATION_INTERVAL_MS = 10_000;

export function reconciliationInterval(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_RECONCILIATION_INTERVAL_MS;
  return Math.max(MIN_RECONCILIATION_INTERVAL_MS, Math.floor(parsed));
}
