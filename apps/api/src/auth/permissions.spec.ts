import type { MembershipRole } from '@prisma/client';
import { hasAllPermissions, PERMISSIONS, permissionsForRoles } from './permissions';

describe('RBAC permission matrix', () => {
  it('allows municipal manager to manage programs and beneficiaries', () => {
    const roles: MembershipRole[] = ['MUNICIPAL_MANAGER'];
    expect(hasAllPermissions(roles, [PERMISSIONS.PROGRAM_WRITE, PERMISSIONS.BENEFICIARY_WRITE])).toBe(true);
  });

  it('blocks municipal operator from provider write and audit read', () => {
    const roles: MembershipRole[] = ['MUNICIPAL_OPERATOR'];
    expect(hasAllPermissions(roles, [PERMISSIONS.PROVIDER_WRITE])).toBe(false);
    expect(hasAllPermissions(roles, [PERMISSIONS.AUDIT_READ])).toBe(false);
  });

  it('allows provider operator to assess feasibility without referral write privileges', () => {
    const roles: MembershipRole[] = ['PROVIDER_OPERATOR'];
    const granted = permissionsForRoles(roles);
    expect(granted.has(PERMISSIONS.PROVIDER_READ)).toBe(true);
    expect(granted.has(PERMISSIONS.PROVIDER_WRITE)).toBe(false);
    expect(granted.has(PERMISSIONS.REFERRAL_WRITE)).toBe(false);
    expect(granted.has(PERMISSIONS.FEASIBILITY_READ)).toBe(true);
    expect(granted.has(PERMISSIONS.FEASIBILITY_WRITE)).toBe(true);
  });

  it('allows municipality to read feasibility without technical write permission', () => {
    const roles: MembershipRole[] = ['MUNICIPAL_MANAGER'];
    expect(hasAllPermissions(roles, [PERMISSIONS.FEASIBILITY_READ])).toBe(true);
    expect(hasAllPermissions(roles, [PERMISSIONS.FEASIBILITY_WRITE])).toBe(false);
  });

  it('allows provider operator to execute installation without referral write privileges', () => {
    const roles: MembershipRole[] = ['PROVIDER_OPERATOR'];
    expect(hasAllPermissions(roles, [PERMISSIONS.INSTALLATION_READ, PERMISSIONS.INSTALLATION_WRITE])).toBe(true);
    expect(hasAllPermissions(roles, [PERMISSIONS.REFERRAL_WRITE])).toBe(false);
  });

  it('allows municipality to read installation without installation write permission', () => {
    const roles: MembershipRole[] = ['MUNICIPAL_MANAGER'];
    expect(hasAllPermissions(roles, [PERMISSIONS.INSTALLATION_READ])).toBe(true);
    expect(hasAllPermissions(roles, [PERMISSIONS.INSTALLATION_WRITE])).toBe(false);
  });

  it('allows auditor to read audit data without write permissions', () => {
    const roles: MembershipRole[] = ['AUDITOR'];
    expect(hasAllPermissions(roles, [PERMISSIONS.AUDIT_READ])).toBe(true);
    expect(hasAllPermissions(roles, [PERMISSIONS.PROGRAM_WRITE])).toBe(false);
  });

  it('combines permissions when a session has multiple active roles', () => {
    const roles: MembershipRole[] = ['MUNICIPAL_OPERATOR', 'AUDITOR'];
    expect(hasAllPermissions(roles, [PERMISSIONS.BENEFICIARY_WRITE, PERMISSIONS.AUDIT_READ])).toBe(true);
  });
});
