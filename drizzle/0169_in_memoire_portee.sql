-- Mission 2.2 (29/10) — isolation de la mémoire fédérée (in_memoire).
-- Ajoute une portée explicite, jamais promue automatiquement : toute ligne
-- existante ou nouvelle reste "pdg_prive" par défaut (le propriétaire est la
-- colonne actor_id déjà présente — pas de nouvelle colonne de propriété,
-- actor_id capture déjà qui a écrit chaque ligne). Seule une promotion
-- explicite, réservée au PDG, peut marquer une ligne "entreprise_partagee".
ALTER TABLE "in_memoire"
  ADD COLUMN IF NOT EXISTS "portee" varchar(24) NOT NULL DEFAULT 'pdg_prive';
