import assert from 'node:assert/strict';
import { deliverToProduct, productTarget } from './product-adapters.js';

const env = {
  BILLING_QUERO_INTERNET_SANDBOX_URL: 'http://quero-internet.test',
  BILLING_QUERO_INTERNET_SANDBOX_TOKEN: 'qi-test-token',
  BILLING_LOOPCLUB_SANDBOX_URL: 'http://loopclub.test',
  BILLING_LOOPCLUB_SANDBOX_TOKEN: 'lc-test-token'
};
assert.equal(productTarget('quero-internet', 'sandbox', env).baseUrl, 'http://quero-internet.test');
assert.equal(productTarget('loopclub', 'sandbox', env).token, 'lc-test-token');

let requested: RequestInit | undefined;
await deliverToProduct({
  eventId: 'evt-1',
  productKey: 'loopclub',
  paymentId: 'pay-1',
  state: 'PAID',
  environment: 'sandbox'
}, async (_url, init) => {
  requested = init;
  return new Response('{}', { status: 200 });
}, env);
assert.equal(requested?.headers && new Headers(requested.headers).get('x-billing-event-id'), 'evt-1');
assert.equal(new Headers(requested?.headers).get('authorization'), 'Bearer lc-test-token');
