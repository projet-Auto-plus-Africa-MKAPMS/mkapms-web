// ===== MODULE: COMPTABILITÉ INTERNE MKA.P-MS + CABINETS COMPTABLES =====
// Finance interne (achats, ventes, factures, dépenses, TVA, rapports)
// + Univers séparé pour cabinets comptables externes (service pro).
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

export const comptaTypeEnum = pgEnum("compta_type", [
  "achat_vehicule",
  "vente_vehicule",
  "facture_fournisseur",
  "facture_client",
  "depense",
  "remboursement",
  "abonnement",
  "commission",
  "salaire",
  "tva",
  "transport",
  "reparation",
  "piece",
  "lavage",
  "autre",
]);

export const comptaDocTypeEnum = pgEnum("compta_doc_type", [
  "facture",
  "recu",
  "bon_commande",
  "avoir",
  "devis",
  "releve",
  "contrat",
  "photo",
  "scan",
  "autre",
]);

export const comptaStatutEnum = pgEnum("compta_statut", [
  "brouillon",
  "a_valider",
  "valide",
  "paye",
  "en_retard",
  "annule",
  "rembourse",
  "archive",
]);

export const cabinetRoleEnum = pgEnum("cabinet_role", [
  "expert_comptable",
  "collaborateur",
  "assistant",
  "stagiaire",
]);

// ── Tables Comptabilité Interne ────────────────────────────────────────

export const comptaEcritures = pgTable("compta_ecritures", {
  id: serial("id").primaryKey(),
  type: comptaTypeEnum("type").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  montantHT: numeric("montant_ht", { precision: 14, scale: 2 }).notNull(),
  tvaRate: numeric("tva_rate", { precision: 5, scale: 2 }).default("20.00"),
  tvaMontant: numeric("tva_montant", { precision: 14, scale: 2 }).default("0"),
  montantTTC: numeric("montant_ttc", { precision: 14, scale: 2 }).notNull(),
  sens: varchar("sens", { length: 8 }).notNull().default("debit"),
  statut: comptaStatutEnum("statut").notNull().default("brouillon"),
  dateEcriture: timestamp("date_ecriture").notNull().defaultNow(),
  dateEcheance: timestamp("date_echeance"),
  // Rattachements
  vehiculeId: integer("vehicule_id"),
  clientId: integer("client_id"),
  fournisseur: varchar("fournisseur", { length: 128 }),
  annonceId: integer("annonce_id"),
  voVehiculeId: integer("vo_vehicule_id"),
  abonnementId: integer("abonnement_id"),
  // Meta
  reference: varchar("reference", { length: 64 }),
  notes: text("notes"),
  validePar: integer("valide_par"),
  dateValidation: timestamp("date_validation"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const comptaDocuments = pgTable("compta_documents", {
  id: serial("id").primaryKey(),
  ecritureId: integer("ecriture_id"),
  vehiculeId: integer("vehicule_id"),
  clientId: integer("client_id"),
  type: comptaDocTypeEnum("type").notNull(),
  nom: varchar("nom", { length: 255 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 64 }),
  taille: integer("taille"),
  ocrData: text("ocr_data"),
  uploadedBy: integer("uploaded_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const comptaRapports = pgTable("compta_rapports", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 32 }).notNull(),
  periode: varchar("periode", { length: 32 }).notNull(),
  dateDebut: timestamp("date_debut").notNull(),
  dateFin: timestamp("date_fin").notNull(),
  totalAchats: numeric("total_achats", { precision: 14, scale: 2 }).default("0"),
  totalVentes: numeric("total_ventes", { precision: 14, scale: 2 }).default("0"),
  totalDepenses: numeric("total_depenses", { precision: 14, scale: 2 }).default("0"),
  totalCommissions: numeric("total_commissions", { precision: 14, scale: 2 }).default("0"),
  totalAbonnements: numeric("total_abonnements", { precision: 14, scale: 2 }).default("0"),
  totalTVA: numeric("total_tva", { precision: 14, scale: 2 }).default("0"),
  beneficeNet: numeric("benefice_net", { precision: 14, scale: 2 }).default("0"),
  data: jsonb("data"),
  pdfUrl: text("pdf_url"),
  excelUrl: text("excel_url"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Tables Cabinets Comptables Externes ────────────────────────────────

export const cabinetsComptables = pgTable("cabinets_comptables", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 255 }).notNull(),
  siret: varchar("siret", { length: 32 }),
  adresse: text("adresse"),
  telephone: varchar("telephone", { length: 32 }),
  email: varchar("email", { length: 255 }),
  siteWeb: varchar("site_web", { length: 255 }),
  responsableId: integer("responsable_id").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cabinetMembres = pgTable("cabinet_membres", {
  id: serial("id").primaryKey(),
  cabinetId: integer("cabinet_id").notNull(),
  userId: integer("user_id").notNull(),
  role: cabinetRoleEnum("role").notNull().default("collaborateur"),
  actif: boolean("actif").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cabinetClients = pgTable("cabinet_clients", {
  id: serial("id").primaryKey(),
  cabinetId: integer("cabinet_id").notNull(),
  clientUserId: integer("client_user_id"),
  nom: varchar("nom", { length: 255 }).notNull(),
  siret: varchar("siret", { length: 32 }),
  email: varchar("email", { length: 255 }),
  telephone: varchar("telephone", { length: 32 }),
  notes: text("notes"),
  actif: boolean("actif").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cabinetDossiers = pgTable("cabinet_dossiers", {
  id: serial("id").primaryKey(),
  cabinetId: integer("cabinet_id").notNull(),
  clientId: integer("client_id").notNull(),
  titre: varchar("titre", { length: 255 }).notNull(),
  type: varchar("type", { length: 64 }),
  status: varchar("status", { length: 32 }).default("ouvert"),
  responsableId: integer("responsable_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cabinetDocuments = pgTable("cabinet_documents", {
  id: serial("id").primaryKey(),
  dossierId: integer("dossier_id").notNull(),
  cabinetId: integer("cabinet_id").notNull(),
  nom: varchar("nom", { length: 255 }).notNull(),
  url: text("url").notNull(),
  type: comptaDocTypeEnum("type_doc").notNull(),
  mimeType: varchar("mime_type", { length: 64 }),
  taille: integer("taille"),
  uploadedBy: integer("uploaded_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
