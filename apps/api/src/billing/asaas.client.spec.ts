import { AsaasClient } from './asaas.client';

describe('AsaasClient', () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.ASAAS_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ASAAS_API_KEY = originalKey;
  });

  it('returns a payment from Asaas', async () => {
    process.env.ASAAS_API_KEY = 'test-key';
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'pay-1', status: 'RECEIVED' }), { status: 200 })) as typeof fetch;

    await expect(new AsaasClient().getPayment('pay-1')).resolves.toEqual({ id: 'pay-1', status: 'RECEIVED' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api-sandbox.asaas.com/v3/payments/pay-1',
      expect.objectContaining({ headers: expect.objectContaining({ access_token: 'test-key' }) })
    );
  });

  it('retries transient provider failures', async () => {
    process.env.ASAAS_API_KEY = 'test-key';
    global.fetch = jest.fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'pay-1', status: 'CONFIRMED' }), { status: 200 })) as typeof fetch;

    await expect(new AsaasClient().getPayment('pay-1')).resolves.toEqual({ id: 'pay-1', status: 'CONFIRMED' });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
