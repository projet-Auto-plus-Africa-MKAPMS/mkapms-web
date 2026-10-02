-- Missions : une reprise garde le lien vers la mission qu'elle poursuit.
ALTER TABLE "in_missions" ADD COLUMN IF NOT EXISTS "reprise_de" integer;
--> statement-breakpoint
-- Une mission n'a qu'une seule reprise : une requête concurrente ne peut pas la reprendre une seconde fois.
CREATE UNIQUE INDEX IF NOT EXISTS "in_missions_reprise_unique" ON "in_missions" ("reprise_de") WHERE "reprise_de" IS NOT NULL;
--> statement-breakpoint
-- Expériences : « tentatives » compte chaque essai ; « occurrences » ne compte plus que les épisodes distincts
-- (résultat ou blocage différents). L'historique n'est pas perdu : l'ancien compteur devient « tentatives ».
ALTER TABLE "in_experiences" ADD COLUMN IF NOT EXISTS "tentatives" integer NOT NULL DEFAULT 1;
--> statement-breakpoint
UPDATE "in_experiences" SET "tentatives" = "occurrences" WHERE "tentatives" = 1 AND "occurrences" > 1;
--> statement-breakpoint
-- Leçons du relevé de code : chaque ligne est UN événement source (classe + source + référence uniques). L'ancien compteur
-- augmentait à chaque relecture du même événement ; il est conservé sous « releves », et « occurrences » repart de la réalité.
ALTER TABLE "cg_lessons" ADD COLUMN IF NOT EXISTS "releves" integer NOT NULL DEFAULT 1;
--> statement-breakpoint
UPDATE "cg_lessons" SET "releves" = "occurrences", "occurrences" = 1 WHERE "releves" = 1 AND "occurrences" > 1;
