import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import type { MembershipRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { extractBearerToken, hashSessionToken } from './session-token';
import { resolveOrganizationContext } from './context-policy';

export type AuthenticatedSession = {
  sessionId: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  organizationId: string;
  tenantIds: string[];
  roles: MembershipRole[];
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAuthorization(authorization?: string): Promise<AuthenticatedSession> {
    const token = extractBearerToken(authorization);
    if (!token) throw new UnauthorizedException('Sessão ausente ou inválida.');

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                organization: {
                  include: { tenantLinks: true }
                }
              }
            }
          }
        }
      }
    });

    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now || !session.user.active) {
      throw new UnauthorizedException('Sessão expirada, revogada ou inválida.');
    }

    const context = resolveOrganizationContext(
      session.activeOrganizationContextId,
      session.user.memberships.map((membership) => ({
        organizationId: membership.organizationId,
        role: membership.role,
        status: membership.status,
        validFrom: membership.validFrom,
        validUntil: membership.validUntil,
        tenantIds: membership.organization.tenantLinks.map((link) => link.tenantId)
      })),
      now
    );

    if (!context) {
      throw new ForbiddenException('A sessão não possui um contexto organizacional ativo e autorizado.');
    }

    return {
      sessionId: session.id,
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName
      },
      organizationId: context.organizationId,
      tenantIds: context.tenantIds,
      roles: context.roles
    };
  }

  async switchOrganization(authorization: string | undefined, organizationId: string): Promise<AuthenticatedSession> {
    const token = extractBearerToken(authorization);
    if (!token) throw new UnauthorizedException('Sessão ausente ou inválida.');

    const tokenHash = hashSessionToken(token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                organization: { include: { tenantLinks: true } }
              }
            }
          }
        }
      }
    });

    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now || !session.user.active) {
      throw new UnauthorizedException('Sessão expirada, revogada ou inválida.');
    }

    const context = resolveOrganizationContext(
      organizationId,
      session.user.memberships.map((membership) => ({
        organizationId: membership.organizationId,
        role: membership.role,
        status: membership.status,
        validFrom: membership.validFrom,
        validUntil: membership.validUntil,
        tenantIds: membership.organization.tenantLinks.map((link) => link.tenantId)
      })),
      now
    );

    if (!context) throw new ForbiddenException('Organização não autorizada para esta sessão.');

    await this.prisma.session.update({
      where: { id: session.id },
      data: { activeOrganizationContextId: organizationId }
    });

    return {
      sessionId: session.id,
      user: { id: session.user.id, email: session.user.email, displayName: session.user.displayName },
      organizationId: context.organizationId,
      tenantIds: context.tenantIds,
      roles: context.roles
    };
  }

  async logout(authorization?: string): Promise<void> {
    const token = extractBearerToken(authorization);
    if (!token) return;

    await this.prisma.session.updateMany({
      where: { tokenHash: hashSessionToken(token), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}
