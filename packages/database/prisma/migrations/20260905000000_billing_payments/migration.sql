CREATE TABLE "BillingPayment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "idempotencyKey" TEXT NOT NULL,
  "paymentReference" TEXT NOT NULL,
  "providerPaymentId" TEXT,
  "productKey" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "value" DECIMAL(12,2) NOT NULL,
  "billingType" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "description" TEXT,
  "externalReference" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "providerStatus" TEXT,
  "invoiceUrl" TEXT,
  "bankSlipUrl" TEXT,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BillingPayment_idempotencyKey_key" ON "BillingPayment"("idempotencyKey");
CREATE UNIQUE INDEX "BillingPayment_paymentReference_key" ON "BillingPayment"("paymentReference");
CREATE UNIQUE INDEX "BillingPayment_providerPaymentId_key" ON "BillingPayment"("providerPaymentId");
CREATE UNIQUE INDEX "BillingPayment_externalReference_key" ON "BillingPayment"("externalReference");
CREATE INDEX "BillingPayment_productKey_tenantId_createdAt_idx" ON "BillingPayment"("productKey","tenantId","createdAt");
CREATE INDEX "BillingPayment_providerPaymentId_createdAt_idx" ON "BillingPayment"("providerPaymentId","createdAt");
CREATE INDEX "BillingPayment_status_createdAt_idx" ON "BillingPayment"("status","createdAt");
