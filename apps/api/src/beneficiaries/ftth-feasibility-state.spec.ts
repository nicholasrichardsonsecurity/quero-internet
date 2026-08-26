import { validateFtthAssessment } from './ftth-feasibility-state';

describe('FTTH feasibility rules', () => {
  it('accepts technically feasible access with confirmed coverage and port', () => {
    expect(validateFtthAssessment({ result: 'FEASIBLE', coverageConfirmed: true, availablePorts: 1 })).toBeNull();
  });

  it('rejects feasible result without confirmed coverage', () => {
    expect(validateFtthAssessment({ result: 'FEASIBLE', coverageConfirmed: false, availablePorts: 1 })).toContain('cobertura');
  });

  it('rejects feasible result when known capacity has no available port', () => {
    expect(validateFtthAssessment({ result: 'FEASIBLE', coverageConfirmed: true, availablePorts: 0 })).toContain('porta');
  });

  it('requires reason and readiness estimate for expansion', () => {
    expect(validateFtthAssessment({ result: 'EXPANSION_REQUIRED', coverageConfirmed: false })).toContain('justificativa');
    expect(validateFtthAssessment({
      result: 'EXPANSION_REQUIRED',
      coverageConfirmed: false,
      technicalReason: 'Necessária expansão da rede de distribuição óptica.'
    })).toContain('previsão');
  });

  it('requires descriptive reason for technical infeasibility', () => {
    expect(validateFtthAssessment({ result: 'NOT_FEASIBLE', coverageConfirmed: false, technicalReason: 'sem rede' })).toContain('justificativa');
  });
});
