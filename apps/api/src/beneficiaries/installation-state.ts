import type { InstallationStatus } from '@prisma/client';

export interface InstallationTransitionInput {
  current: InstallationStatus;
  next: InstallationStatus;
  scheduledAt?: Date;
  reason?: string;
  installationSummary?: string;
  now?: Date;
}

const TERMINAL: InstallationStatus[] = ['ACTIVATED', 'FAILED', 'CANCELLED'];

export function canTransitionInstallation(current: InstallationStatus, next: InstallationStatus): boolean {
  if (TERMINAL.includes(current)) return false;

  if (current === 'INSTALLATION_PENDING') return next === 'SCHEDULED' || next === 'CANCELLED';
  if (current === 'SCHEDULED') return next === 'SCHEDULED' || next === 'IN_PROGRESS' || next === 'CANCELLED';
  if (current === 'IN_PROGRESS') return next === 'INSTALLED' || next === 'FAILED' || next === 'CANCELLED';
  if (current === 'INSTALLED') return next === 'ACTIVATED' || next === 'CANCELLED';

  return false;
}

export function validateInstallationTransition(input: InstallationTransitionInput): string | null {
  if (!canTransitionInstallation(input.current, input.next)) {
    return `Transição de instalação inválida: ${input.current} -> ${input.next}.`;
  }

  if (input.next === 'SCHEDULED') {
    if (!input.scheduledAt || Number.isNaN(input.scheduledAt.getTime())) {
      return 'Agendamento exige data e hora válidas.';
    }
    const now = input.now ?? new Date();
    if (input.scheduledAt.getTime() <= now.getTime()) {
      return 'Agendamento deve ocorrer no futuro.';
    }
  }

  if (input.next === 'INSTALLED') {
    if ((input.installationSummary?.trim().length ?? 0) < 12) {
      return 'Conclusão da instalação exige resumo operacional descritivo.';
    }
  }

  if (input.next === 'FAILED' || input.next === 'CANCELLED') {
    if ((input.reason?.trim().length ?? 0) < 12) {
      return 'Falha ou cancelamento exige motivo descritivo.';
    }
  }

  return null;
}
