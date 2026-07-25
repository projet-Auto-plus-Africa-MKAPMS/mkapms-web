-- Verrouillage des décisions PDG sur les développements détectés.
-- Une fois qu'une permission/statut est tranché par le PDG, le rescan ne doit
-- plus réécraser sa décision (sinon « à définir » réapparaît indéfiniment).
ALTER TABLE "smart_dev_registry" ADD COLUMN IF NOT EXISTS "review_locked" boolean DEFAULT false;
