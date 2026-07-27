-- SEO OS — base de mots-clés : clé unique pour un seed idempotent.
-- Idempotent et sûr sur base existante (table seo_keywords créée en 0041).
CREATE UNIQUE INDEX IF NOT EXISTS "seo_keywords_univers_keyword_lang_country_uniq"
  ON "seo_keywords" ("univers", "keyword", "language", "country");
