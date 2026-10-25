import type { IntegrationProvider as PrismaIntegrationProvider } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import type { ErpConnection } from './erp-connections';
import type { SecretCipher } from './secret-cipher';
import type { IntegrationProvider } from '../integration.types';

export const connectionContext = (organizationId: string, provider: IntegrationProvider) => `integration-connection:${organizationId}:${provider}`;

export type ConnectionStore = {
  find(organizationId: string, provider: IntegrationProvider): Promise<ErpConnection | null>;
};

/** Lê a conexão cadastrada pelo provedor na tela e decifra o token só na hora do uso. */
export class DatabaseConnectionStore implements ConnectionStore {
  constructor(private readonly prisma: PrismaService, private readonly cipher: SecretCipher) {}

  async find(organizationId: string, provider: IntegrationProvider): Promise<ErpConnection | null> {
    const row = await this.prisma.integrationConnection.findUnique({
      where: { organizationId_provider: { organizationId, provider: provider as PrismaIntegrationProvider } }
    });
    if (!row) return null;
    const token = this.cipher.decrypt(row.tokenCiphertext, connectionContext(organizationId, provider));
    return provider === 'IXC'
      ? { provider: 'IXC', organizationId, baseUrl: row.baseUrl, user: row.apiUser ?? undefined, token }
      : { provider: 'SGP', organizationId, baseUrl: row.baseUrl, token, app: row.apiApp ?? '' };
  }
}
