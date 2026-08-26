import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const WINDOW_MS = 15 * 60 * 1000;
const DELAY_START_AFTER = 3;
const BASE_DELAY_MS = 300;
const MAX_DELAY_MS = 2_000;

type ThrottleRow = {
  subjectHash: string;
  failedAttempts: number;
  windowStartedAt: Date;
};

export function loginSubjectHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase(), 'utf8').digest('hex');
}

export function calculateLoginDelayMs(failedAttempts: number): number {
  if (failedAttempts < DELAY_START_AFTER) return 0;
  const exponent = Math.max(0, failedAttempts - DELAY_START_AFTER);
  return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** exponent);
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class LoginThrottleService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAllowed(email: string, now = new Date()): Promise<void> {
    const subjectHash = loginSubjectHash(email);
    const rows = await this.prisma.$queryRaw<ThrottleRow[]>`
      SELECT "subjectHash", "failedAttempts", "windowStartedAt"
      FROM "AuthLoginThrottle"
      WHERE "subjectHash" = ${subjectHash}
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) return;

    const windowFloor = new Date(now.getTime() - WINDOW_MS);
    if (row.windowStartedAt < windowFloor) return;

    // Delays repeated attempts but never hard-locks an account solely by its
    // public identifier. Network/origin rate limiting remains an infrastructure
    // control and must not trust client-supplied forwarding headers blindly.
    await sleep(calculateLoginDelayMs(row.failedAttempts));
  }

  async registerFailure(email: string, now = new Date()): Promise<void> {
    const subjectHash = loginSubjectHash(email);
    const windowFloor = new Date(now.getTime() - WINDOW_MS);

    await this.prisma.$executeRaw`
      INSERT INTO "AuthLoginThrottle" ("subjectHash", "failedAttempts", "windowStartedAt", "updatedAt")
      VALUES (${subjectHash}, 1, ${now}, ${now})
      ON CONFLICT ("subjectHash") DO UPDATE SET
        "failedAttempts" = CASE
          WHEN "AuthLoginThrottle"."windowStartedAt" < ${windowFloor} THEN 1
          ELSE "AuthLoginThrottle"."failedAttempts" + 1
        END,
        "windowStartedAt" = CASE
          WHEN "AuthLoginThrottle"."windowStartedAt" < ${windowFloor} THEN ${now}
          ELSE "AuthLoginThrottle"."windowStartedAt"
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
