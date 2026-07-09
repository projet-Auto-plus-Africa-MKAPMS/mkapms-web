-- Smart Engine — Système d'alerte à 4 niveaux (Partie 10)
-- Ajout ADDITIF d'un niveau "important" (🟠) à l'enum de sévérité existant.
-- Les niveaux deviennent : info (🟢 Information), warning (🟡 Attention),
-- important (🟠 Important), critical (🔴 Critique).
-- Aucune valeur existante n'est retirée. Non destructif.

ALTER TYPE "smart_alert_severity" ADD VALUE IF NOT EXISTS 'important';
