import { Controller, Get } from '@nestjs/common';
import { ObservabilityService } from './observability.service';

@Controller('metrics')
export class ObservabilityController {
  constructor(private readonly observability: ObservabilityService) {}

  @Get()
  metrics() {
    return this.observability.snapshot();
  }
}
