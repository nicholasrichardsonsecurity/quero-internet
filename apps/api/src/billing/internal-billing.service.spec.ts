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
      billingDelivery: { update: jest.fn() },
      billingAuditEntry: { create: jest.fn() }
    };
    const prisma = {
      billingWebhookEvent: { findUnique: jest.fn().mockResolvedValue(source) },
      billingDelivery: { findUnique: jest.fn().mockResolvedValue({ eventId: 'evt-1', status: deliveryStatus }) },
      $transaction: jest.fn((fn: (client: unknown) => Promise<void>) => fn(tx))
    } as never;
    return { service: new InternalBillingService(prisma), prisma, tx };
  }

  it('accepts only reconciled events with the product contract', async () => {
    const { service, tx } = createService();
    await expect(service.receive('evt-1', 'internal-test-token', {
      eventId: 'evt-1', productKey: 'quero-internet', paymentId: 'pay-1', state: 'PAID', environment: 'sandbox'
    })).resolves.toMatchObject({ duplicate: false });
    expect(tx.billingDelivery.update).toHaveBeenCalled();
  });

  it('is idempotent for delivered events', async () => {
    const { service, prisma } = createService('DELIVERED');
    await expect(service.receive('evt-1', 'internal-test-token', {
      eventId: 'evt-1', productKey: 'quero-internet', paymentId: 'pay-1', state: 'PAID', environment: 'sandbox'
    })).resolves.toMatchObject({ duplicate: true });
    expect((prisma as { $transaction: jest.Mock }).$transaction).not.toHaveBeenCalled();
  });
});
