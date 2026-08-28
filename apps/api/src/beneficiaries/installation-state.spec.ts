import { canTransitionInstallation, validateInstallationTransition } from './installation-state';

describe('installation state machine', () => {
  const now = new Date('2026-08-28T12:00:00.000Z');
  const future = new Date('2026-08-29T12:00:00.000Z');

  it('allows the happy path from pending to activation', () => {
    expect(canTransitionInstallation('INSTALLATION_PENDING', 'SCHEDULED')).toBe(true);
    expect(canTransitionInstallation('SCHEDULED', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionInstallation('IN_PROGRESS', 'INSTALLED')).toBe(true);
    expect(canTransitionInstallation('INSTALLED', 'ACTIVATED')).toBe(true);
  });

  it('allows rescheduling while scheduled', () => {
    expect(validateInstallationTransition({ current: 'SCHEDULED', next: 'SCHEDULED', scheduledAt: future, now })).toBeNull();
  });

  it('rejects scheduling in the past', () => {
    expect(validateInstallationTransition({
      current: 'INSTALLATION_PENDING',
      next: 'SCHEDULED',
      scheduledAt: new Date('2026-08-27T12:00:00.000Z'),
      now
    })).toContain('futuro');
  });

  it('requires an operational summary to finish physical installation', () => {
    expect(validateInstallationTransition({ current: 'IN_PROGRESS', next: 'INSTALLED', installationSummary: 'ok' })).toContain('resumo');
    expect(validateInstallationTransition({
      current: 'IN_PROGRESS',
      next: 'INSTALLED',
      installationSummary: 'Drop lançado, ONU instalada e níveis ópticos conferidos.'
    })).toBeNull();
  });

  it('requires descriptive reason for failure and cancellation', () => {
    expect(validateInstallationTransition({ current: 'IN_PROGRESS', next: 'FAILED', reason: 'sem acesso' })).toContain('motivo');
    expect(validateInstallationTransition({
      current: 'SCHEDULED',
      next: 'CANCELLED',
      reason: 'Beneficiário solicitou cancelamento antes da visita técnica.'
    })).toBeNull();
  });

  it('keeps terminal states closed', () => {
    expect(canTransitionInstallation('ACTIVATED', 'CANCELLED')).toBe(false);
    expect(canTransitionInstallation('FAILED', 'SCHEDULED')).toBe(false);
    expect(canTransitionInstallation('CANCELLED', 'SCHEDULED')).toBe(false);
  });
});
