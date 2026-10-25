-- Complète l'enum Postgres "annonce_categorie" avec les valeurs que le
-- dépôt d'annonce (Vendre.tsx, CATEGORIES_AUTO / CATEGORIES_MOTO) peut
-- réellement produire via `.toLowerCase()` — sans ça, choisir une catégorie
-- absente ici (ex. "SUV / Crossover") fait échouer la création de l'annonce
-- au niveau base, alors qu'elle était bien proposée dans le formulaire.
-- ADD VALUE IF NOT EXISTS est purement additif : aucune valeur existante
-- n'est retirée ni renommée, aucune ligne existante n'est affectée.
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'suv / crossover';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'coupé';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'ludospace';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'pick-up';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'fourgon';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'minibus';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'camping-car';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS '4x4';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'limousine';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'luxe / prestige';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'scooter 125';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'scooter 3 roues';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'roadster / naked';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'sportive';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'trail / adventure';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'custom / cruiser';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'touring / gt';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'enduro';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'supermotard';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'café racer';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'scrambler';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'trike';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'électrique';
