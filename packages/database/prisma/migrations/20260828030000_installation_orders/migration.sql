CREATE TYPE "InstallationStatus" AS ENUM (
  'INSTALLATION_PENDING',
  'SCHEDULED',
  'IN_PROGRESS',
  'INSTALLED',
  'ACTIVATED',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE "InstallationOrder" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "municipalityOrganizationId" UUID NOT NULL,
  "providerOrganizationId" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "referralId" UUID NOT NULL,
  "status" "InstallationStatus" NOT NULL DEFAULT 'INSTALLATION_PENDING',
  "scheduledAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "installedAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "cancellationReason" TEXT,
  "externalServiceReference" TEXT,
  "installationSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstallationOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InstallationOrder_schedule_required_check" CHECK (
    "status" NOT IN ('SCHEDULED', 'IN_PROGRESS', 'INSTALLED', 'ACTIVATED') OR "scheduledAt" IS NOT NULL
  ),
  CONSTRAINT "InstallationOrder_started_required_check" CHECK (
    "status" NOT IN ('IN_PROGRESS', 'INSTALLED', 'ACTIVATED') OR "startedAt" IS NOT NULL
  ),
  CONSTRAINT "InstallationOrder_installed_required_check" CHECK (
    "status" NOT IN ('INSTALLED', 'ACTIVATED') OR "installedAt" IS NOT NULL
  ),
  CONSTRAINT "InstallationOrder_activated_required_check" CHECK (
    "status" <> 'ACTIVATED' OR "activatedAt" IS NOT NULL
  ),
  CONSTRAINT "InstallationOrder_failure_reason_check" CHECK (
    "status" <> 'FAILED' OR ("failureReason" IS NOT NULL AND char_length(btrim("failureReason")) >= 12)
  ),
  CONSTRAINT "InstallationOrder_cancellation_reason_check" CHECK (
    "status" <> 'CANCELLED' OR ("cancellationReason" IS NOT NULL AND char_length(btrim("cancellationReason")) >= 12)
  ),
  CONSTRAINT "InstallationOrder_installed_after_started_check" CHECK (
    "installedAt" IS NULL OR "startedAt" IS NULL OR "installedAt" >= "startedAt"
  ),
  CONSTRAINT "InstallationOrder_activated_after_installed_check" CHECK (
    "activatedAt" IS NULL OR "installedAt" IS NULL OR "activatedAt" >= "installedAt"
  )
);

CREATE UNIQUE INDEX "InstallationOrder_referralId_key" ON "InstallationOrder"("referralId");
CREATE INDEX "InstallationOrder_tenantId_status_createdAt_idx" ON "InstallationOrder"("tenantId", "status", "createdAt");
CREATE INDEX "InstallationOrder_municipalityOrganizationId_status_createdAt_idx" ON "InstallationOrder"("municipalityOrganizationId", "status", "createdAt");
CREATE INDEX "InstallationOrder_providerOrganizationId_status_createdAt_idx" ON "InstallationOrder"("providerOrganizationId", "status", "createdAt");
CREATE INDEX "InstallationOrder_programId_status_createdAt_idx" ON "InstallationOrder"("programId", "status", "createdAt");

ALTER TABLE "InstallationOrder" ADD CONSTRAINT "InstallationOrder_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstallationOrder" ADD CONSTRAINT "InstallationOrder_municipalityOrganizationId_fkey"
  FOREIGN KEY ("municipalityOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstallationOrder" ADD CONSTRAINT "InstallationOrder_providerOrganizationId_fkey"
  FOREIGN KEY ("providerOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstallationOrder" ADD CONSTRAINT "InstallationOrder_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstallationOrder" ADD CONSTRAINT "InstallationOrder_referralId_fkey"
  FOREIGN KEY ("referralId") REFERENCES "ProviderReferral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
