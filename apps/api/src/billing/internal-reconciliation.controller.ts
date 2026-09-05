import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { BillingReconciliationService } from './billing-reconciliation.service';

type ReconciliationInput = { limit?: unknown };

@Controller('internal/billing')
export class InternalReconciliationController {
  constructor(private readonly reconciliation: BillingReconciliationService) {}

  @Post('reconcile/run')
  run(@Headers('authorization') authorization: string | undefined, @Body() input: ReconciliationInput) {
    const expected = process.env.BILLING_INTERNAL_TOKEN?.trim();
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : undefined;
    if (!expected || !token || token !== expected) {
      throw new UnauthorizedException('Token de reconciliação inválido.');
    }

    const limit = typeof input?.limit === 'number' && Number.isInteger(input.limit) ? input.limit : 25;
    return this.reconciliation.runOnce(limit);
  }
}
