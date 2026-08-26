import { ProviderReferralStatus } from '@prisma/client';

export function isProviderResponseStatus(status: ProviderReferralStatus): boolean {
  return status === ProviderReferralStatus.ACCEPTED || status === ProviderReferralStatus.DECLINED;
}

export function referralResponseReasonIsValid(status: ProviderReferralStatus, reason?: string): boolean {
  if (status !== ProviderReferralStatus.DECLINED) return true;
  return (reason?.trim().length ?? 0) >= 8;
}
