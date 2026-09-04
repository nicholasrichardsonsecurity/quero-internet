export type AsaasEnvironment = 'sandbox' | 'production';

export type AsaasPayment = {
  id: string;
  status?: string;
  externalReference?: string;
};

export class AsaasHttpError extends Error {
  constructor(readonly status: number) {
    super(`Asaas request failed with HTTP ${status}`);
  }
}

export class AsaasClient {
  private readonly baseUrl: string;
  constructor(
    private readonly environment: AsaasEnvironment,
    private readonly accessToken: string,
    fetchImpl: typeof fetch = fetch
  ) {
    if (!accessToken.trim()) throw new Error('ASAAS_ACCESS_TOKEN is required');
    this.baseUrl = environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://api-sandbox.asaas.com/v3';
    this.fetchImpl = fetchImpl;
  }

  private readonly fetchImpl: typeof fetch;

  async getPayment(paymentId: string): Promise<AsaasPayment> {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(paymentId)) throw new Error('Invalid Asaas payment id');
    const response = await this.fetchImpl(`${this.baseUrl}/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: { accept: 'application/json', access_token: this.accessToken }
    });
    if (!response.ok) throw new AsaasHttpError(response.status);
    return (await response.json()) as AsaasPayment;
  }
}
