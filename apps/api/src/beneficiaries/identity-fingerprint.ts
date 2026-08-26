import { createHash } from 'node:crypto';

export function normalizeIdentityValue(value: string): string {
  return value.replace(/\D/g, '');
}

export function identityFingerprint(value: string): { hash: string; last4: string } {
  const normalized = normalizeIdentityValue(value);
  if (normalized.length !== 11) {
    throw new Error('Identificador deve conter 11 dígitos.');
  }

  return {
    hash: createHash('sha256').update(normalized, 'utf8').digest('hex'),
    last4: normalized.slice(-4)
  };
}
