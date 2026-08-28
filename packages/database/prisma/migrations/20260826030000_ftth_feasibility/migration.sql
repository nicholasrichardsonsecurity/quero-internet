CREATE TYPE "FtthFeasibilityResult" AS ENUM ('FEASIBLE', 'EXPANSION_REQUIRED', 'NOT_FEASIBLE');

CREATE TABLE "FtthFeasibilityAssessment" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "providerOrganizationId" UUID NOT NULL,
  "referralId" UUID NOT NULL,
  "result" "FtthFeasibilityResult" NOT NULL,
  "coverageConfirmed" BOOLEAN NOT NULL,
  "infrastructureReference" TEXT,
  "availablePorts" INTEGER,
  "estimatedDropMeters" INTEGER,
  "expansionRequired" BOOLEAN NOT NULL DEFAULT false,
  "technicalReason" TEXT,
  "estimatedReadyAt" TIMESTAMP(3),
  "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FtthFeasibilityAssessment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FtthFeasibilityAssessment_availablePorts_check" CHECK ("availablePorts" IS NULL OR "availablePorts" >= 0),
  CONSTRAINT "FtthFeasibilityAssessment_estimatedDropMeters_check" CHECK ("estimatedDropMeters" IS NULL OR "estimatedDropMeters" >= 0),
  CONSTRAINT "FtthFeasibilityAssessment_expansionFlag_check" CHECK ("expansionRequired" = ("result" = 'EXPANSION_REQUIRED'::"FtthFeasibilityResult")),
  CONSTRAINT "FtthFeasibilityAssessment_feasibleCoverage_check" CHECK ("result" <> 'FEASIBLE'::"FtthFeasibilityResult" OR "coverageConfirmed" = true),
  CONSTRAINT "FtthFeasibilityAssessment_feasiblePorts_check" CHECK ("result" <> 'FEASIBLE'::"FtthFeasibilityResult" OR "availablePorts" IS NULL OR "availablePorts" > 0),
  CONSTRAINT "FtthFeasibilityAssessment_expansionDetails_check" CHECK (
    "result" <> 'EXPANSION_REQUIRED'::"FtthFeasibilityResult"
    OR (
      "technicalReason" IS NOT NULL
      AND char_length(btrim("technicalReason")) >= 12
      AND "estimatedReadyAt" IS NOT NULL
    )
  ),
  CONSTRAINT "FtthFeasibilityAssessment_infeasibleReason_check" CHECK (
    "result" <> 'NOT_FEASIBLE'::"FtthFeasibilityResult"
    OR ("technicalReason" IS NOT NULL AND char_length(btrim("technicalReason")) >= 12)
  )
);

CREATE UNIQUE INDEX "FtthFeasibilityAssessment_referralId_key" ON "FtthFeasibilityAssessment"("referralId");
CREATE INDEX "FtthFeasibilityAssessment_tenantId_result_assessedAt_idx" ON "FtthFeasibilityAssessment"("tenantId", "result", "assessedAt");
CREATE INDEX "FtthFeasibilityAssessment_providerOrganizationId_result_assessedAt_idx" ON "FtthFeasibilityAssessment"("providerOrganizationId", "result", "assessedAt");

ALTER TABLE "FtthFeasibilityAssessment" ADD CONSTRAINT "FtthFeasibilityAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FtthFeasibilityAssessment" ADD CONSTRAINT "FtthFeasibilityAssessment_providerOrganizationId_fkey" FOREIGN KEY ("providerOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FtthFeasibilityAssessment" ADD CONSTRAINT "FtthFeasibilityAssessment_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "ProviderReferral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
