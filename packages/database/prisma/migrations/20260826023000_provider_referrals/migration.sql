CREATE TYPE "ProviderReferralStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

CREATE TABLE "ProviderReferral" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "municipalityOrganizationId" UUID NOT NULL,
  "providerOrganizationId" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "status" "ProviderReferralStatus" NOT NULL DEFAULT 'PENDING',
  "referredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3),
  "responseReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProviderReferral_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProviderReferral_tenantId_status_referredAt_idx"
  ON "ProviderReferral"("tenantId", "status", "referredAt");
CREATE INDEX "ProviderReferral_municipalityOrganizationId_status_idx"
  ON "ProviderReferral"("municipalityOrganizationId", "status");
CREATE INDEX "ProviderReferral_providerOrganizationId_status_referredAt_idx"
  ON "ProviderReferral"("providerOrganizationId", "status", "referredAt");
CREATE INDEX "ProviderReferral_applicationId_createdAt_idx"
  ON "ProviderReferral"("applicationId", "createdAt");

-- No more than one active provider may hold an application at a time.
CREATE UNIQUE INDEX "ProviderReferral_one_active_per_application_idx"
  ON "ProviderReferral"("applicationId")
  WHERE "status" IN ('PENDING', 'ACCEPTED');

ALTER TABLE "ProviderReferral" ADD CONSTRAINT "ProviderReferral_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderReferral" ADD CONSTRAINT "ProviderReferral_municipalityOrganizationId_fkey"
  FOREIGN KEY ("municipalityOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderReferral" ADD CONSTRAINT "ProviderReferral_providerOrganizationId_fkey"
  FOREIGN KEY ("providerOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderReferral" ADD CONSTRAINT "ProviderReferral_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderReferral" ADD CONSTRAINT "ProviderReferral_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
