// ===== MODULE: DÉMARCHES CARTE GRISE / SIV =====
// Univers complet : DA, DC, changement titulaire, carte grise, véhicule étranger,
// WW / CPI, W garage, suivi dossier, documents, notifications, audit trail.
// Relié à : VO interne, Vente, Achat, Comptabilité, Garage+, Clients, Notifications.
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────

export const cgDossierTypeEnum = pgEnum("cg_dossier_type", [
  "declaration_achat",
  "declaration_cession",
  "changement_titulaire",
  "carte_grise",
  "vehicule_etranger",
  "ww_cpi",
  "w_garage",
  "duplicata",
  "correction",
  "autre",
]);

export const cgDossierStatusEnum = pgEnum("cg_dossier_status", [
  "brouillon",
  "documents_a_verifier",
  "en_verification",
  "documents_valides",
  "document_manquant",
  "document_refuse",
  "renvoye",
  "envoye_agence",
  "en_traitement",
  "accepte",
  "bloque",
  "termine",
  "annule",
  "archive",
]);

export const cgDocStatusEnum = pgEnum("cg_doc_status", [
  "recu",
  "en_verification",
  "valide",
  "refuse",
  "manquant",
  "renvoye",
  "expire",
]);

export const cgAgenceStatusEnum = pgEnum("cg_agence_status", [
  "en_attente",
  "documents_soumis",
  "en_verification",
  "validee",
  "refusee",
  "suspendue",
]);

export const cgAuditActionEnum = pgEnum("cg_audit_action", [
  "creation_dossier",
  "ajout_document",
  "validation_document",
  "refus_document",
  "remplacement_document",
  "changement_statut",
  "affectation_agence",
  "note_ajoutee",
  "notification_envoyee",
  "cloture_dossier",
  "suppression_document",
  "modification_dossier",
]);

// ── Tables ─────────────────────────────────────────────────────────────

// Dossiers carte grise
export const cgDossiers = pgTable("cg_dossiers", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 32 }).notNull(),
  type: cgDossierTypeEnum("type").notNull(),
  status: cgDossierStatusEnum("status").notNull().default("brouillon"),
  // Véhicule
  immatriculation: varchar("immatriculation", { length: 32 }),
  vin: varchar("vin", { length: 32 }),
  marque: varchar("marque", { length: 64 }),
  modele: varchar("modele", { length: 128 }),
  annee: integer("annee"),
  // Liens
  clientId: integer("client_id"),
  voVehiculeId: integer("vo_vehicule_id"),
  annonceId: integer("annonce_id"),
  agenceId: integer("agence_id"),
  // Parties
  vendeurNom: varchar("vendeur_nom", { length: 128 }),
  vendeurId: integer("vendeur_id"),
  acheteurNom: varchar("acheteur_nom", { length: 128 }),
  acheteurId: integer("acheteur_id"),
  // Admin
  montantTaxe: numeric("montant_taxe", { precision: 10, scale: 2 }),
  montantPrestation: numeric("montant_prestation", { precision: 10, scale: 2 }),
  commissionMkapms: numeric("commission_mkapms", { precision: 10, scale: 2 }),
  factureId: integer("facture_id"),
  notes: text("notes"),
  dateCreation: timestamp("date_creation").notNull().defaultNow(),
  dateCloture: timestamp("date_cloture"),
  createdBy: integer("created_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Documents associés à un dossier
export const cgDocuments = pgTable("cg_documents", {
  id: serial("id").primaryKey(),
  dossierId: integer("dossier_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  nom: varchar("nom", { length: 255 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 64 }),
  taille: integer("taille"),
  status: cgDocStatusEnum("status").notNull().default("recu"),
  motifRefus: text("motif_refus"),
  remplaceParId: integer("remplace_par_id"),
  verifieePar: integer("verifiee_par"),
  dateVerification: timestamp("date_verification"),
  uploadedBy: integer("uploaded_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Agences carte grise (pros habilités SIV)
export const cgAgences = pgTable("cg_agences", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  siret: varchar("siret", { length: 32 }),
  adresse: text("adresse"),
  codePostal: varchar("code_postal", { length: 10 }),
  ville: varchar("ville", { length: 128 }),
  telephone: varchar("telephone", { length: 32 }),
  email: varchar("email", { length: 255 }),
  siteWeb: varchar("site_web", { length: 255 }),
  responsableId: integer("responsable_id").notNull(),
  // Documents pro obligatoires
  kbisUrl: text("kbis_url"),
  identiteDirigeantUrl: text("identite_dirigeant_url"),
  justificatifDomicileUrl: text("justificatif_domicile_url"),
  assuranceProUrl: text("assurance_pro_url"),
  habilitationSivUrl: text("habilitation_siv_url"),
  agrementUrl: text("agrement_url"),
  status: cgAgenceStatusEnum("status").notNull().default("en_attente"),
  validePar: integer("valide_par"),
  dateValidation: timestamp("date_validation"),
  // Stats
  dossiersTraites: integer("dossiers_traites").default(0),
  noteQualite: numeric("note_qualite", { precision: 3, scale: 1 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Membres d'une agence
export const cgAgenceMembres = pgTable("cg_agence_membres", {
  id: serial("id").primaryKey(),
  agenceId: integer("agence_id").notNull(),
  userId: integer("user_id").notNull(),
  role: varchar("role", { length: 32 }).notNull().default("agent"),
  actif: boolean("actif").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Abonnements agences
export const cgAbonnements = pgTable("cg_abonnements", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull(),
  nom: varchar("nom", { length: 128 }).notNull(),
  prixHT: numeric("prix_ht", { precision: 10, scale: 2 }).notNull(),
  prixTTC: numeric("prix_ttc", { precision: 10, scale: 2 }).notNull(),
  dossiersMois: integer("dossiers_mois").notNull(),
  features: jsonb("features"),
  actif: boolean("actif").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Packs crédits (achat ponctuel)
export const cgPacks = pgTable("cg_packs", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 128 }).notNull(),
  nbDossiers: integer("nb_dossiers").notNull(),
  prixHT: numeric("prix_ht", { precision: 10, scale: 2 }).notNull(),
  prixTTC: numeric("prix_ttc", { precision: 10, scale: 2 }).notNull(),
  actif: boolean("actif").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Crédits dossiers d'une agence
export const cgCredits = pgTable("cg_credits", {
  id: serial("id").primaryKey(),
  agenceId: integer("agence_id").notNull(),
  creditsRestants: integer("credits_restants").notNull().default(0),
  abonnementId: integer("abonnement_id"),
  packId: integer("pack_id"),
  dateExpiration: timestamp("date_expiration"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Historique des étapes d'un dossier
export const cgEtapes = pgTable("cg_etapes", {
  id: serial("id").primaryKey(),
  dossierId: integer("dossier_id").notNull(),
  status: cgDossierStatusEnum("status").notNull(),
  statusLabel: varchar("status_label", { length: 128 }).notNull(),
  commentaire: text("commentaire"),
  responsable: varchar("responsable", { length: 128 }),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audit trail — TOUTES les actions loggées
export const cgAuditLog = pgTable("cg_audit_log", {
  id: serial("id").primaryKey(),
  dossierId: integer("dossier_id"),
  action: cgAuditActionEnum("action").notNull(),
  detail: text("detail"),
  documentId: integer("document_id"),
  userId: integer("user_id").notNull(),
  userEmail: varchar("user_email", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
