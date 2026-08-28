CREATE TYPE "ServiceStatus" AS ENUM (
  'ACTIVE',
  'SUSPENDED',
  'INTERRUPTED',
  'ENDED'
);

CREATE TABLE "ActiveService" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "municipalityOrganizationId" UUID NOT NULL,
  "providerOrganizationId" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "installationOrderId" UUID NOT NULL,
  "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
  "activatedAt" TIMESTAMP(3) NOT NULL,
  "suspendedAt" TIMESTAMP(3),
  "interruptedAt" TIMESTAMP(3),
  "restoredAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "statusReason" TEXT,
  "externalServiceReference" TEXT,
  "lastObservedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ActiveService_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ActiveService_suspended_reason_check" CHECK (
    "status" <> 'SUSPENDED' OR ("statusReason" IS NOT NULL AND char_length(btrim("statusReason")) >= 12 AND "suspendedAt" IS NOT NULL)
  ),
  CONSTRAINT "ActiveService_interrupted_reason_check" CHECK (
    "status" <> 'INTERRUPTED' OR ("statusReason" IS NOT NULL AND char_length(btrim("statusReason")) >= 12 AND "interruptedAt" IS NOT NULL)
  ),
  CONSTRAINT "ActiveService_ended_reason_check" CHECK (
    "status" <> 'ENDED' OR ("statusReason" IS NOT NULL AND char_length(btrim("statusReason")) >= 12 AND "endedAt" IS NOT NULL)
  ),
  CONSTRAINT "ActiveService_suspended_after_activation_check" CHECK (
    "suspendedAt" IS NULL OR "suspendedAt" >= "activatedAt"
  ),
  CONSTRAINT "ActiveService_interrupted_after_activation_check" CHECK (
    "interruptedAt" IS NULL OR "interruptedAt" >= "activatedAt"
  ),
  CONSTRAINT "ActiveService_restored_after_activation_check" CHECK (
    "restoredAt" IS NULL OR "restoredAt" >= "activatedAt"
  ),
  CONSTRAINT "ActiveService_ended_after_activation_check" CHECK (
    "endedAt" IS NULL OR "endedAt" >= "activatedAt"
  ),
  CONSTRAINT "ActiveService_last_observed_after_activation_check" CHECK (
    "lastObservedAt" IS NULL OR "lastObservedAt" >= "activatedAt"
  )
);

CREATE UNIQUE INDEX "ActiveService_installationOrderId_key" ON "ActiveService"("installationOrderId");
CREATE INDEX "ActiveService_tenantId_status_createdAt_idx" ON "ActiveService"("tenantId", "status", "createdAt");
CREATE INDEX "ActiveService_municipalityOrganizationId_status_createdAt_idx" ON "ActiveService"("municipalityOrganizationId", "status", "createdAt");
CREATE INDEX "ActiveService_providerOrganizationId_status_createdAt_idx" ON "ActiveService"("providerOrganizationId", "status", "createdAt");
CREATE INDEX "ActiveService_programId_status_createdAt_idx" ON "ActiveService"("programId", "status", "createdAt");

ALTER TABLE "ActiveService" ADD CONSTRAINT "ActiveService_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActiveService" ADD CONSTRAINT "ActiveService_municipalityOrganizationId_fkey"
  FOREIGN KEY ("municipalityOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActiveService" ADD CONSTRAINT "ActiveService_providerOrganizationId_fkey"
  FOREIGN KEY ("providerOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActiveService" ADD CONSTRAINT "ActiveService_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActiveService" ADD CONSTRAINT "ActiveService_installationOrderId_fkey"
  FOREIGN KEY ("installationOrderId") REFERENCES "InstallationOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
