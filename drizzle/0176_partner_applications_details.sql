-- Candidature « Devenir partenaire/investisseur » : détails propres au métier
-- candidat (montant envisagé, univers d'intérêt, etc. pour un investisseur),
-- sans ajouter de colonnes spécifiques à un seul métier sur une table partagée
-- par tous les métiers du portail Pro.
ALTER TABLE "partner_applications" ADD COLUMN IF NOT EXISTS "details" jsonb DEFAULT NULL;
