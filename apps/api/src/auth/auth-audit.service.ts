import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { loginSubjectHash } from './login-throttle.service';

@Injectable()
export class AuthAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async loginSucceeded(userId: string, organizationId: string, tenantId?: string): Promise<void> {
    await this.prisma.auditLog.create({ data: {
      actorUserId: userId,
      organizationId,
      tenantId: tenantId ?? null,
      action: 'AUTH_LOGIN_SUCCEEDED',
      entityType: 'SESSION'
    }});
  }

  async loginFailed(email: string): Promise<void> {
    await this.prisma.auditLog.create({ data: {
      action: 'AUTH_LOGIN_FAILED',
      entityType: 'LOGIN_SUBJECT',
      entityId: loginSubjectHash(email)
    }});
  }

  async contextSwitched(userId: string, organizationId: string, tenantId?: string): Promise<void> {
    await this.prisma.auditLog.create({ data: {
      actorUserId: userId,
      organizationId,
      tenantId: tenantId ?? null,
      action: 'AUTH_CONTEXT_SWITCHED',
      entityType: 'ORGANIZATION',
      entityId: organizationId
    }});
  }

  async logout(userId: string, organizationId: string, sessionId: string, tenantId?: string): Promise<void> {
    await this.prisma.auditLog.create({ data: {
      actorUserId: userId,
      organizationId,
      tenantId: tenantId ?? null,
      action: 'AUTH_LOGOUT',
      entityType: 'SESSION',
      entityId: sessionId
    }});
  }
}
