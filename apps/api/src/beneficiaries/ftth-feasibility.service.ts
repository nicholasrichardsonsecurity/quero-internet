import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FtthFeasibilityResult, OrganizationStatus, OrganizationType, ProviderReferralStatus } from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { validateFtthAssessment } from './ftth-feasibility-state';

export interface SubmitFtthAssessmentInput {
  result: FtthFeasibilityResult;
  coverageConfirmed: boolean;
  infrastructureReference?: string;
  availablePorts?: number;
  estimatedDropMeters?: number;
  technicalReason?: string;
  estimatedReadyAt?: Date;
}

@Injectable()
export class FtthFeasibilityService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProviderContext(context: AuthenticatedSession): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { type: true, status: true }
    });
    if (!organization || organization.type !== OrganizationType.INTERNET_PROVIDER || organization.status !== OrganizationStatus.ACTIVE) {
      throw new ForbiddenException('Análise técnica disponível apenas para provedor ativo autorizado.');
    }
  }

  async assess(context: AuthenticatedSession, referralId: string, input: SubmitFtthAssessmentInput) {
    await this.assertProviderContext(context);
    const validationError = validateFtthAssessment(input);
    if (validationError) throw new BadRequestException(validationError);

    const referral = await this.prisma.providerReferral.findFirst({
      where: {
        id: referralId,
        providerOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds },
        status: ProviderReferralStatus.ACCEPTED
      },
      select: { id: true, tenantId: true, programId: true, applicationId: true }
    });
    if (!referral) throw new NotFoundException('Encaminhamento aceito não encontrado no contexto autorizado.');

    const existing = await this.prisma.ftthFeasibilityAssessment.findUnique({ where: { referralId }, select: { id: true } });
    if (existing) throw new ConflictException('Este encaminhamento já possui análise técnica registrada.');

    const infrastructureReference = input.infrastructureReference?.trim() || null;
    const technicalReason = input.technicalReason?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const assessment = await tx.ftthFeasibilityAssessment.create({
        data: {
          tenantId: referral.tenantId,
          providerOrganizationId: context.organizationId,
          referralId: referral.id,
          result: input.result,
          coverageConfirmed: input.coverageConfirmed,
          infrastructureReference,
          availablePorts: input.availablePorts,
          estimatedDropMeters: input.estimatedDropMeters,
          expansionRequired: input.result === FtthFeasibilityResult.EXPANSION_REQUIRED,
          technicalReason,
          estimatedReadyAt: input.estimatedReadyAt
        },
        select: {
          id: true,
          result: true,
          coverageConfirmed: true,
          infrastructureReference: true,
          availablePorts: true,
          estimatedDropMeters: true,
          expansionRequired: true,
          technicalReason: true,
          estimatedReadyAt: true,
          assessedAt: true
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: referral.tenantId,
          organizationId: context.organizationId,
          programId: referral.programId,
          actorUserId: context.user.id,
          action: 'FTTH_FEASIBILITY_ASSESSED',
          entityType: 'FTTH_FEASIBILITY_ASSESSMENT',
          entityId: assessment.id,
          correlationId: referral.applicationId
        }
      });
      return assessment;
    });
  }

  async getForReferral(context: AuthenticatedSession, referralId: string) {
    await this.assertProviderContext(context);
    const assessment = await this.prisma.ftthFeasibilityAssessment.findFirst({
      where: {
        referralId,
        providerOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds }
      },
      select: {
        id: true,
        result: true,
        coverageConfirmed: true,
        infrastructureReference: true,
        availablePorts: true,
        estimatedDropMeters: true,
        expansionRequired: true,
        technicalReason: true,
        estimatedReadyAt: true,
        assessedAt: true
      }
    });
    if (!assessment) throw new NotFoundException('Análise técnica não encontrada no contexto autorizado.');
    return assessment;
  }
}
