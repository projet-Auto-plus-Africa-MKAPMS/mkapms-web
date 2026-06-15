// ===== MODULE FINANCE+ MKA.P-MS =====
// LOA, Paiement fractionné, Suivi véhicules financés, Protection télématique.
// Terminologie : jamais "crédit". Utiliser LOA, paiement fractionné, financement partenaire, acquisition progressive.
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

// --- ENUMS ---
export const finplusContratTypeEnum = pgEnum("finplus_contrat_type", ["loa", "fractionne"]);
export const finplusContratStatusEnum = pgEnum("finplus_contrat_status", [
  "brouillon", "simulation", "dossier_soumis", "en_analyse", "documents_manquants",
  "accepte", "refuse", "signe", "actif", "termine", "resilie",
]);
export const finplusPaiementStatusEnum = pgEnum("finplus_paiement_status", [
  "a_venir", "en_attente", "paye", "en_retard", "echoue", "rembourse",
]);
export const finplusVehiculeStatusEnum = pgEnum("finplus_vehicule_status", [
  "actif", "en_retard", "suspension_demandee", "suspension_validee", "reactivation",
]);
export const finplusImmobilizerStatusEnum = pgEnum("finplus_immobilizer_status", [
  "inactif", "arme", "declenche",
]);

// --- CONTRATS FINANCE+ ---
export const finplusContrats = pgTable("finplus_contrats", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  annonceId: integer("annonce_id"),          // véhicule concerné
  type: varchar("type", { length: 32 }).notNull(), // loa | fractionne
  status: varchar("status", { length: 32 }).notNull().default("simulation"),

  // Simulation
  prixVehicule: numeric("prix_vehicule", { precision: 14, scale: 2 }),
  apportInitial: numeric("apport_initial", { precision: 14, scale: 2 }).default("0"),
  dureeMois: integer("duree_mois"),
  mensualite: numeric("mensualite", { precision: 14, scale: 2 }),
  optionAchat: numeric("option_achat", { precision: 14, scale: 2 }), // LOA uniquement
  nombreFois: integer("nombre_fois"),        // fractionné uniquement (2,3,4,5,10)
  montantParFois: numeric("montant_par_fois", { precision: 14, scale: 2 }),
  totalFinancement: numeric("total_financement", { precision: 14, scale: 2 }),

  // Véhicule
  vehiculeType: varchar("vehicule_type", { length: 32 }), // voiture, utilitaire, moto, scooter, vtc, taxi
  vehiculeMarque: varchar("vehicule_marque", { length: 96 }),
  vehiculeModele: varchar("vehicule_modele", { length: 96 }),
  vehiculePlaque: varchar("vehicule_plaque", { length: 32 }),

  // Client type
  clientType: varchar("client_type", { length: 16 }).default("particulier"), // particulier | professionnel

  // Signature
  signatureDate: timestamp("signature_date"),
  signatureContrat: boolean("signature_contrat").default(false),
  signatureConditions: boolean("signature_conditions").default(false),
  signatureAutorisations: boolean("signature_autorisations").default(false),

  // Livraison (LOA)
  livraisonStatut: varchar("livraison_statut", { length: 32 }), // preparation, programmee, livre
  livraisonDate: timestamp("livraison_date"),

  // Metadata
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- PAIEMENTS FINANCE+ (échéancier) ---
export const finplusPaiements = pgTable("finplus_paiements", {
  id: serial("id").primaryKey(),
  contratId: integer("contrat_id").notNull(),
  numero: integer("numero").notNull(),      // 1, 2, 3... (numéro d'échéance)
  montant: numeric("montant", { precision: 14, scale: 2 }).notNull(),
  dateEcheance: timestamp("date_echeance").notNull(),
  datePaiement: timestamp("date_paiement"),
  status: varchar("status", { length: 32 }).notNull().default("a_venir"),
  stripePaymentId: varchar("stripe_payment_id", { length: 256 }),
  factureId: integer("facture_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- DOCUMENTS FINANCE+ ---
export const finplusDocuments = pgTable("finplus_documents", {
  id: serial("id").primaryKey(),
  contratId: integer("contrat_id").notNull(),
  clientId: integer("client_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(), // identite, domicile, revenus, permis, kbis, siret, tva, rib, contrat, echeancier, facture, conditions
  nom: varchar("nom", { length: 256 }),
  url: text("url"),
  statut: varchar("statut", { length: 32 }).default("en_attente"), // en_attente, valide, refuse, expire
  iaScore: integer("ia_score"),              // Score IA 0-100
  iaAnalyse: jsonb("ia_analyse"),            // Détails analyse IA
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- NOTIFICATIONS FINANCE+ ---
export const finplusNotifications = pgTable("finplus_notifications", {
  id: serial("id").primaryKey(),
  contratId: integer("contrat_id").notNull(),
  clientId: integer("client_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(), // 30j, 15j, 7j, 3j, jour_j, retard, paiement_recu, contrat_termine
  titre: varchar("titre", { length: 256 }),
  message: text("message"),
  lu: boolean("lu").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- VÉHICULES FINANCÉS (suivi télématique futur) ---
export const finplusVehicules = pgTable("finplus_vehicules", {
  id: serial("id").primaryKey(),
  contratId: integer("contrat_id").notNull(),
  annonceId: integer("annonce_id"),
  gpsDeviceId: varchar("gps_device_id", { length: 128 }),
  financeStatus: varchar("finance_status", { length: 32 }).default("actif"),
  immobilizerStatus: varchar("immobilizer_status", { length: 32 }).default("inactif"),
  lastVehiclePosition: jsonb("last_vehicle_position"), // { lat, lng, timestamp }
  paymentStatus: varchar("payment_status", { length: 32 }).default("a_jour"),
  // Suivi temps réel (futur)
  kilometrage: integer("kilometrage"),
  niveauBatterie: integer("niveau_batterie"),  // pourcentage si disponible
  alerteEntretien: boolean("alerte_entretien").default(false),
  historiqueDeplacements: jsonb("historique_deplacements"), // array of {lat, lng, timestamp}
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- LOG ACTIONS (traçabilité immobilisation) ---
export const finplusActionLogs = pgTable("finplus_action_logs", {
  id: serial("id").primaryKey(),
  contratId: integer("contrat_id"),
  vehiculeId: integer("vehicule_id"),
  adminId: integer("admin_id"),
  action: varchar("action", { length: 64 }).notNull(), // immobilisation_demandee, immobilisation_validee, reactivation, paiement_recu, etc.
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
