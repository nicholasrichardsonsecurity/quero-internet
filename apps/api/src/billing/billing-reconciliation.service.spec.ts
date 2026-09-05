import { BillingReconciliationService } from './billing-reconciliation.service';

describe('BillingReconciliationService', () => {
  const baseEvent = {
    id: 'row-1',
    eventId: 'evt-1',
    eventName: 'PAYMENT_CONFIRMED',
    paymentId: 'pay-1',
    productKey: 'quero-internet',
    environment: 'sandbox',
    processingStatus: 'PENDING_RECONCILIATION',
    reconcileAttempts: 0,
    nextAttemptAt: null,
    receivedAt: new Date('2026-01-01T00:00:00.000Z')
  };

  function createService(payment = { id: 'pay-1', status: 'CONFIRMED' }, eventName = 'PAYMENT_CONFIRMED') {
    const event = { ...baseEvent, eventName };
    const prisma = {
      billingWebhookEvent: {
        findMany: jest.fn().mockResolvedValue([event]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue(event),
        findUnique: jest.fn().mockResolvedValue({ reconcileAttempts: 1 })
      }
    } as never;
    const asaas = { getPayment: jest.fn().mockResolvedValue(payment) } as never;
    const internalBilling = { receive: jest.fn().mockResolvedValue({ status: 'accepted', duplicate: false }) } as never;
    const observability = { observeReconciliation: jest.fn() } as never;
    return { service: new BillingReconciliationService(prisma, asaas, internalBilling, observability), prisma, asaas, internalBilling, observability };
  }

  beforeEach(() => {
    process.env.BILLING_INTERNAL_TOKEN = 'internal-test-token';
    process.env.NODE_ENV = 'test';
  });

  it('reconciles and delivers a confirmed payment', async () => {
    const { service, asaas, internalBilling, observability } = createService();
    await expect(service.runOnce()).resolves.toEqual({ processed: 1, delivered: 1, retried: 0 });
    expect(asaas.getPayment).toHaveBeenCalledWith('pay-1');
    expect(internalBilling.receive).toHaveBeenCalledWith('evt-1', 'internal-test-token', expect.objectContaining({ state: 'PAID' }));
    expect(observability.observeReconciliation).toHaveBeenCalledWith({ processed: 1, delivered: 1, retried: 0 });
  });

  it('requires Asaas confirmation for terminal events', async () => {
    const { service, internalBilling } = createService({ id: 'pay-1', status: 'CONFIRMED' }, 'PAYMENT_REFUNDED');
    await expect(service.runOnce()).resolves.toEqual({ processed: 1, delivered: 0, retried: 1 });
    expect(internalBilling.receive).not.toHaveBeenCalled();
  });

  it('delivers a refund only when Asaas confirms it', async () => {
    const { service, internalBilling } = createService({ id: 'pay-1', status: 'REFUNDED' }, 'PAYMENT_REFUNDED');
    await expect(service.runOnce()).resolves.toEqual({ processed: 1, delivered: 1, retried: 0 });
    expect(internalBilling.receive).toHaveBeenCalledWith('evt-1', 'internal-test-token', expect.objectContaining({ state: 'REFUNDED' }));
  });

  it('defers a payment that is not yet reconciliable', async () => {
    const { service, prisma } = createService({ id: 'pay-1', status: 'PENDING' });
    await expect(service.runOnce()).resolves.toEqual({ processed: 1, delivered: 0, retried: 1 });
    expect(prisma.billingWebhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ processingStatus: 'PENDING_RECONCILIATION' })
    }));
  });
});
