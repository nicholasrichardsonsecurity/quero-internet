export const FTTH_FEASIBILITY_RESULTS = ['FEASIBLE', 'EXPANSION_REQUIRED', 'NOT_FEASIBLE'] as const;
export type FtthFeasibilityResult = (typeof FTTH_FEASIBILITY_RESULTS)[number];

export function isFtthFeasibilityResult(value: string): value is FtthFeasibilityResult {
  return FTTH_FEASIBILITY_RESULTS.includes(value as FtthFeasibilityResult);
}

export function validateFtthAssessment(input: {
  result: FtthFeasibilityResult;
  coverageConfirmed: boolean;
  availablePorts?: number;
  estimatedDropMeters?: number;
  technicalReason?: string;
  estimatedReadyAt?: Date;
}): string | null {
  if (input.availablePorts !== undefined && (!Number.isInteger(input.availablePorts) || input.availablePorts < 0)) {
    return 'availablePorts deve ser um inteiro maior ou igual a zero.';
  }
  if (input.estimatedDropMeters !== undefined && (!Number.isFinite(input.estimatedDropMeters) || input.estimatedDropMeters < 0)) {
    return 'estimatedDropMeters deve ser maior ou igual a zero.';
  }

  const reason = input.technicalReason?.trim();
  if (input.result === 'FEASIBLE') {
    if (!input.coverageConfirmed) return 'Viabilidade FTTH exige cobertura técnica confirmada.';
    if (input.availablePorts !== undefined && input.availablePorts < 1) return 'Viabilidade FTTH exige ao menos uma porta disponível.';
  }

  if (input.result === 'EXPANSION_REQUIRED') {
    if (!reason || reason.length < 12) return 'Expansão exige justificativa técnica descritiva.';
    if (!input.estimatedReadyAt) return 'Expansão exige previsão técnica de disponibilidade.';
  }

  if (input.result === 'NOT_FEASIBLE' && (!reason || reason.length < 12)) {
    return 'Inviabilidade exige justificativa técnica descritiva.';
  }

  return null;
}
