-- LOT 7 (suite) — RBAC Fournisseur/Transporteur : architecture et
-- permissions uniquement, aucune ouverture réelle de compte dans ce lot.
--
-- Deux nouvelles valeurs d'énumération, additives, jamais produites tant
-- qu'un PDG n'accorde pas explicitement un accès (server/supplier-engine/
-- access.ts::grantSupplierAccess / grantCarrierAccess) : aucun compte
-- existant n'est affecté.
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'supplier';
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'carrier';

-- Un compte de connexion (users.id) lié à exactement une fiche fournisseur
-- (supplier_profiles) ou une fiche partenaire transporteur (partners,
-- type "transporteur") — jamais les deux, jamais une entrée dupliquée pour
-- le même compte. Isolation stricte par construction : chaque requête du
-- portail fournisseur/transporteur ne peut résoudre QUE cette ligne.
CREATE TABLE IF NOT EXISTS "supplier_carrier_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "account_type" varchar(16) NOT NULL,
  "supplier_profile_id" integer,
  "partner_id" integer,
  "status" varchar(24) NOT NULL DEFAULT 'ready_for_onboarding',
  "granted_by" integer NOT NULL,
  "revoked_by" integer,
  "revoked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "supplier_carrier_accounts_user_id_unique" UNIQUE("user_id")
);
