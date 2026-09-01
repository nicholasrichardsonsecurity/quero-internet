import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ObservabilityController } from './observability.controller';
import { observabilityMiddleware } from './observability.middleware';
import { ObservabilityService } from './observability.service';

@Module({
  controllers: [ObservabilityController],
  providers: [ObservabilityService],
  exports: [ObservabilityService]
})
export class ObservabilityModule implements NestModule {
  constructor(private readonly observability: ObservabilityService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(observabilityMiddleware(this.observability)).forRoutes('*');
  }
}
