export type ProductKey = 'quero-internet' | 'loopclub';
export type BillingDeliveryEvent = {
  eventId: string;
  productKey: string;
  paymentId: string;
  state: string;
  environment: 'sandbox' | 'production';
};

type ProductTarget = { baseUrl: string; token: string };

export class ProductDeliveryError extends Error {
  constructor(readonly status: number | null, message: string) {
    super(message);
  }
}

export function productTarget(productKey: ProductKey, environment: 'sandbox' | 'production', env: NodeJS.ProcessEnv = process.env): ProductTarget {
  const prefix = productKey === 'quero-internet' ? 'QUERO_INTERNET' : 'LOOPCLUB';
  const suffix = environment === 'production' ? 'PROD' : 'SANDBOX';
  const baseUrl = env[`BILLING_${prefix}_${suffix}_URL`]?.trim();
  const token = env[`BILLING_${prefix}_${suffix}_TOKEN`]?.trim();
  if (!baseUrl || !token) throw new Error(`Missing billing target configuration for ${productKey}/${environment}`);
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== 'https:' && environment === 'production') throw new Error('Production billing target must use HTTPS');
  return { baseUrl: parsed.toString().replace(/\/$/, ''), token };
}

export async function deliverToProduct(
  event: BillingDeliveryEvent,
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv = process.env
): Promise<void> {
  const target = productTarget(event.productKey, event.environment, env);
  const response = await fetchImpl(`${target.baseUrl}/internal/billing/events`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${target.token}`,
      'x-billing-event-id': event.eventId
    },
    body: JSON.stringify(event)
  });
  if (!response.ok) throw new ProductDeliveryError(response.status, `Product delivery failed with HTTP ${response.status}`);
}
