import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  FtthFeasibilityResult,
  InstallationStatus,
  OrganizationStatus,
  OrganizationType,
  Prisma,
  ProviderReferralStatus
} from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { validateInstallationTransition } from './installation-state';

export interface TransitionInstallationInput {
  nextStatus: InstallationStatus;
  scheduledAt?: Date;
  reason?: string;
  installationSummary?: string;
  externalServiceReference?: string;
}

const transitionAuditAction: Record<InstallationStatus, string> = {
  INSTALLATION_PENDING: 'INSTALLATION_ORDER_CREATED',
  SCHEDULED: 'INSTALLATION_SCHEDULED',
  IN_PROGRESS: 'INSTALLATION_STARTED',
  INSTALLED: 'INSTALLATION_COMPLETED',
  ACTIVATED: 'SERVICE_ACTIVATED',
  FAILED: 'INSTALLATION_FAILED',
  CANCELLED: 'INSTALLATION_CANCELLED'
};

@Injectable()
export class InstallationService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrganizationContext(context: AuthenticatedSession) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { type: true, status: true }
    });
    if (!organization) throw new ForbiddenException('Contexto organizacional inválido.');
    return organization;
  }

  private async assertActiveProvider(context: AuthenticatedSession): Promise<void> {
    const organization = await this.getOrganizationContext(context);
    if (organization.type !== OrganizationType.INTERNET_PROVIDER || organization.status !== OrganizationStatus.ACTIVE) {
      throw new ForbiddenException('Operação de instalação disponível apenas para provedor ativo autorizado.');
    }
  }

  async createForReferral(context: AuthenticatedSession, referralId: string) {
    await this.assertActiveProvider(context);

    const referral = await this.prisma.providerReferral.findFirst({
      where: {
        id: referralId,
        providerOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds },
        status: ProviderReferralStatus.ACCEPTED,
        feasibilityAssessment: { result: FtthFeasibilityResult.FEASIBLE }
      },
      select: {
        id: true,
        tenantId: true,
        municipalityOrganizationId: true,
        providerOrganizationId: true,
        programId: true,
        applicationId: true
      }
    });

    if (!referral) {
      throw new NotFoundException('Encaminhamento aceito e tecnicamente viável não encontrado no contexto autorizado.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.installationOrder.create({
          data: {
            tenantId: referral.tenantId,
            municipalityOrganizationId: referral.municipalityOrganizationId,
            providerOrganizationId: referral.providerOrganizationId,
            programId: referral.programId,
            referralId: referral.id
          },
          select: {
            id: true,
            referralId: true,
            status: true,
            scheduledAt: true,
            startedAt: true,
            installedAt: true,
            activatedAt: true,
            createdAt: true
          }
        });

        await tx.auditLog.create({
          data: {
            tenantId: referral.tenantId,
            organizationId: context.organizationId,
            programId: referral.programId,
            actorUserId: context.user.id,
            action: transitionAuditAction.INSTALLATION_PENDING,
            entityType: 'INSTALLATION_ORDER',
            entityId: order.id,
            correlationId: referral.applicationId
          }
        });

        return order;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Este encaminhamento já possui ordem de instalação.');
      }
      throw error;
    }
  }

  async transition(context: AuthenticatedSession, referralId: string, input: TransitionInstallationInput) {
    await this.assertActiveProvider(context);

    const order = await this.prisma.installationOrder.findFirst({
      where: {
        referralId,
        providerOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds }
      },
      select: {
        id: true,
        tenantId: true,
        providerOrganizationId: true,
        programId: true,
        referralId: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        installedAt: true,
        referral: { select: { applicationId: true } }
      }
    });

    if (!order) throw new NotFoundException('Ordem de instalação não encontrada no contexto autorizado.');

    const validationError = validateInstallationTransition({
      current: order.status,
      next: input.nextStatus,
      scheduledAt: input.scheduledAt,
      reason: input.reason,
      installationSummary: input.installationSummary
    });
    if (validationError) throw new BadRequestException(validationError);

    const now = new Date();
    const reason = input.reason?.trim() || null;
    const installationSummary = input.installationSummary?.trim() || null;
    const externalServiceReference = input.externalServiceReference?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.InstallationOrderUpdateManyMutationInput = { status: input.nextStatus };

      if (input.nextStatus === InstallationStatus.SCHEDULED) data.scheduledAt = input.scheduledAt;
      if (input.nextStatus === InstallationStatus.IN_PROGRESS) data.startedAt = now;
      if (input.nextStatus === InstallationStatus.INSTALLED) {
        data.installedAt = now;
        data.installationSummary = installationSummary;
      }
      if (input.nextStatus === InstallationStatus.ACTIVATED) {
        data.activatedAt = now;
        data.externalServiceReference = externalServiceReference;
      }
      if (input.nextStatus === InstallationStatus.FAILED) data.failureReason = reason;
      if (input.nextStatus === InstallationStatus.CANCELLED) data.cancellationReason = reason;

      const updated = await tx.installationOrder.updateMany({
        where: { id: order.id, status: order.status },
        data
      });

      if (updated.count !== 1) {
        throw new ConflictException('A ordem foi alterada por outra operação. Recarregue o estado antes de tentar novamente.');
      }

      const current = await tx.installationOrder.findUniqueOrThrow({
        where: { id: order.id },
        select: {
          id: true,
          referralId: true,
          status: true,
          scheduledAt: true,
          startedAt: true,
          installedAt: true,
          activatedAt: true,
          failureReason: true,
          cancellationReason: true,
          externalServiceReference: true,
          installationSummary: true,
          updatedAt: true
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: order.tenantId,
          organizationId: context.organizationId,
          programId: order.programId,
          actorUserId: context.user.id,
          action: transitionAuditAction[input.nextStatus],
          entityType: 'INSTALLATION_ORDER',
          entityId: order.id,
          correlationId: order.referral.applicationId
        }
      });

      return current;
    });
  }

  async getForReferral(context: AuthenticatedSession, referralId: string) {
    const organization = await this.getOrganizationContext(context);

    if (organization.type === OrganizationType.INTERNET_PROVIDER) {
      if (organization.status !== OrganizationStatus.ACTIVE) {
        throw new ForbiddenException('Consulta de instalação disponível apenas para provedor ativo autorizado.');
      }

      const order = await this.prisma.installationOrder.findFirst({
        where: {
          referralId,
          providerOrganizationId: context.organizationId,
          tenantId: { in: context.tenantIds }
        },
        select: {
          id: true,
          referralId: true,
          status: true,
          scheduledAt: true,
          startedAt: true,
          installedAt: true,
          activatedAt: true,
          failureReason: true,
          cancellationReason: true,
          externalServiceReference: true,
          installationSummary: true,
          createdAt: true,
          updatedAt: true
        }
      });
      if (!order) throw new NotFoundException('Ordem de instalação não encontrada no contexto autorizado.');
      return order;
    }

    const allowedMunicipalStatuses: OrganizationStatus[] = [OrganizationStatus.ACTIVE, OrganizationStatus.ONBOARDING];
    if (organization.type === OrganizationType.MUNICIPALITY && allowedMunicipalStatuses.includes(organization.status)) {
      const order = await this.prisma.installationOrder.findFirst({
        where: {
          referralId,
          municipalityOrganizationId: context.organizationId,
          tenantId: { in: context.tenantIds }
        },
        select: {
          id: true,
          referralId: true,
          providerOrganizationId: true,
          status: true,
          scheduledAt: true,
          startedAt: true,
          installedAt: true,
          activatedAt: true,
          failureReason: true,
          cancellationReason: true,
          createdAt: true,
          updatedAt: true
        }
      });
      if (!order) throw new NotFoundException('Ordem de instalação não encontrada no contexto autorizado.');
      return order;
    }

    throw new ForbiddenException('Consulta de instalação indisponível para este contexto organizacional.');
  }
}
