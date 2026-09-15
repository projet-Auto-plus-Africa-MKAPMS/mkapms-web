-- Corrige une dérive schéma/migration antérieure au LOT 3 : la migration
-- 0001 créait déjà "parts_stock" (forme étroite : catalog_id/quantite/
-- seuil_alerte/emplacement). La migration 0011 tentait de la recréer avec la
-- forme enrichie (site_id/quantite_reservee/seuil_min/entrepot/rayon/etagere,
-- alignée sur server/schema.ts) via CREATE TABLE IF NOT EXISTS — sans effet
-- puisque la table existait déjà. server/routers/pieces.ts écrit depuis
-- longtemps sur ces colonnes (`quantiteReservee` notamment, réservation/
-- décrément de stock) sans qu'elles n'aient jamais existé en base — resté
-- silencieux car parts_catalog/parts_stock sont vides depuis le début.
-- Détecté en construisant le Parts Engine (LOT 3) dessus. Additif, table vide
-- à ce jour : aucun risque de perte de donnée.
ALTER TABLE "parts_stock" ADD COLUMN IF NOT EXISTS "site_id" integer;
ALTER TABLE "parts_stock" ADD COLUMN IF NOT EXISTS "quantite_reservee" integer DEFAULT 0 NOT NULL;
ALTER TABLE "parts_stock" ADD COLUMN IF NOT EXISTS "seuil_min" integer DEFAULT 2 NOT NULL;
ALTER TABLE "parts_stock" ADD COLUMN IF NOT EXISTS "entrepot" varchar(128);
ALTER TABLE "parts_stock" ADD COLUMN IF NOT EXISTS "rayon" varchar(64);
ALTER TABLE "parts_stock" ADD COLUMN IF NOT EXISTS "etagere" varchar(64);
