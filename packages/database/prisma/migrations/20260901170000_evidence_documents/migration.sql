CREATE TYPE "EvidenceClassification" AS ENUM ('PUBLIC', 'INTERNAL', 'PERSONAL', 'SENSITIVE');

CREATE TABLE "EvidenceDocument" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "classification" "EvidenceClassification" NOT NULL,
  "originalFileName" TEXT,
  "mimeType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "sha256" VARCHAR(64) NOT NULL,
  "storageKey" TEXT NOT NULL,
  "retentionUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EvidenceDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EvidenceDocument_tenantId_storageKey_key"
  ON "EvidenceDocument"("tenantId", "storageKey");
CREATE INDEX "EvidenceDocument_tenantId_entityType_entityId_createdAt_idx"
  ON "EvidenceDocument"("tenantId", "entityType", "entityId", "createdAt");
CREATE INDEX "EvidenceDocument_organizationId_classification_createdAt_idx"
  ON "EvidenceDocument"("organizationId", "classification", "createdAt");
CREATE INDEX "EvidenceDocument_retentionUntil_idx"
  ON "EvidenceDocument"("retentionUntil");

ALTER TABLE "EvidenceDocument"
  ADD CONSTRAINT "EvidenceDocument_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EvidenceDocument"
  ADD CONSTRAINT "EvidenceDocument_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
