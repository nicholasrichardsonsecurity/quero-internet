const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('node:crypto');

if (process.env.NODE_ENV === 'production' || process.env.APP_ENV !== 'homolog' || process.env.ALLOW_SYNTHETIC_SEED !== 'true') {
  throw new Error('Seed bloqueado: exige APP_ENV=homolog, ALLOW_SYNTHETIC_SEED=true e ambiente não produtivo.');
}

const password = process.env.HOMOLOG_SEED_PASSWORD;
if (!password || password.length < 12) {
  throw new Error('HOMOLOG_SEED_PASSWORD deve ter pelo menos 12 caracteres e ser fornecida pelo ambiente.');
}

const tenantId = '00000000-0000-4000-8000-000000000001';
const municipalityId = '00000000-0000-4000-8000-000000000002';
const providerId = '00000000-0000-4000-8000-000000000003';
const userId = '00000000-0000-4000-8000-000000000004';
const programId = '00000000-0000-4000-8000-000000000005';
const membershipId = '00000000-0000-4000-8000-000000000006';
const providerUserId = '00000000-0000-4000-8000-000000000007';
const providerMembershipId = '00000000-0000-4000-8000-000000000008';
const salt = randomBytes(16).toString('hex');
const passwordHash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.tenant.upsert({
      where: { id: tenantId },
      update: { name: 'Município Sintético de Homologação', status: 'ACTIVE' },
      create: { id: tenantId, slug: 'municipio-sintetico-homologacao', name: 'Município Sintético de Homologação', status: 'ACTIVE' }
    });
    await tx.organization.upsert({
      where: { id: municipalityId },
      update: { legalName: 'Prefeitura Sintética de Homologação', tradeName: 'Prefeitura Sintética', type: 'MUNICIPALITY', status: 'ACTIVE' },
      create: { id: municipalityId, legalName: 'Prefeitura Sintética de Homologação', tradeName: 'Prefeitura Sintética', type: 'MUNICIPALITY', status: 'ACTIVE' }
    });
    await tx.organization.upsert({
      where: { id: providerId },
      update: { legalName: 'Provedor Sintético de Homologação', tradeName: 'Provedor Sintético', type: 'INTERNET_PROVIDER', status: 'ACTIVE' },
      create: { id: providerId, legalName: 'Provedor Sintético de Homologação', tradeName: 'Provedor Sintético', type: 'INTERNET_PROVIDER', status: 'ACTIVE' }
    });
    await tx.tenantOrganization.upsert({
      where: { tenantId_organizationId: { tenantId, organizationId: municipalityId } },
      update: {},
      create: { tenantId, organizationId: municipalityId }
    });
    await tx.tenantOrganization.upsert({
      where: { tenantId_organizationId: { tenantId, organizationId: providerId } },
      update: {},
      create: { tenantId, organizationId: providerId }
    });
    await tx.program.upsert({
      where: { id: programId },
      update: { name: 'Programa Conecta Homologação', status: 'ACTIVE', municipalityOrganizationId: municipalityId },
      create: { id: programId, tenantId, municipalityOrganizationId: municipalityId, name: 'Programa Conecta Homologação', slug: 'programa-conecta-homologacao', status: 'ACTIVE' }
    });
    await tx.user.upsert({
      where: { id: userId },
      update: { email: 'gestor@homolog.example.invalid', displayName: 'Gestor Sintético', passwordHash, active: true },
      create: { id: userId, email: 'gestor@homolog.example.invalid', displayName: 'Gestor Sintético', passwordHash, active: true }
    });
    await tx.membership.upsert({
      where: { id: membershipId },
      update: { userId, organizationId: municipalityId, role: 'MUNICIPAL_MANAGER', status: 'ACTIVE' },
      create: { id: membershipId, userId, organizationId: municipalityId, role: 'MUNICIPAL_MANAGER', status: 'ACTIVE' }
    });
    await tx.user.upsert({
      where: { id: providerUserId },
      update: { email: 'provedor@homolog.example.invalid', displayName: 'Provedor Sintético', passwordHash, active: true },
      create: { id: providerUserId, email: 'provedor@homolog.example.invalid', displayName: 'Provedor Sintético', passwordHash, active: true }
    });
    await tx.membership.upsert({
      where: { id: providerMembershipId },
      update: { userId: providerUserId, organizationId: providerId, role: 'PROVIDER_MANAGER', status: 'ACTIVE' },
      create: { id: providerMembershipId, userId: providerUserId, organizationId: providerId, role: 'PROVIDER_MANAGER', status: 'ACTIVE' }
    });
  });
  console.log(JSON.stringify({
    status: 'seeded',
    tenantId,
    municipalityId,
    providerId,
    programId,
    loginEmail: 'gestor@homolog.example.invalid',
    providerLoginEmail: 'provedor@homolog.example.invalid'
  }));
}

main().catch((error) => { console.error('seed-homolog failed', error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
