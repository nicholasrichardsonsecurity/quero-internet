import { calculateLoginDelayMs, loginSubjectHash } from './login-throttle.service';

describe('login throttle policy', () => {
  it('normalizes e-mail before hashing', () => {
    expect(loginSubjectHash(' User@Example.COM ')).toBe(loginSubjectHash('user@example.com'));
  });

  it('does not delay the first attempts', () => {
    expect(calculateLoginDelayMs(0)).toBe(0);
    expect(calculateLoginDelayMs(1)).toBe(0);
    expect(calculateLoginDelayMs(2)).toBe(0);
  });

  it('applies exponential delay and caps it', () => {
    expect(calculateLoginDelayMs(3)).toBe(300);
    expect(calculateLoginDelayMs(4)).toBe(600);
    expect(calculateLoginDelayMs(5)).toBe(1200);
    expect(calculateLoginDelayMs(6)).toBe(2000);
    expect(calculateLoginDelayMs(20)).toBe(2000);
  });
});
