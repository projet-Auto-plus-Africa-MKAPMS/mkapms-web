-- Points 60-63, 83, 87 — MKA.P-MS Automotive Knowledge Engine.
-- Migration additive : aucune table existante n'est modifiée.

CREATE TABLE IF NOT EXISTS "ake_sources" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "code" varchar(64) NOT NULL,
  "label" varchar(160) NOT NULL,
  "kind" varchar(32) NOT NULL,
  "country_code" varchar(4),
  "authorization" varchar(24) DEFAULT 'a_verifier' NOT NULL,
  "authorization_ref" text,
  "api_endpoint" text,
  "rate_limit" varchar(120),
  "reliability" integer,
  "status" varchar(20) DEFAULT 'non_configure' NOT NULL,
  "last_sync_at" timestamp,
  "last_sync_detail" text,
  "ever_synced" boolean DEFAULT false NOT NULL,
  "declared_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ake_sources_code_unique" UNIQUE ("code")
);

CREATE TABLE IF NOT EXISTS "ake_nodes" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "domain" varchar(40) NOT NULL,
  "kind" varchar(40) NOT NULL,
  "label" varchar(240) NOT NULL,
  "signature" varchar(400) NOT NULL,
  "summary" text,
  "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "country_code" varchar(4),
  "data_class" varchar(20) DEFAULT 'publique' NOT NULL,
  "observations" integer DEFAULT 1 NOT NULL,
  "status" varchar(16) DEFAULT 'propose' NOT NULL,
  "learned_by_engine" varchar(48),
  "last_verified_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ake_nodes_signature_unique" UNIQUE ("signature")
);

CREATE INDEX IF NOT EXISTS "ake_nodes_domain_idx" ON "ake_nodes" ("domain", "status");
CREATE INDEX IF NOT EXISTS "ake_nodes_country_idx" ON "ake_nodes" ("country_code");

CREATE TABLE IF NOT EXISTS "ake_edges" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "from_node_id" integer NOT NULL,
  "to_node_id" integer NOT NULL,
  "relation" varchar(32) NOT NULL,
  "signature" varchar(400) NOT NULL,
  "origin" varchar(32) DEFAULT 'manuel' NOT NULL,
  "confidence" integer,
  "attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ake_edges_signature_unique" UNIQUE ("signature")
);

CREATE INDEX IF NOT EXISTS "ake_edges_from_idx" ON "ake_edges" ("from_node_id", "relation");
CREATE INDEX IF NOT EXISTS "ake_edges_to_idx" ON "ake_edges" ("to_node_id", "relation");

CREATE TABLE IF NOT EXISTS "ake_provenance" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "node_id" integer NOT NULL,
  "source_code" varchar(64) NOT NULL,
  "source_ref" text,
  "license" varchar(24) DEFAULT 'inconnue' NOT NULL,
  "license_ref" text,
  "country_code" varchar(4),
  "reliability" integer,
  "observed_at" timestamp DEFAULT now() NOT NULL,
  "last_checked_at" timestamp,
  "learned_by_engine" varchar(48),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ake_provenance_node_idx" ON "ake_provenance" ("node_id", "observed_at");

CREATE TABLE IF NOT EXISTS "ake_discoveries" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "title" varchar(240) NOT NULL,
  "domain" varchar(40) NOT NULL,
  "detail" text,
  "interest" text,
  "related_service" varchar(64),
  "country_code" varchar(4),
  "source_code" varchar(64),
  "source_ref" text,
  "classification" varchar(16) DEFAULT 'information' NOT NULL,
  "evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "node_id" integer,
  "signature" varchar(400) NOT NULL,
  "decision" varchar(16) DEFAULT 'attente' NOT NULL,
  "decision_note" text,
  "decided_by" integer,
  "decided_at" timestamp,
  "action_task_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ake_discoveries_signature_unique" UNIQUE ("signature")
);

CREATE INDEX IF NOT EXISTS "ake_discoveries_decision_idx"
  ON "ake_discoveries" ("decision", "classification", "updated_at");
