import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InstallationStatus,
  OrganizationStatus,
  OrganizationType,
  ParticipationStatus,
  ParticipationType,
  Prisma,
  ServiceStatus
} from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { validateServiceTransition } from './service-lifecycle-state';

export interface TransitionServiceInput {
  nextStatus: ServiceStatus;
  reason?: string;
}

const serviceAuditAction: Record<ServiceStatus, string> = {
  ACTIVE: 'ACTIVE_SERVICE_RESTORED',
  SUSPENDED: 'ACTIVE_SERVICE_SUSPENDED',
  INTERRUPTED: 'ACTIVE_SERVICE_INTERRUPTED',
  ENDED: 'ACTIVE_SERVICE_ENDED'
};

@Injectable()
export class ServiceLifecycleService {
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
      throw new ForbiddenException('Operação de serviço disponível apenas para provedor ativo autorizado.');
    }
  }

  async createForReferral(context: AuthenticatedSession, referralId: string) {
    await this.assertActiveProvider(context);

    const installation = await this.prisma.installationOrder.findFirst({
      where: {
        referralId,
        providerOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds },
        status: InstallationStatus.ACTIVATED,
        activatedAt: { not: null },
        program: {
          participations: {
            some: {
              organizationId: context.organizationId,
              type: ParticipationType.INTERNET_PROVIDER,
              status: ParticipationStatus.ACTIVE
            }
          }
        }
      },
      select: {
        id: true,
        tenantId: true,
        municipalityOrganizationId: true,
        providerOrganizationId: true,
        programId: true,
        activatedAt: true,
        externalServiceReference: true,
        referral: { select: { applicationId: true } }
      }
    });

    if (!installation || !installation.activatedAt) {
      throw new NotFoundException('Instalação ativada e com participação ativa não encontrada no contexto autorizado.');
    }

    const activatedAt = installation.activatedAt;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const service = await tx.activeService.create({
          data: {
            tenantId: installation.tenantId,
            municipalityOrganizationId: installation.municipalityOrganizationId,
            providerOrganizationId: installation.providerOrganizationId,
            programId: installation.programId,
            installationOrderId: installation.id,
            activatedAt,
            externalServiceReference: installation.externalServiceReference
          },
          select: {
            id: true,
            installationOrderId: true,
            status: true,
            activatedAt: true,
            suspendedAt: true,
            interruptedAt: true,
            restoredAt: true,
            endedAt: true,
            createdAt: true
          }
        });

        await tx.auditLog.create({
          data: {
            tenantId: installation.tenantId,
            organizationId: context.organizationId,
            programId: installation.programId,
            actorUserId: context.user.id,
            action: 'ACTIVE_SERVICE_CREATED',
            entityType: 'ACTIVE_SERVICE',
            entityId: service.id,
            correlationId: installation.referral.applicationId
          }
        });

        return service;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Esta instalação já possui serviço ativo registrado.');
      }
      throw error;
    }
  }

  async transition(context: AuthenticatedSession, referralId: string, input: TransitionServiceInput) {
    await this.assertActiveProvider(context);

    const service = await this.prisma.activeService.findFirst({
      where: {
        installationOrder: { referralId },
        providerOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds },
        program: {
          participations: {
            some: {
              organizationId: context.organizationId,
              type: ParticipationType.INTERNET_PROVIDER,
              status: ParticipationStatus.ACTIVE
            }
          }
        }
      },
      select: {
        id: true,
        tenantId: true,
        providerOrganizationId: true,
        programId: true,
        status: true,
        installationOrder: { select: { referral: { select: { applicationId: true } } } }
      }
    });

    if (!service) throw new NotFoundException('Serviço ativo com participação ativa não encontrado no contexto autorizado.');

    const validationError = validateServiceTransition({
      current: service.status,
      next: input.nextStatus,
      reason: input.reason
    });
    if (validationError) throw new BadRequestException(validationError);

    const now = new Date();
    const reason = input.reason?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.ActiveServiceUpdateManyMutationInput = { status: input.nextStatus };

      if (input.nextStatus === ServiceStatus.ACTIVE) {
        data.restoredAt = now;
        data.statusReason = null;
      }
      if (input.nextStatus === ServiceStatus.SUSPENDED) {
        data.suspendedAt = now;
        data.statusReason = reason;
      }
      if (input.nextStatus === ServiceStatus.INTERRUPTED) {
        data.interruptedAt = now;
        data.statusReason = reason;
      }
      if (input.nextStatus === ServiceStatus.ENDED) {
        data.endedAt = now;
        data.statusReason = reason;
      }

      const updated = await tx.activeService.updateMany({
        where: { id: service.id, status: service.status },
        data
      });

      if (updated.count !== 1) {
        throw new ConflictException('O serviço foi alterado por outra operação. Recarregue o estado antes de tentar novamente.');
      }

      const current = await tx.activeService.findUniqueOrThrow({
        where: { id: service.id },
        select: {
          id: true,
          installationOrderId: true,
          status: true,
          activatedAt: true,
          suspendedAt: true,
          interruptedAt: true,
          restoredAt: true,
          endedAt: true,
          statusReason: true,
          externalServiceReference: true,
          lastObservedAt: true,
          updatedAt: true
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: service.tenantId,
          organizationId: context.organizationId,
          programId: service.programId,
          actorUserId: context.user.id,
          action: serviceAuditAction[input.nextStatus],
          entityType: 'ACTIVE_SERVICE',
          entityId: service.id,
          correlationId: service.installationOrder.referral.applicationId
        }
      });

      return current;
    });
  }

  async getForReferral(context: AuthenticatedSession, referralId: string) {
    const organization = await this.getOrganizationContext(context);

    if (organization.type === OrganizationType.INTERNET_PROVIDER) {
      if (organization.status !== OrganizationStatus.ACTIVE) {
        throw new ForbiddenException('Consulta de serviço disponível apenas para provedor ativo autorizado.');
      }

      const service = await this.prisma.activeService.findFirst({
        where: {
          installationOrder: { referralId },
          providerOrganizationId: context.organizationId,
          tenantId: { in: context.tenantIds }
        },
        select: {
          id: true,
          installationOrderId: true,
          status: true,
          activatedAt: true,
          suspendedAt: true,
          interruptedAt: true,
          restoredAt: true,
          endedAt: true,
          statusReason: true,
          externalServiceReference: true,
          lastObservedAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
      if (!service) throw new NotFoundException('Serviço ativo não encontrado no contexto autorizado.');
      return service;
    }

    const allowedMunicipalStatuses: OrganizationStatus[] = [OrganizationStatus.ACTIVE, OrganizationStatus.ONBOARDING];
    if (organization.type === OrganizationType.MUNICIPALITY && allowedMunicipalStatuses.includes(organization.status)) {
      const service = await this.prisma.activeService.findFirst({
        where: {
          installationOrder: { referralId },
          municipalityOrganizationId: context.organizationId,
          tenantId: { in: context.tenantIds }
        },
        select: {
          id: true,
          installationOrderId: true,
          providerOrganizationId: true,
          status: true,
          activatedAt: true,
          suspendedAt: true,
          interruptedAt: true,
          restoredAt: true,
          endedAt: true,
          lastObservedAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
      if (!service) throw new NotFoundException('Serviço ativo não encontrado no contexto autorizado.');
      return service;
    }

    throw new ForbiddenException('Consulta de serviço indisponível para este contexto organizacional.');
  }
}
