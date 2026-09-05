import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { randomUUID, createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { AsaasClient } from './asaas.client';
import { isBillingEventName, isBillingProductKey, parseBillingReference, type AsaasWebhookPayload } from './billing.types';

type AcceptedWebhook = {
  status: 'accepted';
  eventId: string;
  paymentId: string;
  duplicate: boolean;
  processing: 'recorded_for_reconciliation';
};

export type CreateChargeInput = {
  idempotencyKey?: unknown;
  productKey?: unknown;
  tenantId?: unknown;
  companyId?: unknown;
  planId?: unknown;
  customerId?: unknown;
  value?: unknown;
  billingType?: unknown;
  dueDate?: unknown;
  description?: unknown;
};

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaas: AsaasClient
  ) {}

  async createCharge(authorization: string | undefined, input: CreateChargeInput) {
    this.assertInternalToken(authorization);
    const idempotencyKey = this.requiredValue(input?.idempotencyKey, 'idempotencyKey');
    const productKey = this.requiredValue(input?.productKey, 'productKey');
    const tenantId = this.requiredValue(input?.tenantId, 'tenantId');
    const companyId = this.requiredValue(input?.companyId, 'companyId');
    const planId = this.requiredValue(input?.planId, 'planId');
    const customerId = this.requiredValue(input?.customerId, 'customerId');
    const billingType = this.requiredValue(input?.billingType, 'billingType');
    const dueDate = this.dateValue(input?.dueDate);
    const value = this.amountValue(input?.value);

    if (!isBillingProductKey(productKey)) throw new BadRequestException('productKey não pertence ao ecossistema Aplivora.');
    if (!dueDate) throw new BadRequestException('dueDate deve estar no formato YYYY-MM-DD.');
    if (!value) throw new BadRequestException('value deve ser um número positivo.');
    const existing = await this.prisma.billingPayment.findUnique({ where: { idempotencyKey } });
    if (existing) return this.publicCharge(existing);

    const paymentReference = randomUUID();
    const externalReference = `aplivora:v1:${productKey}:${tenantId}:${companyId}:${planId}:${paymentReference}`;
    const description = typeof input?.description === 'string' && input.description.trim() ? input.description.trim() : undefined;
    const environment = this.environment();

    const payment = await this.prisma.billingPayment.create({
      data: {
        idempotencyKey,
        paymentReference,
        productKey,
        tenantId,
        companyId,
        planId,
        customerId,
        value,
        billingType,
        dueDate: new Date(`${dueDate}T00:00:00.000Z`),
        description,
        externalReference,
        environment,
        status: 'CREATING'
      }
    });

    try {
      const provider = await this.asaas.createPayment({
        customer: customerId,
        billingType,
        value,
        dueDate,
        ...(description ? { description } : {}),
        externalReference
      });
      const updated = await this.prisma.billingPayment.update({
        where: { id: payment.id },
        data: {
          providerPaymentId: provider.id,
          providerStatus: provider.status,
          status: 'CREATED',
          invoiceUrl: provider.invoiceUrl,
          bankSlipUrl: provider.bankSlipUrl
        }
      });
      return this.publicCharge(updated);
    } catch (error) {
      await this.prisma.billingPayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: this.safeError(error).slice(0, 500) }
      });
      throw new InternalServerErrorException('Não foi possível criar a cobrança no provedor.');
    }
  }

  async receiveAsaasWebhook(accessToken: string | undefined, payload: AsaasWebhookPayload): Promise<AcceptedWebhook> {
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
    if (!expectedToken || !accessToken || accessToken !== expectedToken) throw new UnauthorizedException('Webhook Asaas não autorizado.');
    const eventId = this.stringValue(payload.id);
    const event = payload.event;
    const paymentId = this.stringValue(payload.payment?.id);
    const paymentStatus = this.stringValue(payload.payment?.status);
    const externalReference = payload.payment?.externalReference;
    const reference = parseBillingReference(externalReference);
    if (!eventId || !isBillingEventName(event) || !paymentId || !reference) {
      throw new BadRequestException('Payload Asaas inválido ou externalReference incompatível.');
    }
    const payloadHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    const existing = await this.prisma.billingWebhookEvent.findUnique({ where: { eventId } });
    if (existing) return { status: 'accepted', eventId, paymentId, duplicate: true, processing: 'recorded_for_reconciliation' };
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.billingWebhookEvent.create({ data: { eventId, eventName: event, paymentId, paymentStatus, productKey: reference.productKey, tenantId: reference.tenantId, companyId: reference.companyId, planId: reference.planId, externalReference: externalReference as string, environment: this.environment(), payloadHash, payload: JSON.stringify(payload), processingStatus: 'PENDING_RECONCILIATION', receivedAt: new Date() } });
        await tx.billingAuditEntry.create({ data: { eventId, action: 'ASAAS_WEBHOOK_RECORDED', productKey: reference.productKey, tenantId: reference.tenantId, companyId: reference.companyId, planId: reference.planId, paymentId, environment: this.environment(), payloadHash } });
        await tx.billingDelivery.create({ data: { eventId, productKey: reference.productKey, status: 'PENDING', availableAt: new Date() } });
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) return { status: 'accepted', eventId, paymentId, duplicate: true, processing: 'recorded_for_reconciliation' };
      throw error;
    }
    return { status: 'accepted', eventId, paymentId, duplicate: false, processing: 'recorded_for_reconciliation' };
  }

  private publicCharge(payment: Record<string, unknown>) {
    return {
      id: payment.id,
      paymentReference: payment.paymentReference,
      providerPaymentId: payment.providerPaymentId,
      productKey: payment.productKey,
      status: payment.status,
      providerStatus: payment.providerStatus,
      externalReference: payment.externalReference,
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl
    };
  }

  private assertInternalToken(authorization: string | undefined): void {
    const expected = process.env.BILLING_INTERNAL_TOKEN?.trim();
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : undefined;
    if (!expected || !token || token !== expected) throw new UnauthorizedException('Token de billing interno inválido.');
  }

  private requiredValue(value: unknown, field: string): string {
    const normalized = this.stringValue(value);
    if (!normalized || normalized.length > 128) throw new BadRequestException(`${field} inválido.`);
    return normalized;
  }

  private amountValue(value: unknown): number | undefined {
    const amount = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    return Number.isFinite(amount) && amount > 0 && amount <= 1_000_000 ? Math.round(amount * 100) / 100 : undefined;
  }

  private dateValue(value: unknown): string | undefined {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? undefined : value;
  }

  private environment(): 'sandbox' | 'production' { return process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'; }
  private stringValue(value: unknown): string | undefined { return typeof value === 'string' && value.trim() ? value.trim() : undefined; }
  private safeError(error: unknown): string { return error instanceof Error ? error.message : 'Falha desconhecida ao criar cobrança.'; }
  private isUniqueViolation(error: unknown): boolean { return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002'; }
}
