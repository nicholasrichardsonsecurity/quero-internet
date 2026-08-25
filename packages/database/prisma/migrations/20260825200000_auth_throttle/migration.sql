CREATE TABLE "AuthLoginThrottle" (
  "subjectHash" TEXT NOT NULL,
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blockedUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthLoginThrottle_pkey" PRIMARY KEY ("subjectHash")
);

CREATE INDEX "AuthLoginThrottle_blockedUntil_idx" ON "AuthLoginThrottle"("blockedUntil");
