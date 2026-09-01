import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationDeliveryStatus } from '@prisma/client';
import type { AuthenticatedSession } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { NOTIFICATION_TEMPLATES } from './notification.templates';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  templates() {
    return NOTIFICATION_TEMPLATES.map(({ code, version, purpose, channels, text }) => ({ code, version, purpose, channels, text }));
  }

  private async resolveTenant(context: AuthenticatedSession, requestedTenantId?: string) {
    const tenantId = requestedTenantId ?? (context.tenantIds.length === 1 ? context.tenantIds[0] : undefined);
    if (!tenantId) throw new BadRequestException('tenantId é obrigatório quando há múltiplos tenants.');
    if (!context.tenantIds.includes(tenantId)) throw new ForbiddenException('Tenant fora do contexto autorizado.');
    const organization = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { tenantLinks: { where: { tenantId }, select: { tenantId: true } } }
    });
    if (!organization?.tenantLinks.length) throw new ForbiddenException('Organização fora do tenant autorizado.');
    return tenantId;
  }

  private channel(value?: string): NotificationChannel {
    const normalized = value?.trim().toUpperCase() as NotificationChannel;
    if (!Object.values(NotificationChannel).includes(normalized)) throw new BadRequestException('Canal inválido. Use EMAIL, SMS ou WHATSAPP.');
    return normalized;
  }

  private key(value?: string) {
    const key = value?.trim();
    if (!key || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(key)) throw new BadRequestException('x-idempotency-key inválido ou ausente.');
    return key;
  }

  async setConsent(context: AuthenticatedSession, input: { tenantId?: string; recipientRef?: string; channel?: string; purpose?: string; granted?: boolean }) {
    const tenantId = await this.resolveTenant(context, input.tenantId);
    const recipientRef = input.recipientRef?.trim();
    const purpose = input.purpose?.trim();
    const channel = this.channel(input.channel);
    if (!recipientRef || !/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(recipientRef)) throw new BadRequestException('recipientRef inválido.');
    if (!purpose || !/^[a-z][a-z0-9_:-]{2,63}$/.test(purpose)) throw new BadRequestException('purpose inválido.');
    if (typeof input.granted !== 'boolean') throw new BadRequestException('granted deve ser booleano.');
    const now = new Date();
    const consent = await this.prisma.notificationConsent.upsert({
      where: { tenantId_recipientRef_channel_purpose: { tenantId, recipientRef, channel, purpose } },
      create: { tenantId, organizationId: context.organizationId, recipientRef, channel, purpose, grantedAt: input.granted ? now : null, revokedAt: input.granted ? null : now },
      update: { grantedAt: input.granted ? now : undefined, revokedAt: input.granted ? null : now }
    });
    await this.prisma.auditLog.create({
      data: { tenantId, organizationId: context.organizationId, actorUserId: context.user.id, action: input.granted ? 'NOTIFICATION_CONSENT_GRANTED' : 'NOTIFICATION_CONSENT_REVOKED', entityType: 'NOTIFICATION_CONSENT', entityId: consent.id }
    });
    return { id: consent.id, tenantId, recipientRef, channel, purpose, granted: input.granted, updatedAt: consent.updatedAt };
  }

  async dispatchPreview(context: AuthenticatedSession, idempotencyKey: string | undefined, input: { tenantId?: string; recipientRef?: string; templateCode?: string; channel?: string }) {
    const tenantId = await this.resolveTenant(context, input.tenantId);
    const key = this.key(idempotencyKey);
    const recipientRef = input.recipientRef?.trim();
    const template = NOTIFICATION_TEMPLATES.find((item) => item.code === input.templateCode);
    const channel = this.channel(input.channel);
    if (!recipientRef || !/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(recipientRef)) throw new BadRequestException('recipientRef inválido.');
    if (!template || !template.channels.includes(channel)) throw new BadRequestException('Template/canal não disponível.');
    const consent = await this.prisma.notificationConsent.findUnique({ where: { tenantId_recipientRef_channel_purpose: { tenantId, recipientRef, channel, purpose: template.purpose } } });
    const status = consent?.grantedAt && !consent.revokedAt ? NotificationDeliveryStatus.QUEUED : NotificationDeliveryStatus.SUPPRESSED;
    const existing = await this.prisma.notificationDelivery.findUnique({ where: { tenantId_channel_idempotencyKey: { tenantId, channel, idempotencyKey: key } } });
    if (existing) return { deliveryId: existing.id, status: existing.status, reused: true, providerDispatch: false };
    const delivery = await this.prisma.notificationDelivery.create({
      data: { tenantId, organizationId: context.organizationId, recipientRef, templateCode: template.code, channel, status, idempotencyKey: key }
    });
    await this.prisma.auditLog.create({
      data: { tenantId, organizationId: context.organizationId, actorUserId: context.user.id, action: 'NOTIFICATION_DISPATCH_PREVIEWED', entityType: 'NOTIFICATION_DELIVERY', entityId: delivery.id, correlationId: key }
    });
    return { deliveryId: delivery.id, status, reused: false, providerDispatch: false, reason: status === 'SUPPRESSED' ? 'Consentimento ausente ou revogado.' : 'Prévia enfileirada; nenhum fornecedor externo foi acionado.' };
  }
}
