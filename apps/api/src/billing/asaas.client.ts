import { Injectable } from '@nestjs/common';

export type AsaasPayment = {
  id: string;
  status: string;
};

@Injectable()
export class AsaasClient {
  private readonly baseUrl = (process.env.ASAAS_BASE_URL ?? 'https://api-sandbox.asaas.com').replace(/\/$/, '');
  private readonly maxAttempts = 3;

  async getPayment(paymentId: string): Promise<AsaasPayment> {
    const apiKey = process.env.ASAAS_API_KEY?.trim();
    if (!apiKey) throw new Error('ASAAS_API_KEY não configurada.');

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const response = await fetch(`${this.baseUrl}/v3/payments/${encodeURIComponent(paymentId)}`, {
        headers: { accept: 'application/json', access_token: apiKey }
      });

      if (response.ok) {
        const body = (await response.json()) as { id?: unknown; status?: unknown };
        if (typeof body.id !== 'string' || typeof body.status !== 'string') {
          throw new Error('Resposta Asaas inválida.');
        }
        return { id: body.id, status: body.status };
      }

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === this.maxAttempts) {
        throw new Error(`Asaas retornou HTTP ${response.status}.`);
      }
      await this.delay(attempt * 250);
    }

    throw new Error('Falha inesperada ao consultar Asaas.');
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
