import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, OrganizationStatus, OrganizationType } from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { canTransitionApplication, requiresDecisionReason } from './application-state';

@Injectable()
export class EligibilityReviewService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMunicipalContext(context: AuthenticatedSession): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { type: true, status: true }
    });

    if (
      !organization ||
      organization.type !== OrganizationType.MUNICIPALITY ||
      ![OrganizationStatus.ACTIVE, OrganizationStatus.ONBOARDING].includes(organization.status as OrganizationStatus)
    ) {
      throw new ForbiddenException('Revisão disponível apenas no contexto municipal autorizado.');
    }
  }

  async transition(
    context: AuthenticatedSession,
    applicationId: string,
    targetStatus: ApplicationStatus,
    reason?: string
  ) {
    await this.assertMunicipalContext(context);

    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        municipalityOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds }
      },
      select: {
        id: true,
        tenantId: true,
        programId: true,
        status: true
      }
    });

    if (!application) {
      throw new NotFoundException('Solicitação não encontrada no contexto autorizado.');
    }

    if (!canTransitionApplication(application.status, targetStatus)) {
      throw new BadRequestException(`Transição inválida: ${application.status} -> ${targetStatus}.`);
    }

    const normalizedReason = reason?.trim();
    if (requiresDecisionReason(targetStatus) && (!normalizedReason || normalizedReason.length < 8)) {
      throw new BadRequestException('Motivo da decisão é obrigatório e deve ser suficientemente descritivo.');
    }

    const now = new Date();
    const reviewedAt = targetStatus === ApplicationStatus.UNDER_REVIEW ? now : undefined;
    const terminalDecision = targetStatus === ApplicationStatus.ELIGIBLE || targetStatus === ApplicationStatus.INELIGIBLE;

    const updated = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.application.updateMany({
        where: { id: application.id, status: application.status },
        data: {
          status: targetStatus,
          ...(reviewedAt ? { reviewedAt } : {}),
          ...(terminalDecision || requiresDecisionReason(targetStatus)
            ? { decisionReason: normalizedReason || null }
            : {})
        }
      });

      if (changed.count !== 1) {
        throw new BadRequestException('A solicitação foi alterada por outro processo. Recarregue e tente novamente.');
      }

      await tx.auditLog.create({
        data: {
          tenantId: application.tenantId,
          organizationId: context.organizationId,
          programId: application.programId,
          actorUserId: context.user.id,
          action: 'APPLICATION_STATUS_CHANGED',
          entityType: 'APPLICATION',
          entityId: application.id,
          correlationId: `${application.status}->${targetStatus}`
        }
      });

      return tx.application.findUniqueOrThrow({
        where: { id: application.id },
        select: {
          id: true,
          status: true,
          reviewedAt: true,
          decisionReason: true,
          updatedAt: true
        }
      });
    });

    return updated;
  }
}
