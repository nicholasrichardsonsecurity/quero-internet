CREATE TABLE "BillingWebhookEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "eventId" TEXT NOT NULL, "eventName" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL, "paymentStatus" TEXT, "productKey" TEXT NOT NULL, "tenantId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL, "planId" TEXT NOT NULL, "externalReference" TEXT NOT NULL, "environment" TEXT NOT NULL,
  "payloadHash" VARCHAR(64) NOT NULL, "payload" JSONB NOT NULL, "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3), CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BillingWebhookEvent_eventId_key" ON "BillingWebhookEvent"("eventId");
CREATE INDEX "BillingWebhookEvent_paymentId_receivedAt_idx" ON "BillingWebhookEvent"("paymentId", "receivedAt");
CREATE INDEX "BillingWebhookEvent_productKey_tenantId_receivedAt_idx" ON "BillingWebhookEvent"("productKey", "tenantId", "receivedAt");
CREATE TABLE "BillingAuditEntry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "eventId" TEXT NOT NULL, "action" TEXT NOT NULL,
  "productKey" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "companyId" TEXT NOT NULL, "planId" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL, "environment" TEXT NOT NULL, "payloadHash" VARCHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "BillingAuditEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BillingAuditEntry_eventId_createdAt_idx" ON "BillingAuditEntry"("eventId", "createdAt");
CREATE INDEX "BillingAuditEntry_productKey_tenantId_createdAt_idx" ON "BillingAuditEntry"("productKey", "tenantId", "createdAt");

ALTER TABLE "BillingWebhookEvent"
  ADD COLUMN "processingStatus" TEXT NOT NULL DEFAULT 'PENDING_RECONCILIATION',
  ADD COLUMN "reconcileAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "lastError" TEXT;
CREATE TABLE "BillingDelivery" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "eventId" TEXT NOT NULL,
  "productKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BillingDelivery_eventId_key" ON "BillingDelivery"("eventId");
CREATE INDEX "BillingDelivery_status_availableAt_idx" ON "BillingDelivery"("status", "availableAt");
CREATE INDEX "BillingDelivery_productKey_status_createdAt_idx" ON "BillingDelivery"("productKey", "status", "createdAt");
