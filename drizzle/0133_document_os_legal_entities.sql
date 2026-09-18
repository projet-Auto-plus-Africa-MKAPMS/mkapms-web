-- Document OS — Registre des entités juridiques (règle maître documentaire
-- #1/#2/#4/#5/#6, additif pur). MKA.P-MS est une identité internationale
-- d'origine guinéenne : "guinee" est l'entité mère (is_origin_entity), la
-- France une entité locale d'exploitation comme les autres. Les champs
-- légaux de Guinée restent NULL tant que la direction n'a pas fourni le
-- document officiel de création — jamais une valeur inventée.

CREATE TABLE IF NOT EXISTS "doc_legal_entities" (
  "code" varchar(32) PRIMARY KEY,
  "country_code" varchar(2) NOT NULL,
  "is_origin_entity" boolean NOT NULL DEFAULT false,
  "legal_name" varchar(200),
  "registration_number" varchar(64),
  "tax_id" varchar(64),
  "address" text,
  "legal_representative" varchar(160),
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "doc_documents" ADD COLUMN IF NOT EXISTS "legal_entity_code" varchar(32);
