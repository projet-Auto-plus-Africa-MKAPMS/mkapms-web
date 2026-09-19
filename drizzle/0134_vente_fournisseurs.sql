-- Vente Pro — carnet de fournisseurs propre à chaque compte pro (pièces,
-- pneus, transporteurs, partenaires). Additif pur, aucune donnée existante
-- touchée. Volontairement sans compteur de commandes ni de montant total :
-- aucun système de bons de commande n'existe sur la plateforme pour les
-- alimenter honnêtement (voir server/modules/pro.ts).

CREATE TABLE IF NOT EXISTS "vente_fournisseurs" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "nom" varchar(255) NOT NULL,
  "type" varchar(64),
  "telephone" varchar(32),
  "email" varchar(255),
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
