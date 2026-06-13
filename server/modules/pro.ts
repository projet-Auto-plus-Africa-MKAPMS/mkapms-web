// ===== MODULE: AMÉLIORATION PRO — VENTE, LOCATION, VTC/TAXI, DOCUMENTS, GPS, FLOTTE, LIVRAISON PIÈCES =====
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

// ─── ENUMS ───────────────────────────────────────────────────

export const proActivityEnum = pgEnum("pro_activity", [
  "vente_pro",
  "location_pro",
  "vtc_taxi",
  "garage_plus",
  "pieces_auto",
  "livraison",
  "depannage",
  "carte_grise",
  "cabinet_comptable",
  "boutique_stock",
]);

export const proDocStatusEnum = pgEnum("pro_doc_status", [
  "envoye",
  "en_analyse",
  "valide",
  "refuse",
  "expire",
  "a_remplacer",
  "suspect",
]);

export const proDocAlertEnum = pgEnum("pro_doc_alert", [
  "j_30",
  "j_15",
  "j_7",
  "jour_j",
  "expire",
]);

export const vtcDriverStatusEnum = pgEnum("vtc_driver_status", [
  "actif",
  "inactif",
  "bloque",
  "en_validation",
  "suspendu",
]);

export const vtcVehicleStatusEnum = pgEnum("vtc_vehicle_status", [
  "disponible",
  "en_service",
  "en_entretien",
  "bloque",
  "indisponible",
]);

export const locationVehicleStatusEnum = pgEnum("location_vehicle_status", [
  "disponible",
  "reserve",
  "loue",
  "en_entretien",
  "bloque",
  "indisponible",
]);

export const gpsConnectionStatusEnum = pgEnum("gps_connection_status", [
  "connecte",
  "deconnecte",
  "erreur",
  "en_attente",
]);

export const deliverySizeCheckEnum = pgEnum("delivery_size_check", [
  "compatible_moto",
  "trop_volumineux",
  "poids_depasse",
  "interdit_moto",
]);

// ─── PRO PROFILES (activité choisie à l'inscription) ────────

export const proProfiles = pgTable("pro_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activity: proActivityEnum("activity").notNull(),
  companyName: varchar("company_name", { length: 255 }),
  siret: varchar("siret", { length: 32 }),
  kbis: text("kbis_url"),
  addressLine: varchar("address_line", { length: 255 }),
  city: varchar("city", { length: 128 }),
  postalCode: varchar("postal_code", { length: 16 }),
  country: varchar("country", { length: 4 }).default("FR"),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  validated: boolean("validated").notNull().default(false),
  validatedAt: timestamp("validated_at"),
  validatedBy: integer("validated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── DOCUMENTS PRO (vérification, alertes) ───────────────────

export const proDocuments = pgTable("pro_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  proProfileId: integer("pro_profile_id"),
  type: varchar("type", { length: 64 }).notNull(), // kbis, identite, permis, carte_vtc, assurance, etc.
  label: varchar("label", { length: 255 }),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }),
  mimeType: varchar("mime_type", { length: 64 }),
  fileSize: integer("file_size"),
  status: proDocStatusEnum("status").notNull().default("envoye"),
  refusMotif: text("refus_motif"),
  expiresAt: timestamp("expires_at"),
  lastAlertSent: proDocAlertEnum("last_alert_sent"),
  lastAlertAt: timestamp("last_alert_at"),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"), // OCR, cohérence, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── VTC / TAXI ──────────────────────────────────────────────

export const vtcSocietes = pgTable("vtc_societes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // propriétaire
  proProfileId: integer("pro_profile_id"),
  nom: varchar("nom", { length: 255 }).notNull(),
  siret: varchar("siret", { length: 32 }),
  kbisUrl: text("kbis_url"),
  assuranceUrl: text("assurance_url"),
  assuranceExpire: timestamp("assurance_expire"),
  adresse: varchar("adresse", { length: 255 }),
  ville: varchar("ville", { length: 128 }),
  codePostal: varchar("code_postal", { length: 16 }),
  telephone: varchar("telephone", { length: 32 }),
  email: varchar("email", { length: 255 }),
  validated: boolean("validated").notNull().default(false),
  validatedAt: timestamp("validated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vtcChauffeurs = pgTable("vtc_chauffeurs", {
  id: serial("id").primaryKey(),
  societeId: integer("societe_id").notNull(),
  userId: integer("user_id"), // si le chauffeur a un compte MKA.P-MS
  nom: varchar("nom", { length: 128 }).notNull(),
  prenom: varchar("prenom", { length: 128 }).notNull(),
  telephone: varchar("telephone", { length: 32 }),
  email: varchar("email", { length: 255 }),
  permisUrl: text("permis_url"),
  permisExpire: timestamp("permis_expire"),
  carteVtcUrl: text("carte_vtc_url"),
  carteVtcExpire: timestamp("carte_vtc_expire"),
  pieceIdentiteUrl: text("piece_identite_url"),
  justificatifDomicileUrl: text("justificatif_domicile_url"),
  assuranceUrl: text("assurance_url"),
  assuranceExpire: timestamp("assurance_expire"),
  status: vtcDriverStatusEnum("status").notNull().default("en_validation"),
  bloqueMotif: text("bloque_motif"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  totalCourses: integer("total_courses").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vtcVehicules = pgTable("vtc_vehicules", {
  id: serial("id").primaryKey(),
  societeId: integer("societe_id").notNull(),
  chauffeurId: integer("chauffeur_id"), // chauffeur assigné
  marque: varchar("marque", { length: 64 }).notNull(),
  modele: varchar("modele", { length: 64 }).notNull(),
  annee: integer("annee"),
  immatriculation: varchar("immatriculation", { length: 20 }),
  vin: varchar("vin", { length: 24 }),
  carteGriseUrl: text("carte_grise_url"),
  assuranceUrl: text("assurance_url"),
  assuranceExpire: timestamp("assurance_expire"),
  controleTechniqueUrl: text("controle_technique_url"),
  controleTechniqueExpire: timestamp("ct_expire"),
  autorisationExploitationUrl: text("autorisation_exploitation_url"),
  status: vtcVehicleStatusEnum("status").notNull().default("disponible"),
  bloqueMotif: text("bloque_motif"),
  kmActuel: integer("km_actuel"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vtcDemandes = pgTable("vtc_demandes", {
  id: serial("id").primaryKey(),
  societeId: integer("societe_id").notNull(),
  clientId: integer("client_id"),
  chauffeurId: integer("chauffeur_id"),
  vehiculeId: integer("vehicule_id"),
  depart: varchar("depart", { length: 255 }),
  arrivee: varchar("arrivee", { length: 255 }),
  dateHeure: timestamp("date_heure"),
  prixEstime: numeric("prix_estime", { precision: 10, scale: 2 }),
  prixFinal: numeric("prix_final", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 32 }).notNull().default("en_attente"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── LOCATION PRO (flotte, calendrier, contrats, états des lieux) ────

export const locationFlotte = pgTable("location_flotte", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // loueur pro
  proProfileId: integer("pro_profile_id"),
  marque: varchar("marque", { length: 64 }).notNull(),
  modele: varchar("modele", { length: 64 }).notNull(),
  version: varchar("version", { length: 128 }),
  annee: integer("annee"),
  immatriculation: varchar("immatriculation", { length: 20 }),
  vin: varchar("vin", { length: 24 }),
  photos: jsonb("photos").default("[]"),
  prixJour: numeric("prix_jour", { precision: 10, scale: 2 }),
  prixSemaine: numeric("prix_semaine", { precision: 10, scale: 2 }),
  prixMois: numeric("prix_mois", { precision: 10, scale: 2 }),
  caution: numeric("caution", { precision: 10, scale: 2 }),
  assuranceIncluse: boolean("assurance_incluse").notNull().default(false),
  kmInclus: integer("km_inclus"), // km inclus par jour
  status: locationVehicleStatusEnum("status").notNull().default("disponible"),
  carteGriseUrl: text("carte_grise_url"),
  assuranceUrl: text("assurance_url"),
  assuranceExpire: timestamp("assurance_expire"),
  controleTechniqueUrl: text("ct_url"),
  controleTechniqueExpire: timestamp("ct_expire"),
  description: text("description"),
  equipements: jsonb("equipements").default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const locationContrats = pgTable("location_contrats", {
  id: serial("id").primaryKey(),
  vehiculeId: integer("vehicule_id").notNull(),
  loueurId: integer("loueur_id").notNull(),
  clientId: integer("client_id").notNull(),
  dateDebut: timestamp("date_debut").notNull(),
  dateFin: timestamp("date_fin").notNull(),
  prixTotal: numeric("prix_total", { precision: 10, scale: 2 }),
  cautionMontant: numeric("caution_montant", { precision: 10, scale: 2 }),
  cautionRendue: boolean("caution_rendue").notNull().default(false),
  kmDepart: integer("km_depart"),
  kmRetour: integer("km_retour"),
  etatDepartPhotos: jsonb("etat_depart_photos").default("[]"),
  etatRetourPhotos: jsonb("etat_retour_photos").default("[]"),
  etatDepartNotes: text("etat_depart_notes"),
  etatRetourNotes: text("etat_retour_notes"),
  contratUrl: text("contrat_url"),
  status: varchar("status", { length: 32 }).notNull().default("en_cours"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const locationCalendrier = pgTable("location_calendrier", {
  id: serial("id").primaryKey(),
  vehiculeId: integer("vehicule_id").notNull(),
  dateDebut: timestamp("date_debut").notNull(),
  dateFin: timestamp("date_fin").notNull(),
  type: varchar("type", { length: 32 }).notNull().default("reservation"), // reservation, entretien, bloque
  contratId: integer("contrat_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── GPS / TÉLÉMATIQUE ───────────────────────────────────────

export const gpsDevices = pgTable("gps_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  vehiculeRef: varchar("vehicule_ref", { length: 64 }), // réf interne véhicule
  fournisseur: varchar("fournisseur", { length: 128 }),
  identifiantBoitier: varchar("identifiant_boitier", { length: 128 }),
  apiEndpoint: varchar("api_endpoint", { length: 512 }),
  apiKey: varchar("api_key", { length: 256 }),
  connectionStatus: gpsConnectionStatusEnum("connection_status").notNull().default("en_attente"),
  dernierePosition: jsonb("derniere_position"), // { lat, lng, timestamp }
  dernierKm: integer("dernier_km"),
  dernierCarburant: numeric("dernier_carburant", { precision: 5, scale: 2 }),
  derniereBatterie: numeric("derniere_batterie", { precision: 5, scale: 2 }),
  alertesActives: jsonb("alertes_actives").default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const gpsHistorique = pgTable("gps_historique", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  km: integer("km"),
  carburant: numeric("carburant", { precision: 5, scale: 2 }),
  batterie: numeric("batterie", { precision: 5, scale: 2 }),
  vitesse: integer("vitesse"),
  etatVehicule: varchar("etat_vehicule", { length: 32 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// ─── LIVRAISON PIÈCES — vérification taille/poids ───────────

export const livraisonPiecesRules = pgTable("livraison_pieces_rules", {
  id: serial("id").primaryKey(),
  categoriePiece: varchar("categorie_piece", { length: 128 }).notNull(),
  poidsMaxKg: numeric("poids_max_kg", { precision: 6, scale: 2 }),
  longueurMaxCm: integer("longueur_max_cm"),
  largeurMaxCm: integer("largeur_max_cm"),
  hauteurMaxCm: integer("hauteur_max_cm"),
  compatibleMoto: boolean("compatible_moto").notNull().default(true),
  interditeMotif: varchar("interdite_motif", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Pièces interdites pour livraison moto
export const livraisonPiecesInterdites = pgTable("livraison_pieces_interdites", {
  id: serial("id").primaryKey(),
  motCle: varchar("mot_cle", { length: 128 }).notNull(), // moteur, boite_vitesse, capot, pare-chocs...
  motif: varchar("motif", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── VENTE PRO — workflow véhicule ──────────────────────────

export const venteProVehicules = pgTable("vente_pro_vehicules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  annonceId: integer("annonce_id"),
  status: varchar("status", { length: 32 }).notNull().default("brouillon"),
  // brouillon, en_verification, publie, reserve, vendu, archive
  photosValidees: boolean("photos_validees").notNull().default(false),
  documentsValides: boolean("documents_valides").notNull().default(false),
  datePublication: timestamp("date_publication"),
  dateVente: timestamp("date_vente"),
  acheteurId: integer("acheteur_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── PRO DASHBOARD STATS (calculées) ────────────────────────

export const proDashboardStats = pgTable("pro_dashboard_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activity: proActivityEnum("activity").notNull(),
  period: varchar("period", { length: 16 }).notNull(), // 2025-06, 2025-Q2
  annoncesTotal: integer("annonces_total").default(0),
  annoncesVues: integer("annonces_vues").default(0),
  messagesRecus: integer("messages_recus").default(0),
  reservationsTotal: integer("reservations_total").default(0),
  ventesTotal: integer("ventes_total").default(0),
  chiffreAffaires: numeric("chiffre_affaires", { precision: 12, scale: 2 }).default("0"),
  stockVehicules: integer("stock_vehicules").default(0),
  flotteTotal: integer("flotte_total").default(0),
  chauffeurs: integer("chauffeurs").default(0),
  avisPositifs: integer("avis_positifs").default(0),
  avisTotal: integer("avis_total").default(0),
  data: jsonb("data").default("{}"), // données spécifiques par activité
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});
