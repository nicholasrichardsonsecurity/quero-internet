import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  ApplicationStatus,
  BeneficiaryStatus,
  FtthFeasibilityResult,
  InstallationStatus,
  OrganizationStatus,
  ProviderReferralStatus,
  ServiceStatus
} from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { resolveDashboardScope, type DashboardScope } from './dashboard-scope';

type Tone = 'blue' | 'green' | 'violet' | 'amber' | 'red' | 'slate';

type OperationalKpi = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
};

type OperationalStage = {
  label: string;
  value: number;
  description: string;
};

type WorkQueueItem = {
  title: string;
  owner: string;
  sla: string;
  priority: 'Alta' | 'Média' | 'Baixa';
};

type OperationalCounts = {
  beneficiariesActive: number;
  applicationsTotal: number;
  applicationsOpen: number;
  applicationsEligible: number;
  applicationsReferred: number;
  referralsTotal: number;
  referralsPending: number;
  referralsAccepted: number;
  referralsDeclined: number;
  feasibilityTotal: number;
  feasibilityFeasible: number;
  feasibilityExpansion: number;
  installationsTotal: number;
  installationsInProgress: number;
  installationsActivated: number;
  servicesActive: number;
  servicesSuspended: number;
  servicesInterrupted: number;
  auditEvents: number;
};

export type OperationalDashboardResponse = {
  persona: DashboardScope['persona'];
  title: string;
  subtitle: string;
  scopeLabel: string;
  dataSource: 'database';
  generatedAt: string;
  kpis: OperationalKpi[];
  stages: OperationalStage[];
  queues: WorkQueueItem[];
  nextActions: string[];
  privacyNote: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOperationalDashboard(context: AuthenticatedSession): Promise<OperationalDashboardResponse> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { id: true, type: true, status: true, legalName: true, tradeName: true }
    });

    if (!organization || organization.status === OrganizationStatus.TERMINATED) {
      throw new ForbiddenException('Organização sem contexto operacional autorizado.');
    }

    const scope = resolveDashboardScope(context, organization);
    const counts = await this.loadCounts(scope);

    return {
      persona: scope.persona,
      title: scope.title,
      subtitle: scope.subtitle,
      scopeLabel: scope.scopeLabel,
      dataSource: 'database',
      generatedAt: new Date().toISOString(),
      kpis: this.buildKpis(scope, counts),
      stages: this.buildStages(scope, counts),
      queues: this.buildQueues(scope, counts),
      nextActions: this.buildNextActions(scope),
      privacyNote: this.privacyNote(scope)
    };
  }

  private tenantWhere(scope: DashboardScope) {
    return { tenantId: { in: scope.tenantIds } };
  }

  private applicationWhere(scope: DashboardScope) {
    return {
      ...this.tenantWhere(scope),
      ...(scope.dataScope === 'municipality' ? { municipalityOrganizationId: scope.organizationId } : {})
    };
  }

  private beneficiaryWhere(scope: DashboardScope) {
    return {
      ...this.tenantWhere(scope),
      ...(scope.dataScope === 'municipality' ? { municipalityOrganizationId: scope.organizationId } : {})
    };
  }

  private referralWhere(scope: DashboardScope) {
    return {
      ...this.tenantWhere(scope),
      ...(scope.dataScope === 'municipality' ? { municipalityOrganizationId: scope.organizationId } : {}),
      ...(scope.dataScope === 'provider' ? { providerOrganizationId: scope.organizationId } : {})
    };
  }

  private feasibilityWhere(scope: DashboardScope) {
    return {
      ...this.tenantWhere(scope),
      ...(scope.dataScope === 'provider' ? { providerOrganizationId: scope.organizationId } : {}),
      ...(scope.dataScope === 'municipality' ? { referral: { municipalityOrganizationId: scope.organizationId } } : {})
    };
  }

  private installationWhere(scope: DashboardScope) {
    return {
      ...this.tenantWhere(scope),
      ...(scope.dataScope === 'municipality' ? { municipalityOrganizationId: scope.organizationId } : {}),
      ...(scope.dataScope === 'provider' ? { providerOrganizationId: scope.organizationId } : {})
    };
  }

  private activeServiceWhere(scope: DashboardScope) {
    return {
      ...this.tenantWhere(scope),
      ...(scope.dataScope === 'municipality' ? { municipalityOrganizationId: scope.organizationId } : {}),
      ...(scope.dataScope === 'provider' ? { providerOrganizationId: scope.organizationId } : {})
    };
  }

  private auditWhere(scope: DashboardScope) {
    return {
      tenantId: { in: scope.tenantIds },
      ...(scope.dataScope !== 'tenant' && scope.dataScope !== 'audit' ? { organizationId: scope.organizationId } : {})
    };
  }

  private async loadCounts(scope: DashboardScope): Promise<OperationalCounts> {
    const applicationWhere = this.applicationWhere(scope);
    const beneficiaryWhere = this.beneficiaryWhere(scope);
    const referralWhere = this.referralWhere(scope);
    const feasibilityWhere = this.feasibilityWhere(scope);
    const installationWhere = this.installationWhere(scope);
    const activeServiceWhere = this.activeServiceWhere(scope);
    const auditWhere = this.auditWhere(scope);

    const [
      beneficiariesActive,
      applicationsTotal,
      applicationsSubmitted,
      applicationsUnderReview,
      applicationsEligible,
      applicationsReferred,
      referralsTotal,
      referralsPending,
      referralsAccepted,
      referralsDeclined,
      feasibilityTotal,
      feasibilityFeasible,
      feasibilityExpansion,
      installationsTotal,
      installationsPending,
      installationsScheduled,
      installationsInProgress,
      installationsActivated,
      servicesActive,
      servicesSuspended,
      servicesInterrupted,
      auditEvents
    ] = await Promise.all([
      this.prisma.beneficiary.count({ where: { ...beneficiaryWhere, status: BeneficiaryStatus.ACTIVE } }),
      this.prisma.application.count({ where: applicationWhere }),
      this.prisma.application.count({ where: { ...applicationWhere, status: ApplicationStatus.SUBMITTED } }),
      this.prisma.application.count({ where: { ...applicationWhere, status: ApplicationStatus.UNDER_REVIEW } }),
      this.prisma.application.count({ where: { ...applicationWhere, status: ApplicationStatus.ELIGIBLE } }),
      this.prisma.application.count({ where: { ...applicationWhere, status: ApplicationStatus.REFERRED } }),
      this.prisma.providerReferral.count({ where: referralWhere }),
      this.prisma.providerReferral.count({ where: { ...referralWhere, status: ProviderReferralStatus.PENDING } }),
      this.prisma.providerReferral.count({ where: { ...referralWhere, status: ProviderReferralStatus.ACCEPTED } }),
      this.prisma.providerReferral.count({ where: { ...referralWhere, status: ProviderReferralStatus.DECLINED } }),
      this.prisma.ftthFeasibilityAssessment.count({ where: feasibilityWhere }),
      this.prisma.ftthFeasibilityAssessment.count({ where: { ...feasibilityWhere, result: FtthFeasibilityResult.FEASIBLE } }),
      this.prisma.ftthFeasibilityAssessment.count({ where: { ...feasibilityWhere, result: FtthFeasibilityResult.EXPANSION_REQUIRED } }),
      this.prisma.installationOrder.count({ where: installationWhere }),
      this.prisma.installationOrder.count({ where: { ...installationWhere, status: InstallationStatus.INSTALLATION_PENDING } }),
      this.prisma.installationOrder.count({ where: { ...installationWhere, status: InstallationStatus.SCHEDULED } }),
      this.prisma.installationOrder.count({ where: { ...installationWhere, status: InstallationStatus.IN_PROGRESS } }),
      this.prisma.installationOrder.count({ where: { ...installationWhere, status: InstallationStatus.ACTIVATED } }),
      this.prisma.activeService.count({ where: { ...activeServiceWhere, status: ServiceStatus.ACTIVE } }),
      this.prisma.activeService.count({ where: { ...activeServiceWhere, status: ServiceStatus.SUSPENDED } }),
      this.prisma.activeService.count({ where: { ...activeServiceWhere, status: ServiceStatus.INTERRUPTED } }),
      this.prisma.auditLog.count({ where: auditWhere })
    ]);

    return {
      beneficiariesActive: scope.dataScope === 'provider' ? 0 : beneficiariesActive,
      applicationsTotal: scope.dataScope === 'provider' ? 0 : applicationsTotal,
      applicationsOpen: scope.dataScope === 'provider' ? 0 : applicationsSubmitted + applicationsUnderReview,
      applicationsEligible: scope.dataScope === 'provider' ? 0 : applicationsEligible,
      applicationsReferred: scope.dataScope === 'provider' ? 0 : applicationsReferred,
      referralsTotal,
      referralsPending,
      referralsAccepted,
      referralsDeclined,
      feasibilityTotal,
      feasibilityFeasible,
      feasibilityExpansion,
      installationsTotal,
      installationsInProgress: installationsPending + installationsScheduled + installationsInProgress,
      installationsActivated,
      servicesActive,
      servicesSuspended,
      servicesInterrupted,
      auditEvents
    };
  }

  private fmt(value: number) {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  private buildKpis(scope: DashboardScope, counts: OperationalCounts): OperationalKpi[] {
    if (scope.persona === 'provider') {
      return [
        { label: 'Encaminhamentos pendentes', value: this.fmt(counts.referralsPending), detail: `${this.fmt(counts.referralsAccepted)} aceitos`, tone: 'amber' },
        { label: 'Viabilidades favoráveis', value: this.fmt(counts.feasibilityFeasible), detail: `${this.fmt(counts.feasibilityExpansion)} exigem expansão`, tone: 'green' },
        { label: 'Ordens de instalação', value: this.fmt(counts.installationsInProgress), detail: 'Pendentes, agendadas ou em campo', tone: 'blue' },
        { label: 'Serviços ativos', value: this.fmt(counts.servicesActive), detail: `${this.fmt(counts.servicesInterrupted + counts.servicesSuspended)} com atenção`, tone: 'violet' }
      ];
    }

    if (scope.persona === 'auditor') {
      return [
        { label: 'Decisões elegíveis', value: this.fmt(counts.applicationsEligible), detail: 'Somente decisões humanas auditáveis', tone: 'green' },
        { label: 'Eventos operacionais', value: this.fmt(counts.auditEvents), detail: 'Trilha append-only', tone: 'blue' },
        { label: 'Exceções operacionais', value: this.fmt(counts.servicesInterrupted + counts.servicesSuspended + counts.referralsDeclined), detail: 'Sem bloqueio automático por IA', tone: 'amber' },
        { label: 'Serviços ativos', value: this.fmt(counts.servicesActive), detail: 'Resumo minimizado', tone: 'slate' }
      ];
    }

    if (scope.persona === 'support') {
      return [
        { label: 'Solicitações abertas', value: this.fmt(counts.applicationsOpen), detail: 'Triagem sem documento bruto', tone: 'amber' },
        { label: 'Encaminhamentos', value: this.fmt(counts.referralsTotal), detail: 'Somente contexto autorizado', tone: 'blue' },
        { label: 'Incidentes críticos', value: this.fmt(counts.servicesInterrupted), detail: 'Sem decisão operacional automática', tone: counts.servicesInterrupted > 0 ? 'red' : 'green' },
        { label: 'Eventos de auditoria', value: this.fmt(counts.auditEvents), detail: 'Contagem segura', tone: 'slate' }
      ];
    }

    return [
      { label: 'Beneficiários ativos', value: this.fmt(counts.beneficiariesActive), detail: 'Documento bruto não exposto', tone: 'blue' },
      { label: 'Solicitações abertas', value: this.fmt(counts.applicationsOpen), detail: `${this.fmt(counts.applicationsEligible)} elegíveis`, tone: 'green' },
      { label: 'Instalações em andamento', value: this.fmt(counts.installationsInProgress), detail: 'Resumo sem topologia interna', tone: 'amber' },
      { label: 'Serviços ativos', value: this.fmt(counts.servicesActive), detail: `${this.fmt(counts.servicesInterrupted + counts.servicesSuspended)} exigem atenção`, tone: 'violet' }
    ];
  }

  private buildStages(scope: DashboardScope, counts: OperationalCounts): OperationalStage[] {
    if (scope.persona === 'provider') {
      return [
        { label: 'Encaminhadas', value: counts.referralsTotal, description: 'Casos recebidos pelo provedor atual.' },
        { label: 'Aceitas', value: counts.referralsAccepted, description: 'Encaminhamentos assumidos operacionalmente.' },
        { label: 'Viabilidade FTTH', value: counts.feasibilityTotal, description: 'Análises técnicas registradas.' },
        { label: 'Instalação', value: counts.installationsTotal, description: 'Ordens criadas para execução em campo.' },
        { label: 'Ativações', value: counts.installationsActivated, description: 'Instalações ativadas.' },
        { label: 'Serviço ativo', value: counts.servicesActive, description: 'Serviços em ciclo ativo.' }
      ];
    }

    return [
      { label: 'Solicitações submetidas', value: counts.applicationsTotal, description: 'Entradas registradas no programa.' },
      { label: 'Elegíveis', value: counts.applicationsEligible, description: 'Decisões humanas aprovadas.' },
      { label: 'Encaminhadas', value: counts.referralsTotal || counts.applicationsReferred, description: 'Casos enviados a provedores participantes.' },
      { label: 'Viabilidade FTTH', value: counts.feasibilityTotal, description: 'Casos com análise técnica registrada.' },
      { label: 'Instalação', value: counts.installationsTotal, description: 'Ordens em agendamento, execução ou conclusão.' },
      { label: 'Serviço ativo', value: counts.servicesActive, description: 'Ativações registradas no ciclo de vida.' }
    ];
  }

  private buildQueues(scope: DashboardScope, counts: OperationalCounts): WorkQueueItem[] {
    if (scope.persona === 'provider') {
      return [
        { title: `${this.fmt(counts.referralsPending)} encaminhamentos pendentes`, owner: 'Gestor do provedor', sla: '12h', priority: counts.referralsPending > 0 ? 'Alta' : 'Baixa' },
        { title: `${this.fmt(Math.max(counts.referralsAccepted - counts.feasibilityTotal, 0))} aceites sem viabilidade`, owner: 'Equipe técnica', sla: '24h', priority: 'Alta' },
        { title: `${this.fmt(counts.installationsInProgress)} instalações em execução`, owner: 'Campo', sla: '48h', priority: 'Média' }
      ];
    }

    return [
      { title: `${this.fmt(counts.applicationsOpen)} solicitações aguardando análise`, owner: scope.persona === 'support' ? 'Suporte' : 'Operação municipal', sla: '24h', priority: counts.applicationsOpen > 0 ? 'Alta' : 'Baixa' },
      { title: `${this.fmt(counts.applicationsEligible)} elegíveis para encaminhamento`, owner: 'Gestão municipal', sla: '48h', priority: 'Alta' },
      { title: `${this.fmt(counts.installationsInProgress)} instalações sem conclusão`, owner: 'Operação conjunta', sla: '72h', priority: 'Média' }
    ];
  }

  private buildNextActions(scope: DashboardScope): string[] {
    if (scope.persona === 'provider') {
      return ['Aceitar ou recusar encaminhamentos pendentes', 'Registrar viabilidade FTTH sem inferir por CEP', 'Ativar serviço somente após instalação concluída'];
    }
    if (scope.persona === 'auditor') {
      return ['Validar motivos de elegibilidade', 'Conferir escopo tenant/organização', 'Exigir DMS mínimo no próximo gate'];
    }
    if (scope.persona === 'support') {
      return ['Ajudar sem decidir elegibilidade', 'Escalar falhas técnicas', 'Não acessar documento bruto'];
    }
    return ['Analisar elegibilidade com motivo', 'Encaminhar apenas para provedor ativo', 'Cobrar atualização sem expor topologia'];
  }

  private privacyNote(scope: DashboardScope): string {
    if (scope.persona === 'provider') {
      return 'Provedor vê somente sua própria fila e os dados técnicos necessários, sem acessar fila de outro provedor.';
    }
    if (scope.persona === 'municipal') {
      return 'Município recebe resumo operacional minimizado; dados técnicos internos do provedor permanecem ocultos.';
    }
    if (scope.persona === 'auditor') {
      return 'Auditoria acessa rastreabilidade e conformidade sem ampliar acesso a dado sensível desnecessário.';
    }
    return 'O painel não expõe CPF, documento bruto, portas internas ou topologia sensível.';
  }
}
