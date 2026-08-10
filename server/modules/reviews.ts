/**
 * Module Avis Universel MKA.P-MS
 * 
 * Système d'avis multi-univers, extensible, international.
 * Points couverts : 1-34 + indice de confiance.
 * 
 * Architecture :
 * - univers = VARCHAR dynamique (pas d'enum figé) → extensible sans code
 * - targetType = VARCHAR dynamique → tout type de cible
 * - Toutes les règles, badges, critères, points = tables configurables
 * - Module 100% indépendant, aucune table existante modifiée
 */
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ════════════════════════════════════════════════════════════════════
// TABLE PRINCIPALE — AVIS
// ════════════════════════════════════════════════════════════════════

export const reviewsV2 = pgTable("reviews_v2", {
  id: serial("id").primaryKey(),
  // ─── Auteur ───
  authorId: integer("author_id").notNull(),
  authorDisplayMode: varchar("author_display_mode", { length: 16 }).notNull().default("full"),
  // "full" | "prenom" | "initiales" | "anonyme" (Point 28)
  // ─── Cible ───
  targetType: varchar("target_type", { length: 32 }).notNull(),
  // "user" | "garage" | "annonce" | "boutique" | "plateforme" | "service" | "employe" | "support"
  targetId: integer("target_id").notNull(),
  // ─── Univers (dynamique — Point 1) ───
  univers: varchar("univers", { length: 64 }).notNull(),
  // "vente" | "location" | "garage" | ... | "electric_plus" | "banque" | tout futur service
  // ─── Transaction liée (preuve vérification) ───
  transactionType: varchar("transaction_type", { length: 32 }),
  transactionId: integer("transaction_id"),
  // ─── Notes ───
  ratingGlobal: integer("rating_global").notNull(), // 1-5
  criterias: jsonb("criterias").notNull().default("{}"), // {"qualite": 5, "delai": 4, ...}
  // ─── Contenu ───
  comment: text("comment"),
  prosText: text("pros_text"),
  consText: text("cons_text"),
  // ─── Médias (Point 14 — photos, vidéos, factures, devis, documents) ───
  photos: jsonb("photos").default("[]"), // string[]
  videos: jsonb("videos").default("[]"), // string[]
  documents: jsonb("documents").default("[]"), // {name, url, type}[]
  // ─── Vérification (Point 7 — avis vérifiés) ───
  verified: boolean("verified").notNull().default(false),
  verificationProof: varchar("verification_proof", { length: 128 }),
  // ─── Statut & Modération ───
  status: varchar("status", { length: 20 }).notNull().default("publie"),
  // "publie" | "en_moderation" | "masque" | "signale" | "conteste" | "prive"
  visibility: varchar("visibility", { length: 12 }).notNull().default("public"),
  // "public" | "prive" | "interne" (Points 2, 15)
  moderationReason: text("moderation_reason"),
  moderatedBy: integer("moderated_by"),
  moderatedAt: timestamp("moderated_at"),
  // ─── Réponse du professionnel (Point 11 — droit de réponse) ───
  responseText: text("response_text"),
  responseAt: timestamp("response_at"),
  responseBy: integer("response_by"),
  responseDocuments: jsonb("response_documents").default("[]"), // pièces jointes réponse (Point 14)
  // ─── Réponse du client (Point 11 — 1 seule réponse, puis clôturé) ───
  clientReplyText: text("client_reply_text"),
  clientReplyAt: timestamp("client_reply_at"),
  // ─── Réponse officielle MKA.P-MS (Point 3) ───
  officialResponseText: text("official_response_text"),
  officialResponseAt: timestamp("official_response_at"),
  officialResponseBy: integer("official_response_by"),
  // ─── Engagement ───
  helpfulCount: integer("helpful_count").notNull().default(0),
  reportedCount: integer("reported_count").notNull().default(0),
  // ─── Contexte ───
  language: varchar("language", { length: 8 }).default("fr"), // Point 27
  translatedComment: text("translated_comment"), // Point 27 — traduction auto
  translatedLanguage: varchar("translated_language", { length: 8 }),
  deviceType: varchar("device_type", { length: 16 }),
  ipCity: varchar("ip_city", { length: 128 }), // Point 29 — géolocalisation
  ipCountry: varchar("ip_country", { length: 4 }),
  // ─── Pays de l'expérience (point 46 — réputation par pays activé) ───
  // Distinct de `ipCountry` : un client peut consulter depuis un autre pays que
  // celui où la prestation a eu lieu.
  countryCode: varchar("country_code", { length: 4 }),
  // ─── Poids fidélité (Point 19) ───
  authorLoyaltyTier: varchar("author_loyalty_tier", { length: 16 }),
  // "new" | "regular" | "fidele" | "vip" — affiché pareil mais poids interne différent
  // ─── Timestamps ───
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// HISTORIQUE DES MODIFICATIONS D'AVIS (Point 26)
// ════════════════════════════════════════════════════════════════════

export const reviewHistory = pgTable("review_history", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  action: varchar("action", { length: 32 }).notNull(),
  // "created" | "edited" | "response_pro" | "response_client" | "response_official"
  // | "reported" | "moderated" | "contested" | "status_changed"
  actorId: integer("actor_id"),
  previousData: jsonb("previous_data"), // snapshot avant modification
  newData: jsonb("new_data"), // snapshot après modification
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// CRITÈRES DE NOTATION PAR UNIVERS (configurable — Point 22)
// ════════════════════════════════════════════════════════════════════

export const reviewCriteriaTemplates = pgTable("review_criteria_templates", {
  id: serial("id").primaryKey(),
  univers: varchar("univers", { length: 64 }).notNull(),
  targetType: varchar("target_type", { length: 32 }).notNull(),
  criteriaKey: varchar("criteria_key", { length: 32 }).notNull(),
  criteriaLabel: varchar("criteria_label", { length: 128 }).notNull(),
  criteriaLabelEn: varchar("criteria_label_en", { length: 128 }), // Point 27
  criteriaIcon: varchar("criteria_icon", { length: 32 }),
  ordre: integer("ordre").notNull().default(0),
  weight: integer("weight").notNull().default(1), // poids dans le calcul
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// DEMANDES AUTOMATIQUES D'AVIS (Points 5, 8, 25, 33)
// ════════════════════════════════════════════════════════════════════

export const reviewRequests = pgTable("review_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  targetType: varchar("target_type", { length: 32 }).notNull(),
  targetId: integer("target_id").notNull(),
  univers: varchar("univers", { length: 64 }).notNull(),
  transactionType: varchar("transaction_type", { length: 32 }).notNull(),
  transactionId: integer("transaction_id").notNull(),
  triggerReason: varchar("trigger_reason", { length: 64 }).notNull(),
  // "achat_termine" | "location_terminee" | "intervention_terminee" | "support_termine"
  // | "annonce_supprimee" | "mise_a_jour_plateforme" | etc.
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  // "pending" | "sent" | "completed" | "expired" | "dismissed"
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  reviewId: integer("review_id"),
  reminderCount: integer("reminder_count").notNull().default(0),
  // Pays de la prestation terminée (point 48)
  countryCode: varchar("country_code", { length: 4 }),
  expiresAt: timestamp("expires_at").notNull(),
  metadata: jsonb("metadata").default("{}"), // données contextuelles
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// SIGNALEMENTS D'AVIS
// ════════════════════════════════════════════════════════════════════

export const reviewReports = pgTable("review_reports", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  reporterId: integer("reporter_id").notNull(),
  reason: varchar("reason", { length: 32 }).notNull(),
  // "faux_avis" | "insulte" | "spam" | "doublon" | "conflit_interet" | "hors_sujet" | "contenu_inapproprie"
  details: text("details"),
  status: varchar("status", { length: 12 }).notNull().default("ouvert"),
  // "ouvert" | "traite" | "rejete"
  handledBy: integer("handled_by"),
  handledAt: timestamp("handled_at"),
  decision: text("decision"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// CONTESTATIONS D'AVIS PAR LES PROFESSIONNELS (Point 12)
// ════════════════════════════════════════════════════════════════════

export const reviewContestations = pgTable("review_contestations", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  contesterId: integer("contester_id").notNull(), // le pro qui conteste
  reason: varchar("reason", { length: 32 }).notNull(),
  // "faux_avis" | "erreur_personne" | "langage_injurieux" | "concurrence_deloyale" | "spam" | "hors_sujet"
  explanation: text("explanation"),
  evidence: jsonb("evidence").default("[]"), // documents/preuves joints
  status: varchar("status", { length: 16 }).notNull().default("en_attente"),
  // "en_attente" | "acceptee" | "rejetee"
  handledBy: integer("handled_by"),
  handledAt: timestamp("handled_at"),
  decision: text("decision"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// VOTES "AVIS UTILE"
// ════════════════════════════════════════════════════════════════════

export const reviewHelpful = pgTable("review_helpful", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// STATISTIQUES AGRÉGÉES PAR CIBLE (cache dénormalisé)
// ════════════════════════════════════════════════════════════════════

export const reviewAggregates = pgTable("review_aggregates", {
  id: serial("id").primaryKey(),
  targetType: varchar("target_type", { length: 32 }).notNull(),
  targetId: integer("target_id").notNull(),
  univers: varchar("univers", { length: 64 }).notNull(),
  totalReviews: integer("total_reviews").notNull().default(0),
  averageRatingX100: integer("average_rating_x100").notNull().default(0),
  rating5Count: integer("rating_5_count").notNull().default(0),
  rating4Count: integer("rating_4_count").notNull().default(0),
  rating3Count: integer("rating_3_count").notNull().default(0),
  rating2Count: integer("rating_2_count").notNull().default(0),
  rating1Count: integer("rating_1_count").notNull().default(0),
  verifiedCount: integer("verified_count").notNull().default(0),
  responseRatePct: integer("response_rate_pct").notNull().default(0),
  criteriaAverages: jsonb("criteria_averages").default("{}"),
  lastReviewAt: timestamp("last_review_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// HISTORIQUE MENSUEL DES NOTES (Point 4 — tendances)
// ════════════════════════════════════════════════════════════════════

export const reviewMonthlyStats = pgTable("review_monthly_stats", {
  id: serial("id").primaryKey(),
  targetType: varchar("target_type", { length: 32 }).notNull(),
  targetId: integer("target_id").notNull(),
  univers: varchar("univers", { length: 64 }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  averageRatingX100: integer("average_rating_x100").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  verifiedCount: integer("verified_count").notNull().default(0),
  criteriaAverages: jsonb("criteria_averages").default("{}"),
});

// ════════════════════════════════════════════════════════════════════
// INDICE DE CONFIANCE / RÉPUTATION (Points 23, conseil stratégique)
// ════════════════════════════════════════════════════════════════════

export const reviewTrustScores = pgTable("review_trust_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  score: integer("score").notNull().default(50), // 0-100
  // Composantes du score
  anciennetePoints: integer("anciennete_points").notNull().default(0),
  transactionsPoints: integer("transactions_points").notNull().default(0),
  avisVerifiesPoints: integer("avis_verifies_points").notNull().default(0),
  tauxReponsePoints: integer("taux_reponse_points").notNull().default(0),
  tauxAnnulationPoints: integer("taux_annulation_points").notNull().default(0),
  litigesPoints: integer("litiges_points").notNull().default(0),
  documentsVerifiesPoints: integer("documents_verifies_points").notNull().default(0),
  activiteRecentePoints: integer("activite_recente_points").notNull().default(0),
  respectDelaisPoints: integer("respect_delais_points").notNull().default(0),
  // Metadata
  lastCalculatedAt: timestamp("last_calculated_at").notNull().defaultNow(),
  history: jsonb("history").default("[]"), // [{date, score, reason}]
});

// ════════════════════════════════════════════════════════════════════
// BADGES QUALITÉ (Point 13)
// ════════════════════════════════════════════════════════════════════

export const reviewBadgeDefinitions = pgTable("review_badge_definitions", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 32 }).notNull().unique(),
  label: varchar("label", { length: 64 }).notNull(),
  labelEn: varchar("label_en", { length: 64 }),
  description: varchar("description", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 32 }).notNull(),
  color: varchar("color", { length: 16 }).notNull().default("#FFD700"),
  category: varchar("category", { length: 32 }).notNull(),
  // "performance" | "service" | "confiance" | "engagement" | "special"
  conditions: jsonb("conditions").notNull(), // règles d'attribution automatique
  // Ex: {"min_rating": 4.8, "min_reviews": 10, "min_response_rate": 90}
  active: boolean("active").notNull().default(true),
  ordre: integer("ordre").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewBadgesAwarded = pgTable("review_badges_awarded", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeKey: varchar("badge_key", { length: 32 }).notNull(),
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // null = permanent
  active: boolean("active").notNull().default(true),
  metadata: jsonb("metadata").default("{}"),
});

// ════════════════════════════════════════════════════════════════════
// OBJECTIFS QUALITÉ PAR PROFESSIONNEL (Point 31)
// ════════════════════════════════════════════════════════════════════

export const reviewObjectives = pgTable("review_objectives", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  univers: varchar("univers", { length: 64 }),
  targetRating: integer("target_rating_x100").notNull(), // ex: 480 = 4.80
  currentRating: integer("current_rating_x100").notNull().default(0),
  progressPct: integer("progress_pct").notNull().default(0),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 12 }).notNull().default("actif"),
  // "actif" | "atteint" | "echoue" | "annule"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// AVIS PAR EMPLOYÉ (Point 24)
// ════════════════════════════════════════════════════════════════════

export const reviewEmployees = pgTable("review_employees", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(), // garage_id ou entreprise
  businessType: varchar("business_type", { length: 32 }).notNull(), // "garage" | "carrosserie" | "boutique"
  employeeName: varchar("employee_name", { length: 128 }).notNull(),
  employeeRole: varchar("employee_role", { length: 64 }).notNull(),
  // "mecanicien" | "receptionniste" | "commercial" | "livreur" | "carrossier"
  userId: integer("user_id"), // lié à un compte si existant
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// ENQUÊTES POST-SUPPRESSION (Point 8)
// ════════════════════════════════════════════════════════════════════

export const reviewExitSurveys = pgTable("review_exit_surveys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  annonceId: integer("annonce_id"),
  reason: varchar("reason", { length: 32 }).notNull(),
  // "vendu_mkapms" | "vendu_ailleurs" | "changement_avis" | "autre"
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// SATISFACTION POST-MISE-À-JOUR (Point 33)
// ════════════════════════════════════════════════════════════════════

export const reviewFeatureSatisfaction = pgTable("review_feature_satisfaction", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  featureKey: varchar("feature_key", { length: 64 }).notNull(),
  featureLabel: varchar("feature_label", { length: 200 }).notNull(),
  satisfied: boolean("satisfied"), // true=oui, false=non, null=pas répondu
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// CONFIGURATION DU SYSTÈME D'AVIS (Point 22 — tout configurable)
// ════════════════════════════════════════════════════════════════════

export const reviewConfig = pgTable("review_config", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: jsonb("value").notNull(),
  label: varchar("label", { length: 128 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 32 }).notNull(),
  // "criteres" | "badges" | "recompenses" | "moderation" | "notifications" | "classement" | "affichage"
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// WEBHOOKS MAKE / N8N (Point 9)
// ════════════════════════════════════════════════════════════════════

export const reviewWebhooks = pgTable("review_webhooks", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 128 }),
  events: jsonb("events").notNull().default("[]"),
  // ["review.created", "review.reported", "review.response", "badge.awarded", "trust.updated"]
  active: boolean("active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  failureCount: integer("failure_count").notNull().default(0),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reviewWebhookLogs = pgTable("review_webhook_logs", {
  id: serial("id").primaryKey(),
  webhookId: integer("webhook_id").notNull(),
  event: varchar("event", { length: 64 }).notNull(),
  payload: jsonb("payload"),
  statusCode: integer("status_code"),
  responseBody: text("response_body"),
  success: boolean("success").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════
// UNIVERS ENREGISTRÉS (extensible sans code — Point 1)
// ════════════════════════════════════════════════════════════════════

export const reviewUniversRegistry = pgTable("review_univers_registry", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 128 }).notNull(),
  labelEn: varchar("label_en", { length: 128 }),
  icon: varchar("icon", { length: 32 }),
  active: boolean("active").notNull().default(true),
  ordre: integer("ordre").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
