/**
 * Supplier Engine — schéma (LOT 1 du Plan Maître Fournisseurs).
 *
 * Complète le réseau de partenaires existant (`partners`, `partner_applications`,
 * `partner_contracts`, `partner_coverage` — voir server/partner-engine/) au lieu
 * de le dupliquer : `partnerTypeEnum` (server/modules/operations.ts) contient
 * déjà "fournisseur_vehicules", "fournisseur_pieces" et "transporteur", et
 * `PROFESSION_TO_PARTNER_TYPE` (server/partner-engine/service.ts) route déjà les
 * candidatures de ces métiers. Ces tables ajoutent ce qui manquait pour qu'un
 * fournisseur (par opposition à un partenaire prestataire de service) soit
 * réellement exploitable : identité légale, territoires multiples, connecteurs,
 * mapping de catalogue, étapes d'onboarding et audit dédié.
 *
 * `partnerId` référence `partners.id` en lecture seule (entier simple, comme
 * `documentId` dans Contract OS) : le Supplier Engine reste un moteur
 * indépendant (règle MOS #11), sans contrainte FK dure vers un autre moteur.
 */
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Fiche fournisseur : ce que `partners` ne porte pas (identité légale,
 * territoires, devise, conditions, statut d'activation détaillé).
 */
export const supplierProfiles = pgTable(
  "supplier_profiles",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    /** Entrée du carnet d'adresses historique (`partners.id`). */
    partnerId: integer("partner_id").notNull(),
    /** "vehicules" | "pieces" | "transport" | "multi" — cohérent avec partnerTypeEnum. */
    supplierType: varchar("supplier_type", { length: 24 }).notNull(),
    companyLegalName: varchar("company_legal_name", { length: 200 }).notNull(),
    registrationNumber: varchar("registration_number", { length: 64 }),
    vatNumber: varchar("vat_number", { length: 32 }),
    countryCode: varchar("country_code", { length: 4 }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
    /** Codes pays (Country OS) où ce fournisseur est autorisé à vendre. */
    territoriesAllowed: jsonb("territories_allowed").$type<string[]>().notNull().default([]),
    /** Codes pays explicitement exclus, même si `territoriesAllowed` est large. */
    territoriesExcluded: jsonb("territories_excluded").$type<string[]>().notNull().default([]),
    paymentTermsDays: integer("payment_terms_days").notNull().default(30),
    commercialTerms: text("commercial_terms"),
    /** "non_verifie" | "en_cours" | "verifie" | "refuse" */
    kybStatus: varchar("kyb_status", { length: 16 }).notNull().default("non_verifie"),
    kybVerifiedBy: integer("kyb_verified_by"),
    kybVerifiedAt: timestamp("kyb_verified_at"),
    kybNote: text("kyb_note"),
    /**
     * "brouillon" | "en_verification" | "valide_direction" | "contrat_signe" |
     * "test_connexion" | "actif" | "suspendu" | "desactive"
     */
    status: varchar("status", { length: 24 }).notNull().default("brouillon"),
    validatedByDirection: integer("validated_by_direction"),
    validatedAt: timestamp("validated_at"),
    /** Contrat de la partie "fournisseur"/"transporteur" (Contract OS, `contract_terms.id`). */
    contractTermsId: integer("contract_terms_id"),
    activatedAt: timestamp("activated_at"),
    activatedBy: integer("activated_by"),
    suspendedAt: timestamp("suspended_at"),
    suspendedReason: text("suspended_reason"),
    deactivatedAt: timestamp("deactivated_at"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    partnerIdx: index("supplier_profiles_partner_idx").on(t.partnerId),
    statusIdx: index("supplier_profiles_status_idx").on(t.status, t.supplierType),
    countryIdx: index("supplier_profiles_country_idx").on(t.countryCode),
  }),
);

/**
 * Contacts par fonction. `partners` n'a qu'un seul email/téléphone : un
 * fournisseur a besoin de contacts commercial, technique et comptabilité
 * distincts, chacun pouvant être vide.
 */
export const supplierContacts = pgTable(
  "supplier_contacts",
  {
    id: serial("id").primaryKey(),
    supplierProfileId: integer("supplier_profile_id").notNull(),
    /** "commercial" | "technique" | "comptabilite" */
    kind: varchar("kind", { length: 16 }).notNull(),
    name: varchar("name", { length: 160 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 32 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    supplierIdx: index("supplier_contacts_supplier_idx").on(t.supplierProfileId, t.kind),
  }),
);

/**
 * Étape d'onboarding (point 2 du plan). Une ligne par étape et par
 * fournisseur : l'historique complet reste visible, jamais écrasé.
 */
export const supplierOnboardingSteps = pgTable(
  "supplier_onboarding_steps",
  {
    id: serial("id").primaryKey(),
    supplierProfileId: integer("supplier_profile_id").notNull(),
    /** Voir ONBOARDING_STEPS dans contract.ts. */
    step: varchar("step", { length: 32 }).notNull(),
    /** "a_faire" | "en_cours" | "valide" | "refuse" */
    status: varchar("status", { length: 16 }).notNull().default("a_faire"),
    completedBy: integer("completed_by"),
    completedAt: timestamp("completed_at"),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    supplierIdx: index("supplier_onboarding_steps_supplier_idx").on(t.supplierProfileId, t.step),
  }),
);

/**
 * Connector Engine (point 4) : un adaptateur par méthode de connexion et par
 * fournisseur. Aucun secret réel n'est stocké ici — `secretRef` ne porte que
 * le nom de la variable d'environnement / clé du gestionnaire de secrets.
 * Sans secret configuré, `status` reste honnêtement "not_connected" (même
 * principe que la Passerelle d'Embeddings du LOT IA02F) : ça ne bloque jamais
 * le reste de l'onboarding.
 */
export const supplierConnections = pgTable(
  "supplier_connections",
  {
    id: serial("id").primaryKey(),
    supplierProfileId: integer("supplier_profile_id").notNull(),
    /** Voir CONNECTION_METHODS dans contract.ts (22 méthodes du plan). */
    method: varchar("method", { length: 32 }).notNull(),
    /** "none" | "api_key" | "oauth2" | "hmac" | "basic_auth" */
    authType: varchar("auth_type", { length: 16 }).notNull().default("none"),
    /** "sandbox" | "production" */
    environment: varchar("environment", { length: 16 }).notNull().default("sandbox"),
    /**
     * "not_connected" (défaut honnête, aucun secret réel) | "configured"
     * (paramètres saisis, jamais testés avec succès) | "active" | "suspended"
     * | "disabled"
     */
    status: varchar("status", { length: 16 }).notNull().default("not_connected"),
    endpointUrl: text("endpoint_url"),
    /** Nom de la variable d'environnement / référence du secret manager — jamais le secret lui-même. */
    secretRef: varchar("secret_ref", { length: 128 }),
    rateLimitPerMinute: integer("rate_limit_per_minute"),
    /** Réglages non sensibles (en-têtes, format, fréquence d'import programmé…). */
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    lastHealthCheckAt: timestamp("last_health_check_at"),
    /** "ok" | "degraded" | "down" | "not_connected" */
    lastHealthStatus: varchar("last_health_status", { length: 16 }).notNull().default("not_connected"),
    lastHealthMessage: text("last_health_message"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    supplierIdx: index("supplier_connections_supplier_idx").on(t.supplierProfileId, t.active),
  }),
);

/**
 * Universal Mapping Engine (point 5) : correspondance champ fournisseur →
 * champ canonique MKA.P-MS. Versionné et jamais écrasé (une nouvelle version
 * s'ajoute, l'ancienne reste consultable) — "Historique des mappings /
 * Versioning mappings" du plan.
 */
export const supplierMappings = pgTable(
  "supplier_mappings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    supplierProfileId: integer("supplier_profile_id").notNull(),
    /** "vehicule" | "piece" */
    entityType: varchar("entity_type", { length: 16 }).notNull(),
    canonicalField: varchar("canonical_field", { length: 96 }).notNull(),
    supplierField: varchar("supplier_field", { length: 96 }).notNull(),
    /** Règle de transformation (unité, devise, catégorie, normalisation) — libre, jamais interprétée en dur ici. */
    transform: jsonb("transform").$type<Record<string, unknown>>().notNull().default({}),
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(true),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    supplierIdx: index("supplier_mappings_supplier_idx").on(
      t.supplierProfileId,
      t.entityType,
      t.active,
    ),
  }),
);

/**
 * Audit obligatoire (règle MOS #12 : table `<engine>_audit_log`). Chaque
 * décision — jamais seulement les erreurs — avec qui l'a prise.
 */
export const supplierAuditLog = pgTable(
  "supplier_audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    supplierProfileId: integer("supplier_profile_id").notNull(),
    action: varchar("action", { length: 48 }).notNull(),
    actorId: integer("actor_id"),
    fromStatus: varchar("from_status", { length: 24 }),
    toStatus: varchar("to_status", { length: 24 }),
    detail: jsonb("detail").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    supplierIdx: index("supplier_audit_log_supplier_idx").on(t.supplierProfileId, t.createdAt),
  }),
);

/** Journal de santé (même mécanique que `country_health_log`). */
export const supplierHealthLog = pgTable("supplier_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * LOT 7 (suite) — RBAC Fournisseur/Transporteur.
 *
 * Un compte de connexion (`users.id`) lié à exactement une fiche —
 * fournisseur (`supplier_profiles.id`) ou partenaire transporteur
 * (`partners.id`, type "transporteur") — jamais les deux à la fois, jamais
 * une seconde ligne pour le même compte (contrainte unique sur `userId`).
 * Chaque requête du portail fournisseur/transporteur résout SA propre
 * ligne, jamais un identifiant fourni par le client : c'est cette
 * résolution qui garantit l'isolement strict par entreprise.
 *
 * `status` par défaut "ready_for_onboarding" : la ligne déclare une
 * capacité prête, jamais un accès déjà accordé. Seul `grantSupplierAccess`
 * / `grantCarrierAccess` (server/supplier-engine/access.ts), appelés par
 * un PDG, font réellement passer un compte à "active".
 */
export const supplierCarrierAccounts = pgTable("supplier_carrier_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  /** "supplier" | "carrier" */
  accountType: varchar("account_type", { length: 16 }).notNull(),
  supplierProfileId: integer("supplier_profile_id"),
  partnerId: integer("partner_id"),
  /** "ready_for_onboarding" | "active" | "suspended" | "revoked" */
  status: varchar("status", { length: 24 }).notNull().default("ready_for_onboarding"),
  grantedBy: integer("granted_by").notNull(),
  revokedBy: integer("revoked_by"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
