import type { MembershipRole } from '@prisma/client';

export type AuthenticatedContext = {
  sessionId: string;
  userId: string;
  organizationId: string;
  tenantIds: string[];
  roles: MembershipRole[];
};
