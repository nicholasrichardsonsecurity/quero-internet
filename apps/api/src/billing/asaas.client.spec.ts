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

    const result = await new AsaasClient().createPayment({
      customer: 'cus_123',
      billingType: 'PIX',
      value: 10,
      dueDate: '2026-09-10',
      externalReference: 'aplivora:v1:loopclub:t:c:p:internal'
    });
    expect(result).toMatchObject({ id: 'pay_123', status: 'PENDING' });
    expect(JSON.stringify(result)).not.toContain('sandbox-key');

    expect(fetchMock).toHaveBeenCalledWith('https://api-sandbox.asaas.com/v3/payments', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('aplivora:v1:loopclub')
    }));
    // A chave só pode viajar no header access_token, nunca na URL nem no corpo.
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).access_token).toBe('sandbox-key');
    expect(url).not.toContain('sandbox-key');
    expect(String(init.body)).not.toContain('sandbox-key');
    fetchMock.mockRestore();
  });
});
