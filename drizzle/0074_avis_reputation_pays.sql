-- Points 46-48 — Reviews & Reputation Engine.
-- Ajout purement additif : le pays de l'expérience, indispensable pour une
-- réputation par pays activé. `ip_country` ne peut pas servir à cela (il décrit
-- d'où le client consulte, pas où la prestation a eu lieu).
--
-- Les tables `reviews_v2` / `review_requests` sont créées par 0107 (avec ces
-- colonnes et index inclus). Sur une base neuve elles n'existent pas encore à
-- ce stade : les ALTER sont conditionnels pour ne pas faire échouer — et donc
-- annuler — toute la série de migrations.

DO $$
BEGIN
  IF to_regclass('reviews_v2') IS NOT NULL THEN
    ALTER TABLE "reviews_v2" ADD COLUMN IF NOT EXISTS "country_code" varchar(4);
    CREATE INDEX IF NOT EXISTS "reviews_v2_country_idx"
      ON "reviews_v2" ("country_code", "univers", "status");
  END IF;

  IF to_regclass('review_requests') IS NOT NULL THEN
    ALTER TABLE "review_requests" ADD COLUMN IF NOT EXISTS "country_code" varchar(4);
    -- Une transaction ne peut engendrer qu'une seule demande d'avis : sans cette
    -- contrainte, un professionnel qui repasse un dossier en « terminé »
    -- relancerait le client à chaque fois.
    CREATE UNIQUE INDEX IF NOT EXISTS "review_requests_txn_unique"
      ON "review_requests" ("user_id", "transaction_type", "transaction_id");
  END IF;
END $$;
