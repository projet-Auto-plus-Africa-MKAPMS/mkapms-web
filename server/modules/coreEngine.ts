// ===== MKA.P-MS CORE ENGINE =====
// Le "cerveau" de la plateforme : moteur d'orchestration qui relie tous les modules.
// 15 centres : Services, Recommandation, Fournisseurs, Distribution, Formation,
// B2B, Stats IA, Documents, Partenaires, Open API, IA Automatisation, Workflow,
// Recherche Mondiale, Expansion, Écosystème.
//
// Module 100% indépendant — ne modifie AUCUNE table existante.
// Connecté au projet mais non intégré directement (staging 2 mois).

import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ─── 1. MOTEUR DE SERVICES UNIVERSEL ───
// Relie automatiquement les services pertinents après une action utilisateur.
export const serviceRecommendationRules = pgTable("ce_service_rules", {
  id: serial("id").primaryKey(),
  triggerEvent: varchar("trigger_event", { length: 64 }).notNull(), // ex: "achat_vehicule", "location_terminee"
  triggerUnivers: varchar("trigger_univers", { length: 64 }).notNull(), // vente, location, garage...
  recommendedService: varchar("recommended_service", { length: 64 }).notNull(), // assurance, carte_grise, garage...
  priority: integer("priority").notNull().default(0),
  conditions: jsonb("conditions"), // ex: { "vehicule_age_min": 5, "marque": "all" }
  messageTemplate: text("message_template"), // "Félicitations pour votre {marque}! Pensez à..."
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 2. CENTRE DE RECOMMANDATION INTELLIGENT ───
// Recommandations personnalisées basées sur comportement utilisateur.
export const userBehaviorLog = pgTable("ce_user_behavior", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // view, search, bookmark, purchase
  targetType: varchar("target_type", { length: 64 }).notNull(), // annonce, garage, piece, service
  targetId: integer("target_id"),
  metadata: jsonb("metadata"), // { marque, modele, prix, ville, categorie... }
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recommendations = pgTable("ce_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(), // garage, piece, annonce, service, assurance
  targetType: varchar("target_type", { length: 64 }).notNull(),
  targetId: integer("target_id").notNull(),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(), // pertinence 0-100
  reason: varchar("reason", { length: 255 }), // "Basé sur votre achat BMW Série 3"
  seen: boolean("seen").notNull().default(false),
  clicked: boolean("clicked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// ─── 3. CENTRE FOURNISSEURS MONDIAL ───
export const ceSuppliers = pgTable("ce_suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  country: varchar("country", { length: 4 }).notNull(),
  city: varchar("city", { length: 128 }),
  category: varchar("category", { length: 64 }).notNull(), // pieces, vehicules, accessoires, outillage
  specialites: jsonb("specialites"), // ["plaquettes", "filtres", "huiles"]
  marques: jsonb("marques"), // ["peugeot", "renault", "bmw"]
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 32 }),
  website: varchar("website", { length: 255 }),
  delaiMoyenJours: integer("delai_moyen_jours"),
  noteMoyenne: numeric("note_moyenne", { precision: 3, scale: 2 }),
  certified: boolean("certified").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ceSupplierCatalogue = pgTable("ce_supplier_catalogue", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  reference: varchar("reference", { length: 64 }).notNull(),
  designation: varchar("designation", { length: 255 }).notNull(),
  marque: varchar("marque", { length: 64 }),
  prixHT: numeric("prix_ht", { precision: 12, scale: 2 }),
  devise: varchar("devise", { length: 8 }).notNull().default("EUR"),
  stock: integer("stock"),
  delaiJours: integer("delai_jours"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 4. CENTRE DE DISTRIBUTION ───
export const distributionDepots = pgTable("ce_distribution_depots", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  country: varchar("country", { length: 4 }).notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  address: text("address"),
  capacity: integer("capacity"), // nb colis max
  currentLoad: integer("current_load").notNull().default(0),
  managerId: integer("manager_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const distributionShipments = pgTable("ce_distribution_shipments", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 32 }).unique(),
  fromDepotId: integer("from_depot_id"),
  toDepotId: integer("to_depot_id"),
  transporteurId: integer("transporteur_id"),
  status: varchar("status", { length: 32 }).notNull().default("prepare"), // prepare, en_transit, livre, retourne
  nbColis: integer("nb_colis").notNull().default(1),
  poidsKg: numeric("poids_kg", { precision: 8, scale: 2 }),
  trackingUrl: varchar("tracking_url", { length: 255 }),
  estimatedDelivery: timestamp("estimated_delivery"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 5. CENTRE DE FORMATION ───
export const ceFormationCourses = pgTable("ce_formation_courses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull(), // garage, carrosserie, vente, depannage, franchise
  level: varchar("level", { length: 32 }).notNull().default("debutant"), // debutant, intermediaire, avance
  durationMinutes: integer("duration_minutes"),
  videoUrl: varchar("video_url", { length: 500 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  badgeOnCompletion: varchar("badge_on_completion", { length: 64 }),
  certificationOnCompletion: boolean("certification_on_completion").notNull().default(false),
  maxAttempts: integer("max_attempts").notNull().default(3),
  passingScore: integer("passing_score").notNull().default(70),
  active: boolean("active").notNull().default(true),
  ordre: integer("ordre").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ceFormationModules = pgTable("ce_formation_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"), // HTML ou markdown
  videoUrl: varchar("video_url", { length: 500 }),
  ordre: integer("ordre").notNull().default(0),
});

export const ceFormationExams = pgTable("ce_formation_exams", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  questions: jsonb("questions").notNull(), // [{ question, options, correctIndex }]
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ceFormationEnrollments = pgTable("ce_formation_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  progress: integer("progress").notNull().default(0), // %
  score: integer("score"),
  passed: boolean("passed"),
  certificationUrl: varchar("certification_url", { length: 500 }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ─── 6. CENTRE MARKETPLACE B2B ───
export const b2bListings = pgTable("ce_b2b_listings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(), // grossiste, fabricant, importateur
  sellerType: varchar("seller_type", { length: 64 }).notNull(), // grossiste, constructeur, importateur, fabricant
  category: varchar("category", { length: 64 }).notNull(), // pieces, vehicules, outillage, consommables
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  marque: varchar("marque", { length: 64 }),
  reference: varchar("reference", { length: 64 }),
  prixUnitaireHT: numeric("prix_unitaire_ht", { precision: 12, scale: 2 }),
  devise: varchar("devise", { length: 8 }).notNull().default("EUR"),
  quantiteMin: integer("quantite_min").notNull().default(1),
  stock: integer("stock"),
  delaiJours: integer("delai_jours"),
  country: varchar("country", { length: 4 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const b2bOrders = pgTable("ce_b2b_orders", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 32 }).unique(),
  buyerId: integer("buyer_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  listingId: integer("listing_id").notNull(),
  quantity: integer("quantity").notNull(),
  totalHT: numeric("total_ht", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 32 }).notNull().default("en_attente"), // en_attente, confirmee, expediee, livree, annulee
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 7. CENTRE STATISTIQUES IA ───
export const aiAnalysisReports = pgTable("ce_ai_reports", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 64 }).notNull(), // tendances_vente, saisonnalite, prix, demande_ville
  period: varchar("period", { length: 32 }).notNull(), // 2025-01, 2025-Q1, 2025
  data: jsonb("data").notNull(), // résultats structurés
  insights: jsonb("insights"), // [{ message, priority, actionSuggested }]
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const aiPredictions = pgTable("ce_ai_predictions", {
  id: serial("id").primaryKey(),
  targetType: varchar("target_type", { length: 64 }).notNull(), // prix_vehicule, demande_piece, satisfaction
  targetId: integer("target_id"),
  predictedValue: numeric("predicted_value", { precision: 12, scale: 2 }),
  confidence: numeric("confidence", { precision: 5, scale: 2 }), // 0-100
  horizon: varchar("horizon", { length: 32 }), // 7j, 30j, 90j
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 8. CENTRE DOCUMENTS MONDIAL (coffre-fort) ───
export const documentVault = pgTable("ce_document_vault", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  ownerType: varchar("owner_type", { length: 32 }).notNull(), // user, garage, vehicule, transaction
  category: varchar("category", { length: 64 }).notNull(), // contrat, garantie, facture, certificat, photo, video
  title: varchar("title", { length: 200 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 64 }),
  sizeBytes: integer("size_bytes"),
  encrypted: boolean("encrypted").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 9. CENTRE PARTENAIRES ───
export const strategicPartners = pgTable("ce_strategic_partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  sector: varchar("sector", { length: 64 }).notNull(), // assurance, banque, constructeur, controle_technique, transporteur, electricite
  country: varchar("country", { length: 4 }),
  contactName: varchar("contact_name", { length: 128 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 32 }),
  contractUrl: varchar("contract_url", { length: 500 }),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
  status: varchar("status", { length: 32 }).notNull().default("prospect"), // prospect, actif, suspendu, termine
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 10. CENTRE OPEN API ───
export const apiKeys = pgTable("ce_api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  keyHash: varchar("key_hash", { length: 128 }).notNull(),
  keyPrefix: varchar("key_prefix", { length: 16 }).notNull(), // "mka_live_abcd..."
  scopes: jsonb("scopes").notNull(), // ["annonces.read", "factures.write", ...]
  rateLimit: integer("rate_limit").notNull().default(1000), // req/heure
  active: boolean("active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiUsageLogs = pgTable("ce_api_usage_logs", {
  id: serial("id").primaryKey(),
  apiKeyId: integer("api_key_id").notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 8 }).notNull(),
  statusCode: integer("status_code"),
  responseTimeMs: integer("response_time_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 11. CENTRE IA AUTOMATISATION ───
// Événements déclencheurs qui font communiquer les modules entre eux.
export const automationEvents = pgTable("ce_automation_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 64 }).notNull(), // vente_terminee, location_terminee, reparation_terminee...
  sourceModule: varchar("source_module", { length: 64 }).notNull(), // vente, location, garage...
  sourceId: integer("source_id"), // ID de la transaction source
  userId: integer("user_id"),
  payload: jsonb("payload"), // données de l'événement
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const automationActions = pgTable("ce_automation_actions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  actionType: varchar("action_type", { length: 64 }).notNull(), // creer_facture, envoyer_notification, crediter_rewards, demander_avis
  targetModule: varchar("target_module", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("en_attente"), // en_attente, en_cours, termine, echoue
  result: jsonb("result"),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 12. CENTRE WORKFLOW ───
// Règles configurables par le PDG : SI condition ALORS actions en cascade.
export const workflows = pgTable("ce_workflows", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  triggerEvent: varchar("trigger_event", { length: 64 }).notNull(), // paiement_recu, annonce_publiee, location_terminee...
  triggerConditions: jsonb("trigger_conditions"), // { montant_min, univers, type_compte... }
  actions: jsonb("actions").notNull(), // [{ type, params, ordre }]
  active: boolean("active").notNull().default(true),
  createdBy: integer("created_by").notNull(),
  executionCount: integer("execution_count").notNull().default(0),
  lastExecutedAt: timestamp("last_executed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workflowExecutions = pgTable("ce_workflow_executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  eventId: integer("event_id"),
  status: varchar("status", { length: 32 }).notNull().default("en_cours"), // en_cours, termine, echoue, annule
  stepsCompleted: integer("steps_completed").notNull().default(0),
  stepsTotal: integer("steps_total").notNull().default(0),
  logs: jsonb("logs"), // [{ step, action, result, timestamp }]
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ─── 13. CENTRE RECHERCHE MONDIALE ───
// Index de recherche unifié (toutes entités dans un seul endroit).
export const searchIndex = pgTable("ce_search_index", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 64 }).notNull(), // annonce, garage, piece, location, encheres, faq
  entityId: integer("entity_id").notNull(),
  univers: varchar("univers", { length: 64 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  keywords: jsonb("keywords"), // ["peugeot", "308", "diesel", "paris"]
  city: varchar("city", { length: 128 }),
  country: varchar("country", { length: 4 }),
  imageUrl: varchar("image_url", { length: 500 }),
  url: varchar("url", { length: 500 }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull().default("0"), // pertinence de classement
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 14. CENTRE EXPANSION MONDIALE ───
export const expansionCountries = pgTable("ce_expansion_countries", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 4 }).notNull().unique(),
  countryName: varchar("country_name", { length: 128 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("etude"), // etude, preparation, lancement, actif, suspendu
  defaultLanguage: varchar("default_language", { length: 8 }).notNull().default("fr"),
  defaultCurrency: varchar("default_currency", { length: 8 }).notNull().default("EUR"),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }),
  paymentMethods: jsonb("payment_methods"), // ["carte", "mobile_money", "virement"]
  legalRequirements: jsonb("legal_requirements"), // notes juridiques par pays
  launchDate: timestamp("launch_date"),
  managerId: integer("manager_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 15. CENTRE ÉCOSYSTÈME ───
// Liens inter-modules : trace les connexions entre actions de différents modules.
export const ecosystemLinks = pgTable("ce_ecosystem_links", {
  id: serial("id").primaryKey(),
  sourceModule: varchar("source_module", { length: 64 }).notNull(),
  sourceAction: varchar("source_action", { length: 64 }).notNull(),
  targetModule: varchar("target_module", { length: 64 }).notNull(),
  targetAction: varchar("target_action", { length: 64 }).notNull(),
  description: varchar("description", { length: 255 }),
  active: boolean("active").notNull().default(true),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Journal d'orchestration : toutes les actions automatiques tracées.
export const orchestrationLog = pgTable("ce_orchestration_log", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  sourceModule: varchar("source_module", { length: 64 }).notNull(),
  actionsTriggered: integer("actions_triggered").notNull().default(0),
  actionsSucceeded: integer("actions_succeeded").notNull().default(0),
  actionsFailed: integer("actions_failed").notNull().default(0),
  duration_ms: integer("duration_ms"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
