// ===== MODULE: VO INTERNE MKA.P-MS =====
// Cycle complet d'un véhicule d'occasion acheté par MKA.P-MS :
// Achat → Transport → Réception → Diagnostic → Pièces/Devis → Réparation →
// Lavage → Destination (Vente/Location/Export/Stock) → Documents → Compta → Archive
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

export const voStatusEnum = pgEnum("vo_status", [
  "achat_enregistre",
  "en_attente_recuperation",
  "en_cours_transport",
  "vehicule_recu",
  "diagnostic_en_cours",
  "diagnostic_termine",
  "en_attente_pieces",
  "en_reparation",
  "reparation_terminee",
  "controle_final",
  "preparation_esthetique",
  "pret",
  "en_vente",
  "en_location",
  "vendu",
  "loue",
  "exporte",
  "stock_interne",
  "a_revoir",
  "archive",
]);

export const voModeAchatEnum = pgEnum("vo_mode_achat", [
  "auto1",
  "fournisseur",
  "particulier",
  "pro",
  "enchere",
  "depot_vente",
  "autre",
]);

export const voDestinationEnum = pgEnum("vo_destination", [
  "vente",
  "location",
  "vente_directe",
  "export_africa",
  "stock_interne",
  "a_revoir",
]);

export const voDiagResultEnum = pgEnum("vo_diag_result", [
  "ok",
  "a_reparer",
  "a_controler",
  "piece_a_commander",
]);

export const voDocCategoryEnum = pgEnum("vo_doc_category", [
  "facture_achat",
  "bon_commande",
  "certificat_cession",
  "carte_grise",
  "controle_technique",
  "photo_achat",
  "preuve_paiement",
  "facture_transport",
  "bon_enlevement",
  "bon_livraison",
  "rapport_diagnostic",
  "photo_defaut",
  "devis_interne",
  "facture_piece",
  "bon_commande_piece",
  "photo_avant_reparation",
  "photo_apres_reparation",
  "facture_lavage",
  "photo_avant_lavage",
  "photo_apres_lavage",
  "facture_vente",
  "contrat_vente",
  "piece_identite_acheteur",
  "contrat_location",
  "assurance",
  "etat_lieux",
  "autre",
]);

// ── Tables ─────────────────────────────────────────────────────────────

export const voVehicules = pgTable("vo_vehicules", {
  id: serial("id").primaryKey(),
  immatriculation: varchar("immatriculation", { length: 32 }),
  vin: varchar("vin", { length: 32 }),
  marque: varchar("marque", { length: 64 }).notNull(),
  modele: varchar("modele", { length: 128 }).notNull(),
  version: varchar("version", { length: 128 }),
  annee: integer("annee"),
  kilometrage: integer("kilometrage"),
  kilometrageReception: integer("kilometrage_reception"),
  carburant: varchar("carburant", { length: 32 }),
  boiteVitesse: varchar("boite_vitesse", { length: 32 }),
  couleur: varchar("couleur", { length: 32 }),
  puissance: varchar("puissance", { length: 32 }),
  niveauCarburant: varchar("niveau_carburant", { length: 16 }),
  etatCarrosserie: varchar("etat_carrosserie", { length: 32 }),
  etatInterieur: varchar("etat_interieur", { length: 32 }),
  // Achat
  prixAchat: numeric("prix_achat", { precision: 12, scale: 2 }),
  fournisseur: varchar("fournisseur", { length: 128 }),
  modeAchat: voModeAchatEnum("mode_achat"),
  dateAchat: timestamp("date_achat"),
  lieuAchat: varchar("lieu_achat", { length: 255 }),
  // Transport
  coutTransport: numeric("cout_transport", { precision: 10, scale: 2 }),
  transporteur: varchar("transporteur", { length: 128 }),
  adresseDepart: varchar("adresse_depart", { length: 255 }),
  adresseArrivee: varchar("adresse_arrivee", { length: 255 }),
  dateRecupPrevue: timestamp("date_recup_prevue"),
  dateReception: timestamp("date_reception"),
  responsableTransport: varchar("responsable_transport", { length: 128 }),
  // Coûts cumulés
  coutReparation: numeric("cout_reparation", { precision: 12, scale: 2 }).default("0"),
  coutPieces: numeric("cout_pieces", { precision: 12, scale: 2 }).default("0"),
  coutMainOeuvre: numeric("cout_main_oeuvre", { precision: 12, scale: 2 }).default("0"),
  coutLavage: numeric("cout_lavage", { precision: 12, scale: 2 }).default("0"),
  coutTotal: numeric("cout_total", { precision: 12, scale: 2 }).default("0"),
  // Destination
  destination: voDestinationEnum("destination"),
  prixVente: numeric("prix_vente", { precision: 12, scale: 2 }),
  prixVenteEffectif: numeric("prix_vente_effectif", { precision: 12, scale: 2 }),
  margeBrute: numeric("marge_brute", { precision: 12, scale: 2 }),
  margeNette: numeric("marge_nette", { precision: 12, scale: 2 }),
  dateVente: timestamp("date_vente"),
  acheteurNom: varchar("acheteur_nom", { length: 128 }),
  acheteurId: integer("acheteur_id"),
  annonceId: integer("annonce_id"),
  // Location
  prixJour: numeric("prix_jour", { precision: 8, scale: 2 }),
  prixSemaine: numeric("prix_semaine", { precision: 8, scale: 2 }),
  prixMois: numeric("prix_mois", { precision: 10, scale: 2 }),
  caution: numeric("caution", { precision: 10, scale: 2 }),
  kmInclus: integer("km_inclus"),
  // Meta
  status: voStatusEnum("status").notNull().default("achat_enregistre"),
  description: text("description"),
  equipements: text("equipements"),
  garantie: varchar("garantie", { length: 128 }),
  badgeOfficiel: boolean("badge_officiel").default(true),
  createdBy: integer("created_by"),
  agentId: integer("agent_id"),
  siteId: integer("site_id"),
  dureeStock: integer("duree_stock"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Documents rattachés à un véhicule VO
export const voDocuments = pgTable("vo_documents", {
  id: serial("id").primaryKey(),
  vehiculeId: integer("vehicule_id").notNull(),
  category: voDocCategoryEnum("category").notNull(),
  etape: varchar("etape", { length: 64 }),
  nom: varchar("nom", { length: 255 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mime_type", { length: 64 }),
  taille: integer("taille"),
  uploadedBy: integer("uploaded_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Historique des étapes (timeline)
export const voEtapes = pgTable("vo_etapes", {
  id: serial("id").primaryKey(),
  vehiculeId: integer("vehicule_id").notNull(),
  status: voStatusEnum("status").notNull(),
  statusLabel: varchar("status_label", { length: 128 }).notNull(),
  responsable: varchar("responsable", { length: 128 }),
  commentaire: text("commentaire"),
  docsObligatoires: jsonb("docs_obligatoires"),
  docsPresents: jsonb("docs_presents"),
  validePar: integer("valide_par"),
  dateValidation: timestamp("date_validation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Diagnostics
export const voDiagnostics = pgTable("vo_diagnostics", {
  id: serial("id").primaryKey(),
  vehiculeId: integer("vehicule_id").notNull(),
  categorie: varchar("categorie", { length: 64 }).notNull(),
  resultat: voDiagResultEnum("resultat").notNull(),
  detail: text("detail"),
  codeDefaut: varchar("code_defaut", { length: 32 }),
  photoUrl: text("photo_url"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Réparations / ordres de réparation
export const voReparations = pgTable("vo_reparations", {
  id: serial("id").primaryKey(),
  vehiculeId: integer("vehicule_id").notNull(),
  prestation: varchar("prestation", { length: 255 }).notNull(),
  mecanicien: varchar("mecanicien", { length: 128 }),
  piecesUtilisees: text("pieces_utilisees"),
  tempsMainOeuvre: numeric("temps_main_oeuvre", { precision: 6, scale: 2 }),
  coutPieces: numeric("cout_pieces", { precision: 10, scale: 2 }).default("0"),
  coutMainOeuvre: numeric("cout_main_oeuvre", { precision: 10, scale: 2 }).default("0"),
  coutTotal: numeric("cout_total", { precision: 10, scale: 2 }).default("0"),
  photoAvant: text("photo_avant"),
  photoApres: text("photo_apres"),
  status: varchar("status", { length: 32 }).default("en_attente"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Lavage / préparation esthétique
export const voLavage = pgTable("vo_lavage", {
  id: serial("id").primaryKey(),
  vehiculeId: integer("vehicule_id").notNull(),
  lavageInterieur: boolean("lavage_interieur").default(false),
  lavageExterieur: boolean("lavage_exterieur").default(false),
  detailing: boolean("detailing").default(false),
  renovationOptique: boolean("renovation_optique").default(false),
  nettoyageMoteur: boolean("nettoyage_moteur").default(false),
  photoAvant: text("photo_avant"),
  photoApres: text("photo_apres"),
  cout: numeric("cout", { precision: 10, scale: 2 }).default("0"),
  prestataireExterne: boolean("prestataire_externe").default(false),
  factureUrl: text("facture_url"),
  status: varchar("status", { length: 32 }).default("a_faire"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
