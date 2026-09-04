export const INTERNAL_BILLING_STATES = [
  'PAID',
  'OVERDUE',
  'REFUNDED',
  'CHARGEBACK',
  'CANCELED',
  'RESTORED'
] as const;
export type InternalBillingState = (typeof INTERNAL_BILLING_STATES)[number];
export type InternalBillingEvent = {
  eventId?: unknown;
  productKey?: unknown;
  paymentId?: unknown;
  state?: unknown;
  environment?: unknown;
};
