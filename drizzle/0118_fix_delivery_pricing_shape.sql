-- LOT IA02E — corrige un vrai bug de migration trouvé par les tests de ce
-- chantier : la migration 0011_boutique_tracking.sql a tenté un
-- "CREATE TABLE IF NOT EXISTS delivery_pricing" avec des colonnes
-- (vehicle_type, prix_base, prix_par_km, …) alors que la table existait déjà
-- depuis 0001_awesome_nebula.sql avec d'autres colonnes (type, base_fee,
-- per_km, …) : le IF NOT EXISTS a silencieusement annulé 0011. La table
-- réelle n'a donc jamais eu les colonnes que server/schema.ts déclare depuis
-- lors — server/routers/livraison.ts::quote et ::payMission interrogeaient
-- une colonne inexistante ("vehicle_type") et échouaient réellement.
--
-- Additif, jamais destructif : les anciennes colonnes restent (au cas où un
-- autre environnement s'y appuie encore) ; les nouvelles sont ajoutées et
-- rétro-remplies depuis les anciennes quand une ligne existe déjà.
ALTER TABLE "delivery_pricing" ADD COLUMN IF NOT EXISTS "vehicle_type" varchar(32);--> statement-breakpoint
ALTER TABLE "delivery_pricing" ADD COLUMN IF NOT EXISTS "label" varchar(64);--> statement-breakpoint
ALTER TABLE "delivery_pricing" ADD COLUMN IF NOT EXISTS "poids_max_kg" numeric(8,2);--> statement-breakpoint
ALTER TABLE "delivery_pricing" ADD COLUMN IF NOT EXISTS "dimension_max_cm" numeric(8,2);--> statement-breakpoint
ALTER TABLE "delivery_pricing" ADD COLUMN IF NOT EXISTS "prix_base" numeric(10,2);--> statement-breakpoint
ALTER TABLE "delivery_pricing" ADD COLUMN IF NOT EXISTS "prix_par_km" numeric(6,2) DEFAULT '0.50';--> statement-breakpoint
ALTER TABLE "delivery_pricing" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();--> statement-breakpoint

UPDATE "delivery_pricing" SET
  "vehicle_type" = COALESCE("vehicle_type", "type"::text),
  "label" = COALESCE("label", "type"::text),
  "poids_max_kg" = COALESCE("poids_max_kg", 0),
  "dimension_max_cm" = COALESCE("dimension_max_cm", 0),
  "prix_base" = COALESCE("prix_base", "base_fee"),
  "prix_par_km" = COALESCE("prix_par_km", "per_km")
WHERE "vehicle_type" IS NULL OR "prix_base" IS NULL;--> statement-breakpoint

ALTER TABLE "delivery_pricing" ALTER COLUMN "vehicle_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_pricing" ALTER COLUMN "label" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_pricing" ALTER COLUMN "poids_max_kg" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_pricing" ALTER COLUMN "dimension_max_cm" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_pricing" ALTER COLUMN "prix_base" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_pricing" ALTER COLUMN "prix_par_km" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_pricing" ALTER COLUMN "created_at" SET NOT NULL;
