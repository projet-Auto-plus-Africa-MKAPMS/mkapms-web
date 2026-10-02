-- Postes supplémentaires attribuables par le PDG : sous-directeur, comptable,
-- investisseur, partenaire. Valeurs d'énumération additives : aucun compte
-- existant n'est modifié, aucun droit n'est accordé (le droit vient du rôle).
ALTER TYPE "staff_position" ADD VALUE IF NOT EXISTS 'sous_directeur';
ALTER TYPE "staff_position" ADD VALUE IF NOT EXISTS 'comptable';
ALTER TYPE "staff_position" ADD VALUE IF NOT EXISTS 'investisseur';
ALTER TYPE "staff_position" ADD VALUE IF NOT EXISTS 'partenaire';
