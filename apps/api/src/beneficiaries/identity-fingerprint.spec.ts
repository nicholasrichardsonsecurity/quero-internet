import { identityFingerprint, normalizeIdentityValue } from './identity-fingerprint';

describe('identity fingerprint', () => {
  const pepper = 'a'.repeat(48);

  it('normalizes formatting characters', () => {
    expect(normalizeIdentityValue('123.456.789-01')).toBe('12345678901');
  });

  it('is deterministic with the same pepper without returning the raw identifier', () => {
    const first = identityFingerprint('123.456.789-01', pepper);
    const second = identityFingerprint('12345678901', pepper);

    expect(first.hash).toBe(second.hash);
    expect(first.hash).not.toContain('12345678901');
    expect(first.last4).toBe('8901');
  });

  it('changes when the pepper changes', () => {
    const first = identityFingerprint('12345678901', pepper);
    const second = identityFingerprint('12345678901', 'b'.repeat(48));
    expect(first.hash).not.toBe(second.hash);
  });

  it('rejects invalid identifiers and weak peppers', () => {
    expect(() => identityFingerprint('123', pepper)).toThrow();
    expect(() => identityFingerprint('12345678901', 'short')).toThrow();
  });
});
