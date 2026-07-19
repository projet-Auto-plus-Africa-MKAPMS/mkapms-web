-- Annonces — colonne garanties (JSONB)
-- Permet au vendeur (professionnel ou officiel MKA.P-MS) de saisir la liste
-- des garanties applicables au véhicule au moment du dépôt de l'annonce.
-- Format : [{ "type": "Constructeur", "duree": "24 mois", "statut": "Active" }, ...]
-- Migration idempotente, purement additive.

ALTER TABLE "annonces"
  ADD COLUMN IF NOT EXISTS "garanties" jsonb DEFAULT '[]'::jsonb;
