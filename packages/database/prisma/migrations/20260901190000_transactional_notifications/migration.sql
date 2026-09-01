CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('QUEUED', 'SUPPRESSED');

CREATE TABLE "NotificationConsent" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "recipientRef" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "purpose" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationConsent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationConsent_tenantId_recipientRef_channel_purpose_key" ON "NotificationConsent"("tenantId", "recipientRef", "channel", "purpose");
CREATE INDEX "NotificationConsent_organizationId_channel_updatedAt_idx" ON "NotificationConsent"("organizationId", "channel", "updatedAt");

CREATE TABLE "NotificationDelivery" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "recipientRef" TEXT NOT NULL,
  "templateCode" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationDelivery_tenantId_channel_idempotencyKey_key" ON "NotificationDelivery"("tenantId", "channel", "idempotencyKey");
CREATE INDEX "NotificationDelivery_organizationId_status_createdAt_idx" ON "NotificationDelivery"("organizationId", "status", "createdAt");

ALTER TABLE "NotificationConsent" ADD CONSTRAINT "NotificationConsent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationConsent" ADD CONSTRAINT "NotificationConsent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
