-- Global Visibility Engine — Intentions (table `visibility_intents`).
-- Modèle à 3 niveaux : mot-clé → question → intention. Alimente SEO, recherche,
-- suggestions, contenus sociaux, visibilité IA/GEO et ciblage d'audience.
-- `trend_score` dérivé des signaux réels (recherches enregistrées). Additif.

CREATE TABLE IF NOT EXISTS "visibility_intents" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"intent_key" varchar(200) NOT NULL,
	"keyword" varchar(160) NOT NULL,
	"question" varchar(300),
	"intention" varchar(200) NOT NULL,
	"topic" varchar(48) NOT NULL,
	"lang" varchar(8) DEFAULT 'fr' NOT NULL,
	"country" varchar(2),
	"trend_score" integer DEFAULT 0 NOT NULL,
	"source" varchar(24) DEFAULT 'base' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "visibility_intents_intent_key_unique" UNIQUE("intent_key")
);

CREATE INDEX IF NOT EXISTS "visibility_intents_topic_idx" ON "visibility_intents" ("topic","country");
CREATE INDEX IF NOT EXISTS "visibility_intents_trend_idx" ON "visibility_intents" ("trend_score");
