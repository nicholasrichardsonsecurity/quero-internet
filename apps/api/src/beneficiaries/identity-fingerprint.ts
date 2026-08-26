import { createHmac } from 'node:crypto';

export function normalizeIdentityValue(value: string): string {
  return value.replace(/\D/g, '');
}

export function identityFingerprint(value: string, pepper: string): { hash: string; last4: string } {
  const normalized = normalizeIdentityValue(value);
  if (normalized.length !== 11) {
    throw new Error('Identificador deve conter 11 dígitos.');
  }
  if (pepper.length < 32) {
    throw new Error('Pepper de identificação ausente ou fraco.');
  }

  return {
    hash: createHmac('sha256', pepper).update(normalized, 'utf8').digest('hex'),
    last4: normalized.slice(-4)
  };
}
