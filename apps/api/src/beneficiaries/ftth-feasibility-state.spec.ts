import { validateFtthAssessment } from './ftth-feasibility-state';

describe('FTTH feasibility rules', () => {
  const now = new Date('2026-08-26T12:00:00.000Z');

  it('accepts technically feasible access with confirmed coverage and port', () => {
    expect(validateFtthAssessment({ result: 'FEASIBLE', coverageConfirmed: true, availablePorts: 1 }, now)).toBeNull();
  });

  it('rejects feasible result without confirmed coverage', () => {
    expect(validateFtthAssessment({ result: 'FEASIBLE', coverageConfirmed: false, availablePorts: 1 }, now)).toContain('cobertura');
  });

  it('rejects feasible result when known capacity has no available port', () => {
    expect(validateFtthAssessment({ result: 'FEASIBLE', coverageConfirmed: true, availablePorts: 0 }, now)).toContain('porta');
  });

  it('requires reason and readiness estimate for expansion', () => {
    expect(validateFtthAssessment({ result: 'EXPANSION_REQUIRED', coverageConfirmed: false }, now)).toContain('justificativa');
    expect(validateFtthAssessment({
      result: 'EXPANSION_REQUIRED',
      coverageConfirmed: false,
      technicalReason: 'Necessária expansão da rede de distribuição óptica.'
    }, now)).toContain('previsão');
  });

  it('rejects an expansion estimate in the past', () => {
    expect(validateFtthAssessment({
      result: 'EXPANSION_REQUIRED',
      coverageConfirmed: false,
      technicalReason: 'Necessária expansão da rede de distribuição óptica.',
      estimatedReadyAt: new Date('2026-08-25T12:00:00.000Z')
    }, now)).toContain('futuro');
  });

  it('accepts a future expansion estimate with a technical reason', () => {
    expect(validateFtthAssessment({
      result: 'EXPANSION_REQUIRED',
      coverageConfirmed: false,
      technicalReason: 'Necessária expansão da rede de distribuição óptica.',
      estimatedReadyAt: new Date('2026-09-10T12:00:00.000Z')
    }, now)).toBeNull();
  });

  it('requires descriptive reason for technical infeasibility', () => {
    expect(validateFtthAssessment({ result: 'NOT_FEASIBLE', coverageConfirmed: false, technicalReason: 'sem rede' }, now)).toContain('justificativa');
  });
});
