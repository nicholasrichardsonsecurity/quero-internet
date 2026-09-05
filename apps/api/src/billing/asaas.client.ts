import { Injectable } from '@nestjs/common';

export type AsaasPayment = {
  id: string;
  status: string;
};

export type CreateAsaasPaymentInput = {
  customer: string;
  billingType: string;
  value: number;
  dueDate: string;
  description?: string;
  externalReference: string;
};

export type CreatedAsaasPayment = AsaasPayment & {
  invoiceUrl?: string;
  bankSlipUrl?: string;
};

@Injectable()
export class AsaasClient {
  private readonly baseUrl = (process.env.ASAAS_BASE_URL ?? 'https://api-sandbox.asaas.com').replace(/\/$/, '');
  private readonly maxAttempts = 3;

  async getPayment(paymentId: string): Promise<AsaasPayment> {
    const apiKey = this.apiKey();
    return this.request<AsaasPayment>(`/v3/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: { accept: 'application/json', access_token: apiKey }
    }, (body) => {
      if (typeof body.id !== 'string' || typeof body.status !== 'string') {
        throw new Error('Resposta Asaas inválida.');
      }
      return { id: body.id, status: body.status };
    });
  }

  async createPayment(input: CreateAsaasPaymentInput): Promise<CreatedAsaasPayment> {
    const apiKey = this.apiKey();
    return this.request<CreatedAsaasPayment>('/v3/payments', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        access_token: apiKey
      },
      body: JSON.stringify(input)
    }, (body) => {
      if (typeof body.id !== 'string' || typeof body.status !== 'string') {
        throw new Error('Resposta Asaas inválida.');
      }
      return {
        id: body.id,
        status: body.status,
        ...(typeof body.invoiceUrl === 'string' ? { invoiceUrl: body.invoiceUrl } : {}),
        ...(typeof body.bankSlipUrl === 'string' ? { bankSlipUrl: body.bankSlipUrl } : {})
      };
    });
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    parse: (body: Record<string, unknown>) => T
  ): Promise<T> {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, init);
      if (response.ok) return parse((await response.json()) as Record<string, unknown>);

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === this.maxAttempts) {
        throw new Error(`Asaas retornou HTTP ${response.status}.`);
      }
      await this.delay(attempt * 250);
    }
    throw new Error('Falha inesperada ao consultar Asaas.');
  }

  private apiKey(): string {
    const apiKey = process.env.ASAAS_API_KEY?.trim();
    if (!apiKey) throw new Error('ASAAS_API_KEY não configurada.');
    return apiKey;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
