-- Country OS — capacités Google par pays (doctrine PDG v1.1, mkapms-mos-architecture.md §12.1/12.2)
-- Additif pur. Interdiction absolue d'inventer une disponibilité Google : une capacité n'est
-- exploitable qu'avec verified = true ET source_ref renseignée (page officielle support.google.com).
-- L'absence de ligne, ou verified = false, vaut « indisponible » pour tout moteur appelant.

CREATE TABLE IF NOT EXISTS "country_google_capabilities" (
  "country_code" varchar(2) PRIMARY KEY,
  "search" boolean NOT NULL DEFAULT true,
  "merchant" boolean NOT NULL DEFAULT false,
  "free_listings" boolean NOT NULL DEFAULT false,
  "shopping" boolean NOT NULL DEFAULT false,
  "vehicle_ads" boolean NOT NULL DEFAULT false,
  "google_business" boolean NOT NULL DEFAULT false,
  "local_ads" boolean NOT NULL DEFAULT false,
  "verified" boolean NOT NULL DEFAULT false,
  "source_ref" text,
  "notes" text,
  "verified_by" integer,
  "verified_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Seed — uniquement des faits vérifiés par recherche des pages officielles Google au 25/09/2026,
-- pour les 20 pays déjà seedés dans country_countries. Un pays absent ci-dessous n'a volontairement
-- reçu aucune ligne : il reste « non vérifié » (aucune capacité Google active) jusqu'à vérification.
--
-- Shopping/Free listings/Merchant (support.google.com/merchants/answer/160637) : liste explicite
-- couvrant FR, BE, CH, DE, ES, IT, PT, GB, CA, US, AE parmi nos 20 pays.
-- Vehicle Ads (support.google.com/merchants/answer/11189169, /answer/17003740, /answer/14933131) :
-- pleinement disponible pour US, CA (dès l'ouverture), GB (oct. 2024), FR (août 2025),
-- ES/IT/DE (mars 2026).
-- Search (SEO organique) : universel, sans restriction pays connue — vrai par défaut pour tous.

INSERT INTO "country_google_capabilities"
  ("country_code","search","merchant","free_listings","shopping","vehicle_ads","google_business","local_ads","verified","source_ref","notes","verified_at")
VALUES
  ('FR', true, true, true, true, true, false, false, true,
   'https://support.google.com/merchants/answer/160637 ; https://support.google.com/merchants/answer/11189169',
   'Vehicle Ads disponible à tous les annonceurs FR depuis août 2025.', now()),
  ('BE', true, true, true, true, false, false, false, true,
   'https://support.google.com/merchants/answer/160637', NULL, now()),
  ('CH', true, true, true, true, false, false, false, true,
   'https://support.google.com/merchants/answer/160637', NULL, now()),
  ('DE', true, true, true, true, true, false, false, true,
   'https://support.google.com/merchants/answer/160637 ; https://support.google.com/merchants/answer/17003740',
   'Vehicle Ads disponible à tous les annonceurs DE depuis mars 2026.', now()),
  ('ES', true, true, true, true, true, false, false, true,
   'https://support.google.com/merchants/answer/160637 ; https://support.google.com/merchants/answer/17003740',
   'Vehicle Ads disponible à tous les annonceurs ES depuis mars 2026.', now()),
  ('IT', true, true, true, true, true, false, false, true,
   'https://support.google.com/merchants/answer/160637 ; https://support.google.com/merchants/answer/17003740',
   'Vehicle Ads disponible à tous les annonceurs IT depuis mars 2026.', now()),
  ('PT', true, true, true, true, false, false, false, true,
   'https://support.google.com/merchants/answer/160637', NULL, now()),
  ('GB', true, true, true, true, true, false, false, true,
   'https://support.google.com/merchants/answer/160637 ; https://support.google.com/merchants/answer/14933131',
   'Vehicle Ads disponible à tous les annonceurs UK depuis octobre 2024.', now()),
  ('CA', true, true, true, true, true, false, false, true,
   'https://support.google.com/merchants/answer/160637 ; https://support.google.com/merchants/answer/11189169',
   'Vehicle Ads en accès direct depuis Merchant Center (pleinement disponible).', now()),
  ('US', true, true, true, true, true, false, false, true,
   'https://support.google.com/merchants/answer/160637 ; https://support.google.com/merchants/answer/11189169',
   'Vehicle Ads en accès direct depuis Merchant Center (pleinement disponible).', now()),
  ('AE', true, true, true, true, false, false, false, true,
   'https://support.google.com/merchants/answer/160637', NULL, now())
ON CONFLICT ("country_code") DO NOTHING;
