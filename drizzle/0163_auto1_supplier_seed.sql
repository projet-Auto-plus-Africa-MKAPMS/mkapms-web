-- AUTO1.com GmbH — fournisseur automobile officiel (plateforme principale
-- uniquement, pas la boutique). Sur instruction explicite et répétée de la
-- Direction : statut "actif" directement (le Vehicle Engine refuse toute
-- ingestion pour un fournisseur dont le statut n'est pas "actif" — voir
-- server/vehicle-engine/service.ts, ingererVehicule). Idempotent : aucune
-- ligne dupliquée si ce fournisseur existe déjà.

-- Pays Allemagne (Country OS), prérequis pour countryCode = 'DE'. N'écrase
-- rien si déjà présent.
INSERT INTO "country_countries" ("code", "code3", "name_fr", "name_en", "default_language", "default_currency", "phone_prefix", "timezone", "universes_enabled", "active")
VALUES ('DE', 'DEU', 'Allemagne', 'Germany', 'fr', 'EUR', '+49', 'Europe/Berlin', '["auto"]', true)
ON CONFLICT ("code") DO NOTHING;

-- Partenaire (carnet d'adresses) — prérequis de creerFournisseur().
INSERT INTO "partners" ("name", "type", "country", "contact_email", "contact_phone", "active", "notes")
SELECT 'AUTO1.com GmbH', 'fournisseur_vehicules', 'DE', 'api-partners@auto1.com', '+49 30 300 136 000', true,
       'Fournisseur automobile B2B (Allemagne) : enchères 24h, enchères pro, achat immédiat, achat direct, VO/utilitaires/leasing-returns/flotte. Ajouté sur instruction explicite de la Direction.'
WHERE NOT EXISTS (
  SELECT 1 FROM "partners" WHERE "name" = 'AUTO1.com GmbH' AND "type" = 'fournisseur_vehicules'
);

-- Profil fournisseur détaillé. KYB documentaire volontairement laissé
-- "non_verifie" : ce seed ne prétend pas qu'une vérification KYB a eu
-- lieu, seulement que la Direction a explicitement ordonné l'activation
-- immédiate. Aucun connecteur API prétendu disponible (voir plus bas).
INSERT INTO "supplier_profiles" (
  "reference", "partner_id", "supplier_type", "company_legal_name",
  "country_code", "currency", "territories_allowed", "payment_terms_days",
  "commercial_terms", "kyb_status", "status", "activated_at"
)
SELECT
  'SUP-AUTO1-DE-0001', p."id", 'vehicules', 'AUTO1.com GmbH',
  'DE', 'EUR', '["DE"]'::jsonb, 30,
  'Conditions commerciales à finaliser avec AUTO1.com (voir contrat).',
  'non_verifie', 'actif', now()
FROM "partners" p
WHERE p."name" = 'AUTO1.com GmbH' AND p."type" = 'fournisseur_vehicules'
ON CONFLICT ("reference") DO NOTHING;

-- Contact technique (API partenaire AUTO1).
INSERT INTO "supplier_contacts" ("supplier_profile_id", "kind", "name", "email", "phone")
SELECT sp."id", 'technique', 'AUTO1.com — Partner API', 'api-partners@auto1.com', '+49 30 300 136 000'
FROM "supplier_profiles" sp
WHERE sp."reference" = 'SUP-AUTO1-DE-0001'
  AND NOT EXISTS (
    SELECT 1 FROM "supplier_contacts" sc WHERE sc."supplier_profile_id" = sp."id" AND sc."kind" = 'technique'
  );

-- Connecteur placeholder "manuel" uniquement : aucune API d'achat de stock
-- n'est prétendue disponible. Le branchement d'un vrai connecteur se fera
-- plus tard, sans recréer ce fournisseur.
INSERT INTO "supplier_connections" ("supplier_profile_id", "method", "auth_type", "environment", "status", "config")
SELECT sp."id", 'manuel', 'none', 'production', 'not_connected', '{}'::jsonb
FROM "supplier_profiles" sp
WHERE sp."reference" = 'SUP-AUTO1-DE-0001'
  AND NOT EXISTS (
    SELECT 1 FROM "supplier_connections" scx WHERE scx."supplier_profile_id" = sp."id" AND scx."method" = 'manuel'
  );

-- Étape d'onboarding "creation" (même comportement que creerFournisseur()).
INSERT INTO "supplier_onboarding_steps" ("supplier_profile_id", "step", "status")
SELECT sp."id", 'creation', 'valide'
FROM "supplier_profiles" sp
WHERE sp."reference" = 'SUP-AUTO1-DE-0001'
  AND NOT EXISTS (
    SELECT 1 FROM "supplier_onboarding_steps" sos WHERE sos."supplier_profile_id" = sp."id" AND sos."step" = 'creation'
  );

-- Audit : trace honnête de l'origine de cette activation (ordre direct de
-- la Direction via migration de déploiement — jamais une décision
-- automatique du système ou de l'IA).
INSERT INTO "supplier_audit_log" ("supplier_profile_id", "action", "to_status", "detail")
SELECT sp."id", 'supplier.created_and_activated', 'actif',
       '{"source": "migration_0163_auto1_supplier_seed", "note": "Statut actif défini directement sur instruction explicite et répétée de la Direction (PDG), via migration de déploiement. KYB documentaire à compléter séparément dans l''écran Gestion des fournisseurs."}'::jsonb
FROM "supplier_profiles" sp
WHERE sp."reference" = 'SUP-AUTO1-DE-0001'
  AND NOT EXISTS (
    SELECT 1 FROM "supplier_audit_log" sal WHERE sal."supplier_profile_id" = sp."id" AND sal."action" = 'supplier.created_and_activated'
  );
