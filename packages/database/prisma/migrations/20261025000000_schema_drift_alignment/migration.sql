-- Missão 2.0: alinha o banco ao schema.prisma para `prisma migrate diff` ficar vazio no CI.
-- Os ids e updatedAt já são gerados pelo Prisma Client; os nomes de índice longos tinham
-- sido truncados pelo PostgreSQL (63 bytes) e agora seguem o nome que o Prisma espera.

-- AlterTable
ALTER TABLE "BillingAuditEntry" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BillingDelivery" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BillingPayment" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BillingWebhookEvent" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "InstallationVoucher" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MunicipalBillingPeriod" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MunicipalContract" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProviderInvoice" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ProviderServiceMeasurement" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "FtthFeasibilityAssessment_providerOrganizationId_result_assesse" RENAME TO "FtthFeasibilityAssessment_providerOrganizationId_result_ass_idx";

-- RenameIndex
ALTER INDEX "InstallationOrder_municipalityOrganizationId_status_createdAt_i" RENAME TO "InstallationOrder_municipalityOrganizationId_status_created_idx";

-- RenameIndex
ALTER INDEX "MunicipalBillingPeriod_contractId_competenceStart_competenceEnd" RENAME TO "MunicipalBillingPeriod_contractId_competenceStart_competenc_key";

-- RenameIndex
ALTER INDEX "ProviderServiceMeasurement_municipalityOrganizationId_status_co" RENAME TO "ProviderServiceMeasurement_municipalityOrganizationId_statu_idx";

-- RenameIndex
ALTER INDEX "ProviderServiceMeasurement_providerOrganizationId_programId_com" RENAME TO "ProviderServiceMeasurement_providerOrganizationId_programId_key";

-- RenameIndex
ALTER INDEX "ProviderServiceMeasurement_providerOrganizationId_status_compet" RENAME TO "ProviderServiceMeasurement_providerOrganizationId_status_co_idx";

