import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ObservabilityModule } from './observability/observability.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [DatabaseModule, AuthModule, BeneficiariesModule, DashboardModule, DocumentsModule, IntegrationsModule, NotificationsModule, ObservabilityModule],
  controllers: [HealthController]
})
export class AppModule {}
