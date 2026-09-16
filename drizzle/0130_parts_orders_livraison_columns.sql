-- Même dérive schéma/migration que 0124_parts_stock_columns_fix.sql, cette
-- fois sur "parts_orders" : server/schema.ts déclare livraison_type et
-- livraison_tarif depuis longtemps, mais aucune migration ne les avait
-- jamais créées en base. server/routers/pieces.ts::createOrder les
-- référence dans son INSERT depuis l'origine — la création de commande
-- pièces échouait donc à 100% ("column livraison_type does not exist"),
-- jamais détecté car parts_orders n'avait jamais été exercée par un test
-- réel avant ce lot. Additif, table vide à ce jour : aucun risque de perte
-- de donnée.
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "livraison_type" varchar(32);
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "livraison_tarif" numeric(10, 2);
