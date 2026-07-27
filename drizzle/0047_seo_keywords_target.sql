-- SEO OS — Phase 2 : association mots-clé → page cible.
-- Idempotent et sûr sur base existante.
ALTER TABLE "seo_keywords" ADD COLUMN IF NOT EXISTS "target_path" varchar(512);
