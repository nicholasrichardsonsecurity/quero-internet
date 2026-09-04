import { InternalBillingService } from './internal-billing.service';

describe('InternalBillingService', () => {
  const source = {
    eventId: 'evt-1',
    productKey: 'quero-internet',
    paymentId: 'pay-1',
    processingStatus: 'PAID',
    tenantId: 'tenant-1',
    companyId: 'company-1',
    planId: 'plan-1',
    payloadHash: 'a'.repeat(64)
  };

  beforeEach(() => {
    process.env.BILLING_INTERNAL_TOKEN = 'internal-test-token';
    process.env.NODE_ENV = 'test';
  });

  function createService(deliveryStatus = 'PENDING') {
    const tx = {
      billingDelivery: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      billingAuditEntry: { create: jest.fn() }
    };
    const prisma = {
      billingWebhookEvent: { findUnique: jest.fn().mockResolvedValue(source) },
      billingDelivery: { findUnique: jest.fn().mockResolvedValue({ eventId: 'evt-1', status: deliveryStatus }) },
      $transaction: jest.fn((fn: (client: unknown) => Promise<unknown>) => fn(tx))
    } as never;
    return { service: new InternalBillingService(prisma), prisma, tx };
  }

  it('accepts only reconciled events with the product contract', async () => {
    const { service, tx } = createService();
    await expect(service.receive('evt-1', 'internal-test-token', {
      eventId: 'evt-1', productKey: 'quero-internet', paymentId: 'pay-1', state: 'PAID', environment: 'sandbox'
    })).resolves.toMatchObject({ duplicate: false });
    expect(tx.billingDelivery.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { eventId: 'evt-1', status: { not: 'DELIVERED' } }
    }));
  });

  it('is idempotent for delivered events', async () => {
    const { service, prisma, tx } = createService('DELIVERED');
    (tx.billingDelivery.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
    await expect(service.receive('evt-1', 'internal-test-token', {
      eventId: 'evt-1', productKey: 'quero-internet', paymentId: 'pay-1', state: 'PAID', environment: 'sandbox'
    })).resolves.toMatchObject({ duplicate: true });
    expect((prisma as { $transaction: jest.Mock }).$transaction).toHaveBeenCalled();
    expect(tx.billingAuditEntry.create).not.toHaveBeenCalled();
  });
});
