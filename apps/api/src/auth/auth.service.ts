import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { MembershipRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { resolveOrganizationContext } from './context-policy';
import { verifyPassword } from './password';
import { createSessionToken, extractBearerToken, hashSessionToken } from './session-token';
import { LoginThrottleService } from './login-throttle.service';
import { AuthAuditService } from './auth-audit.service';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

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

export type LoginResult = AuthenticatedSession & {
  token: string;
  expiresAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly throttle: LoginThrottleService,
    private readonly audit: AuthAuditService
  ) {}

  private membershipSnapshot(user: {
    memberships: Array<{
      organizationId: string;
      role: MembershipRole;
      status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
      validFrom: Date | null;
      validUntil: Date | null;
      organization: { tenantLinks: Array<{ tenantId: string }> };
    }>;
  }) {
    return user.memberships.map((membership) => ({
      organizationId: membership.organizationId,
      role: membership.role,
      status: membership.status,
      validFrom: membership.validFrom,
      validUntil: membership.validUntil,
      tenantIds: membership.organization.tenantLinks.map((link) => link.tenantId)
    }));
  }

  async login(email: string, password: string, organizationId?: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    await this.throttle.assertAllowed(normalizedEmail);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          include: {
            organization: { include: { tenantLinks: true } }
          }
        }
      }
    });

    const credentialsValid = Boolean(
      user && user.active && user.passwordHash && (await verifyPassword(password, user.passwordHash))
    );

    if (!credentialsValid || !user) {
      await Promise.allSettled([
        this.throttle.registerFailure(normalizedEmail),
        this.audit.loginFailed(normalizedEmail)
      ]);
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const memberships = this.membershipSnapshot(user);
    const now = new Date();
    let context = organizationId ? resolveOrganizationContext(organizationId, memberships, now) : null;

    if (!context) {
      const candidateOrganizations = Array.from(new Set(memberships.map((membership) => membership.organizationId)));
      for (const candidate of candidateOrganizations) {
        context = resolveOrganizationContext(candidate, memberships, now);
        if (context) break;
      }
    }

    if (!context) {
      await this.audit.loginFailed(normalizedEmail).catch(() => undefined);
      throw new ForbiddenException('Usuário sem vínculo organizacional ativo.');
    }

    const token = createSessionToken();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashSessionToken(token),
        activeOrganizationContextId: context.organizationId,
        expiresAt
      }
    });

    await Promise.allSettled([
      this.throttle.reset(normalizedEmail),
      this.audit.loginSucceeded(user.id, context.organizationId, context.tenantIds[0])
    ]);

    return {
      token,
      expiresAt,
      sessionId: session.id,
      user: { id: user.id, email: user.email, displayName: user.displayName },
      organizationId: context.organizationId,
      tenantIds: context.tenantIds,
      roles: context.roles
    };
  }

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
      session.activeOrganizationContextId,
      this.membershipSnapshot(session.user),
      now
    );

    if (!context) {
      throw new ForbiddenException('A sessão não possui um contexto organizacional ativo e autorizado.');
    }

    return {
      sessionId: session.id,
      user: { id: session.user.id, email: session.user.email, displayName: session.user.displayName },
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

    const context = resolveOrganizationContext(organizationId, this.membershipSnapshot(session.user), now);
    if (!context) throw new ForbiddenException('Organização não autorizada para esta sessão.');

    await this.prisma.session.update({
      where: { id: session.id },
      data: { activeOrganizationContextId: organizationId }
    });

    await this.audit.contextSwitched(session.user.id, context.organizationId, context.tenantIds[0]).catch(() => undefined);

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

    let context: AuthenticatedSession | null = null;
    try {
      context = await this.resolveAuthorization(authorization);
    } catch {
      context = null;
    }

    await this.prisma.session.updateMany({
      where: { tokenHash: hashSessionToken(token), revokedAt: null },
      data: { revokedAt: new Date() }
    });

    if (context) {
      await this.audit.logout(
        context.user.id,
        context.organizationId,
        context.sessionId,
        context.tenantIds[0]
      ).catch(() => undefined);
    }
  }
}
