import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { OrganizationStatus, OrganizationType, Prisma } from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';

type ContractInput = {
  tenantId?: string;
  municipalityOrganizationId?: string;
  programId?: string;
  contractNumber?: string;
  title?: string;
  startsAt?: string;
  endsAt?: string;
  monthlySaaSValue?: number | string;
  billingCustomerId?: string;
};

type PeriodInput = {
  competenceStart?: string;
  competenceEnd?: string;
  dueDate?: string;
  amount?: number | string;
};

@Injectable()
export class MunicipalBillingService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(value: string | undefined, field: string): Date {
    if (!value) throw new BadRequestException(`${field} é obrigatório.`);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} inválido.`);
    }
    return parsed;
  }

  private parseAmount(value: number | string | undefined, field: string): Prisma.Decimal {
    const normalized = typeof value === 'string' ? value.trim() : value;
    if (normalized === undefined || normalized === null || normalized === '') {
      throw new BadRequestException(`${field} é obrigatório.`);
    }

    let amount: Prisma.Decimal;
    try {
      amount = new Prisma.Decimal(normalized);
    } catch {
      throw new BadRequestException(`${field} inválido.`);
    }

    if (!amount.isFinite() || amount.lte(0) || amount.gt(100000000)) {
      throw new BadRequestException(`${field} deve ser maior que zero e inferior a R$ 100.000.000,00.`);
    }

    return amount.toDecimalPlaces(2);
  }

  private async resolveTenant(context: AuthenticatedSession, requestedTenantId?: string): Promise<string> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { type: true, status: true }
    });

    const allowedStatuses: OrganizationStatus[] = [
      OrganizationStatus.ACTIVE,
      OrganizationStatus.ONBOARDING
    ];

    if (
      !organization ||
      organization.type !== OrganizationType.MUNICIPALITY ||
      !allowedStatuses.includes(organization.status)
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

  private async findScopedContract(
    context: AuthenticatedSession,
    contractId: string
  ) {
    const contract = await this.prisma.municipalContract.findFirst({
      where: {
        id: contractId,
        municipalityOrganizationId: context.organizationId,
        tenantId: { in: context.tenantIds }
      }
    });

    if (!contract) {
      throw new NotFoundException('Contrato municipal não encontrado no contexto autorizado.');
    }

    return contract;
  }

  async createContract(contextPromise: Promise<AuthenticatedSession>, input: ContractInput) {
    const context = await contextPromise;
    const municipalityOrganizationId = input.municipalityOrganizationId ?? context.organizationId;
    if (municipalityOrganizationId !== context.organizationId) {
      throw new ForbiddenException('Organização municipal fora do contexto autorizado.');
    }

    const tenantId = await this.resolveTenant(context, input.tenantId);
    const contractNumber = input.contractNumber?.trim();
    const title = input.title?.trim();

    if (!contractNumber || contractNumber.length > 120) {
      throw new BadRequestException('contractNumber é obrigatório e deve ter até 120 caracteres.');
    }
    if (!title || title.length < 3 || title.length > 240) {
      throw new BadRequestException('title é obrigatório e deve ter entre 3 e 240 caracteres.');
    }
    if (!input.programId) throw new BadRequestException('programId é obrigatório.');

    const startsAt = this.parseDate(input.startsAt, 'startsAt');
    const endsAt = input.endsAt ? this.parseDate(input.endsAt, 'endsAt') : null;
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException('endsAt deve ser posterior a startsAt.');
    }

    const monthlySaaSValue = this.parseAmount(input.monthlySaaSValue, 'monthlySaaSValue');
    const program = await this.prisma.program.findFirst({
      where: {
        id: input.programId,
        tenantId,
        municipalityOrganizationId: context.organizationId
      },
      select: { id: true }
    });
    if (!program) throw new BadRequestException('Programa não pertence ao contexto municipal informado.');

    try {
      const contract = await this.prisma.municipalContract.create({
        data: {
          tenantId,
          municipalityOrganizationId,
          programId: program.id,
          contractNumber,
          title,
          startsAt,
          endsAt,
          monthlySaaSValue,
          billingCustomerId: input.billingCustomerId?.trim() || null
        }
      });

      await this.prisma.auditLog.create({
        data: {
          tenantId,
          organizationId: context.organizationId,
          programId: program.id,
          actorUserId: context.user.id,
          action: 'MUNICIPAL_CONTRACT_CREATED',
          entityType: 'MUNICIPAL_CONTRACT',
          entityId: contract.id
        }
      });

      return contract;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe contrato com este número neste tenant.');
      }
      throw error;
    }
  }

  async listContracts(context: AuthenticatedSession, requestedTenantId?: string) {
    const tenantId = await this.resolveTenant(context, requestedTenantId);
    return this.prisma.municipalContract.findMany({
      where: {
        tenantId,
        municipalityOrganizationId: context.organizationId
      },
      orderBy: { startsAt: 'desc' }
    });
  }

  async getContract(context: AuthenticatedSession, contractId: string) {
    return this.findScopedContract(context, contractId);
  }

  async createPeriod(context: AuthenticatedSession, contractId: string, input: PeriodInput) {
    const contract = await this.findScopedContract(context, contractId);
    const competenceStart = this.parseDate(input.competenceStart, 'competenceStart');
    const competenceEnd = this.parseDate(input.competenceEnd, 'competenceEnd');
    const dueDate = this.parseDate(input.dueDate, 'dueDate');

    if (competenceEnd <= competenceStart) {
      throw new BadRequestException('competenceEnd deve ser posterior a competenceStart.');
    }

    const amount = this.parseAmount(input.amount, 'amount');
    const period = await this.prisma.municipalBillingPeriod.create({
      data: {
        tenantId: contract.tenantId,
        contractId: contract.id,
        competenceStart,
        competenceEnd,
        dueDate,
        amount
      }
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: contract.tenantId,
        organizationId: context.organizationId,
        programId: contract.programId,
        actorUserId: context.user.id,
        action: 'MUNICIPAL_BILLING_PERIOD_CREATED',
        entityType: 'MUNICIPAL_BILLING_PERIOD',
        entityId: period.id
      }
    });

    return period;
  }

  async listPeriods(context: AuthenticatedSession, contractId: string) {
    const contract = await this.findScopedContract(context, contractId);
    return this.prisma.municipalBillingPeriod.findMany({
      where: { contractId: contract.id, tenantId: contract.tenantId },
      orderBy: { competenceStart: 'desc' }
    });
  }
}
