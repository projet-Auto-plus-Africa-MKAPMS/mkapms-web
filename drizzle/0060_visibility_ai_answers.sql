-- Global Visibility Engine — Visibilité IA / GEO (table `visibility_ai_answers`).
-- Base de connaissances question/réponse structurée, brand-neutral, publiée
-- publiquement (feed /assistants-ia.txt) pour être découvrable par les moteurs
-- de recherche et assistants IA. Table isolée et additive.

CREATE TABLE IF NOT EXISTS "visibility_ai_answers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"answer_key" varchar(180) NOT NULL,
	"topic" varchar(48) NOT NULL,
	"question" varchar(300) NOT NULL,
	"answer" varchar(2000) NOT NULL,
	"lang" varchar(8) DEFAULT 'fr' NOT NULL,
	"country" varchar(2),
	"link" varchar(1000),
	"source_type" varchar(48),
	"source_id" varchar(64),
	"status" varchar(24) DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "visibility_ai_answers_answer_key_unique" UNIQUE("answer_key")
);

CREATE INDEX IF NOT EXISTS "visibility_ai_answers_topic_idx" ON "visibility_ai_answers" ("topic","country");
CREATE INDEX IF NOT EXISTS "visibility_ai_answers_status_idx" ON "visibility_ai_answers" ("status");
