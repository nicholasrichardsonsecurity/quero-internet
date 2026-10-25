import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { PrismaService } from '../database/prisma.service';
import { IntegrationConnectionsService } from './connections.service';
import { DatabaseConnectionStore } from './erp/connection-store';
import { ErpAdapterRegistry } from './erp/erp-connections';
import { SecretCipher } from './erp/secret-cipher';
import { guardedFetch } from './erp/url-guard';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    IntegrationConnectionsService,
    { provide: SecretCipher, useFactory: () => new SecretCipher() },
    {
      provide: ErpAdapterRegistry,
      inject: [PrismaService, SecretCipher],
      useFactory: (prisma: PrismaService, cipher: SecretCipher) =>
        ErpAdapterRegistry.fromEnvironment(process.env, guardedFetch(), new DatabaseConnectionStore(prisma, cipher))
    }
  ]
})
export class IntegrationsModule {}
