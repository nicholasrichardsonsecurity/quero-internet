import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { OperationsModule } from './operations/operations.module';

@Module({
  imports: [DatabaseModule, AuthModule, BeneficiariesModule, OperationsModule],
  controllers: [HealthController]
})
export class AppModule {}
