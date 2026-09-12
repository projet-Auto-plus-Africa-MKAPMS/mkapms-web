-- LOT IA02A — séparation motif technique interne / motif public générique.
ALTER TABLE "in_messages" ADD COLUMN IF NOT EXISTS "motif_public" text NOT NULL DEFAULT '';
