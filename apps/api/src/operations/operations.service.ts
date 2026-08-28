import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  ApplicationStatus,
  FtthFeasibilityResult,
  InstallationStatus,
  OrganizationStatus,
  OrganizationType,
  ProviderReferralStatus,
  ServiceStatus
} from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';

type OperationalContext = 'municipality' | 'provider';

type PipelineItem = {
  applicationId: string;
  referralId: string | null;
  programName: string;
  organizationName: string | null;
  applicationStatus: ApplicationStatus;
  referralStatus: ProviderReferralStatus | null;
  feasibilityResult: FtthFeasibilityResult | null;
  installationStatus: InstallationStatus | null;
  serviceStatus: ServiceStatus | null;
  submittedAt: Date;
  lastUpdatedAt: Date;
};

const OPEN_INSTALLATION_STATUSES: InstallationStatus[] = [
  InstallationStatus.INSTALLATION_PENDING,
  InstallationStatus.SCHEDULED,
  InstallationStatus.IN_PROGRESS,
  InstallationStatus.INSTALLED
];

const ATTENTION_INSTALLATION_STATUSES: InstallationStatus[] = [InstallationStatus.FAILED, InstallationStatus.CANCELLED];
const ATTENTION_SERVICE_STATUSES: ServiceStatus[] = [ServiceStatus.SUSPENDED, ServiceStatus.INTERRUPTED];

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveOperationalContext(context: AuthenticatedSession): Promise<OperationalContext> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { type: true, status: true }
    });

    if (!organization) throw new ForbiddenException('Contexto organizacional inválido.');

    if (
      organization.type === OrganizationType.MUNICIPALITY &&
      [OrganizationStatus.ACTIVE, OrganizationStatus.ONBOARDING].includes(organization.status)
    ) {
      return 'municipality';
    }

    if (organization.type === OrganizationType.INTERNET_PROVIDER && organization.status === OrganizationStatus.ACTIVE) {
      return 'provider';
    }

    throw new ForbiddenException('Visão operacional indisponível para este contexto organizacional.');
  }

  async overview(context: AuthenticatedSession) {
    const operationalContext = await this.resolveOperationalContext(context);
    if (operationalContext === 'municipality') return this.municipalityOverview(context);
    return this.providerOverview(context);
  }

  private async municipalityOverview(context: AuthenticatedSession) {
    const tenantScope = { in: context.tenantIds };
    const organizationId = context.organizationId;

    const [
      applications,
      submittedApplications,
      eligibleApplications,
      pendingReferrals,
      feasibleAssessments,
      openInstallations,
      activeServices,
      installationAttention,
      serviceAttention
    ] = await Promise.all([
      this.prisma.application.findMany({
        where: { tenantId: tenantScope, municipalityOrganizationId: organizationId },
        orderBy: { updatedAt: 'desc' },
        take: 25,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          updatedAt: true,
          program: { select: { name: true } },
          referrals: {
            orderBy: { referredAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              providerOrganization: { select: { legalName: true, tradeName: true } },
              feasibilityAssessment: { select: { result: true } },
              installationOrder: { select: { status: true, activeService: { select: { status: true } } } }
            }
          }
        }
      }),
      this.prisma.application.count({
        where: { tenantId: tenantScope, municipalityOrganizationId: organizationId, status: ApplicationStatus.SUBMITTED }
      }),
      this.prisma.application.count({
        where: { tenantId: tenantScope, municipalityOrganizationId: organizationId, status: ApplicationStatus.ELIGIBLE }
      }),
      this.prisma.providerReferral.count({
        where: { tenantId: tenantScope, municipalityOrganizationId: organizationId, status: ProviderReferralStatus.PENDING }
      }),
      this.prisma.ftthFeasibilityAssessment.count({
        where: {
          tenantId: tenantScope,
          result: FtthFeasibilityResult.FEASIBLE,
          referral: { municipalityOrganizationId: organizationId }
        }
      }),
      this.prisma.installationOrder.count({
        where: { tenantId: tenantScope, municipalityOrganizationId: organizationId, status: { in: OPEN_INSTALLATION_STATUSES } }
      }),
      this.prisma.activeService.count({
        where: { tenantId: tenantScope, municipalityOrganizationId: organizationId, status: ServiceStatus.ACTIVE }
      }),
      this.prisma.installationOrder.count({
        where: { tenantId: tenantScope, municipalityOrganizationId: organizationId, status: { in: ATTENTION_INSTALLATION_STATUSES } }
      }),
      this.prisma.activeService.count({
        where: { tenantId: tenantScope, municipalityOrganizationId: organizationId, status: { in: ATTENTION_SERVICE_STATUSES } }
      })
    ]);

    return {
      context: 'municipality' as const,
      generatedAt: new Date(),
      counters: {
        submittedApplications,
        eligibleApplications,
        pendingReferrals,
        feasibleAssessments,
        openInstallations,
        activeServices,
        attentionItems: installationAttention + serviceAttention
      },
      items: applications.map((application): PipelineItem => {
        const referral = application.referrals[0] ?? null;
        return {
          applicationId: application.id,
          referralId: referral?.id ?? null,
          programName: application.program.name,
          organizationName: referral?.providerOrganization.tradeName ?? referral?.providerOrganization.legalName ?? null,
          applicationStatus: application.status,
          referralStatus: referral?.status ?? null,
          feasibilityResult: referral?.feasibilityAssessment?.result ?? null,
          installationStatus: referral?.installationOrder?.status ?? null,
          serviceStatus: referral?.installationOrder?.activeService?.status ?? null,
          submittedAt: application.submittedAt,
          lastUpdatedAt: application.updatedAt
        };
      })
    };
  }

  private async providerOverview(context: AuthenticatedSession) {
    const tenantScope = { in: context.tenantIds };
    const organizationId = context.organizationId;

    const [
      referrals,
      submittedApplications,
      eligibleApplications,
      pendingReferrals,
      feasibleAssessments,
      openInstallations,
      activeServices,
      installationAttention,
      serviceAttention
    ] = await Promise.all([
      this.prisma.providerReferral.findMany({
        where: { tenantId: tenantScope, providerOrganizationId: organizationId },
        orderBy: { updatedAt: 'desc' },
        take: 25,
        select: {
          id: true,
          status: true,
          updatedAt: true,
          application: {
            select: {
              id: true,
              status: true,
              submittedAt: true,
              program: { select: { name: true } },
              municipalityOrganization: { select: { legalName: true, tradeName: true } }
            }
          },
          feasibilityAssessment: { select: { result: true } },
          installationOrder: { select: { status: true, activeService: { select: { status: true } } } }
        }
      }),
      this.prisma.providerReferral.count({
        where: { tenantId: tenantScope, providerOrganizationId: organizationId }
      }),
      this.prisma.providerReferral.count({
        where: { tenantId: tenantScope, providerOrganizationId: organizationId, application: { status: ApplicationStatus.ELIGIBLE } }
      }),
      this.prisma.providerReferral.count({
        where: { tenantId: tenantScope, providerOrganizationId: organizationId, status: ProviderReferralStatus.PENDING }
      }),
      this.prisma.ftthFeasibilityAssessment.count({
        where: { tenantId: tenantScope, providerOrganizationId: organizationId, result: FtthFeasibilityResult.FEASIBLE }
      }),
      this.prisma.installationOrder.count({
        where: { tenantId: tenantScope, providerOrganizationId: organizationId, status: { in: OPEN_INSTALLATION_STATUSES } }
      }),
      this.prisma.activeService.count({
        where: { tenantId: tenantScope, providerOrganizationId: organizationId, status: ServiceStatus.ACTIVE }
      }),
      this.prisma.installationOrder.count({
        where: { tenantId: tenantScope, providerOrganizationId: organizationId, status: { in: ATTENTION_INSTALLATION_STATUSES } }
      }),
      this.prisma.activeService.count({
        where: { tenantId: tenantScope, providerOrganizationId: organizationId, status: { in: ATTENTION_SERVICE_STATUSES } }
      })
    ]);

    return {
      context: 'provider' as const,
      generatedAt: new Date(),
      counters: {
        submittedApplications,
        eligibleApplications,
        pendingReferrals,
        feasibleAssessments,
        openInstallations,
        activeServices,
        attentionItems: installationAttention + serviceAttention
      },
      items: referrals.map((referral): PipelineItem => ({
        applicationId: referral.application.id,
        referralId: referral.id,
        programName: referral.application.program.name,
        organizationName:
          referral.application.municipalityOrganization.tradeName ?? referral.application.municipalityOrganization.legalName,
        applicationStatus: referral.application.status,
        referralStatus: referral.status,
        feasibilityResult: referral.feasibilityAssessment?.result ?? null,
        installationStatus: referral.installationOrder?.status ?? null,
        serviceStatus: referral.installationOrder?.activeService?.status ?? null,
        submittedAt: referral.application.submittedAt,
        lastUpdatedAt: referral.updatedAt
      }))
    };
  }
}
