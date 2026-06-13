// AUTO-GENERATED clean PostgreSQL schema for MKA.P-MS — Auto Plus Africa
// Reproduces the production data model (single owned database).
import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  date,
  doublePrecision,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  real,
  serial,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ===== ENUMS =====
export const accountTypeEnum = pgEnum("account_type", ["particulier", "professionnel"]);
export const annonceBoiteEnum = pgEnum("annonce_boite", ["manuelle", "automatique", "semi_automatique"]);
export const annonceCarburantEnum = pgEnum("annonce_carburant", ["essence", "diesel", "electrique", "hybride", "hybride_rechargeable", "gpl", "hydrogene", "ethanol", "autre"]);
export const annonceCategorieEnum = pgEnum("annonce_categorie", ["citadine", "berline", "break", "suv", "coupe", "cabriolet", "monospace", "utilitaire", "camion", "moto", "scooter", "quad", "luxe", "autre"]);
export const annonceEtatEnum = pgEnum("annonce_etat", ["neuf", "occasion", "demonstration", "accidente"]);
export const annonceFamilleEnum = pgEnum("annonce_famille", ["auto", "moto"]);
export const annonceOptionTypeEnum = pgEnum("annonce_option_type", ["annonce_urgente", "boost_7j", "boost_15j", "boost_30j", "mise_avant_categorie", "mise_avant_accueil", "photo_pack"]);
export const annonceStatusEnum = pgEnum("annonce_status", ["brouillon", "en_validation", "publiee", "vendue", "louee", "expiree", "refusee", "archivee"]);
export const annonceTypeEnum = pgEnum("annonce_type", ["vente", "location"]);
export const annonceVendeurTypeEnum = pgEnum("annonce_vendeur_type", ["particulier", "professionnel", "concession"]);
// Partie 11 — flotte : propriété du véhicule (plateforme / partenaire / client).
export const annonceOwnershipEnum = pgEnum("annonce_ownership", ["client", "plateforme", "partenaire"]);
export const availabilityEnum = pgEnum("availability", ["available", "soon", "sold"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "accepted", "rejected", "cancelled", "completed"]);
export const bookingTypeEnum = pgEnum("booking_type", ["test_drive", "rental", "purchase_visit"]);
export const boostTypeEnum = pgEnum("boost_type", ["none", "boost_7d", "boost_30d", "premium_30d"]);
export const cautionStatusEnum = pgEnum("caution_status", ["none", "pending", "paid", "released", "captured"]);
export const changeRequestStatusEnum = pgEnum("change_request_status", ["pending", "approved", "rejected"]);
export const conversationStatusEnum = pgEnum("conversation_status", ["active", "archived", "blocked"]);
export const devisGarageStatusEnum = pgEnum("devis_garage_status", ["nouveau", "recu_par_garages", "offres_recues", "accepte", "refuse", "annule", "termine"]);
export const devisStatusEnum = pgEnum("devis_status", ["brouillon", "envoye", "accepte", "refuse", "termine", "expire"]);
export const factureStatusEnum = pgEnum("facture_status", ["brouillon", "envoyee", "payee", "en_retard", "annulee"]);
export const financeCategoryEnum = pgEnum("finance_category", ["vente_vehicule", "abonnement", "commission", "reservation", "prestation", "option", "acompte_rdv", "autre_entree", "achat_vehicule", "achat_piece", "carburant", "publicite", "materiel", "assurance", "frais_administratifs", "salaire", "prestataire", "remboursement", "depense", "autre_sortie"]);
export const financeDocCategoryEnum = pgEnum("finance_doc_category", ["facture_fournisseur", "facture_vente", "justificatif", "contrat", "releve", "autre"]);
export const financeFlowEnum = pgEnum("finance_flow", ["entree", "sortie"]);
export const fuelEnum = pgEnum("fuel", ["essence", "diesel", "hybrid", "electric", "gpl", "other"]);
export const garagePublicStatusEnum = pgEnum("garage_public_status", ["en_attente", "valide", "refuse", "suspendu"]);
export const garageStatusEnum = pgEnum("garage_status", ["pending", "active", "rejected", "suspended"]);
export const garageTypeEnum = pgEnum("garage_type", ["concession", "pro", "franchise", "independent"]);
export const interventionStatusEnum = pgEnum("intervention_status", ["planifiee", "en_cours", "terminee", "annulee"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "issued", "paid", "cancelled"]);
export const kycDocTypeEnum = pgEnum("kyc_doc_type", ["piece_identite", "permis_conduire", "justificatif_domicile", "kbis", "rib", "carte_grise", "controle_technique", "autre"]);
export const kycStatusEnum = pgEnum("kyc_status", ["non_demarre", "en_cours", "en_validation", "valide", "refuse", "expire"]);
export const locationSegmentEnum = pgEnum("location_segment", ["particulier", "professionnel", "vtc_taxi"]);
export const locationStatusEnum = pgEnum("location_status", ["demande", "acceptee", "refusee", "payee", "en_cours", "terminee", "annulee", "litige"]);
export const messageStatusEnum = pgEnum("message_status", ["envoye", "lu", "archive"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded", "cancelled"]);
export const paymentTypeEnum = pgEnum("payment_type", ["rental_caution", "society_acompte", "pro_subscription", "franchise_subscription", "vehicle_boost"]);
export const plateLookupTypeEnum = pgEnum("plate_lookup_type", ["plate", "vin"]);
export const proCategoryEnum = pgEnum("pro_category", ["garage", "concessionnaire", "marchand", "revendeur", "loueur", "convoyeur", "expert_auto", "centre_ct", "fournisseur_pieces", "carrossier", "depanneur", "autre"]);
export const quoteStatusEnum = pgEnum("quote_status", ["pending", "accepted", "rejected", "expired", "draft"]);
export const rdvStatusEnum = pgEnum("rdv_status", ["en_attente", "confirme", "honore", "annule_client", "annule_garage", "no_show"]);
export const rdvTypeEnum = pgEnum("rdv_type", ["visite", "intervention"]);
export const rentalApplicantTypeEnum = pgEnum("rental_applicant_type", ["individual", "society", "vtc", "taxi"]);
export const rentalApplicationStatusEnum = pgEnum("rental_application_status", ["draft", "submitted", "approved", "rejected", "paid", "completed"]);
export const reportStatusEnum = pgEnum("report_status", ["ouvert", "en_cours", "traite", "rejete"]);
export const reviewTargetEnum = pgEnum("review_target", ["vendeur", "garage", "loueur", "livreur", "vtc_taxi", "boutique_pieces", "annonce"]);
export const saleTypeEnum = pgEnum("sale_type", ["sale", "rental", "leasing", "loa"]);
export const staffPositionEnum = pgEnum("staff_position", ["pdg", "directeur", "adjoint", "gerant", "chef_equipe", "agent"]);
export const subscriptionCategoryEnum = pgEnum("subscription_category", ["pro_subscription", "franchise_subscription", "particulier_boost"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["particulier_free", "boost_7j", "boost_30j", "premium_30j", "pro_starter", "pro_business", "pro_premium", "franchise", "pro_start", "pro_elite", "pro_max", "garage_start", "garage_premium", "garage_elite", "garage_max", "loc_start", "loc_premium", "loc_elite", "loc_max", "vtc_start", "vtc_premium", "vtc_elite", "vtc_max", "pieces_boutique", "pieces_start", "pieces_premium", "pieces_elite", "pieces_max", "livraison_start", "livraison_premium", "livraison_elite"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["pending", "active", "cancelled", "past_due", "expired"]);
export const transmissionEnum = pgEnum("transmission", ["manual", "auto"]);
export const universEnum = pgEnum("univers", ["vente_pro", "garage", "location", "vtc_taxi", "pieces", "livraison"]);
export const uploadTypeEnum = pgEnum("upload_type", ["image", "document"]);
export const userRoleEnum = pgEnum("user_role", ["user", "pro", "garage", "employee", "society", "admin", "super_admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "deleted"]);
export const vehicleStatusEnum = pgEnum("vehicle_status", ["pending", "active", "sold", "rejected", "expired", "draft"]);
export const vehiculeStatusEnum = pgEnum("vehicule_status", ["disponible", "vendu", "reserve", "en_preparation"]);

// ===== TABLES =====
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id"),
  action: varchar("action", { length: 64 }).notNull(),
  targetType: varchar("target_type", { length: 32 }),
  targetId: integer("target_id"),
  metadata: text("metadata"),
  ipAddress: varchar("ip_address", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const alerts = pgTable("alerts", {
  brand: text("brand"),
  category: text("category"),
  frequency: text("frequency"),
  fuelType: text("fuel_type"),
  isActive: text("is_active"),
  location: text("location"),
  maxMileage: text("max_mileage"),
});

export const annonceOptions = pgTable("annonce_options", {
  id: serial("id").primaryKey(),
  annonceId: integer("annonce_id").notNull(),
  userId: integer("user_id").notNull(),
  optionType: annonceOptionTypeEnum("option_type").notNull(),
  optionCode: varchar("option_code", { length: 64 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  paymentId: integer("payment_id"),
  activeUntil: timestamp("active_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const annoncePhotos = pgTable("annonce_photos", {
  id: serial("id").primaryKey(),
  annonceId: integer("annonce_id").notNull(),
  url: text("url").notNull(),
  ordre: integer("ordre").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const annonces = pgTable("annonces", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 24 }).unique(), // réf unique annonce (ex: MKA-A-000123)
  ownerId: integer("owner_id").notNull(),
  type: annonceTypeEnum("type").notNull().default("vente"),
  status: annonceStatusEnum("status").notNull().default("publiee"),
  titre: varchar("titre", { length: 255 }).notNull(),
  description: text("description"),
  marque: varchar("marque", { length: 64 }).notNull(),
  modele: varchar("modele", { length: 128 }).notNull(),
  version: varchar("version", { length: 128 }),
  categorie: annonceCategorieEnum("categorie").notNull().default("berline"),
  etat: annonceEtatEnum("etat").notNull().default("occasion"),
  carburant: annonceCarburantEnum("carburant").notNull().default("essence"),
  boite: annonceBoiteEnum("boite").notNull().default("manuelle"),
  annee: integer("annee"),
  kilometrage: integer("kilometrage"),
  couleur: varchar("couleur", { length: 64 }),
  puissanceCv: integer("puissance_cv"),
  portes: integer("portes"),
  places: integer("places"),
  prix: numeric("prix", { precision: 12, scale: 2 }).notNull().default("0"),
  prixJour: numeric("prix_jour", { precision: 12, scale: 2 }),
  prixSemaine: numeric("prix_semaine", { precision: 12, scale: 2 }),
  prixMois: numeric("prix_mois", { precision: 12, scale: 2 }),
  devise: varchar("devise", { length: 4 }).notNull().default("EUR"),
  negociable: boolean("negociable").notNull().default(true),
  ville: varchar("ville", { length: 128 }),
  pays: varchar("pays", { length: 4 }).default("FR"),
  codePostal: varchar("code_postal", { length: 16 }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  contactNom: varchar("contact_nom", { length: 128 }),
  contactTelephone: varchar("contact_telephone", { length: 32 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  boosted: boolean("boosted").notNull().default(false),
  boostedUntil: timestamp("boosted_until"),
  vues: integer("vues").notNull().default(0),
  contacts: integer("contacts").notNull().default(0),
  favoris: integer("favoris").notNull().default(0),
  publishedAt: timestamp("published_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  famille: annonceFamilleEnum("famille").notNull().default("auto"),
  segmentLocation: locationSegmentEnum("segment_location"),
  vendeurType: annonceVendeurTypeEnum("vendeur_type").notNull().default("particulier"),
  slug: varchar("slug", { length: 255 }),
  videos: text("videos"),
  urgent: boolean("urgent").notNull().default(false),
  urgentUntil: timestamp("urgent_until"),
  miseAvantCategorie: boolean("mise_avant_categorie").notNull().default(false),
  miseAvantCategorieUntil: timestamp("mise_avant_categorie_until"),
  miseAvantAccueil: boolean("mise_avant_accueil").notNull().default(false),
  miseAvantAccueilUntil: timestamp("mise_avant_accueil_until"),
  photosQuota: integer("photos_quota").notNull().default(4),
  // Label qualité « Sélection MKA.P-MS » — certifié par la Direction (PDG).
  selectionMka: boolean("selection_mka").notNull().default(false),
  selectionMkaBy: integer("selection_mka_by"),
  selectionMkaAt: timestamp("selection_mka_at"),
  // Partie 11 — flotte MKA.P-MS.
  ownership: annonceOwnershipEnum("ownership").notNull().default("client"),
});

export const auditLogs = pgTable("audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorId: bigint("actor_id", { mode: "number" }),
  action: varchar("action", { length: 128 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }),
  entityId: bigint("entity_id", { mode: "number" }),
  metadata: jsonb("metadata"),
  // Partie 7 — traçabilité : appareil + adresse IP de l'auteur.
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: varchar("user_agent", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  vehicleId: bigint("vehicle_id", { mode: "number" }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  garageId: bigint("garage_id", { mode: "number" }),
  type: bookingTypeEnum("type").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  status: bookingStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  message: text("message"),
  cautionAmount: numeric("caution_amount", { precision: 12, scale: 2 }),
  cautionCurrency: varchar("caution_currency", { length: 8 }),
  cautionStatus: cautionStatusEnum("caution_status").notNull().default("none"),
  cautionStripeSessionId: varchar("caution_stripe_session_id", { length: 256 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const changeRequests = pgTable("change_requests", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  currentValue: text("current_value"),
  requestedValue: text("requested_value"),
  message: text("message"),
  status: changeRequestStatusEnum("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  postalCode: varchar("postal_code", { length: 16 }),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  firstName: varchar("first_name", { length: 128 }).notNull(),
  lastName: varchar("last_name", { length: 128 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  addressLine: varchar("address_line", { length: 255 }),
  city: varchar("city", { length: 128 }),
  postalCode: varchar("postal_code", { length: 16 }),
  country: varchar("country", { length: 4 }).default("FR"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  vehicleId: bigint("vehicle_id", { mode: "number" }),
  garageId: bigint("garage_id", { mode: "number" }),
  buyerId: bigint("buyer_id", { mode: "number" }).notNull(),
  sellerId: bigint("seller_id", { mode: "number" }).notNull(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  buyerUnread: integer("buyer_unread").notNull().default(0),
  sellerUnread: integer("seller_unread").notNull().default(0),
  status: conversationStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const devis = pgTable("devis", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  numero: varchar("numero", { length: 32 }).notNull(),
  clientId: integer("client_id"),
  vehiculeId: integer("vehicule_id"),
  titre: varchar("titre", { length: 255 }).notNull(),
  description: text("description"),
  status: devisStatusEnum("status").notNull().default("brouillon"),
  totalHt: numeric("total_ht", { precision: 12, scale: 2 }).notNull().default("0"),
  totalTva: numeric("total_tva", { precision: 12, scale: 2 }).notNull().default("0"),
  totalTtc: numeric("total_ttc", { precision: 12, scale: 2 }).notNull().default("0"),
  tauxTva: numeric("taux_tva", { precision: 5, scale: 2 }).notNull().default("20"),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const devisGarageRequests = pgTable("devis_garage_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  contactNom: varchar("contact_nom", { length: 128 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactTelephone: varchar("contact_telephone", { length: 32 }),
  vehiculeMarque: varchar("vehicule_marque", { length: 64 }),
  vehiculeModele: varchar("vehicule_modele", { length: 128 }),
  vehiculeAnnee: integer("vehicule_annee"),
  immatriculation: varchar("immatriculation", { length: 32 }),
  typeIntervention: varchar("type_intervention", { length: 128 }).notNull(),
  description: text("description"),
  ville: varchar("ville", { length: 128 }),
  codePostal: varchar("code_postal", { length: 16 }),
  pays: varchar("pays", { length: 4 }).default("FR"),
  photos: text("photos"),
  status: devisGarageStatusEnum("status").notNull().default("nouveau"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const devisItems = pgTable("devis_items", {
  id: serial("id").primaryKey(),
  devisId: integer("devis_id").notNull(),
  designation: varchar("designation", { length: 255 }).notNull(),
  quantite: numeric("quantite", { precision: 10, scale: 2 }).notNull().default("1"),
  prixUnitaireHt: numeric("prix_unitaire_ht", { precision: 12, scale: 2 }).notNull(),
  ordre: integer("ordre").notNull().default(0),
  type: varchar("type", { length: 16 }).notNull().default("main_oeuvre"),
  catalogId: integer("catalog_id"),
});

export const factures = pgTable("factures", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  numero: varchar("numero", { length: 32 }).notNull(),
  clientId: integer("client_id"),
  devisId: integer("devis_id"),
  interventionId: integer("intervention_id"),
  status: factureStatusEnum("status").notNull().default("brouillon"),
  totalHt: numeric("total_ht", { precision: 12, scale: 2 }).notNull().default("0"),
  totalTva: numeric("total_tva", { precision: 12, scale: 2 }).notNull().default("0"),
  totalTtc: numeric("total_ttc", { precision: 12, scale: 2 }).notNull().default("0"),
  paidAt: timestamp("paid_at"),
  dueAt: timestamp("due_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const favoris = pgTable("favoris", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  annonceId: integer("annonce_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const financeDocuments = pgTable("finance_documents", {
  id: serial("id").primaryKey(),
  category: financeDocCategoryEnum("category").notNull().default("justificatif"),
  title: varchar("title", { length: 255 }).notNull(),
  transactionId: integer("transaction_id"),
  userId: integer("user_id"),
  fileName: varchar("file_name", { length: 255 }),
  mimeType: varchar("mime_type", { length: 120 }),
  sizeBytes: integer("size_bytes"),
  fileData: text("file_data"),
  amountTtc: numeric("amount_ttc", { precision: 14, scale: 2 }),
  amountHt: numeric("amount_ht", { precision: 14, scale: 2 }),
  tvaAmount: numeric("tva_amount", { precision: 14, scale: 2 }),
  tvaRate: numeric("tva_rate", { precision: 5, scale: 2 }),
  currency: varchar("currency", { length: 4 }).default("EUR"),
  supplier: varchar("supplier", { length: 255 }),
  note: text("note"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const financeTransactions = pgTable("finance_transactions", {
  id: serial("id").primaryKey(),
  flow: financeFlowEnum("flow").notNull(),
  category: financeCategoryEnum("category").notNull(),
  univers: universEnum("univers"),
  amountTtc: numeric("amount_ttc", { precision: 14, scale: 2 }).notNull(),
  amountHt: numeric("amount_ht", { precision: 14, scale: 2 }),
  tvaAmount: numeric("tva_amount", { precision: 14, scale: 2 }),
  tvaRate: numeric("tva_rate", { precision: 5, scale: 2 }),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  label: varchar("label", { length: 255 }).notNull(),
  paymentId: integer("payment_id"),
  userId: integer("user_id"),
  sourceType: varchar("source_type", { length: 40 }),
  sourceRef: varchar("source_ref", { length: 128 }),
  vehiculeInterneId: integer("vehicule_interne_id"),
  note: text("note"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const garages = pgTable("garages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  ownerId: bigint("owner_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  postalCode: varchar("postal_code", { length: 16 }),
  country: varchar("country", { length: 64 }),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  website: text("website"),
  hours: jsonb("hours"),
  type: garageTypeEnum("type").notNull().default("pro"),
  status: garageStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const garagesPublics = pgTable("garages_publics", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id"),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  addressLine: varchar("address_line", { length: 255 }),
  city: varchar("city", { length: 128 }),
  postalCode: varchar("postal_code", { length: 16 }),
  country: varchar("country", { length: 4 }).default("FR"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  hours: text("hours"),
  services: text("services"),
  specialites: text("specialites"),
  status: garagePublicStatusEnum("status").notNull().default("valide"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  garage: text("garage"),
  intervention: text("intervention"),
  issuedAt: text("issued_at"),
  pdfFile: text("pdf_file"),
  totalTtc: text("total_ttc"),
  creationDate: text("creation_date"),
  modifiedDate: text("modified_date"),
});

export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  docType: kycDocTypeEnum("doc_type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }),
  mimeType: varchar("mime_type", { length: 64 }),
  sizeBytes: integer("size_bytes"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const kycProfiles = pgTable("kyc_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: kycStatusEnum("status").notNull().default("non_demarre"),
  submittedAt: timestamp("submitted_at"),
  validatedAt: timestamp("validated_at"),
  validatedBy: integer("validated_by"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const locationCalendar = pgTable("location_calendar", {
  id: serial("id").primaryKey(),
  annonceId: integer("annonce_id").notNull(),
  date: timestamp("date").notNull(),
  blocked: boolean("blocked").notNull().default(false),
  locationId: integer("location_id"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  annonceId: integer("annonce_id").notNull(),
  locataireId: integer("locataire_id").notNull(),
  loueurId: integer("loueur_id").notNull(),
  status: locationStatusEnum("status").notNull().default("demande"),
  dateDebut: timestamp("date_debut").notNull(),
  dateFin: timestamp("date_fin").notNull(),
  nbJours: integer("nb_jours").notNull(),
  prixJournalier: numeric("prix_journalier", { precision: 12, scale: 2 }).notNull(),
  montantLocation: numeric("montant_location", { precision: 12, scale: 2 }).notNull(),
  montantCaution: numeric("montant_caution", { precision: 12, scale: 2 }).notNull().default("0"),
  montantAssurance: numeric("montant_assurance", { precision: 12, scale: 2 }).notNull().default("0"),
  montantTotal: numeric("montant_total", { precision: 12, scale: 2 }).notNull(),
  devise: varchar("devise", { length: 4 }).notNull().default("EUR"),
  paymentId: integer("payment_id"),
  contratUrl: text("contrat_url"),
  etatDepartUrl: text("etat_depart_url"),
  etatRetourUrl: text("etat_retour_url"),
  kmDepart: integer("km_depart"),
  kmRetour: integer("km_retour"),
  kmInclus: integer("km_inclus").default(200),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messageThreads = pgTable("message_threads", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  annonceId: integer("annonce_id"),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  status: messageStatusEnum("status").notNull().default("envoye"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  type: paymentTypeEnum("type").notNull(),
  bookingId: bigint("booking_id", { mode: "number" }),
  rentalApplicationId: bigint("rental_application_id", { mode: "number" }),
  subscriptionId: bigint("subscription_id", { mode: "number" }),
  vehicleId: bigint("vehicle_id", { mode: "number" }),
  stripeSessionId: varchar("stripe_session_id", { length: 256 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 256 }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pieces = pgTable("pieces", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  reference: varchar("reference", { length: 64 }).notNull(),
  designation: varchar("designation", { length: 255 }).notNull(),
  description: text("description"),
  prixAchat: numeric("prix_achat", { precision: 12, scale: 2 }),
  prixVente: numeric("prix_vente", { precision: 12, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  stockMin: integer("stock_min").notNull().default(0),
  fournisseur: varchar("fournisseur", { length: 255 }),
  emplacement: varchar("emplacement", { length: 128 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ===== BOUTIQUE PIÈCES AUTO PROFESSIONNELLE (Mini-ERP) =====

export const partsShopTypeEnum = pgEnum("parts_shop_type", [
  "magasin_pieces", "casse_auto", "grossiste", "distributeur", "centre_auto", "garage_vendeur",
]);
export const partsConditionEnum = pgEnum("parts_condition", [
  "neuf", "occasion", "reconditionne", "echange_standard",
]);
export const partsOrderStatusEnum = pgEnum("parts_order_status", [
  "panier", "confirme", "preparation", "expedie", "livre", "termine", "annule",
]);
export const partsInvoiceTypeEnum = pgEnum("parts_invoice_type", [
  "devis", "bon_commande", "facture", "avoir", "recu",
]);
export const partsInvoiceStatusEnum = pgEnum("parts_invoice_status", [
  "brouillon", "emis", "paye", "annule",
]);

export const partsShops = pgTable("parts_shops", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  nom: varchar("nom", { length: 255 }).notNull(),
  type: partsShopTypeEnum("type").notNull().default("magasin_pieces"),
  description: text("description"),
  adresse: text("adresse"),
  ville: varchar("ville", { length: 128 }),
  codePostal: varchar("code_postal", { length: 16 }),
  countryCode: varchar("country_code", { length: 4 }).default("FR"),
  telephone: varchar("telephone", { length: 32 }),
  email: varchar("email", { length: 255 }),
  siret: varchar("siret", { length: 32 }),
  logoUrl: text("logo_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const partsSites = pgTable("parts_sites", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull(),
  nom: varchar("nom", { length: 255 }).notNull(),
  type: varchar("type", { length: 32 }).notNull().default("entrepot"),
  adresse: text("adresse"),
  ville: varchar("ville", { length: 128 }),
  codePostal: varchar("code_postal", { length: 16 }),
  countryCode: varchar("country_code", { length: 4 }).default("FR"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const partsCatalog = pgTable("parts_catalog", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull(),
  nom: varchar("nom", { length: 255 }).notNull(),
  description: text("description"),
  referenceInterne: varchar("reference_interne", { length: 64 }).notNull(),
  referenceOem: varchar("reference_oem", { length: 64 }),
  referenceEquipementier: varchar("reference_equipementier", { length: 64 }),
  codeBarre: varchar("code_barre", { length: 64 }),
  categorie: varchar("categorie", { length: 128 }),
  sousCategorie: varchar("sous_categorie", { length: 128 }),
  marquePiece: varchar("marque_piece", { length: 128 }),
  etat: varchar("etat", { length: 16 }),
  condition: partsConditionEnum("condition").notNull().default("neuf"),
  fournisseurId: integer("fournisseur_id"),
  prixHt: numeric("prix_ht", { precision: 12, scale: 2 }).notNull(),
  prixTtc: numeric("prix_ttc", { precision: 12, scale: 2 }),
  tvaRate: numeric("tva_rate", { precision: 5, scale: 2 }).notNull().default("20"),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  poidsKg: numeric("poids_kg", { precision: 8, scale: 3 }),
  longueurCm: numeric("longueur_cm", { precision: 8, scale: 2 }),
  largeurCm: numeric("largeur_cm", { precision: 8, scale: 2 }),
  hauteurCm: numeric("hauteur_cm", { precision: 8, scale: 2 }),
  photoUrl: text("photo_url"),
  photos: text("photos"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const partsCompatibility = pgTable("parts_compatibility", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").notNull(),
  marque: varchar("marque", { length: 64 }).notNull(),
  modele: varchar("modele", { length: 128 }),
  moteur: varchar("moteur", { length: 64 }),
  anneeDebut: integer("annee_debut"),
  anneeFin: integer("annee_fin"),
});

export const partsStock = pgTable("parts_stock", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").notNull(),
  siteId: integer("site_id"),
  quantite: integer("quantite").notNull().default(0),
  quantiteReservee: integer("quantite_reservee").notNull().default(0),
  seuilMin: integer("seuil_min").notNull().default(2),
  entrepot: varchar("entrepot", { length: 128 }),
  rayon: varchar("rayon", { length: 64 }),
  etagere: varchar("etagere", { length: 64 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const partsOrders = pgTable("parts_orders", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 32 }),
  shopId: integer("shop_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  status: partsOrderStatusEnum("status").notNull().default("panier"),
  totalHt: numeric("total_ht", { precision: 12, scale: 2 }),
  totalTtc: numeric("total_ttc", { precision: 12, scale: 2 }),
  livraisonType: varchar("livraison_type", { length: 32 }),
  livraisonTarif: numeric("livraison_tarif", { precision: 10, scale: 2 }),
  devisId: integer("devis_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const partsOrderItems = pgTable("parts_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  catalogId: integer("catalog_id").notNull(),
  quantite: integer("quantite").notNull(),
  prixUnitaireHt: numeric("prix_unitaire_ht", { precision: 12, scale: 2 }).notNull(),
  totalHt: numeric("total_ht", { precision: 12, scale: 2 }),
});

export const partsInvoices = pgTable("parts_invoices", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id"),
  shopId: integer("shop_id").notNull(),
  buyerId: integer("buyer_id"),
  type: partsInvoiceTypeEnum("type").notNull(),
  reference: varchar("reference", { length: 32 }),
  totalHt: numeric("total_ht", { precision: 12, scale: 2 }),
  totalTva: numeric("total_tva", { precision: 12, scale: 2 }),
  totalTtc: numeric("total_ttc", { precision: 12, scale: 2 }),
  status: partsInvoiceStatusEnum("status").notNull().default("brouillon"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const plateLookups = pgTable("plate_lookups", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  type: plateLookupTypeEnum("type").notNull(),
  query: varchar("query", { length: 64 }).notNull(),
  result: jsonb("result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  key: varchar("key", { length: 64 }).primaryKey().notNull(),
  value: text("value").notNull(),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  number: varchar("number", { length: 64 }).notNull(),
  vehicleId: bigint("vehicle_id", { mode: "number" }),
  garageId: bigint("garage_id", { mode: "number" }),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  status: quoteStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  lines: jsonb("lines"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
  notes: text("notes"),
  pdfUrl: text("pdf_url"),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rdvFidelite = pgTable("rdv_fidelite", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  garageId: integer("garage_id").notNull(),
  nbHonores: integer("nb_honores").notNull().default(0),
  nbNoShow: integer("nb_no_show").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rdvGarage = pgTable("rdv_garage", {
  id: serial("id").primaryKey(),
  garageId: integer("garage_id").notNull(),
  clientId: integer("client_id").notNull(),
  annonceId: integer("annonce_id"),
  type: rdvTypeEnum("type").notNull().default("visite"),
  status: rdvStatusEnum("status").notNull().default("en_attente"),
  dateHeure: timestamp("date_heure").notNull(),
  motif: varchar("motif", { length: 255 }),
  notes: text("notes"),
  acompteCents: integer("acompte_cents").notNull().default(0),
  acomptePaid: boolean("acompte_paid").notNull().default(false),
  paymentId: integer("payment_id"),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  annulePrevenanceOk: boolean("annule_prevenance_ok").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rentalApplications = pgTable("rental_applications", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  token: varchar("token", { length: 128 }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  vehicleId: bigint("vehicle_id", { mode: "number" }),
  garageId: bigint("garage_id", { mode: "number" }),
  applicantType: rentalApplicantTypeEnum("applicant_type").notNull().default("individual"),
  data: jsonb("data"),
  currentStep: integer("current_step").notNull().default(0),
  status: rentalApplicationStatusEnum("status").notNull().default("draft"),
  rejectionReason: text("rejection_reason"),
  depositAmount: numeric("deposit_amount", { precision: 12, scale: 2 }),
  depositCurrency: varchar("deposit_currency", { length: 8 }),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  depositStripeSessionId: varchar("deposit_stripe_session_id", { length: 256 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  targetUserId: integer("target_user_id"),
  targetType: varchar("target_type", { length: 32 }).notNull(),
  targetId: integer("target_id"),
  reason: varchar("reason", { length: 128 }).notNull(),
  details: text("details"),
  status: reportStatusEnum("status").notNull().default("ouvert"),
  handledBy: integer("handled_by"),
  handledAt: timestamp("handled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  bookingId: bigint("booking_id", { mode: "number" }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  garageId: bigint("garage_id", { mode: "number" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  authorId: integer("author_id"),
  targetUserId: integer("target_user_id"),
  targetType: reviewTargetEnum("target_type").default("vendeur"),
  refType: varchar("ref_type", { length: 32 }),
  refId: integer("ref_id"),
  note: integer("note"),
  hidden: boolean("hidden").default(false),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 64 }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptionReminders = pgTable("subscription_reminders", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull(),
  userId: integer("user_id"),
  stage: varchar("stage", { length: 16 }).notNull(),
  periodEnd: timestamp("period_end"),
  channel: varchar("channel", { length: 16 }).notNull().default("email"),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  garageId: bigint("garage_id", { mode: "number" }),
  planCode: varchar("plan_code", { length: 64 }).notNull(),
  category: subscriptionCategoryEnum("category").notNull(),
  stripeSessionId: varchar("stripe_session_id", { length: 256 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 256 }),
  status: subscriptionStatusEnum("status").notNull().default("pending"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  univers: universEnum("univers"),
  quotaAnnonces: integer("quota_annonces"),
  quotaPhotos: integer("quota_photos"),
  quotaVideos: integer("quota_videos"),
  quotaVehicules: integer("quota_vehicules"),
  quotaEmployes: integer("quota_employes"),
  quotaDevisMois: integer("quota_devis_mois"),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  contactNom: varchar("contact_nom", { length: 128 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  sujet: varchar("sujet", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("ouvert"),
  priority: varchar("priority", { length: 16 }).notNull().default("normale"),
  assignedTo: integer("assigned_to"),
  response: text("response"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const uploads = pgTable("uploads", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  type: uploadTypeEnum("type").notNull(),
  category: varchar("category", { length: 64 }),
  url: text("url").notNull(),
  fileKey: varchar("file_key", { length: 256 }).notNull(),
  filename: varchar("filename", { length: 256 }),
  mimeType: varchar("mime_type", { length: 64 }),
  size: integer("size"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userAssurances = pgTable("user_assurances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  vehiculeId: integer("vehicule_id"),
  compagnie: varchar("compagnie", { length: 128 }).notNull(),
  numeroPolice: varchar("numero_police", { length: 64 }),
  formule: varchar("formule", { length: 64 }),
  dateDebut: timestamp("date_debut"),
  dateFin: timestamp("date_fin"),
  primeAnnuelle: numeric("prime_annuelle", { precision: 12, scale: 2 }),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userBlocks = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull(),
  blockedId: integer("blocked_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userDocuments = pgTable("user_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }),
  mimeType: varchar("mime_type", { length: 64 }),
  sizeBytes: integer("size_bytes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 24 }).unique(), // réf unique compte (ex: MKA-U-000123)
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash"),
  googleId: varchar("google_id", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 128 }),
  lastName: varchar("last_name", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  avatarUrl: text("avatar_url"),
  accountType: accountTypeEnum("account_type").notNull().default("particulier"),
  role: userRoleEnum("role").notNull().default("user"),
  companyName: varchar("company_name", { length: 255 }),
  companySiret: varchar("company_siret", { length: 32 }),
  addressLine: varchar("address_line", { length: 255 }),
  city: varchar("city", { length: 128 }),
  postalCode: varchar("postal_code", { length: 16 }),
  country: varchar("country", { length: 4 }).default("FR"),
  currency: varchar("currency", { length: 4 }).default("EUR"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 128 }),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  proCategory: proCategoryEnum("pro_category"),
  staffPosition: staffPositionEnum("staff_position"),
  managerId: integer("manager_id"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorCode: varchar("two_factor_code", { length: 12 }),
  twoFactorExpiresAt: timestamp("two_factor_expires_at"),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  logoUrl: text("logo_url"),
  horaires: text("horaires"),
});

export const vehicleAvailabilitySubscriptions = pgTable("vehicle_availability_subscriptions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  vehicleId: bigint("vehicle_id", { mode: "number" }).notNull(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vehiculeDossiers = pgTable("vehicule_dossiers", {
  id: serial("id").primaryKey(),
  immatriculation: varchar("immatriculation", { length: 32 }),
  vin: varchar("vin", { length: 32 }),
  marque: varchar("marque", { length: 64 }),
  modele: varchar("modele", { length: 128 }),
  annee: integer("annee"),
  dernierKm: integer("dernier_km"),
  indiceConfiance: integer("indice_confiance").notNull().default(50),
  annonceId: integer("annonce_id"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vehiculeHistorique = pgTable("vehicule_historique", {
  id: serial("id").primaryKey(),
  dossierId: integer("dossier_id").notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  titre: varchar("titre", { length: 255 }).notNull(),
  description: text("description"),
  kilometrage: integer("kilometrage"),
  cout: numeric("cout", { precision: 12, scale: 2 }),
  devise: varchar("devise", { length: 4 }).default("EUR"),
  source: varchar("source", { length: 32 }).notNull().default("interne"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vehicules = pgTable("vehicules", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  marque: varchar("marque", { length: 64 }).notNull(),
  modele: varchar("modele", { length: 128 }).notNull(),
  version: varchar("version", { length: 128 }),
  annee: integer("annee"),
  kilometrage: integer("kilometrage"),
  carburant: varchar("carburant", { length: 32 }),
  boite: varchar("boite", { length: 32 }),
  couleur: varchar("couleur", { length: 64 }),
  immatriculation: varchar("immatriculation", { length: 32 }),
  vin: varchar("vin", { length: 32 }),
  prixVente: numeric("prix_vente", { precision: 12, scale: 2 }),
  prixAchat: numeric("prix_achat", { precision: 12, scale: 2 }),
  status: vehiculeStatusEnum("status").notNull().default("disponible"),
  description: text("description"),
  photos: text("photos"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ===== MODULES FÉDÉRÉS (structure modulaire — Plan A→Z) =====
// Chaque univers est défini dans son propre fichier (indépendant, désactivable).
// Re-export ici pour que Drizzle (schema unique) prenne tout en compte.
export * from "./modules/core"; // RBAC configurable, registre modules, i18n
export * from "./modules/pieces"; // Univers Pièces Auto
export * from "./modules/livraison"; // Univers Livraison
export * from "./modules/depannage"; // Univers Dépannage
export * from "./modules/transport"; // Univers VTC / TAXI
export * from "./modules/importafrica"; // Univers Import Africa+
export * from "./modules/wallet"; // Wallet professionnel
export * from "./modules/contracts"; // Contrats intelligents
export * from "./modules/installments"; // Paiement fractionné
export * from "./modules/marketing"; // Marketing / QR codes
export * from "./modules/history"; // Historique véhicule + suggestions/signalements
export * from "./modules/operations"; // Litiges, partenaires, entrepôts, pays (Parties 7-15)
export * from "./modules/future"; // Lavage, Karting, Formation, Financement (futurs)
