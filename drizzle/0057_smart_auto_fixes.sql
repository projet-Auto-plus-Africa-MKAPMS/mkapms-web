-- Mémoire d'auto-réparation du Système Intelligent (Smart Engine).
-- Quand une correction sûre est appliquée (manuellement via « Résolu » ou
-- automatiquement pendant un scan), on mémorise ICI la recette : type de
-- problème + clé + action + paramètres. Les scans suivants rejouent ces
-- recettes pour résoudre SEUL les mêmes défauts, sans intervention humaine.
-- Table isolée et additive : ne remplace aucune mémoire existante.
CREATE TABLE IF NOT EXISTS "smart_auto_fixes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"problem_type" varchar(48) NOT NULL,
	"match_key" varchar(255) NOT NULL,
	"action" varchar(48) NOT NULL,
	"params" jsonb,
	"confidence" integer DEFAULT 100 NOT NULL,
	"auto_apply" boolean DEFAULT true NOT NULL,
	"times_applied" integer DEFAULT 0 NOT NULL,
	"last_applied_at" timestamp,
	"learned_from" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "smart_auto_fixes_uniq" UNIQUE("problem_type","match_key")
);
