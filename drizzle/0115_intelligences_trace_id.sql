ALTER TABLE "in_messages" ADD COLUMN IF NOT EXISTS "trace_id" varchar(40) NOT NULL DEFAULT '';
ALTER TABLE "in_outils_journal" ADD COLUMN IF NOT EXISTS "trace_id" varchar(40) NOT NULL DEFAULT '';
