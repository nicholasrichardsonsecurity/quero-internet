import { ApplicationStatus } from '@prisma/client';
import { canTransitionApplication, requiresDecisionReason } from './application-state';

describe('application review state machine', () => {
  it('allows the expected manual review flow', () => {
    expect(canTransitionApplication(ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW)).toBe(true);
    expect(canTransitionApplication(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.ELIGIBLE)).toBe(true);
    expect(canTransitionApplication(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.INELIGIBLE)).toBe(true);
    expect(canTransitionApplication(ApplicationStatus.ELIGIBLE, ApplicationStatus.REFERRED)).toBe(true);
  });

  it('prevents skipping review and reopening terminal states', () => {
    expect(canTransitionApplication(ApplicationStatus.SUBMITTED, ApplicationStatus.ELIGIBLE)).toBe(false);
    expect(canTransitionApplication(ApplicationStatus.INELIGIBLE, ApplicationStatus.UNDER_REVIEW)).toBe(false);
    expect(canTransitionApplication(ApplicationStatus.REFERRED, ApplicationStatus.UNDER_REVIEW)).toBe(false);
  });

  it('requires reason for negative or cancellation decisions', () => {
    expect(requiresDecisionReason(ApplicationStatus.INELIGIBLE)).toBe(true);
    expect(requiresDecisionReason(ApplicationStatus.CANCELLED)).toBe(true);
    expect(requiresDecisionReason(ApplicationStatus.ELIGIBLE)).toBe(false);
  });
});
