-- Migration 0045 : Ajout des catégories engins & machines
-- Étend les enums annonce_categorie et annonce_famille pour supporter les engins

-- Ajout des nouvelles valeurs à l'enum annonce_categorie
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'engin';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'machine';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'tracteur';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'pelleteuse';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'grue';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'chariot';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'nacelle';
ALTER TYPE "annonce_categorie" ADD VALUE IF NOT EXISTS 'compacteur';

-- Ajout de la famille engin
ALTER TYPE "annonce_famille" ADD VALUE IF NOT EXISTS 'engin';
