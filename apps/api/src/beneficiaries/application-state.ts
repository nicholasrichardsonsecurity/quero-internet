import { ApplicationStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  SUBMITTED: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.CANCELLED],
  UNDER_REVIEW: [ApplicationStatus.ELIGIBLE, ApplicationStatus.INELIGIBLE, ApplicationStatus.CANCELLED],
  ELIGIBLE: [ApplicationStatus.REFERRED, ApplicationStatus.CANCELLED],
  INELIGIBLE: [],
  REFERRED: [],
  CANCELLED: []
};

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function requiresDecisionReason(status: ApplicationStatus): boolean {
  return status === ApplicationStatus.INELIGIBLE || status === ApplicationStatus.CANCELLED;
}
