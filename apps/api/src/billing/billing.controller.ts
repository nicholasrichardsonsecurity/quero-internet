import { Body, Controller, Headers, Post } from '@nestjs/common';
import { BillingService, type CreateChargeInput } from './billing.service';
import type { AsaasWebhookPayload } from './billing.types';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('charges')
  createCharge(
    @Headers('authorization') authorization: string | undefined,
    @Body() input: CreateChargeInput
  ) {
    return this.billingService.createCharge(authorization, input);
  }

  @Post('webhooks/asaas')
  receiveAsaasWebhook(
    @Headers('asaas-access-token') accessToken: string | undefined,
    @Body() payload: AsaasWebhookPayload
  ) {
    return this.billingService.receiveAsaasWebhook(accessToken, payload);
  }
}
