import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { SimulatedIxcAdapter, SimulatedSgpAdapter } from './simulated.adapters';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, SimulatedIxcAdapter, SimulatedSgpAdapter]
})
export class IntegrationsModule {}
