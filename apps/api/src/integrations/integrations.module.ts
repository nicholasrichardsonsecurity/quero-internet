import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ErpAdapterRegistry } from './erp/erp-connections';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, { provide: ErpAdapterRegistry, useFactory: () => ErpAdapterRegistry.fromEnvironment() }]
})
export class IntegrationsModule {}
