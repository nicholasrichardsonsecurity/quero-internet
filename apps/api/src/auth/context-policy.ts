import type { MembershipRole, MembershipStatus } from '@prisma/client';

type MembershipSnapshot = {
  organizationId: string;
  role: MembershipRole;
  status: MembershipStatus;
  validFrom: Date | null;
  validUntil: Date | null;
  tenantIds: string[];
};

export type ResolvedContext = {
  organizationId: string;
  tenantIds: string[];
  roles: MembershipRole[];
};

export function resolveOrganizationContext(
  organizationId: string | null,
  memberships: MembershipSnapshot[],
  now = new Date()
): ResolvedContext | null {
  if (!organizationId) return null;

  const active = memberships.filter((membership) => {
    const startsOk = !membership.validFrom || membership.validFrom <= now;
    const endsOk = !membership.validUntil || membership.validUntil > now;
    return membership.organizationId === organizationId && membership.status === 'ACTIVE' && startsOk && endsOk;
  });

  if (active.length === 0) return null;

  const tenantIds = Array.from(new Set(active.flatMap((membership) => membership.tenantIds)));
  if (tenantIds.length === 0) return null;

  return {
    organizationId,
    tenantIds,
    roles: Array.from(new Set(active.map((membership) => membership.role)))
  };
}
