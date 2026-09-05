import { BillingReconciliationService } from './billing-reconciliation.service';

describe('BillingReconciliationService', () => {
  const event = {
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

  function createService(payment = { id: 'pay-1', status: 'CONFIRMED' }) {
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
    return { service: new BillingReconciliationService(prisma, asaas, internalBilling), prisma, asaas, internalBilling };
  }

  beforeEach(() => {
    process.env.BILLING_INTERNAL_TOKEN = 'internal-test-token';
    process.env.NODE_ENV = 'test';
  });

  it('reconciles and delivers a confirmed payment', async () => {
    const { service, asaas, internalBilling } = createService();
    await expect(service.runOnce()).resolves.toEqual({ processed: 1, delivered: 1, retried: 0 });
    expect(asaas.getPayment).toHaveBeenCalledWith('pay-1');
    expect(internalBilling.receive).toHaveBeenCalledWith('evt-1', 'internal-test-token', expect.objectContaining({ state: 'PAID' }));
  });

  it('defers a payment that is not yet reconciliable', async () => {
    const { service, prisma } = createService({ id: 'pay-1', status: 'PENDING' });
    await expect(service.runOnce()).resolves.toEqual({ processed: 1, delivered: 0, retried: 1 });
    expect(prisma.billingWebhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ processingStatus: 'PENDING_RECONCILIATION' })
    }));
  });
});
