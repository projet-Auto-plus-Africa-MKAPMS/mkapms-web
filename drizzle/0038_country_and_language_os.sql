-- Country OS + Language OS — Fondations (règle MOS #15, additive pure)
-- Consolide shared/currency.ts en tables interrogeables + i18n complet.

-- ═══════════════════════════════════════════════════════════════════════
-- COUNTRY OS — Registre mondial des pays
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "country_countries" (
  "code" varchar(2) PRIMARY KEY,        -- ISO 3166-1 alpha-2
  "code3" varchar(3),                    -- ISO alpha-3
  "name_fr" varchar(120) NOT NULL,
  "name_en" varchar(120),
  "default_language" varchar(8) NOT NULL DEFAULT 'fr',
  "available_languages" jsonb NOT NULL DEFAULT '["fr"]'::jsonb,
  "default_currency" varchar(4) NOT NULL,
  "tva_rate" numeric(5,2) NOT NULL DEFAULT 0,
  "phone_prefix" varchar(6),
  "timezone" varchar(48) NOT NULL DEFAULT 'UTC',
  "address_format" jsonb DEFAULT '{}'::jsonb,
  "payment_methods" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "required_docs" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "universes_enabled" jsonb NOT NULL DEFAULT '["auto"]'::jsonb,
  "regulations" jsonb DEFAULT '{}'::jsonb,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "country_active_idx" ON "country_countries" ("active");

-- Seed initial — 20 pays clés (Europe + Afrique francophone + Maghreb + Amérique + Golfe).
-- Chaque INSERT est idempotent (ON CONFLICT DO NOTHING).
INSERT INTO "country_countries" ("code","code3","name_fr","name_en","default_language","available_languages","default_currency","tva_rate","phone_prefix","timezone","payment_methods","universes_enabled") VALUES
  ('FR','FRA','France','France','fr','["fr","en"]','EUR',20.00,'+33','Europe/Paris','["card","sepa","stripe","paypal"]','["auto","moto","location","immo"]'),
  ('BE','BEL','Belgique','Belgium','fr','["fr","nl","en"]','EUR',21.00,'+32','Europe/Brussels','["card","sepa","stripe"]','["auto","moto","location"]'),
  ('LU','LUX','Luxembourg','Luxembourg','fr','["fr","de","en"]','EUR',17.00,'+352','Europe/Luxembourg','["card","sepa","stripe"]','["auto","moto"]'),
  ('CH','CHE','Suisse','Switzerland','fr','["fr","de","it","en"]','EUR',7.70,'+41','Europe/Zurich','["card","stripe"]','["auto","moto"]'),
  ('DE','DEU','Allemagne','Germany','fr','["de","en","fr"]','EUR',19.00,'+49','Europe/Berlin','["card","sepa","stripe"]','["auto","moto"]'),
  ('ES','ESP','Espagne','Spain','fr','["es","en","fr"]','EUR',21.00,'+34','Europe/Madrid','["card","sepa","stripe"]','["auto","moto"]'),
  ('IT','ITA','Italie','Italy','fr','["it","en","fr"]','EUR',22.00,'+39','Europe/Rome','["card","sepa","stripe"]','["auto","moto"]'),
  ('PT','PRT','Portugal','Portugal','fr','["pt","en","fr"]','EUR',23.00,'+351','Europe/Lisbon','["card","sepa","stripe"]','["auto","moto"]'),
  ('GB','GBR','Royaume-Uni','United Kingdom','fr','["en","fr"]','GBP',20.00,'+44','Europe/London','["card","stripe"]','["auto","moto"]'),
  ('CA','CAN','Canada','Canada','fr','["fr","en"]','CAD',15.00,'+1','America/Montreal','["card","stripe"]','["auto","moto"]'),
  ('US','USA','États-Unis','United States','fr','["en","fr"]','USD',0.00,'+1','America/New_York','["card","stripe"]','["auto","moto"]'),
  ('CI','CIV','Côte d''Ivoire','Ivory Coast','fr','["fr"]','XOF',18.00,'+225','Africa/Abidjan','["card","mobile_money","cash"]','["auto","moto","location","importafrica"]'),
  ('SN','SEN','Sénégal','Senegal','fr','["fr"]','XOF',18.00,'+221','Africa/Dakar','["card","mobile_money","cash"]','["auto","moto","location","importafrica"]'),
  ('CM','CMR','Cameroun','Cameroon','fr','["fr","en"]','XAF',19.25,'+237','Africa/Douala','["card","mobile_money","cash"]','["auto","moto","importafrica"]'),
  ('ML','MLI','Mali','Mali','fr','["fr"]','XOF',18.00,'+223','Africa/Bamako','["mobile_money","cash"]','["auto","moto","importafrica"]'),
  ('BF','BFA','Burkina Faso','Burkina Faso','fr','["fr"]','XOF',18.00,'+226','Africa/Ouagadougou','["mobile_money","cash"]','["auto","moto","importafrica"]'),
  ('MA','MAR','Maroc','Morocco','fr','["fr","ar","en"]','MAD',20.00,'+212','Africa/Casablanca','["card","stripe","cash"]','["auto","moto","importafrica"]'),
  ('DZ','DZA','Algérie','Algeria','fr','["fr","ar"]','DZD',19.00,'+213','Africa/Algiers','["card","cash"]','["auto","moto"]'),
  ('TN','TUN','Tunisie','Tunisia','fr','["fr","ar","en"]','TND',19.00,'+216','Africa/Tunis','["card","cash"]','["auto","moto"]'),
  ('AE','ARE','Émirats arabes unis','UAE','fr','["ar","en","fr"]','AED',5.00,'+971','Asia/Dubai','["card","stripe","cash"]','["auto","moto","luxe"]')
ON CONFLICT (code) DO NOTHING;

-- Devises (référentiel — coexistence avec shared/currency.ts pour la conversion runtime)
CREATE TABLE IF NOT EXISTS "country_currencies" (
  "code" varchar(4) PRIMARY KEY,
  "symbol" varchar(8) NOT NULL,
  "name_fr" varchar(80) NOT NULL,
  "rate_from_eur" numeric(18,6) NOT NULL DEFAULT 1,
  "locale" varchar(16) NOT NULL DEFAULT 'fr-FR',
  "no_decimals" boolean NOT NULL DEFAULT false,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
INSERT INTO "country_currencies" ("code","symbol","name_fr","rate_from_eur","locale","no_decimals") VALUES
  ('EUR','€','Euro',1,'fr-FR',false),
  ('USD','$','Dollar US',1.08,'en-US',false),
  ('GBP','£','Livre sterling',0.85,'en-GB',false),
  ('CAD','$','Dollar canadien',1.46,'fr-CA',false),
  ('XOF','FCFA','Franc CFA (BCEAO)',655.957,'fr-FR',true),
  ('XAF','FCFA','Franc CFA (BEAC)',655.957,'fr-FR',true),
  ('MAD','DH','Dirham marocain',10.8,'fr-MA',false),
  ('DZD','DA','Dinar algérien',145,'fr-DZ',true),
  ('TND','DT','Dinar tunisien',3.4,'fr-TN',false),
  ('GNF','FG','Franc guinéen',9300,'fr-FR',true),
  ('AED','د.إ','Dirham émirati',3.97,'ar-AE',false)
ON CONFLICT (code) DO NOTHING;

-- Santé Country OS
CREATE TABLE IF NOT EXISTS "country_health_log" (
  "id" bigserial PRIMARY KEY,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- LANGUAGE OS — Registre + traductions + préférences
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "language_languages" (
  "code" varchar(8) PRIMARY KEY,       -- fr, en, es, ar, it, de, pt, nl, zh, ...
  "code3" varchar(3),
  "name_native" varchar(80) NOT NULL,  -- ex: "Français"
  "name_fr" varchar(80) NOT NULL,      -- ex: "Français"
  "name_en" varchar(80) NOT NULL,
  "rtl" boolean NOT NULL DEFAULT false, -- arabic, hebrew
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

INSERT INTO "language_languages" ("code","code3","name_native","name_fr","name_en","rtl") VALUES
  ('fr','fra','Français','Français','French',false),
  ('en','eng','English','Anglais','English',false),
  ('es','spa','Español','Espagnol','Spanish',false),
  ('it','ita','Italiano','Italien','Italian',false),
  ('de','deu','Deutsch','Allemand','German',false),
  ('pt','por','Português','Portugais','Portuguese',false),
  ('nl','nld','Nederlands','Néerlandais','Dutch',false),
  ('ar','ara','العربية','Arabe','Arabic',true),
  ('zh','zho','中文','Chinois','Chinese',false)
ON CONFLICT (code) DO NOTHING;

-- Table de traductions — namespace + clé + langue + valeur
CREATE TABLE IF NOT EXISTS "language_translations" (
  "id" bigserial PRIMARY KEY,
  "namespace" varchar(48) NOT NULL,     -- ui, annonce, email, doc, seo, ai
  "key" varchar(255) NOT NULL,
  "language" varchar(8) NOT NULL,
  "value" text NOT NULL,
  "source" varchar(16) NOT NULL DEFAULT 'human',  -- human, auto, ai, mixed
  "validated" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "language_translations_unique" UNIQUE ("namespace","key","language")
);
CREATE INDEX IF NOT EXISTS "language_translations_ns_key_idx" ON "language_translations" ("namespace","key");
CREATE INDEX IF NOT EXISTS "language_translations_lang_idx" ON "language_translations" ("language");

-- Préférences linguistiques par utilisateur (référence molle vers users.id)
CREATE TABLE IF NOT EXISTS "language_user_preferences" (
  "user_id" integer PRIMARY KEY,
  "preferred_language" varchar(8) NOT NULL,
  "translation_level" varchar(16) NOT NULL DEFAULT 'auto', -- auto, human_only, mixed
  "auto_translate_messages" boolean NOT NULL DEFAULT true,
  "auto_translate_annonces" boolean NOT NULL DEFAULT true,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Santé Language OS
CREATE TABLE IF NOT EXISTS "language_health_log" (
  "id" bigserial PRIMARY KEY,
  "status" varchar(16) NOT NULL,
  "message" text,
  "metrics" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
