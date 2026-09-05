import { AsaasClient } from './asaas.client';

describe('AsaasClient', () => {
  beforeEach(() => {
    process.env.ASAAS_API_KEY = 'sandbox-key';
    process.env.ASAAS_BASE_URL = 'https://api-sandbox.asaas.com';
  });

  it('creates a payment without logging or returning the API key', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      id: 'pay_123',
      status: 'PENDING',
      invoiceUrl: 'https://sandbox.asaas.com/i/123'
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    await expect(new AsaasClient().createPayment({
      customer: 'cus_123',
      billingType: 'PIX',
      value: 10,
      dueDate: '2026-09-10',
      externalReference: 'aplivora:v1:loopclub:t:c:p:internal'
    })).resolves.toMatchObject({ id: 'pay_123', status: 'PENDING' });

    expect(fetchMock).toHaveBeenCalledWith('https://api-sandbox.asaas.com/v3/payments', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('aplivora:v1:loopclub')
    }));
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('sandbox-key');
    fetchMock.mockRestore();
  });
});
