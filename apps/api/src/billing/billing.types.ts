export const BILLING_EVENTS = [
  'PAYMENT_CONFIRMED','PAYMENT_RECEIVED','PAYMENT_OVERDUE','PAYMENT_DELETED',
  'PAYMENT_REFUNDED','PAYMENT_CHARGEBACK_REQUESTED','PAYMENT_RESTORED',
  'PAYMENT_CREATED','PAYMENT_UPDATED'
] as const;
export type BillingEventName = (typeof BILLING_EVENTS)[number];
export type BillingReference = { productKey:string; tenantId:string; companyId:string; planId:string; paymentId:string };
export type AsaasWebhookPayload = { id?:unknown; event?:unknown; payment?:{ id?:unknown; status?:unknown; externalReference?:unknown } };
export function parseBillingReference(value: unknown): BillingReference | null {
  if (typeof value !== 'string') return null;
  const parts=value.split(':');
  if (parts.length!==7 || parts[0]!=='aplivora' || parts[1]!=='v1') return null;
  const [, , productKey, tenantId, companyId, planId, paymentId]=parts;
  if ([productKey,tenantId,companyId,planId,paymentId].some((part)=>!/^[A-Za-z0-9._-]{1,128}$/.test(part))) return null;
  return {productKey,tenantId,companyId,planId,paymentId};
}
export function isBillingEventName(value: unknown): value is BillingEventName {
  return typeof value==='string' && (BILLING_EVENTS as readonly string[]).includes(value);
}
