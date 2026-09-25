-- Tâche #66 (doctrine PDG v1.1, §12.1) : découvert en construisant langueDe()
-- (server/product-engine/service.ts) — country_countries.default_language
-- avait été seedé à 'fr' pour LES 20 PAYS SANS EXCEPTION (drizzle/0038), y
-- compris l'Allemagne, l'Espagne, l'Italie, le Portugal, le Royaume-Uni, les
-- États-Unis et les pays arabophones. Sans cette correction, tout code qui
-- dérive la langue depuis le Country OS (dont le nouveau langueDe() de cette
-- tâche) retombait silencieusement sur le français pour ces pays.
--
-- Correction limitée aux pays mono-langue nationale sans ambiguïté
-- raisonnable (langue officielle/nationale factuelle, pas un jugement
-- commercial) : DE, ES, IT, PT, GB, US, MA, DZ, TN, AE. Les pays
-- multilingues où le français reste une langue officielle ou majoritaire
-- plausible pour cette plateforme francophone (BE, LU, CH, CA, CI, SN, CM,
-- ML, BF) ne sont volontairement pas touchés — corriger ceux-là serait un
-- choix éditorial, pas une correction factuelle.

UPDATE "country_countries" SET "default_language" = 'de', "updated_at" = now() WHERE "code" = 'DE';
UPDATE "country_countries" SET "default_language" = 'es', "updated_at" = now() WHERE "code" = 'ES';
UPDATE "country_countries" SET "default_language" = 'it', "updated_at" = now() WHERE "code" = 'IT';
UPDATE "country_countries" SET "default_language" = 'pt', "updated_at" = now() WHERE "code" = 'PT';
UPDATE "country_countries" SET "default_language" = 'en', "updated_at" = now() WHERE "code" = 'GB';
UPDATE "country_countries" SET "default_language" = 'en', "updated_at" = now() WHERE "code" = 'US';
UPDATE "country_countries" SET "default_language" = 'ar', "updated_at" = now() WHERE "code" = 'MA';
UPDATE "country_countries" SET "default_language" = 'ar', "updated_at" = now() WHERE "code" = 'DZ';
UPDATE "country_countries" SET "default_language" = 'ar', "updated_at" = now() WHERE "code" = 'TN';
UPDATE "country_countries" SET "default_language" = 'ar', "updated_at" = now() WHERE "code" = 'AE';
