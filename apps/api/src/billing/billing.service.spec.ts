import { BillingService } from './billing.service';

describe('BillingService', () => {
  const event = {
    id: 'evt-sandbox-001',
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: 'payment-001',
      status: 'RECEIVED',
      externalReference: 'aplivora:v1:quero-internet:tenant-1:company-1:plan-1:payment-001'
    }
  };

  function service(existing: unknown = null) {
    const prisma = {
      billingWebhookEvent: { findUnique: jest.fn().mockResolvedValue(existing), create: jest.fn() },
      billingAuditEntry: { create: jest.fn() },
          billingDelivery: { create: jest.fn() },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<void>) =>
        callback({
          billingWebhookEvent: { create: jest.fn() },
          billingAuditEntry: { create: jest.fn() }
        })
      )
    } as never;
    return { billing: new BillingService(prisma), prisma };
  }

  beforeEach(() => {
    process.env.ASAAS_WEBHOOK_TOKEN = 'sandbox-secret';
    process.env.NODE_ENV = 'test';
  });

  it('records a valid event once', async () => {
    const { billing, prisma } = service();
    await expect(billing.receiveAsaasWebhook('sandbox-secret', event)).resolves.toMatchObject({
      status: 'accepted',
      duplicate: false,
      paymentId: 'payment-001'
    });
    expect((prisma as { $transaction: jest.Mock }).$transaction).toHaveBeenCalledTimes(1);
  });

  it('acknowledges an already recorded event without writing again', async () => {
    const { billing, prisma } = service({ eventId: event.id });
    await expect(billing.receiveAsaasWebhook('sandbox-secret', event)).resolves.toMatchObject({ duplicate: true });
    expect((prisma as { $transaction: jest.Mock }).$transaction).not.toHaveBeenCalled();
  });

  it('rejects invalid credentials and mismatched references', async () => {
    const { billing } = service();
    await expect(billing.receiveAsaasWebhook('wrong', event)).rejects.toThrow('não autorizado');
    await expect(billing.receiveAsaasWebhook('sandbox-secret', {
      ...event,
      payment: { ...event.payment, id: 'other-payment' }
    })).rejects.toThrow('externalReference incompatível');
  });

  it('accepts both supported product keys through the same contract', async () => {
    const { billing } = service();
    const loopclubEvent = {
      ...event,
      id: 'evt-sandbox-loopclub',
      payment: {
        ...event.payment,
        id: 'payment-loopclub',
        externalReference: 'aplivora:v1:loopclub:tenant-2:company-2:plan-pro:payment-loopclub'
      }
    };
    await expect(billing.receiveAsaasWebhook('sandbox-secret', loopclubEvent)).resolves.toMatchObject({ duplicate: false });
  });
});
