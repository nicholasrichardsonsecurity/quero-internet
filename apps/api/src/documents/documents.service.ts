import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { EvidenceClassification } from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';

type RegisterDocumentInput = {
  tenantId?: string;
  entityType?: string;
  entityId?: string;
  purpose?: string;
  classification?: string;
  originalFileName?: string;
  mimeType?: string;
  byteSize?: number;
  sha256?: string;
  storageKey?: string;
  retentionUntil?: string;
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveTenant(context: AuthenticatedSession, requestedTenantId?: string) {
    const tenantId = requestedTenantId ?? (context.tenantIds.length === 1 ? context.tenantIds[0] : undefined);
    if (!tenantId) throw new BadRequestException('tenantId é obrigatório quando há múltiplos tenants.');
    if (!context.tenantIds.includes(tenantId)) throw new ForbiddenException('Tenant fora do contexto autorizado.');

    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { tenantLinks: { where: { tenantId }, select: { tenantId: true } } }
    });
    if (!organization?.tenantLinks.length) {
      throw new ForbiddenException('Organização fora do tenant autorizado.');
    }
    return tenantId;
  }

  async register(context: AuthenticatedSession, input: RegisterDocumentInput) {
    const tenantId = await this.resolveTenant(context, input.tenantId);
    const entityType = input.entityType?.trim().toUpperCase();
    const entityId = input.entityId?.trim();
    const purpose = input.purpose?.trim();
    const mimeType = input.mimeType?.trim().toLowerCase();
    const storageKey = input.storageKey?.trim();
    const sha256 = input.sha256?.trim().toLowerCase();

    if (!entityType || !/^[A-Z][A-Z0-9_]{1,63}$/.test(entityType)) {
      throw new BadRequestException('entityType inválido.');
    }
    if (!entityId || entityId.length > 100) throw new BadRequestException('entityId inválido.');
    if (!purpose || purpose.length < 3 || purpose.length > 160) throw new BadRequestException('purpose inválido.');
    if (!mimeType || mimeType.length > 160 || mimeType.includes(';')) throw new BadRequestException('mimeType inválido.');
    if (!Number.isInteger(input.byteSize) || (input.byteSize as number) < 1 || (input.byteSize as number) > 25_000_000) {
      throw new BadRequestException('byteSize deve estar entre 1 byte e 25 MB.');
    }
    if (!sha256 || !/^[a-f0-9]{64}$/.test(sha256)) throw new BadRequestException('sha256 deve ser SHA-256 hexadecimal.');
    if (!storageKey || storageKey.length > 512 || storageKey.startsWith('/') || storageKey.includes('..')) {
      throw new BadRequestException('storageKey inválida.');
    }
    if (!Object.values(EvidenceClassification).includes(input.classification as EvidenceClassification)) {
      throw new BadRequestException('classification inválida.');
    }

    let retentionUntil: Date | undefined;
    if (input.retentionUntil) {
      retentionUntil = new Date(input.retentionUntil);
      if (Number.isNaN(retentionUntil.getTime())) throw new BadRequestException('retentionUntil inválido.');
    }

    const document = await this.prisma.evidenceDocument.create({
      data: {
        tenantId,
        organizationId: context.organizationId,
        entityType,
        entityId,
        purpose,
        classification: input.classification as EvidenceClassification,
        originalFileName: input.originalFileName?.trim().slice(0, 255) || null,
        mimeType,
        byteSize: input.byteSize as number,
        sha256,
        storageKey,
        retentionUntil
      },
      select: {
        id: true, tenantId: true, organizationId: true, entityType: true, entityId: true,
        purpose: true, classification: true, originalFileName: true, mimeType: true,
        byteSize: true, sha256: true, retentionUntil: true, createdAt: true
      }
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        organizationId: context.organizationId,
        actorUserId: context.user.id,
        action: 'EVIDENCE_DOCUMENT_REGISTERED',
        entityType: 'EVIDENCE_DOCUMENT',
        entityId: document.id
      }
    });

    return document;
  }

  async list(
    context: AuthenticatedSession,
    filters: { tenantId?: string; entityType?: string; entityId?: string }
  ) {
    const tenantId = await this.resolveTenant(context, filters.tenantId);
    return this.prisma.evidenceDocument.findMany({
      where: {
        tenantId,
        organizationId: context.organizationId,
        ...(filters.entityType ? { entityType: filters.entityType.trim().toUpperCase() } : {}),
        ...(filters.entityId ? { entityId: filters.entityId.trim() } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, tenantId: true, organizationId: true, entityType: true, entityId: true,
        purpose: true, classification: true, originalFileName: true, mimeType: true,
        byteSize: true, sha256: true, retentionUntil: true, createdAt: true
      }
    });
  }
}
