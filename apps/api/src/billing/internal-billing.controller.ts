import { Body, Controller, Headers, Post } from '@nestjs/common';
import { InternalBillingService } from './internal-billing.service';
import type { InternalBillingEvent } from './internal-billing.types';

@Controller('internal/billing')
export class InternalBillingController {
  constructor(private readonly service: InternalBillingService) {}

  @Post('events')
  receive(
    @Headers('x-billing-event-id') eventId: string | undefined,
    @Headers('authorization') authorization: string | undefined,
    @Body() input: InternalBillingEvent
  ) {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    return this.service.receive(eventId, token, input);
  }
}
