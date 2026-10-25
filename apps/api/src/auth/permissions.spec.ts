import type { MembershipRole } from '@prisma/client';
import { hasAllPermissions, PERMISSIONS, permissionsForRoles } from './permissions';

describe('RBAC permission matrix', () => {
  it('allows all active operational roles to read the dashboard', () => {
    const roles: MembershipRole[] = [
      'ORGANIZATION_OWNER',
      'ORGANIZATION_ADMIN',
      'MUNICIPAL_MANAGER',
      'MUNICIPAL_OPERATOR',
      'PROVIDER_MANAGER',
      'PROVIDER_OPERATOR',
      'AUDITOR',
      'SUPPORT'
    ];
    for (const role of roles) {
      expect(hasAllPermissions([role], [PERMISSIONS.DASHBOARD_READ])).toBe(true);
    }
  });

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

  it('allows provider operator to manage service lifecycle without referral write privileges', () => {
    const roles: MembershipRole[] = ['PROVIDER_OPERATOR'];
    expect(hasAllPermissions(roles, [PERMISSIONS.SERVICE_READ, PERMISSIONS.SERVICE_WRITE])).toBe(true);
    expect(hasAllPermissions(roles, [PERMISSIONS.REFERRAL_WRITE])).toBe(false);
  });

  it('allows municipality to read service lifecycle without service write permission', () => {
    const roles: MembershipRole[] = ['MUNICIPAL_MANAGER'];
    expect(hasAllPermissions(roles, [PERMISSIONS.SERVICE_READ])).toBe(true);
    expect(hasAllPermissions(roles, [PERMISSIONS.SERVICE_WRITE])).toBe(false);
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

describe('RBAC — missão 2.1 (escrita separada de leitura)', () => {
  it('somente gestão municipal e administração decidem elegibilidade', () => {
    expect(hasAllPermissions(['MUNICIPAL_MANAGER'], [PERMISSIONS.ELIGIBILITY_DECIDE])).toBe(true);
    expect(hasAllPermissions(['ORGANIZATION_ADMIN'], [PERMISSIONS.ELIGIBILITY_DECIDE])).toBe(true);
    for (const role of ['MUNICIPAL_OPERATOR', 'PROVIDER_MANAGER', 'PROVIDER_OPERATOR', 'AUDITOR', 'SUPPORT'] as MembershipRole[]) {
      expect(hasAllPermissions([role], [PERMISSIONS.ELIGIBILITY_DECIDE])).toBe(false);
    }
  });

  it('auditor lê documentos e notificações mas não escreve', () => {
    expect(hasAllPermissions(['AUDITOR'], [PERMISSIONS.DOCUMENT_READ, PERMISSIONS.NOTIFICATION_READ])).toBe(true);
    expect(hasAllPermissions(['AUDITOR'], [PERMISSIONS.DOCUMENT_WRITE])).toBe(false);
    expect(hasAllPermissions(['AUDITOR'], [PERMISSIONS.NOTIFICATION_WRITE])).toBe(false);
  });

  it('sincronizar integração exige permissão própria, não basta ler provedor', () => {
    expect(hasAllPermissions(['PROVIDER_MANAGER'], [PERMISSIONS.INTEGRATION_SYNC])).toBe(true);
    for (const role of ['PROVIDER_OPERATOR', 'MUNICIPAL_MANAGER', 'MUNICIPAL_OPERATOR', 'AUDITOR', 'SUPPORT'] as MembershipRole[]) {
      expect(hasAllPermissions([role], [PERMISSIONS.PROVIDER_READ])).toBe(true);
      expect(hasAllPermissions([role], [PERMISSIONS.INTEGRATION_SYNC])).toBe(false);
    }
  });

  it('nenhuma permissão nova foi concedida a quem antes não tinha audit:read', () => {
    const nova = [PERMISSIONS.DOCUMENT_READ, PERMISSIONS.DOCUMENT_WRITE, PERMISSIONS.NOTIFICATION_READ, PERMISSIONS.NOTIFICATION_WRITE];
    for (const role of ['MUNICIPAL_OPERATOR', 'PROVIDER_OPERATOR', 'SUPPORT'] as MembershipRole[]) {
      for (const p of nova) expect(hasAllPermissions([role], [p])).toBe(false);
    }
  });
});
