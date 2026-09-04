import { Body, Controller, Headers, Post } from '@nestjs/common';
import { BillingService } from './billing.service';
import type { AsaasWebhookPayload } from './billing.types';
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}
  @Post('webhooks/asaas')
  receiveAsaasWebhook(@Headers('asaas-access-token') accessToken:string|undefined,@Body() payload:AsaasWebhookPayload) {
    return this.billingService.receiveAsaasWebhook(accessToken,payload);
  }
}
