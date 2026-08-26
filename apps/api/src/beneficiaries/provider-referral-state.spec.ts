import { ProviderReferralStatus } from '@prisma/client';
import { isProviderResponseStatus, referralResponseReasonIsValid } from './provider-referral-state';

describe('provider referral decision rules', () => {
  it('accepts only provider response states', () => {
    expect(isProviderResponseStatus(ProviderReferralStatus.ACCEPTED)).toBe(true);
    expect(isProviderResponseStatus(ProviderReferralStatus.DECLINED)).toBe(true);
    expect(isProviderResponseStatus(ProviderReferralStatus.PENDING)).toBe(false);
    expect(isProviderResponseStatus(ProviderReferralStatus.CANCELLED)).toBe(false);
  });

  it('requires a descriptive reason when provider declines', () => {
    expect(referralResponseReasonIsValid(ProviderReferralStatus.DECLINED, 'sem porta')).toBe(true);
    expect(referralResponseReasonIsValid(ProviderReferralStatus.DECLINED, 'curto')).toBe(false);
    expect(referralResponseReasonIsValid(ProviderReferralStatus.DECLINED)).toBe(false);
  });

  it('does not require a reason for acceptance', () => {
    expect(referralResponseReasonIsValid(ProviderReferralStatus.ACCEPTED)).toBe(true);
  });
});
