import { randomBytes } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import { SecretCipher } from './secret-cipher';

const key = () => randomBytes(32).toString('base64');

describe('SecretCipher', () => {
  it('cifra e decifra sem deixar o token em claro', () => {
    const cipher = new SecretCipher(key());
    const stored = cipher.encrypt('token-super-secreto', 'ctx');
    expect(stored.startsWith('v1:')).toBe(true);
    expect(stored).not.toContain('token-super-secreto');
    expect(cipher.decrypt(stored, 'ctx')).toBe('token-super-secreto');
  });

  it('gera texto diferente a cada cifragem (IV aleatório)', () => {
    const cipher = new SecretCipher(key());
    expect(cipher.encrypt('abc12345', 'ctx')).not.toBe(cipher.encrypt('abc12345', 'ctx'));
  });

  it('não decifra em outro contexto (outra organização) nem com outra chave', () => {
    const stored = new SecretCipher(key()).encrypt('abc12345', 'org-a');
    const same = new SecretCipher(key());
    expect(() => same.decrypt(stored, 'org-a')).toThrow();
    const cipher = new SecretCipher(key());
    const own = cipher.encrypt('abc12345', 'org-a');
    expect(() => cipher.decrypt(own, 'org-b')).toThrow();
  });

  it('detecta texto adulterado', () => {
    const cipher = new SecretCipher(key());
    const [v, iv, tag, data] = cipher.encrypt('abc12345', 'ctx').split(':');
    const flipped = Buffer.from(data, 'base64url'); flipped[0] ^= 1;
    expect(() => cipher.decrypt([v, iv, tag, flipped.toString('base64url')].join(':'), 'ctx')).toThrow();
  });

  it('sem chave configurada, recusa cifrar com 503; chave de tamanho errado falha ao subir', () => {
    expect(new SecretCipher('').configured).toBe(false);
    expect(() => new SecretCipher('').encrypt('abc12345', 'ctx')).toThrow(ServiceUnavailableException);
    expect(() => new SecretCipher(Buffer.from('curta').toString('base64'))).toThrow(/32 bytes/);
  });
});
