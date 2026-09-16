-- Idempotence de createOrder (server/routers/pieces.ts) : un double clic ou
-- une reprise réseau sur "Commander et payer" ne doit jamais créer deux
-- commandes ni réserver deux fois le même stock. Le client génère une clé
-- une seule fois par tentative de paiement ; toute résubmission avec la
-- même clé renvoie la commande déjà créée. Additif, colonne nullable :
-- aucune commande existante n'est affectée.
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(64);
CREATE UNIQUE INDEX IF NOT EXISTS "parts_orders_idempotency_key_unique" ON "parts_orders" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;
