CREATE TYPE "BeneficiaryStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ELIGIBLE', 'INELIGIBLE', 'REFERRED', 'CANCELLED');

CREATE TABLE "Beneficiary" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "municipalityOrganizationId" UUID NOT NULL,
  "fullName" TEXT NOT NULL,
  "documentHash" TEXT NOT NULL,
  "documentLast4" VARCHAR(4) NOT NULL,
  "birthDate" TIMESTAMP(3),
  "phone" TEXT,
  "email" TEXT,
  "status" "BeneficiaryStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Application" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "municipalityOrganizationId" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "beneficiaryId" UUID NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "decisionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Beneficiary_tenantId_documentHash_key" ON "Beneficiary"("tenantId", "documentHash");
CREATE INDEX "Beneficiary_municipalityOrganizationId_status_idx" ON "Beneficiary"("municipalityOrganizationId", "status");
CREATE INDEX "Beneficiary_tenantId_createdAt_idx" ON "Beneficiary"("tenantId", "createdAt");

CREATE UNIQUE INDEX "Application_programId_beneficiaryId_key" ON "Application"("programId", "beneficiaryId");
CREATE INDEX "Application_tenantId_status_submittedAt_idx" ON "Application"("tenantId", "status", "submittedAt");
CREATE INDEX "Application_municipalityOrganizationId_status_idx" ON "Application"("municipalityOrganizationId", "status");
CREATE INDEX "Application_beneficiaryId_createdAt_idx" ON "Application"("beneficiaryId", "createdAt");

ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_municipalityOrganizationId_fkey"
  FOREIGN KEY ("municipalityOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Application" ADD CONSTRAINT "Application_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_municipalityOrganizationId_fkey"
  FOREIGN KEY ("municipalityOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_beneficiaryId_fkey"
  FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
