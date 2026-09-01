import { OrganizationStatus, OrganizationType, type MembershipRole } from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { resolveDashboardScope, type OrganizationSnapshot } from './dashboard-scope';

function session(roles: MembershipRole[]): AuthenticatedSession {
  return {
    sessionId: 'session-1',
    user: { id: 'user-1', email: 'user@example.com', displayName: 'User' },
    organizationId: '00000000-0000-0000-0000-000000000001',
    tenantIds: ['00000000-0000-0000-0000-000000000010'],
    roles
  };
}

function organization(type: OrganizationType): OrganizationSnapshot {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    legalName: 'Organização Teste',
    tradeName: 'Org Teste',
    type,
    status: OrganizationStatus.ACTIVE
  };
}

describe('dashboard scope policy', () => {
  it('uses municipal minimized scope for municipality contexts', () => {
    const scope = resolveDashboardScope(session(['MUNICIPAL_MANAGER']), organization(OrganizationType.MUNICIPALITY));
    expect(scope.persona).toBe('municipal');
    expect(scope.dataScope).toBe('municipality');
    expect(scope.minimized).toBe(true);
  });

  it('uses provider scope for internet provider contexts', () => {
    const scope = resolveDashboardScope(session(['PROVIDER_OPERATOR']), organization(OrganizationType.INTERNET_PROVIDER));
    expect(scope.persona).toBe('provider');
    expect(scope.dataScope).toBe('provider');
    expect(scope.minimized).toBe(false);
  });

  it('allows platform owners to see tenant-level operational aggregation', () => {
    const scope = resolveDashboardScope(session(['ORGANIZATION_OWNER']), organization(OrganizationType.PLATFORM_OPERATOR));
    expect(scope.persona).toBe('superadmin');
    expect(scope.dataScope).toBe('tenant');
    expect(scope.minimized).toBe(true);
  });

  it('keeps auditors in minimized audit scope', () => {
    const scope = resolveDashboardScope(session(['AUDITOR']), organization(OrganizationType.AUDIT_ORGANIZATION));
    expect(scope.persona).toBe('auditor');
    expect(scope.dataScope).toBe('audit');
    expect(scope.minimized).toBe(true);
  });

  it('falls back to support scope for service providers without elevated role', () => {
    const scope = resolveDashboardScope(session(['SUPPORT']), organization(OrganizationType.SERVICE_PROVIDER));
    expect(scope.persona).toBe('support');
    expect(scope.dataScope).toBe('support');
    expect(scope.minimized).toBe(true);
  });
});
