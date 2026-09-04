import assert from 'node:assert/strict';
import { normalizedPaymentState, retryDecision } from './reconciliation-policy.js';

const now = new Date('2026-01-01T00:00:00.000Z');
const transient = retryDecision(503, 2, now);
assert.equal(transient.retry, true);
assert.equal(transient.nextAttemptAt?.toISOString(), '2026-01-01T00:00:04.000Z');
assert.equal(retryDecision(404, 0, now).reason, 'permanent');
assert.equal(retryDecision(503, 5, now).reason, 'permanent');
assert.equal(normalizedPaymentState('PAYMENT_RECEIVED', 'RECEIVED'), 'PAID');
assert.equal(normalizedPaymentState('PAYMENT_REFUNDED', 'RECEIVED'), 'REFUNDED');
