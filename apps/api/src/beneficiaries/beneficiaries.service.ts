import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, OrganizationStatus, OrganizationType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedSession } from '../auth/auth.service';
import { identityFingerprint } from './identity-fingerprint';

type BeneficiaryInput = {
  tenantId?: string;
  fullName: string;
  identityDocument: string;
  birthDate?: string;
  phone?: string;
  email?: string;
};

type ApplicationInput = {
  programId: string;
};

@Injectable()
export class BeneficiariesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveMunicipalTenant(context: AuthenticatedSession, requestedTenantId?: string): Promise<string> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { type: true, status: true }
    });

    if (
      !organization ||
      organization.type !== OrganizationType.MUNICIPALITY ||
      ![OrganizationStatus.ACTIVE, OrganizationStatus.ONBOARDING].includes(organization.status)
    ) {
      throw new ForbiddenException('Operação disponível apenas no contexto municipal autorizado.');
    }

    if (requestedTenantId) {
      if (!context.tenantIds.includes(requestedTenantId)) {
        throw new ForbiddenException('Tenant fora do contexto autorizado.');
      }
      return requestedTenantId;
    }

    if (context.tenantIds.length !== 1) {
      throw new BadRequestException('tenantId é obrigatório quando o contexto possui múltiplos tenants.');
    }

    return context.tenantIds[0];
  }

  async createBeneficiary(context: AuthenticatedSession, input: BeneficiaryInput) {
    const tenantId = await this.resolveMunicipalTenant(context, input.tenantId);
    const fullName = input.fullName?.trim();
    if (!fullName || fullName.length < 3 || fullName.length > 160) {
      throw new BadRequestException('Nome completo inválido.');
    }

    const pepper = process.env.BENEFICIARY_IDENTITY_PEPPER;
    if (!pepper || pepper.length < 32) {
      throw new InternalServerErrorException('Proteção de identificadores não configurada.');
    }

    let fingerprint: { hash: string; last4: string };
    try {
      fingerprint = identityFingerprint(input.identityDocument ?? '', pepper);
    } catch {
      throw new BadRequestException('Documento de identificação inválido.');
    }

    let birthDate: Date | undefined;
    if (input.birthDate) {
      birthDate = new Date(input.birthDate);
      if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
        throw new BadRequestException('Data de nascimento inválida.');
      }
    }

    try {
      const beneficiary = await this.prisma.beneficiary.create({
        data: {
          tenantId,
          municipalityOrganizationId: context.organizationId,
          fullName,
          documentHash: fingerprint.hash,
          documentLast4: fingerprint.last4,
          birthDate,
          phone: input.phone?.trim() || null,
          email: input.email?.trim().toLowerCase() || null
        },
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          documentLast4: true,
          birthDate: true,
          phone: true,
          email: true,
          status: true,
          createdAt: true
        }
      });

      await this.prisma.auditLog.create({
        data: {
          tenantId,
          organizationId: context.organizationId,
          actorUserId: context.user.id,
          action: 'BENEFICIARY_CREATED',
          entityType: 'BENEFICIARY',
          entityId: beneficiary.id
        }
      });

      return beneficiary;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe beneficiário com este documento neste tenant.');
      }
      throw error;
    }
  }

  async listBeneficiaries(context: AuthenticatedSession, tenantId?: string) {
    const scopedTenantId = await this.resolveMunicipalTenant(context, tenantId);
    return this.prisma.beneficiary.findMany({
      where: {
        tenantId: scopedTenantId,
        municipalityOrganizationId: context.organizationId,
        status: { not: 'ARCHIVED' }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        fullName: true,
        documentLast4: true,
        birthDate: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async createApplication(context: AuthenticatedSession, beneficiaryId: string, input: ApplicationInput) {
    if (!input.programId) throw new BadRequestException('programId é obrigatório.');

    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: {
        id: beneficiaryId,
        municipalityOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds },
        status: 'ACTIVE'
      },
      select: { id: true, tenantId: true }
    });
    if (!beneficiary) throw new NotFoundException('Beneficiário não encontrado no contexto autorizado.');

    await this.resolveMunicipalTenant(context, beneficiary.tenantId);

    const program = await this.prisma.program.findFirst({
      where: {
        id: input.programId,
        tenantId: beneficiary.tenantId,
        municipalityOrganizationId: context.organizationId,
        status: 'ACTIVE'
      },
      select: { id: true }
    });
    if (!program) throw new BadRequestException('Programa não está ativo no contexto municipal informado.');

    try {
      const application = await this.prisma.application.create({
        data: {
          tenantId: beneficiary.tenantId,
          municipalityOrganizationId: context.organizationId,
          programId: program.id,
          beneficiaryId: beneficiary.id
        },
        select: {
          id: true,
          programId: true,
          beneficiaryId: true,
          status: true,
          submittedAt: true,
          createdAt: true
        }
      });

      await this.prisma.auditLog.create({
        data: {
          tenantId: beneficiary.tenantId,
          organizationId: context.organizationId,
          programId: program.id,
          actorUserId: context.user.id,
          action: 'APPLICATION_SUBMITTED',
          entityType: 'APPLICATION',
          entityId: application.id
        }
      });

      return application;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Beneficiário já possui solicitação para este programa.');
      }
      throw error;
    }
  }

  async listApplications(context: AuthenticatedSession, tenantId?: string, status?: string, programId?: string) {
    const scopedTenantId = await this.resolveMunicipalTenant(context, tenantId);
    const parsedStatus = status && Object.values(ApplicationStatus).includes(status as ApplicationStatus)
      ? (status as ApplicationStatus)
      : undefined;

    if (status && !parsedStatus) throw new BadRequestException('Status de solicitação inválido.');

    return this.prisma.application.findMany({
      where: {
        tenantId: scopedTenantId,
        municipalityOrganizationId: context.organizationId,
        ...(parsedStatus ? { status: parsedStatus } : {}),
        ...(programId ? { programId } : {})
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        decisionReason: true,
        beneficiary: { select: { id: true, fullName: true, documentLast4: true } },
        program: { select: { id: true, name: true, status: true } }
      }
    });
  }
}
