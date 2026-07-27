-- Phase 44 — Document OS : traçabilité complète (auteur, version, QR, signature, historique)
ALTER TABLE "doc_documents" ADD COLUMN IF NOT EXISTS "author_user_id" integer;
ALTER TABLE "doc_documents" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;
ALTER TABLE "doc_documents" ADD COLUMN IF NOT EXISTS "qr_payload" text;
ALTER TABLE "doc_documents" ADD COLUMN IF NOT EXISTS "signature_name" varchar(160);
ALTER TABLE "doc_documents" ADD COLUMN IF NOT EXISTS "signature_data" text;

CREATE TABLE IF NOT EXISTS "doc_document_history" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "document_id" integer NOT NULL,
  "version" integer NOT NULL,
  "action" varchar(32) NOT NULL,
  "actor_user_id" integer,
  "snapshot" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "doc_document_history_document_idx"
ON "doc_document_history" ("document_id");
