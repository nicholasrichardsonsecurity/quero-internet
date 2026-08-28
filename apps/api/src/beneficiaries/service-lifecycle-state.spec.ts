import { canTransitionService, isServiceStatus, validateServiceTransition } from './service-lifecycle-state';

describe('service lifecycle state machine', () => {
  it('allows active service to be suspended, interrupted or ended', () => {
    expect(canTransitionService('ACTIVE', 'SUSPENDED')).toBe(true);
    expect(canTransitionService('ACTIVE', 'INTERRUPTED')).toBe(true);
    expect(canTransitionService('ACTIVE', 'ENDED')).toBe(true);
  });

  it('allows suspended or interrupted service to return to active', () => {
    expect(canTransitionService('SUSPENDED', 'ACTIVE')).toBe(true);
    expect(canTransitionService('INTERRUPTED', 'ACTIVE')).toBe(true);
  });

  it('blocks terminal service transitions', () => {
    expect(canTransitionService('ENDED', 'ACTIVE')).toBe(false);
    expect(validateServiceTransition({ current: 'ENDED', next: 'ACTIVE' })).toContain('Transição de serviço inválida');
  });

  it('requires descriptive reason for negative or terminal states', () => {
    expect(validateServiceTransition({ current: 'ACTIVE', next: 'SUSPENDED', reason: 'curto' })).toContain('motivo descritivo');
    expect(validateServiceTransition({ current: 'ACTIVE', next: 'INTERRUPTED', reason: 'sem sinal na região' })).toBeNull();
    expect(validateServiceTransition({ current: 'ACTIVE', next: 'ENDED', reason: 'benefício encerrado pelo programa' })).toBeNull();
  });

  it('does not require reason to restore service to active', () => {
    expect(validateServiceTransition({ current: 'SUSPENDED', next: 'ACTIVE' })).toBeNull();
    expect(validateServiceTransition({ current: 'INTERRUPTED', next: 'ACTIVE' })).toBeNull();
  });

  it('recognizes only supported service statuses', () => {
    expect(isServiceStatus('ACTIVE')).toBe(true);
    expect(isServiceStatus('SUSPENDED')).toBe(true);
    expect(isServiceStatus('INTERRUPTED')).toBe(true);
    expect(isServiceStatus('ENDED')).toBe(true);
    expect(isServiceStatus('CANCELLED')).toBe(false);
  });
});
