import { Injectable } from '@nestjs/common';
import { AsaasClient, type AsaasPayment } from './asaas.client';
import { InternalBillingService } from './internal-billing.service';
import { PrismaService } from '../database/prisma.service';
import type { InternalBillingState } from './internal-billing.types';

type ReconciliationResult = { processed: number; delivered: number; retried: number };

const TERMINAL_STATUS_BY_EVENT: Partial<Record<string, readonly string[]>> = {
  PAYMENT_REFUNDED: ['REFUNDED'],
  PAYMENT_CHARGEBACK_REQUESTED: ['CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL'],
  PAYMENT_OVERDUE: ['OVERDUE'],
  PAYMENT_DELETED: ['DELETED'],
  PAYMENT_RESTORED: ['RECEIVED', 'RECEIVED_IN_CASH', 'CONFIRMED']
};

@Injectable()
export class BillingReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaas: AsaasClient,
    private readonly internalBilling: InternalBillingService
  ) {}

  async runOnce(limit = 25): Promise<ReconciliationResult> {
    const now = new Date();
    const events = await this.prisma.billingWebhookEvent.findMany({
      where: {
        processingStatus: 'PENDING_RECONCILIATION',
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }]
      },
      orderBy: { receivedAt: 'asc' },
      take: Math.min(Math.max(limit, 1), 100)
    });

    const result: ReconciliationResult = { processed: 0, delivered: 0, retried: 0 };
    for (const event of events) {
      const claimed = await this.prisma.billingWebhookEvent.updateMany({
        where: { id: event.id, processingStatus: 'PENDING_RECONCILIATION' },
        data: { processingStatus: 'RECONCILING', reconcileAttempts: { increment: 1 } }
      });
      if (claimed.count !== 1) continue;

      result.processed += 1;
      try {
        const payment = await this.asaas.getPayment(event.paymentId);
        const state = this.resolveState(event.eventName, payment);
        if (!state) {
          await this.defer(event.id, 'Pagamento remoto não confirma o estado do evento.');
          result.retried += 1;
          continue;
        }

        await this.prisma.billingWebhookEvent.update({
          where: { id: event.id },
          data: { processingStatus: state, processedAt: new Date(), nextAttemptAt: null, lastError: null }
        });

        await this.internalBilling.receive(event.eventId, process.env.BILLING_INTERNAL_TOKEN, {
          eventId: event.eventId,
          productKey: event.productKey,
          paymentId: event.paymentId,
          state,
          environment: event.environment
        });
        result.delivered += 1;
      } catch (error) {
        await this.defer(event.id, this.safeError(error));
        result.retried += 1;
      }
    }
    return result;
  }

  private resolveState(eventName: string, payment: AsaasPayment): InternalBillingState | null {
    if (eventName === 'PAYMENT_CONFIRMED' || eventName === 'PAYMENT_RECEIVED') {
      return ['RECEIVED', 'RECEIVED_IN_CASH', 'CONFIRMED'].includes(payment.status) ? 'PAID' : null;
    }

    const state = this.stateForTerminalEvent(eventName);
    if (!state || !TERMINAL_STATUS_BY_EVENT[eventName]?.includes(payment.status)) return null;
    return state;
  }

  private stateForTerminalEvent(eventName: string): InternalBillingState | null {
    if (eventName === 'PAYMENT_REFUNDED') return 'REFUNDED';
    if (eventName === 'PAYMENT_CHARGEBACK_REQUESTED') return 'CHARGEBACK';
    if (eventName === 'PAYMENT_OVERDUE') return 'OVERDUE';
    if (eventName === 'PAYMENT_DELETED') return 'CANCELED';
    if (eventName === 'PAYMENT_RESTORED') return 'RESTORED';
    return null;
  }

  private async defer(eventId: string, message: string): Promise<void> {
    const event = await this.prisma.billingWebhookEvent.findUnique({ where: { id: eventId }, select: { reconcileAttempts: true } });
    const attempts = event?.reconcileAttempts ?? 1;
    const delayMinutes = Math.min(60, 2 ** Math.min(attempts, 5));
    await this.prisma.billingWebhookEvent.update({
      where: { id: eventId },
      data: {
        processingStatus: 'PENDING_RECONCILIATION',
        nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000),
        lastError: message.slice(0, 500)
      }
    });
  }

  private safeError(error: unknown): string {
    return error instanceof Error ? error.message : 'Falha desconhecida na reconciliação.';
  }
}
