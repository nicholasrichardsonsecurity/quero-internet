-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiUser" TEXT,
    "apiApp" TEXT,
    "tokenCiphertext" TEXT NOT NULL,
    "tokenLast4" VARCHAR(4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNTESTED',
    "lastTestedAt" TIMESTAMP(3),
    "lastTestMessage" TEXT,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_organizationId_provider_key" ON "IntegrationConnection"("organizationId", "provider");

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Regras persistíveis: o ERP só é acessado por https e o status é um conjunto fechado.
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_status_check" CHECK ("status" IN ('UNTESTED', 'OK', 'FAILED'));
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_baseUrl_https_check" CHECK ("baseUrl" LIKE 'https://%');
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_token_encrypted_check" CHECK ("tokenCiphertext" LIKE 'v1:%');
-- SGP precisa do nome do app; IXC não usa.
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_sgp_app_check" CHECK ("provider" <> 'SGP' OR ("apiApp" IS NOT NULL AND "apiApp" <> ''));
