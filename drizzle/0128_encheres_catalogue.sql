-- Reconnexion du catalogue Enchères (/acheter/encheres) au vrai Auction
-- Engine. Audit préalable : la page VenteEncheres.tsx n'appelait aucune
-- procédure serveur et affichait des lots entièrement fabriqués (catégories
-- reprise/stock/flotte..., restrictions acheteurs, état par sous-système,
-- galeries de photos catégorisées) — un vrai backend d'enchères existe déjà
-- (server/auction-engine/) mais ne portait pas ces champs. 100 % additif :
-- aucune ligne existante modifiée, `auctions` déjà en production (utilisée
-- par /encheres/live) n'est pas recréée.
ALTER TABLE "auctions"
  ADD COLUMN IF NOT EXISTS "category" varchar(24),
  ADD COLUMN IF NOT EXISTS "lot_details" jsonb DEFAULT '{}'::jsonb NOT NULL;
CREATE INDEX IF NOT EXISTS "auctions_category_idx" ON "auctions" ("category","published");
