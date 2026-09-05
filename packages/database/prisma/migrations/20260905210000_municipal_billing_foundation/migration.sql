CREATE TABLE "MunicipalContract" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "municipalityOrganizationId" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "contractNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "monthlySaaSValue" DECIMAL(12,2) NOT NULL,
  "billingCustomerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MunicipalContract_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MunicipalContract_tenantId_contractNumber_key" ON "MunicipalContract"("tenantId","contractNumber");
CREATE INDEX "MunicipalContract_municipalityOrganizationId_status_idx" ON "MunicipalContract"("municipalityOrganizationId","status");
CREATE INDEX "MunicipalContract_programId_status_idx" ON "MunicipalContract"("programId","status");

CREATE TABLE "MunicipalBillingPeriod" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "contractId" UUID NOT NULL,
  "competenceStart" TIMESTAMP(3) NOT NULL,
  "competenceEnd" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "billingPaymentId" TEXT,
  "invoiceNumber" TEXT,
  "invoiceUrl" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MunicipalBillingPeriod_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MunicipalBillingPeriod_contractId_competenceStart_competenceEnd_key" ON "MunicipalBillingPeriod"("contractId","competenceStart","competenceEnd");
CREATE INDEX "MunicipalBillingPeriod_tenantId_status_dueDate_idx" ON "MunicipalBillingPeriod"("tenantId","status","dueDate");
CREATE INDEX "MunicipalBillingPeriod_contractId_competenceStart_idx" ON "MunicipalBillingPeriod"("contractId","competenceStart");

CREATE TABLE "ProviderServiceMeasurement" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "municipalityOrganizationId" UUID NOT NULL,
  "providerOrganizationId" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "competenceStart" TIMESTAMP(3) NOT NULL,
  "competenceEnd" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "beneficiaryCount" INTEGER NOT NULL DEFAULT 0,
  "activeServiceCount" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderServiceMeasurement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProviderServiceMeasurement_providerOrganizationId_programId_competenceStart_competenceEnd_key" ON "ProviderServiceMeasurement"("providerOrganizationId","programId","competenceStart","competenceEnd");
CREATE INDEX "ProviderServiceMeasurement_municipalityOrganizationId_status_competenceStart_idx" ON "ProviderServiceMeasurement"("municipalityOrganizationId","status","competenceStart");
CREATE INDEX "ProviderServiceMeasurement_providerOrganizationId_status_competenceStart_idx" ON "ProviderServiceMeasurement"("providerOrganizationId","status","competenceStart");

CREATE TABLE "ProviderInvoice" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "measurementId" UUID NOT NULL,
  "municipalityOrganizationId" UUID NOT NULL,
  "providerOrganizationId" UUID NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "amount" DECIMAL(12,2) NOT NULL,
  "documentUrl" TEXT,
  "paymentUrl" TEXT,
  "externalReference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REGISTERED',
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderInvoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProviderInvoice_measurementId_key" ON "ProviderInvoice"("measurementId");
CREATE UNIQUE INDEX "ProviderInvoice_providerOrganizationId_invoiceNumber_key" ON "ProviderInvoice"("providerOrganizationId","invoiceNumber");
CREATE INDEX "ProviderInvoice_municipalityOrganizationId_status_dueDate_idx" ON "ProviderInvoice"("municipalityOrganizationId","status","dueDate");
CREATE INDEX "ProviderInvoice_providerOrganizationId_status_issueDate_idx" ON "ProviderInvoice"("providerOrganizationId","status","issueDate");

CREATE TABLE "InstallationVoucher" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "applicationId" UUID NOT NULL,
  "providerOrganizationId" UUID NOT NULL,
  "codeHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ISSUED',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "redeemedAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InstallationVoucher_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InstallationVoucher_applicationId_key" ON "InstallationVoucher"("applicationId");
CREATE UNIQUE INDEX "InstallationVoucher_codeHash_key" ON "InstallationVoucher"("codeHash");
CREATE INDEX "InstallationVoucher_tenantId_status_expiresAt_idx" ON "InstallationVoucher"("tenantId","status","expiresAt");
CREATE INDEX "InstallationVoucher_providerOrganizationId_status_issuedAt_idx" ON "InstallationVoucher"("providerOrganizationId","status","issuedAt");
