import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { INTERNAL_BILLING_STATES, type InternalBillingEvent, type InternalBillingState } from './internal-billing.types';

@Injectable()
export class InternalBillingService {
  constructor(private readonly prisma: PrismaService) {}

  async receive(eventIdHeader: string | undefined, token: string | undefined, input: InternalBillingEvent) {
    const expected = process.env.BILLING_INTERNAL_TOKEN?.trim();
    if (!expected || !token || token !== expected) throw new UnauthorizedException('Token de billing interno inválido.');

    const eventId = this.value(input.eventId);
    const productKey = this.value(input.productKey);
    const paymentId = this.value(input.paymentId);
    const state = input.state;
    const environment = this.value(input.environment);
    if (!eventId || eventIdHeader !== eventId || productKey !== 'quero-internet' || !paymentId ||
        !this.isState(state) || environment !== this.environment()) {
      throw new BadRequestException('Evento interno de billing inválido.');
    }

    const source = await this.prisma.billingWebhookEvent.findUnique({ where: { eventId } });
    if (!source || source.productKey !== productKey || source.paymentId !== paymentId ||
        source.processingStatus === 'PENDING_RECONCILIATION') {
      throw new NotFoundException('Evento não reconciliado ou inexistente.');
    }

    const delivery = await this.prisma.billingDelivery.findUnique({ where: { eventId } });
    if (!delivery) throw new NotFoundException('Entrega de billing inexistente.');
    if (delivery.status === 'DELIVERED') return { status: 'accepted', eventId, duplicate: true };

    await this.prisma.$transaction(async (tx) => {
      await tx.billingDelivery.update({
        where: { eventId },
        data: { status: 'DELIVERED', deliveredAt: new Date(), attempts: { increment: 1 }, lastError: null }
      });
      await tx.billingAuditEntry.create({
        data: {
          eventId,
          action: 'PRODUCT_EVENT_ACCEPTED',
          productKey,
          tenantId: source.tenantId,
          companyId: source.companyId,
          planId: source.planId,
          paymentId,
          environment,
          payloadHash: source.payloadHash
        }
      });
    });

    return { status: 'accepted', eventId, duplicate: false };
  }

  private environment(): 'sandbox' | 'production' {
    return process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
  }

  private value(input: unknown): string | undefined {
    return typeof input === 'string' && input.trim() ? input.trim() : undefined;
  }

  private isState(input: unknown): input is InternalBillingState {
    return typeof input === 'string' && (INTERNAL_BILLING_STATES as readonly string[]).includes(input);
  }
}
