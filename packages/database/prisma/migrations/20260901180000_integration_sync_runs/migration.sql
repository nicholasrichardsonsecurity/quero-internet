CREATE TYPE "IntegrationProvider" AS ENUM ('IXC', 'SGP');
CREATE TYPE "IntegrationSyncStatus" AS ENUM ('COMPLETED', 'REUSED');
CREATE TABLE "IntegrationSyncRun" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "IntegrationSyncStatus" NOT NULL DEFAULT 'COMPLETED',
  "mode" TEXT NOT NULL,
  "recordCount" INTEGER NOT NULL DEFAULT 0,
  "resultHash" VARCHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationSyncRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "IntegrationSyncRun_tenantId_provider_idempotencyKey_key" ON "IntegrationSyncRun"("tenantId", "provider", "idempotencyKey");
CREATE INDEX "IntegrationSyncRun_organizationId_provider_createdAt_idx" ON "IntegrationSyncRun"("organizationId", "provider", "createdAt");
ALTER TABLE "IntegrationSyncRun" ADD CONSTRAINT "IntegrationSyncRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IntegrationSyncRun" ADD CONSTRAINT "IntegrationSyncRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
