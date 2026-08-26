-- Fail closed if any existing session points to an unknown organization.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Session" s
    LEFT JOIN "Organization" o ON o."id" = s."activeOrganizationContextId"
    WHERE s."activeOrganizationContextId" IS NOT NULL
      AND o."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add Session organization FK: orphaned activeOrganizationContextId found';
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "Session_activeOrganizationContextId_idx"
  ON "Session"("activeOrganizationContextId");

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_activeOrganizationContextId_fkey"
  FOREIGN KEY ("activeOrganizationContextId")
  REFERENCES "Organization"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- Audit records are append-only at database level. Any parent deletion that
-- would try to rewrite an AuditLog through ON DELETE SET NULL is also blocked,
-- preserving evidentiary integrity until an explicit archival policy exists.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only: % is not allowed', TG_OP
    USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditLog_append_only"
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();

-- Hard account lockout by e-mail is removed because it can be weaponized as
-- denial of service against a known account. Failure history remains and is
-- used for progressive server-side delay instead.
DROP INDEX IF EXISTS "AuthLoginThrottle_blockedUntil_idx";
ALTER TABLE "AuthLoginThrottle" DROP COLUMN IF EXISTS "blockedUntil";
