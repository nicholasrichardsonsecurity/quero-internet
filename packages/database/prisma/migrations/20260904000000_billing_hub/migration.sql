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
