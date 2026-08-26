import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ApplicationStatus,
  OrganizationStatus,
  OrganizationType,
  ParticipationStatus,
  ParticipationType,
  Prisma,
  ProviderReferralStatus
} from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMunicipalContext(context: AuthenticatedSession): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { type: true, status: true }
    });
    const allowedStatuses: OrganizationStatus[] = [OrganizationStatus.ACTIVE, OrganizationStatus.ONBOARDING];

    if (
      !organization ||
      organization.type !== OrganizationType.MUNICIPALITY ||
      !allowedStatuses.includes(organization.status)
    ) {
      throw new ForbiddenException('Encaminhamento disponível apenas no contexto municipal autorizado.');
    }
  }

  private async assertProviderContext(context: AuthenticatedSession): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { type: true, status: true }
    });

    if (
      !organization ||
      organization.type !== OrganizationType.INTERNET_PROVIDER ||
      organization.status !== OrganizationStatus.ACTIVE
    ) {
      throw new ForbiddenException('Operação disponível apenas para provedor ativo autorizado.');
    }
  }

  async referApplication(
    context: AuthenticatedSession,
    applicationId: string,
    providerOrganizationId: string
  ) {
    await this.assertMunicipalContext(context);
    if (!providerOrganizationId) throw new BadRequestException('providerOrganizationId é obrigatório.');

    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        municipalityOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds },
        status: { in: [ApplicationStatus.ELIGIBLE, ApplicationStatus.REFERRED] }
      },
      select: { id: true, tenantId: true, programId: true, status: true }
    });

    if (!application) {
      throw new NotFoundException('Solicitação elegível não encontrada no contexto autorizado.');
    }

    const now = new Date();
    const participation = await this.prisma.programParticipation.findFirst({
      where: {
        programId: application.programId,
        organizationId: providerOrganizationId,
        type: ParticipationType.INTERNET_PROVIDER,
        status: ParticipationStatus.ACTIVE,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] }
        ]
      },
      select: {
        organization: { select: { id: true, type: true, status: true, legalName: true, tradeName: true } }
      }
    });

    if (
      !participation ||
      participation.organization.type !== OrganizationType.INTERNET_PROVIDER ||
      participation.organization.status !== OrganizationStatus.ACTIVE
    ) {
      throw new BadRequestException('Provedor não está credenciado e ativo neste programa.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const referral = await tx.providerReferral.create({
          data: {
            tenantId: application.tenantId,
            municipalityOrganizationId: context.organizationId,
            providerOrganizationId,
            programId: application.programId,
            applicationId: application.id
          },
          select: {
            id: true,
            status: true,
            referredAt: true,
            providerOrganization: { select: { id: true, legalName: true, tradeName: true } }
          }
        });

        if (application.status === ApplicationStatus.ELIGIBLE) {
          const changed = await tx.application.updateMany({
            where: { id: application.id, status: ApplicationStatus.ELIGIBLE },
            data: { status: ApplicationStatus.REFERRED }
          });
          if (changed.count !== 1) {
            throw new ConflictException('A solicitação foi alterada por outro processo. Recarregue e tente novamente.');
          }
        }

        await tx.auditLog.create({
          data: {
            tenantId: application.tenantId,
            organizationId: context.organizationId,
            programId: application.programId,
            actorUserId: context.user.id,
            action: 'APPLICATION_REFERRED_TO_PROVIDER',
            entityType: 'PROVIDER_REFERRAL',
            entityId: referral.id,
            correlationId: application.id
          }
        });

        return referral;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Esta solicitação já possui encaminhamento ativo para um provedor.');
      }
      throw error;
    }
  }

  async listProviderReferrals(context: AuthenticatedSession, status?: string) {
    await this.assertProviderContext(context);

    const parsedStatus = status && Object.values(ProviderReferralStatus).includes(status as ProviderReferralStatus)
      ? (status as ProviderReferralStatus)
      : undefined;
    if (status && !parsedStatus) throw new BadRequestException('Status de encaminhamento inválido.');

    return this.prisma.providerReferral.findMany({
      where: {
        providerOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds },
        ...(parsedStatus ? { status: parsedStatus } : {})
      },
      orderBy: { referredAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        referredAt: true,
        respondedAt: true,
        responseReason: true,
        program: { select: { id: true, name: true } },
        application: {
          select: {
            id: true,
            beneficiary: {
              select: {
                fullName: true,
                documentLast4: true,
                phone: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  async respondToReferral(
    context: AuthenticatedSession,
    referralId: string,
    targetStatus: ProviderReferralStatus,
    reason?: string
  ) {
    await this.assertProviderContext(context);
    if (![ProviderReferralStatus.ACCEPTED, ProviderReferralStatus.DECLINED].includes(targetStatus)) {
      throw new BadRequestException('Resposta de encaminhamento inválida.');
    }

    const normalizedReason = reason?.trim();
    if (targetStatus === ProviderReferralStatus.DECLINED && (!normalizedReason || normalizedReason.length < 8)) {
      throw new BadRequestException('Motivo da recusa é obrigatório e deve ser suficientemente descritivo.');
    }

    const referral = await this.prisma.providerReferral.findFirst({
      where: {
        id: referralId,
        providerOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds },
        status: ProviderReferralStatus.PENDING
      },
      select: { id: true, tenantId: true, programId: true, applicationId: true }
    });
    if (!referral) throw new NotFoundException('Encaminhamento pendente não encontrado no contexto autorizado.');

    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.providerReferral.updateMany({
        where: { id: referral.id, status: ProviderReferralStatus.PENDING },
        data: {
          status: targetStatus,
          respondedAt: new Date(),
          responseReason: normalizedReason || null
        }
      });
      if (changed.count !== 1) {
        throw new ConflictException('O encaminhamento foi alterado por outro processo. Recarregue e tente novamente.');
      }

      await tx.auditLog.create({
        data: {
          tenantId: referral.tenantId,
          organizationId: context.organizationId,
          programId: referral.programId,
          actorUserId: context.user.id,
          action: targetStatus === ProviderReferralStatus.ACCEPTED
            ? 'PROVIDER_REFERRAL_ACCEPTED'
            : 'PROVIDER_REFERRAL_DECLINED',
          entityType: 'PROVIDER_REFERRAL',
          entityId: referral.id,
          correlationId: referral.applicationId
        }
      });

      return tx.providerReferral.findUniqueOrThrow({
        where: { id: referral.id },
        select: { id: true, status: true, respondedAt: true, responseReason: true }
      });
    });
  }
}
