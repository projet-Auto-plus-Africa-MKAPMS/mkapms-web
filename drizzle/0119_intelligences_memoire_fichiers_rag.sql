-- LOT IA02F — Mémoire, fichiers, recherche et RAG. Additif uniquement.
CREATE TABLE IF NOT EXISTS "in_memoire_utilisateur" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"categorie" varchar(48) DEFAULT 'preference' NOT NULL,
	"cle" varchar(160) NOT NULL,
	"contenu" text DEFAULT '' NOT NULL,
	"source" varchar(24) DEFAULT 'utilisateur' NOT NULL,
	"confiance" varchar(16) DEFAULT 'haute' NOT NULL,
	"visibilite" varchar(24) DEFAULT 'prive' NOT NULL,
	"retention_jours" integer,
	"actor_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_memoire_utilisateur_user_idx" ON "in_memoire_utilisateur" USING btree ("user_id","categorie");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "in_memoire_utilisateur_user_cle_idx" ON "in_memoire_utilisateur" USING btree ("user_id","cle");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_memoire_projet" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"projet_id" integer NOT NULL,
	"type" varchar(24) NOT NULL,
	"titre" varchar(200) DEFAULT '' NOT NULL,
	"contenu" text DEFAULT '' NOT NULL,
	"statut" varchar(24) DEFAULT 'actif' NOT NULL,
	"actor_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_memoire_projet_projet_idx" ON "in_memoire_projet" USING btree ("projet_id","type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_conversation_resume" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"resume" text DEFAULT '' NOT NULL,
	"faits_importants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"couvert_jusquau_message_id" integer DEFAULT 0 NOT NULL,
	"nb_messages_couverts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "in_conversation_resume_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_fichiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"projet_id" integer,
	"nom" varchar(260) NOT NULL,
	"type_mime" varchar(120) DEFAULT '' NOT NULL,
	"extension" varchar(16) DEFAULT '' NOT NULL,
	"taille_octets" integer DEFAULT 0 NOT NULL,
	"hash_sha256" varchar(64) NOT NULL,
	"donnees" text NOT NULL,
	"contenu_texte" text,
	"langue" varchar(8),
	"nb_pages" integer,
	"statut_pipeline" varchar(24) DEFAULT 'uploaded' NOT NULL,
	"erreur" text DEFAULT '' NOT NULL,
	"visibilite" varchar(24) DEFAULT 'prive' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_fichiers_owner_idx" ON "in_fichiers" USING btree ("owner_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_fichiers_hash_idx" ON "in_fichiers" USING btree ("hash_sha256");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_fichier_morceaux" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"fichier_id" integer NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"contenu" text DEFAULT '' NOT NULL,
	"page" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_fichier_morceaux_fichier_idx" ON "in_fichier_morceaux" USING btree ("fichier_id","ordre");
--> statement-breakpoint
-- Recherche plein texte réelle (PostgreSQL natif) : aucune dépendance externe,
-- aucun moteur d'embeddings requis pour ce lot (voir Embedding Gateway,
-- honnêtement NOT_CONNECTED). Index fonctionnel : pas de colonne generated,
-- rien à maintenir en écriture.
CREATE INDEX IF NOT EXISTS "in_fichier_morceaux_fts_idx" ON "in_fichier_morceaux" USING gin (to_tsvector('french', "contenu"));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_connaissance" (
	"id" serial PRIMARY KEY NOT NULL,
	"categorie" varchar(48) NOT NULL,
	"titre" varchar(220) NOT NULL,
	"contenu" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"version" varchar(24) DEFAULT '1' NOT NULL,
	"auteur" varchar(120) DEFAULT '' NOT NULL,
	"statut" varchar(24) DEFAULT 'propose' NOT NULL,
	"visibilite" varchar(24) DEFAULT 'interne' NOT NULL,
	"validite" varchar(24) DEFAULT 'permanente' NOT NULL,
	"actor_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_connaissance_categorie_idx" ON "in_connaissance" USING btree ("categorie","statut");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_connaissance_fts_idx" ON "in_connaissance" USING gin (to_tsvector('french', "contenu" || ' ' || "titre"));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "in_retrieval_audit" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"projet_id" integer,
	"session_id" integer,
	"source" varchar(24) NOT NULL,
	"requete" text DEFAULT '' NOT NULL,
	"result_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scores" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"permissions_appliquees" text DEFAULT '' NOT NULL,
	"duree_ms" integer DEFAULT 0 NOT NULL,
	"trace_id" varchar(40) DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "in_retrieval_audit_trace_idx" ON "in_retrieval_audit" USING btree ("trace_id");
--> statement-breakpoint
-- Recherche dans les conversations (conversation.search, point 22) : même
-- mécanisme plein texte, posé sur la table existante in_messages sans la
-- modifier (aucune colonne ajoutée, index fonctionnel seulement).
CREATE INDEX IF NOT EXISTS "in_messages_fts_idx" ON "in_messages" USING gin (to_tsvector('french', "contenu"));
