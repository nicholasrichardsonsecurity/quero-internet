import type { ServiceStatus } from '@prisma/client';

export interface ServiceTransitionInput {
  current: ServiceStatus;
  next: ServiceStatus;
  reason?: string;
}

const TERMINAL: ServiceStatus[] = ['ENDED'];

export function canTransitionService(current: ServiceStatus, next: ServiceStatus): boolean {
  if (TERMINAL.includes(current)) return false;

  if (current === 'ACTIVE') return next === 'SUSPENDED' || next === 'INTERRUPTED' || next === 'ENDED';
  if (current === 'SUSPENDED') return next === 'ACTIVE' || next === 'ENDED';
  if (current === 'INTERRUPTED') return next === 'ACTIVE' || next === 'ENDED';

  return false;
}

export function validateServiceTransition(input: ServiceTransitionInput): string | null {
  if (!canTransitionService(input.current, input.next)) {
    return `Transição de serviço inválida: ${input.current} -> ${input.next}.`;
  }

  if (input.next === 'SUSPENDED' || input.next === 'INTERRUPTED' || input.next === 'ENDED') {
    if ((input.reason?.trim().length ?? 0) < 12) {
      return 'Suspensão, interrupção ou encerramento exige motivo descritivo.';
    }
  }

  return null;
}

export function isServiceStatus(value: string): value is ServiceStatus {
  return value === 'ACTIVE' || value === 'SUSPENDED' || value === 'INTERRUPTED' || value === 'ENDED';
}
