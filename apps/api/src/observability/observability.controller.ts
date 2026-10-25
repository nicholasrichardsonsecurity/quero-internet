import { Controller, Get } from '@nestjs/common';
import { PublicRoute } from '../auth/require-permissions.decorator';
import { ObservabilityService } from './observability.service';

// Snapshot agregado, sem dados pessoais; restringir por rede no ingress (missão 2.2 revisa).
@Controller('metrics')
@PublicRoute('metrics')
export class ObservabilityController {
  constructor(private readonly observability: ObservabilityService) {}

  @Get()
  metrics() {
    return this.observability.snapshot();
  }
}
