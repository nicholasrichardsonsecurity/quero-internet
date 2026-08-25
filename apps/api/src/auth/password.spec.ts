import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('hashes and verifies a valid password without storing plaintext', async () => {
    const password = 'SenhaGovTech!2026';
    const encoded = await hashPassword(password);

    expect(encoded).toMatch(/^scrypt\$/);
    expect(encoded).not.toContain(password);
    await expect(verifyPassword(password, encoded)).resolves.toBe(true);
    await expect(verifyPassword('SenhaErrada!2026', encoded)).resolves.toBe(false);
  });

  it('rejects passwords shorter than the minimum policy', async () => {
    await expect(hashPassword('curta123')).rejects.toThrow('pelo menos 12 caracteres');
  });

  it('fails closed for malformed hashes', async () => {
    await expect(verifyPassword('SenhaGovTech!2026', 'invalid')).resolves.toBe(false);
  });
});
