import { OrganizationStatus, OrganizationType, type MembershipRole } from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';

export type DashboardPersona = 'superadmin' | 'municipal' | 'provider' | 'auditor' | 'support';
export type DashboardDataScope = 'tenant' | 'municipality' | 'provider' | 'audit' | 'support';

export type OrganizationSnapshot = {
  id: string;
  type: OrganizationType;
  status: OrganizationStatus;
  legalName: string;
  tradeName: string | null;
};

export type DashboardScope = {
  persona: DashboardPersona;
  dataScope: DashboardDataScope;
  organizationId: string;
  tenantIds: string[];
  title: string;
  subtitle: string;
  scopeLabel: string;
  minimized: boolean;
};

const ownerRoles: MembershipRole[] = ['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN'];

function hasAnyRole(roles: readonly MembershipRole[], expected: readonly MembershipRole[]) {
  return expected.some((role) => roles.includes(role));
}

function displayName(organization: OrganizationSnapshot) {
  return organization.tradeName || organization.legalName || `Org. ${organization.id.slice(0, 8)}`;
}

export function resolveDashboardScope(
  context: AuthenticatedSession,
  organization: OrganizationSnapshot
): DashboardScope {
  const name = displayName(organization);
  const isOrgAdmin = hasAnyRole(context.roles, ownerRoles);

  if (organization.type === OrganizationType.INTERNET_PROVIDER) {
    return {
      persona: 'provider',
      dataScope: 'provider',
      organizationId: context.organizationId,
      tenantIds: context.tenantIds,
      title: 'Operação do provedor',
      subtitle: 'Fila técnica FTTH: aceite, viabilidade, instalação, ativação e serviço ativo.',
      scopeLabel: `${name} • Provedor participante`,
      minimized: false
    };
  }

  if (organization.type === OrganizationType.MUNICIPALITY) {
    return {
      persona: 'municipal',
      dataScope: 'municipality',
      organizationId: context.organizationId,
      tenantIds: context.tenantIds,
      title: 'Operação municipal',
      subtitle: 'Fila diária do programa público: cadastros, elegibilidade humana, encaminhamentos e ativações.',
      scopeLabel: `${name} • Prefeitura/gestão municipal`,
      minimized: true
    };
  }

  if (organization.type === OrganizationType.AUDIT_ORGANIZATION || context.roles.includes('AUDITOR')) {
    return {
      persona: 'auditor',
      dataScope: 'audit',
      organizationId: context.organizationId,
      tenantIds: context.tenantIds,
      title: 'Painel de auditoria',
      subtitle: 'Visão de conformidade: decisões humanas, trilha de eventos e separação entre operação e produção.',
      scopeLabel: `${name} • Auditoria`,
      minimized: true
    };
  }

  if (organization.type === OrganizationType.PLATFORM_OPERATOR && isOrgAdmin) {
    return {
      persona: 'superadmin',
      dataScope: 'tenant',
      organizationId: context.organizationId,
      tenantIds: context.tenantIds,
      title: 'Painel executivo GovTech',
      subtitle: 'Visão consolidada da operação multi-organização, com foco em risco, adoção e gargalos.',
      scopeLabel: `${name} • Visão global autorizada`,
      minimized: true
    };
  }

  return {
    persona: 'support',
    dataScope: 'support',
    organizationId: context.organizationId,
    tenantIds: context.tenantIds,
    title: 'Suporte operacional',
    subtitle: 'Acompanhamento seguro de contexto, saúde operacional e orientação sem acesso sensível ampliado.',
    scopeLabel: `${name} • Suporte`,
    minimized: true
  };
}
