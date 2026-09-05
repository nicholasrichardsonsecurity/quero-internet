import { BillingService } from './billing.service';

describe('BillingService', () => {
  const event = {
    id: 'evt-sandbox-001',
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: 'asaas-payment-001',
      status: 'RECEIVED',
      externalReference: 'aplivora:v1:quero-internet:tenant-1:company-1:plan-1:internal-payment-001'
    }
  };

  function service(existing: unknown = null) {
    const prisma = {
      billingPayment: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn()
      },
      billingWebhookEvent: { findUnique: jest.fn().mockResolvedValue(existing), create: jest.fn() },
      billingAuditEntry: { create: jest.fn() },
      billingDelivery: { create: jest.fn() },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<void>) =>
        callback({
          billingWebhookEvent: { create: jest.fn() },
          billingAuditEntry: { create: jest.fn() },
          billingDelivery: { create: jest.fn() }
        })
      )
    } as never;
    const asaas = { createPayment: jest.fn(), getPayment: jest.fn() } as never;
    return { billing: new BillingService(prisma, asaas), prisma, asaas };
  }

  beforeEach(() => {
    process.env.ASAAS_WEBHOOK_TOKEN = 'sandbox-secret';
    process.env.BILLING_INTERNAL_TOKEN = 'internal-secret';
    process.env.NODE_ENV = 'test';
  });

  it('records a valid event once without requiring internal and provider IDs to match', async () => {
    const { billing, prisma } = service();
    await expect(billing.receiveAsaasWebhook('sandbox-secret', event)).resolves.toMatchObject({
      status: 'accepted',
      duplicate: false,
      paymentId: 'asaas-payment-001'
    });
    expect((prisma as { $transaction: jest.Mock }).$transaction).toHaveBeenCalledTimes(1);
  });

  it('acknowledges an already recorded event without writing again', async () => {
    const { billing, prisma } = service({ eventId: event.id });
    await expect(billing.receiveAsaasWebhook('sandbox-secret', event)).resolves.toMatchObject({ duplicate: true });
    expect((prisma as { $transaction: jest.Mock }).$transaction).not.toHaveBeenCalled();
  });

  it('rejects invalid credentials and malformed references', async () => {
    const { billing } = service();
    await expect(billing.receiveAsaasWebhook('wrong', event)).rejects.toThrow('não autorizado');
    await expect(billing.receiveAsaasWebhook('sandbox-secret', {
      ...event,
      payment: { ...event.payment, externalReference: 'invalid' }
    })).rejects.toThrow('externalReference incompatível');
  });

  it('creates an idempotent central charge with the product reference', async () => {
    const { billing, asaas, prisma } = service();
    (asaas as { createPayment: jest.Mock }).createPayment.mockResolvedValue({
      id: 'asaas-payment-001',
      status: 'PENDING',
      invoiceUrl: 'https://sandbox.asaas.com/i/abc'
    });
    (prisma as { billingPayment: { create: jest.Mock; update: jest.Mock } }).billingPayment.create.mockResolvedValue({
      id: 'db-payment-001',
      paymentReference: 'internal-payment-001',
      productKey: 'loopclub',
      status: 'CREATING'
    });
    (prisma as { billingPayment: { update: jest.Mock } }).billingPayment.update.mockResolvedValue({
      id: 'db-payment-001',
      paymentReference: 'internal-payment-001',
      providerPaymentId: 'asaas-payment-001',
      productKey: 'loopclub',
      status: 'CREATED',
      externalReference: 'aplivora:v1:loopclub:tenant-1:company-1:plan-1:internal-payment-001',
      invoiceUrl: 'https://sandbox.asaas.com/i/abc'
    });

    const result = await billing.createCharge('Bearer internal-secret', {
      idempotencyKey: 'checkout-001',
      productKey: 'loopclub',
      tenantId: 'tenant-1',
      companyId: 'company-1',
      planId: 'plan-1',
      customerId: 'cus_000009025596',
      value: 29.9,
      billingType: 'PIX',
      dueDate: '2026-09-10'
    });

    expect(result).toMatchObject({ providerPaymentId: 'asaas-payment-001', status: 'CREATED' });
    expect((asaas as { createPayment: jest.Mock }).createPayment).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_000009025596',
      externalReference: expect.stringMatching(/^aplivora:v1:loopclub:tenant-1:company-1:plan-1:/)
    }));
  });
});
