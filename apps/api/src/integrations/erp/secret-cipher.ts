import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const TAG_LENGTH = 16;
import { ServiceUnavailableException } from '@nestjs/common';

/**
 * Cifra segredos de integração (tokens de ERP) com AES-256-GCM.
 * Formato guardado: `v1:<iv base64url>:<tag base64url>:<texto cifrado base64url>`.
 * O contexto (organização + provedor) entra como dado autenticado: um texto cifrado
 * copiado para outra organização não decifra.
 * A chave vem de INTEGRATION_ENCRYPTION_KEY: 32 bytes em base64 (`openssl rand -base64 32`).
 */
export class SecretCipher {
  private readonly key: Buffer | null;

  constructor(rawKey: string | undefined = process.env.INTEGRATION_ENCRYPTION_KEY) {
    const key = rawKey?.trim() ? Buffer.from(rawKey.trim(), 'base64') : null;
    if (key && key.length !== 32) throw new Error('INTEGRATION_ENCRYPTION_KEY deve ter 32 bytes em base64.');
    this.key = key;
  }

  get configured(): boolean {
    return this.key !== null;
  }

  private requireKey(): Buffer {
    if (!this.key) throw new ServiceUnavailableException('Cadastro de credenciais indisponível: INTEGRATION_ENCRYPTION_KEY não configurada no servidor.');
    return this.key;
  }

  encrypt(plain: string, context: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.requireKey(), iv, { authTagLength: TAG_LENGTH });
    cipher.setAAD(Buffer.from(context));
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join(':');
  }

  decrypt(stored: string, context: string): string {
    const [version, iv, tag, data] = stored.split(':');
    if (version !== 'v1' || !iv || !tag || !data) throw new Error('Formato de segredo inválido.');
    const authTag = Buffer.from(tag, 'base64url');
    if (authTag.length !== TAG_LENGTH) throw new Error('Formato de segredo inválido.');
    const decipher = createDecipheriv('aes-256-gcm', this.requireKey(), Buffer.from(iv, 'base64url'), { authTagLength: TAG_LENGTH });
    decipher.setAAD(Buffer.from(context));
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  }
}
