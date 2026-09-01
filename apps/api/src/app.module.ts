import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [DatabaseModule, AuthModule, BeneficiariesModule, DashboardModule, DocumentsModule, IntegrationsModule],
  controllers: [HealthController]
})
export class AppModule {}
