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

type MeasurementInput = {
  tenantId?: string;
  municipalityOrganizationId?: string;
  providerOrganizationId?: string;
  programId?: string;
  competenceStart?: string;
  competenceEnd?: string;
  beneficiaryCount?: number;
  activeServiceCount?: number;
  totalAmount?: number | string;
};

type InvoiceInput = {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  amount?: number | string;
  documentUrl?: string;
  paymentUrl?: string;
  externalReference?: string;
};

@Injectable()
export class ProviderBillingService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(value: string | undefined, field: string): Date {
    if (!value) throw new BadRequestException(`${field} é obrigatório.`);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException(`${field} inválido.`);
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

  private async organizationContext(context: AuthenticatedSession) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { type: true, status: true }
    });

    const allowedStatuses: OrganizationStatus[] = [
      OrganizationStatus.ACTIVE,
      OrganizationStatus.ONBOARDING
    ];

    if (!organization || !allowedStatuses.includes(organization.status)) {
      throw new ForbiddenException('Organização fora do contexto autorizado.');
    }

    return organization;
  }

  private async findMeasurement(context: AuthenticatedSession, measurementId: string) {
    const organization = await this.organizationContext(context);
    const measurement = await this.prisma.providerServiceMeasurement.findFirst({
      where: {
        id: measurementId,
        tenantId: { in: context.tenantIds },
        ...(organization.type === OrganizationType.INTERNET_PROVIDER
          ? { providerOrganizationId: context.organizationId }
          : { municipalityOrganizationId: context.organizationId })
      }
    });

    if (!measurement) {
      throw new NotFoundException('Medição não encontrada no contexto autorizado.');
    }

    return { organization, measurement };
  }

  private async audit(
    context: AuthenticatedSession,
    measurement: { tenantId: string; municipalityOrganizationId: string; programId: string },
    action: string,
    entityType: string,
    entityId: string
  ) {
    await this.prisma.auditLog.create({
      data: {
        tenantId: measurement.tenantId,
        organizationId: context.organizationId,
        programId: measurement.programId,
        actorUserId: context.user.id,
        action,
        entityType,
        entityId
      }
    });
  }

  async createMeasurement(context: AuthenticatedSession, input: MeasurementInput) {
    const organization = await this.organizationContext(context);
    if (organization.type !== OrganizationType.INTERNET_PROVIDER) {
      throw new ForbiddenException('Somente provedores podem criar medições.');
    }

    const tenantId = input.tenantId;
    if (!tenantId || !context.tenantIds.includes(tenantId)) {
      throw new ForbiddenException('Tenant fora do contexto autorizado.');
    }

    const municipalityOrganizationId = input.municipalityOrganizationId;
    const providerOrganizationId = input.providerOrganizationId ?? context.organizationId;
    if (!municipalityOrganizationId || providerOrganizationId !== context.organizationId) {
      throw new BadRequestException('Município e provedor são obrigatórios e devem pertencer ao contexto.');
    }

    const municipality = await this.prisma.organization.findFirst({
      where: {
        id: municipalityOrganizationId,
        type: OrganizationType.MUNICIPALITY,
        status: { in: [OrganizationStatus.ACTIVE, OrganizationStatus.ONBOARDING] },
        tenantLinks: { some: { tenantId } }
      },
      select: { id: true }
    });
    if (!municipality) throw new BadRequestException('Município não pertence ao tenant informado.');

    if (!input.programId) throw new BadRequestException('programId é obrigatório.');
    const program = await this.prisma.program.findFirst({
      where: {
        id: input.programId,
        tenantId,
        municipalityOrganizationId
      },
      select: { id: true }
    });
    if (!program) throw new BadRequestException('Programa não pertence ao município informado.');

    const competenceStart = this.parseDate(input.competenceStart, 'competenceStart');
    const competenceEnd = this.parseDate(input.competenceEnd, 'competenceEnd');
    if (competenceEnd <= competenceStart) {
      throw new BadRequestException('competenceEnd deve ser posterior a competenceStart.');
    }

    const beneficiaryCount = input.beneficiaryCount ?? 0;
    const activeServiceCount = input.activeServiceCount ?? 0;
    if (!Number.isInteger(beneficiaryCount) || beneficiaryCount < 0) {
      throw new BadRequestException('beneficiaryCount deve ser um inteiro não negativo.');
    }
    if (!Number.isInteger(activeServiceCount) || activeServiceCount < 0) {
      throw new BadRequestException('activeServiceCount deve ser um inteiro não negativo.');
    }

    const totalAmount = this.parseAmount(input.totalAmount, 'totalAmount');

    try {
      const measurement = await this.prisma.providerServiceMeasurement.create({
        data: {
          tenantId,
          municipalityOrganizationId,
          providerOrganizationId,
          programId: program.id,
          competenceStart,
          competenceEnd,
          beneficiaryCount,
          activeServiceCount,
          totalAmount
        }
      });

      await this.audit(context, measurement, 'PROVIDER_MEASUREMENT_CREATED', 'PROVIDER_SERVICE_MEASUREMENT', measurement.id);
      return measurement;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe medição para este provedor, programa e competência.');
      }
      throw error;
    }
  }

  async listMeasurements(context: AuthenticatedSession) {
    const organization = await this.organizationContext(context);
    if (
      organization.type !== OrganizationType.INTERNET_PROVIDER &&
      organization.type !== OrganizationType.MUNICIPALITY
    ) {
      throw new ForbiddenException('Operação disponível apenas para município ou provedor.');
    }

    return this.prisma.providerServiceMeasurement.findMany({
      where: {
        tenantId: { in: context.tenantIds },
        ...(organization.type === OrganizationType.INTERNET_PROVIDER
          ? { providerOrganizationId: context.organizationId }
          : { municipalityOrganizationId: context.organizationId })
      },
      orderBy: { competenceStart: 'desc' }
    });
  }

  async submitMeasurement(context: AuthenticatedSession, measurementId: string) {
    const { organization, measurement } = await this.findMeasurement(context, measurementId);
    if (organization.type !== OrganizationType.INTERNET_PROVIDER) {
      throw new ForbiddenException('Somente provedores podem submeter medições.');
    }
    if (measurement.status !== 'DRAFT') {
      throw new BadRequestException('Somente medições em rascunho podem ser submetidas.');
    }

    const updated = await this.prisma.providerServiceMeasurement.update({
      where: { id: measurement.id },
      data: { status: 'SUBMITTED', submittedAt: new Date() }
    });
    await this.audit(context, updated, 'PROVIDER_MEASUREMENT_SUBMITTED', 'PROVIDER_SERVICE_MEASUREMENT', updated.id);
    return updated;
  }

  async approveMeasurement(context: AuthenticatedSession, measurementId: string) {
    const { organization, measurement } = await this.findMeasurement(context, measurementId);
    if (organization.type !== OrganizationType.MUNICIPALITY) {
      throw new ForbiddenException('Somente o município pode aprovar medições.');
    }
    if (measurement.status !== 'SUBMITTED') {
      throw new BadRequestException('Somente medições submetidas podem ser aprovadas.');
    }

    const updated = await this.prisma.providerServiceMeasurement.update({
      where: { id: measurement.id },
      data: { status: 'APPROVED', approvedAt: new Date() }
    });
    await this.audit(context, updated, 'PROVIDER_MEASUREMENT_APPROVED', 'PROVIDER_SERVICE_MEASUREMENT', updated.id);
    return updated;
  }

  async registerInvoice(context: AuthenticatedSession, measurementId: string, input: InvoiceInput) {
    const { organization, measurement } = await this.findMeasurement(context, measurementId);
    if (organization.type !== OrganizationType.INTERNET_PROVIDER) {
      throw new ForbiddenException('Somente provedores podem registrar NF.');
    }
    if (measurement.status !== 'APPROVED') {
      throw new BadRequestException('A medição precisa ser aprovada pelo município antes da NF.');
    }

    const invoiceNumber = input.invoiceNumber?.trim();
    if (!invoiceNumber || invoiceNumber.length > 120) {
      throw new BadRequestException('invoiceNumber é obrigatório e deve ter até 120 caracteres.');
    }

    const issueDate = this.parseDate(input.issueDate, 'issueDate');
    const dueDate = input.dueDate ? this.parseDate(input.dueDate, 'dueDate') : null;
    const amount = this.parseAmount(input.amount, 'amount');
    if (!amount.equals(measurement.totalAmount)) {
      throw new BadRequestException('O valor da NF deve ser igual ao total aprovado da medição.');
    }

    try {
      const invoice = await this.prisma.providerInvoice.create({
        data: {
          tenantId: measurement.tenantId,
          measurementId: measurement.id,
          municipalityOrganizationId: measurement.municipalityOrganizationId,
          providerOrganizationId: measurement.providerOrganizationId,
          invoiceNumber,
          issueDate,
          dueDate,
          amount,
          documentUrl: input.documentUrl?.trim() || null,
          paymentUrl: input.paymentUrl?.trim() || null,
          externalReference: input.externalReference?.trim() || null
        }
      });

      await this.audit(context, measurement, 'PROVIDER_INVOICE_REGISTERED', 'PROVIDER_INVOICE', invoice.id);
      return invoice;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe NF registrada para esta medição ou número no provedor.');
      }
      throw error;
    }
  }

  async getInvoice(context: AuthenticatedSession, measurementId: string) {
    const { measurement } = await this.findMeasurement(context, measurementId);
    const invoice = await this.prisma.providerInvoice.findUnique({
      where: { measurementId: measurement.id }
    });
    if (!invoice) throw new NotFoundException('NF ainda não foi registrada para esta medição.');
    return invoice;
  }
}
