CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "OrganizationType" AS ENUM ('MUNICIPALITY', 'INTERNET_PROVIDER', 'PLATFORM_OPERATOR', 'AUDIT_ORGANIZATION', 'FINANCIAL_OPERATOR', 'SERVICE_PROVIDER');
CREATE TYPE "OrganizationStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'RESTRICTED', 'SUSPENDED', 'OFFBOARDING', 'TERMINATED');
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED');
CREATE TYPE "ParticipationType" AS ENUM ('MUNICIPAL_MANAGER', 'INTERNET_PROVIDER', 'AUDITOR', 'FINANCIAL_OPERATOR', 'SERVICE_PROVIDER');
CREATE TYPE "ParticipationStatus" AS ENUM ('PENDING', 'ACTIVE', 'RESTRICTED', 'SUSPENDED', 'TERMINATED');
CREATE TYPE "MembershipRole" AS ENUM ('ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'MUNICIPAL_MANAGER', 'MUNICIPAL_OPERATOR', 'PROVIDER_MANAGER', 'PROVIDER_OPERATOR', 'AUDITOR', 'SUPPORT');
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

CREATE TABLE "Tenant" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Organization" (
  "id" UUID NOT NULL,
  "legalName" TEXT NOT NULL,
  "tradeName" TEXT,
  "documentNumber" TEXT,
  "type" "OrganizationType" NOT NULL,
  "status" "OrganizationStatus" NOT NULL DEFAULT 'ONBOARDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TenantOrganization" (
  "tenantId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantOrganization_pkey" PRIMARY KEY ("tenantId", "organizationId")
);

CREATE TABLE "OrganizationalUnit" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationalUnit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Program" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "municipalityOrganizationId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgramParticipation" (
  "id" UUID NOT NULL,
  "programId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "type" "ParticipationType" NOT NULL,
  "status" "ParticipationStatus" NOT NULL DEFAULT 'PENDING',
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProgramParticipation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membership" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "role" "MembershipRole" NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
  "validFrom" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "activeOrganizationContextId" UUID,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" UUID NOT NULL,
  "tenantId" UUID,
  "organizationId" UUID,
  "programId" UUID,
  "actorUserId" UUID,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Organization_type_status_idx" ON "Organization"("type", "status");
CREATE INDEX "TenantOrganization_organizationId_idx" ON "TenantOrganization"("organizationId");
CREATE UNIQUE INDEX "OrganizationalUnit_organizationId_code_key" ON "OrganizationalUnit"("organizationId", "code");
CREATE INDEX "OrganizationalUnit_organizationId_active_idx" ON "OrganizationalUnit"("organizationId", "active");
CREATE UNIQUE INDEX "Program_tenantId_slug_key" ON "Program"("tenantId", "slug");
CREATE INDEX "Program_tenantId_status_idx" ON "Program"("tenantId", "status");
CREATE INDEX "Program_municipalityOrganizationId_idx" ON "Program"("municipalityOrganizationId");
CREATE UNIQUE INDEX "ProgramParticipation_programId_organizationId_type_key" ON "ProgramParticipation"("programId", "organizationId", "type");
CREATE INDEX "ProgramParticipation_organizationId_status_idx" ON "ProgramParticipation"("organizationId", "status");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Membership_userId_organizationId_role_key" ON "Membership"("userId", "organizationId", "role");
CREATE INDEX "Membership_organizationId_status_idx" ON "Membership"("organizationId", "status");
CREATE INDEX "Membership_userId_status_idx" ON "Membership"("userId", "status");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");
CREATE INDEX "AuditLog_programId_createdAt_idx" ON "AuditLog"("programId", "createdAt");
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");

ALTER TABLE "TenantOrganization" ADD CONSTRAINT "TenantOrganization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantOrganization" ADD CONSTRAINT "TenantOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationalUnit" ADD CONSTRAINT "OrganizationalUnit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_municipalityOrganizationId_fkey" FOREIGN KEY ("municipalityOrganizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProgramParticipation" ADD CONSTRAINT "ProgramParticipation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgramParticipation" ADD CONSTRAINT "ProgramParticipation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
