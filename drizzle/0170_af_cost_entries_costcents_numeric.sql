-- Mission "Finalisation et déploiement AL-HOUDOUD·M" — le coût réel d'un appel IA (ex. quelques centaines de
-- jetons) est presque toujours une fraction de centime : un entier arrondissait chaque mesure réelle à zéro,
-- rendant tout calcul de coût réel impossible. Passage en numeric(14,6), idempotent et réversible.
ALTER TABLE af_cost_entries ALTER COLUMN cost_cents TYPE numeric(14, 6) USING cost_cents::numeric(14, 6);
--> statement-breakpoint
ALTER TABLE af_cost_entries ALTER COLUMN cost_cents SET DEFAULT 0;
