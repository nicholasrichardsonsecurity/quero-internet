import { createHash } from 'node:crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type ThrottleRow = {
  subjectHash: string;
  failedAttempts: number;
  windowStartedAt: Date;
  blockedUntil: Date | null;
};

export function loginSubjectHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase(), 'utf8').digest('hex');
}

@Injectable()
export class LoginThrottleService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAllowed(email: string, now = new Date()): Promise<void> {
    const subjectHash = loginSubjectHash(email);
    const rows = await this.prisma.$queryRaw<ThrottleRow[]>`
      SELECT "subjectHash", "failedAttempts", "windowStartedAt", "blockedUntil"
      FROM "AuthLoginThrottle"
      WHERE "subjectHash" = ${subjectHash}
      LIMIT 1
    `;

    const row = rows[0];
    if (row?.blockedUntil && row.blockedUntil > now) {
      throw new HttpException(
        'Muitas tentativas de acesso. Tente novamente mais tarde.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  async registerFailure(email: string, now = new Date()): Promise<void> {
    const subjectHash = loginSubjectHash(email);
    const windowFloor = new Date(now.getTime() - WINDOW_MS);
    const blockedUntil = new Date(now.getTime() + BLOCK_MS);

    await this.prisma.$executeRaw`
      INSERT INTO "AuthLoginThrottle" ("subjectHash", "failedAttempts", "windowStartedAt", "blockedUntil", "updatedAt")
      VALUES (${subjectHash}, 1, ${now}, NULL, ${now})
      ON CONFLICT ("subjectHash") DO UPDATE SET
        "failedAttempts" = CASE
          WHEN "AuthLoginThrottle"."windowStartedAt" < ${windowFloor} THEN 1
          ELSE "AuthLoginThrottle"."failedAttempts" + 1
        END,
        "windowStartedAt" = CASE
          WHEN "AuthLoginThrottle"."windowStartedAt" < ${windowFloor} THEN ${now}
          ELSE "AuthLoginThrottle"."windowStartedAt"
        END,
        "blockedUntil" = CASE
          WHEN (
            CASE
              WHEN "AuthLoginThrottle"."windowStartedAt" < ${windowFloor} THEN 1
              ELSE "AuthLoginThrottle"."failedAttempts" + 1
            END
          ) >= ${MAX_FAILURES} THEN ${blockedUntil}
          ELSE NULL
        END,
        "updatedAt" = ${now}
    `;
  }

  async reset(email: string): Promise<void> {
    const subjectHash = loginSubjectHash(email);
    await this.prisma.$executeRaw`
      DELETE FROM "AuthLoginThrottle" WHERE "subjectHash" = ${subjectHash}
    `;
  }
}
