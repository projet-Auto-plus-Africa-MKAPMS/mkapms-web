/**
 * MKA.P-MS Smart Engine — Schema (tables isolées)
 *
 * Module intelligent développé séparément de la plateforme principale.
 * Toutes les tables sont préfixées `smart_` pour éviter tout conflit.
 *
 * Nom visible : "Système Intelligent MKA.P-MS"
 * Nom technique : "MKA.P-MS Smart Engine"
 */
import {
  bigserial,
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────
// 4 niveaux (Partie 10) : info (🟢 Information), warning (🟡 Attention),
// important (🟠 Important), critical (🔴 Critique).
export const smartAlertSeverityEnum = pgEnum("smart_alert_severity", [
  "info",
  "warning",
  "important",
  "critical",
]);
export const smartAlertStatusEnum = pgEnum("smart_alert_status", [
  "open",
  "acknowledged",
  "resolved",
  "dismissed",
]);
export const smartDuplicateTypeEnum = pgEnum("smart_duplicate_type", [
  "plaque",
  "vin",
  "photo",
  "description",
  "vendeur",
]);
export const smartLearnedStatusEnum = pgEnum("smart_learned_status", [
  "proposed",
  "confirmed",
  "rejected",
]);

// ── 1. Analyse des recherches ──────────────────────────────────────────
export const smartSearchLogs = pgTable("smart_search_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: integer("user_id"),
  sessionId: varchar("session_id", { length: 128 }),
  query: text("query"),
  filters: jsonb("filters").$type<Record<string, unknown>>(),
  // Contexte géo
  ville: varchar("ville", { length: 128 }),
  pays: varchar("pays", { length: 64 }),
  rayon: integer("rayon"),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  // Résultats
  resultCount: integer("result_count").default(0),
  hasResults: boolean("has_results").default(true),
  // Suivi
  clickedAnnonceId: integer("clicked_annonce_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── 2. Mémoire utilisateur ─────────────────────────────────────────────
export const smartUserMemory = pgTable("smart_user_memory", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 32 }).notNull(), // "search" | "filter" | "view" | "alert" | "need"
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── 3. Recommandations ─────────────────────────────────────────────────
export const smartRecommendations = pgTable("smart_recommendations", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 32 }).notNull(), // "annonce" | "garage" | "piece" | "location" | "service"
  targetId: integer("target_id"),
  reason: text("reason"),
  score: integer("score").default(0),
  seen: boolean("seen").default(false),
  clicked: boolean("clicked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── 4. Apprentissage dépôt d'annonce ───────────────────────────────────
export const smartLearnedData = pgTable("smart_learned_data", {
  id: serial("id").primaryKey(),
  field: varchar("field", { length: 64 }).notNull(), // "version" | "finition" | "motorisation" | "equipement" | "couleur" ...
  marque: varchar("marque", { length: 64 }),
  modele: varchar("modele", { length: 64 }),
  value: varchar("value", { length: 255 }).notNull(),
  submittedBy: integer("submitted_by"),
  confirmations: integer("confirmations").default(1),
  status: smartLearnedStatusEnum("status").default("proposed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── 5. Détection doublon annonce ───────────────────────────────────────
export const smartDuplicates = pgTable("smart_duplicates", {
  id: serial("id").primaryKey(),
  annonceId: integer("annonce_id").notNull(),
  matchedAnnonceId: integer("matched_annonce_id").notNull(),
  type: smartDuplicateTypeEnum("type").notNull(),
  confidence: integer("confidence").default(0), // 0-100
  resolved: boolean("resolved").default(false),
  resolvedBy: integer("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── 6. Reconnaissance photo (empreintes) ───────────────────────────────
export const smartPhotoFingerprints = pgTable("smart_photo_fingerprints", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  annonceId: integer("annonce_id").notNull(),
  photoIndex: integer("photo_index").default(0),
  fingerprint: varchar("fingerprint", { length: 128 }).notNull(), // hash perceptuel
  createdAt: timestamp("created_at").defaultNow(),
});

// ── 7. Détection faux comptes ──────────────────────────────────────────
export const smartSuspectAccounts = pgTable("smart_suspect_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  reason: varchar("reason", { length: 64 }).notNull(), // "duplicate_email" | "duplicate_phone" | "same_device" | "same_ip" | "abnormal_behavior"
  details: jsonb("details").$type<Record<string, unknown>>(),
  severity: smartAlertSeverityEnum("severity").default("warning"),
  resolved: boolean("resolved").default(false),
  resolvedBy: integer("resolved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── 8. Centre de contrôle — alertes générales ──────────────────────────
export const smartAlerts = pgTable("smart_alerts", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 48 }).notNull(), // "doublon" | "faux_compte" | "annonce_suspecte" | "erreur" | "redirection" | "avis" | "badge"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: smartAlertSeverityEnum("severity").default("info"),
  status: smartAlertStatusEnum("status").default("open"),
  targetType: varchar("target_type", { length: 32 }), // "annonce" | "user" | "page" | "bouton"
  targetId: integer("target_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  resolvedBy: integer("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── 9. Journal d'activité ──────────────────────────────────────────────
export const smartActivityLog = pgTable("smart_activity_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  action: varchar("action", { length: 64 }).notNull(),
  userId: integer("user_id"),
  targetType: varchar("target_type", { length: 32 }),
  targetId: integer("target_id"),
  data: jsonb("data").$type<Record<string, unknown>>(),
  result: varchar("result", { length: 32 }), // "success" | "failure" | "pending"
  proposedDecision: text("proposed_decision"),
  humanValidation: boolean("human_validation"),
  validatedBy: integer("validated_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── 13. Surveillance boutons/redirections ──────────────────────────────
export const smartHealthChecks = pgTable("smart_health_checks", {
  id: serial("id").primaryKey(),
  page: varchar("page", { length: 255 }).notNull(),
  element: varchar("element", { length: 128 }).notNull(), // "bouton_modifier" | "lien_voir_annonces" | "formulaire_depot" ...
  elementType: varchar("element_type", { length: 32 }).notNull(), // "button" | "link" | "form" | "image"
  status: varchar("status", { length: 16 }).default("ok"), // "ok" | "broken" | "slow" | "missing"
  lastCheckedAt: timestamp("last_checked_at").defaultNow(),
  errorDetails: text("error_details"),
  suggestedFix: text("suggested_fix"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── 15. Apprentissage privé PDG (chat PDG ↔ Système Intelligent) ────────
// Espace confidentiel : seul le PDG (super_admin) écrit ici. Chaque leçon
// enseignée est mémorisée et le système peut la restituer plus tard.
export const smartTeachingRoleEnum = pgEnum("smart_teaching_role", [
  "pdg",
  "system",
]);

export const smartTeachings = pgTable("smart_teachings", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  authorId: integer("author_id"), // PDG qui enseigne (null pour les réponses système)
  role: smartTeachingRoleEnum("role").notNull(), // "pdg" = leçon enseignée, "system" = réponse du système
  topic: varchar("topic", { length: 128 }), // sujet libre optionnel
  message: text("message").notNull(),
  // Marque une leçon "mémorisée" (les tours PDG contenant un vrai enseignement)
  isLesson: boolean("is_lesson").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── 16. Connaissances externes (veille / benchmark concurrents) ─────────
// Base de connaissance alimentée hors plateforme : bonnes pratiques
// observées chez d'autres acteurs (garages, concessionnaires, marketplaces…)
// avec un conseil concret pour MKA.P-MS. Réservé au PDG.
export const smartKnowledge = pgTable("smart_knowledge", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  category: varchar("category", { length: 64 }).notNull(), // "marketplace" | "garage" | "concessionnaire" | "location" | "pieces" | "general"
  source: varchar("source", { length: 160 }), // nom de la plateforme / acteur observé
  insight: text("insight").notNull(), // ce qui a été observé / appris
  recommendation: text("recommendation"), // conseil concret pour MKA.P-MS
  url: varchar("url", { length: 512 }),
  addedBy: integer("added_by"), // PDG (null = graine système)
  applied: boolean("applied").default(false), // marqué comme appliqué chez nous
  createdAt: timestamp("created_at").defaultNow(),
});

// ── 17. Base de connaissances officielle MKA.P-MS (Parties 6 & 7) ───────
// Mémoire officielle de la plateforme, alimentée automatiquement à chaque
// action (recherche, dépôt, nouvelle version/pièce/garage/mot-clé…).
// Chaque entrée est d'abord "proposée" ; si elle est cohérente et revient
// plusieurs fois (observations), elle passe "confirmée". Aucune donnée n'est
// perdue. Domaines : véhicules, pièces, pannes, utilisateurs + mots-clés.
export const smartKbEntries = pgTable("smart_kb_entries", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  // "vehicule" | "piece" | "panne" | "utilisateur" | "recherche" | "mot_cle" | "service" | "garage"
  domain: varchar("domain", { length: 24 }).notNull(),
  // vehicule: marque|modele|generation|finition|motorisation|boite|carburant|option
  // piece: reference|compatibilite|fabricant|equivalence|mot_cle
  // panne: symptome|cause|solution
  // utilisateur: recherche|preference|besoin
  type: varchar("type", { length: 48 }).notNull(),
  value: varchar("value", { length: 320 }).notNull(),
  // Contexte hiérarchique (ex: la marque pour un modèle, le modèle pour une finition)
  parentKey: varchar("parent_key", { length: 320 }),
  // Données structurées additionnelles (temps moyen, difficulté, véhicules concernés…)
  attributes: jsonb("attributes").$type<Record<string, unknown>>(),
  // Signature unique normalisée = domain|type|parent|value (minuscule)
  signature: varchar("signature", { length: 768 }).notNull().unique(),
  observations: integer("observations").default(1),
  status: smartLearnedStatusEnum("status").default("proposed"), // proposed | confirmed | rejected
  firstSource: varchar("first_source", { length: 48 }), // "recherche" | "annonce" | "depot" | "manuel" | "systeme"
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── 18. Auto-optimisation (Partie 8) ────────────────────────────────────
// Le Smart Engine analyse la plateforme et PROPOSE des optimisations
// (vitesse de recherche, classement, qualité résultats, mots-clés, filtres,
// suggestions). Il ne modifie JAMAIS une règle métier sans validation :
// chaque proposition reste "proposed" jusqu'à ce que le PDG l'applique ou la
// rejette. Table isolée, additive.
export const smartOptimizationStatusEnum = pgEnum("smart_optimization_status", [
  "proposed",
  "applied",
  "rejected",
]);
export const smartOptimizations = pgTable("smart_optimizations", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  // "vitesse_recherche" | "classement_annonces" | "qualite_resultats"
  // | "mots_cles" | "filtres" | "suggestions"
  category: varchar("category", { length: 32 }).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  detail: text("detail"),
  recommendation: text("recommendation"),
  // "faible" | "moyen" | "eleve"
  impact: varchar("impact", { length: 16 }).default("moyen"),
  // Données factuelles qui justifient la proposition (compteurs, exemples…)
  evidence: jsonb("evidence").$type<Record<string, unknown>>(),
  // Signature normalisée pour éviter les doublons d'une même proposition
  signature: varchar("signature", { length: 400 }).notNull().unique(),
  status: smartOptimizationStatusEnum("status").default("proposed"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── 19. Apprentissage des développements (Partie 11) ────────────────────
// À chaque nouveau développement (moteur, table, API, page, bouton), le
// Système Intelligent analyse la nouveauté, comprend sa fonction, l'ajoute à
// sa surveillance et vérifie qu'une permission est bien définie (Permission
// Engine). Détection réelle : introspection du routeur TRPC (API) et des
// tables présentes en base. Table isolée, additive, jamais bloquante.
export const smartDevKindEnum = pgEnum("smart_dev_kind", [
  "moteur",
  "table",
  "api",
  "page",
  "bouton",
  "formulaire",
]);
export const smartDevStatusEnum = pgEnum("smart_dev_status", [
  "nouveau", // détecté, pas encore pris en compte par le PDG
  "surveille", // intégré à la surveillance
  "ignore", // écarté par le PDG
]);
// Permission : le Permission Engine a-t-il une règle pour cette nouveauté ?
export const smartDevPermissionEnum = pgEnum("smart_dev_permission", [
  "definie", // une règle de permission existe
  "requise", // aucune règle → à créer (une fonctionnalité sans permission ne doit pas être visible)
  "publique", // volontairement public (pas de permission nécessaire)
  "na", // non applicable
]);
export const smartDevRegistry = pgTable("smart_dev_registry", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  kind: smartDevKindEnum("kind").notNull(),
  // Nom lisible (ex: "annonces.create", "message_threads", "/paiement-vehicule")
  name: varchar("name", { length: 255 }).notNull(),
  // Fonction déduite automatiquement (heuristique sur le nom / type)
  functionGuess: text("function_guess"),
  // Sous-type utile (ex: "query" | "mutation" pour une API)
  subtype: varchar("subtype", { length: 32 }),
  // Module de permission rattaché (clé de shared/permissions.ts) si connu
  permissionModule: varchar("permission_module", { length: 64 }),
  permission: smartDevPermissionEnum("permission").default("na"),
  status: smartDevStatusEnum("status").default("nouveau"),
  // Signature unique normalisée = kind|name
  signature: varchar("signature", { length: 320 }).notNull().unique(),
  detections: integer("detections").default(1),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  acknowledgedBy: integer("acknowledged_by"),
  // Décision PDG verrouillée : une fois que le PDG a tranché la permission ou le
  // statut d'un élément, le rescan ne réécrase plus sa décision (sinon « à
  // définir » réapparaîtrait indéfiniment). Le PDG décide une fois, c'est validé.
  reviewLocked: boolean("review_locked").default(false),
  firstSeenAt: timestamp("first_seen_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
});

// ── Partie 12 — Moteur Qualité (Quality Engine) ─────────────────────────
// Le Système Intelligent évalue en continu la qualité réelle de la plateforme
// (annonces, photos, descriptions, prix, confiance, doublons, santé, avis) et
// produit un score par domaine + un score global. 100% lecture seule sur les
// données existantes ; les audits sont stockés dans une table isolée `smart_`.
// Aucune donnée existante n'est modifiée. Le PDG décide des suites à donner.
export const smartQualityCategoryEnum = pgEnum("smart_quality_category", [
  "annonces", // complétude des annonces (photos, description, prix)
  "photos", // richesse photo (nombre, catégorisation)
  "descriptions", // qualité des descriptions
  "prix", // renseignement du prix
  "confiance", // comptes suspects non résolus
  "doublons", // doublons d'annonces non résolus
  "sante", // santé technique de la plateforme
  "avis", // signaux issus des avis
]);
// Statut qualité : bon (🟢), moyen (🟡), faible (🔴).
export const smartQualityStatusEnum = pgEnum("smart_quality_status", [
  "bon",
  "moyen",
  "faible",
]);
export const smartQualityAudits = pgTable("smart_quality_audits", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  category: smartQualityCategoryEnum("category").notNull(),
  // Score de 0 à 100 (100 = qualité parfaite).
  score: integer("score").notNull(),
  status: smartQualityStatusEnum("status").notNull(),
  // Résumé lisible affiché au PDG (ex: "82% des annonces ont ≥ 3 photos").
  headline: text("headline").notNull(),
  // Recommandation additive (jamais d'action automatique).
  recommendation: text("recommendation"),
  // Détails chiffrés (échantillon, numérateur/dénominateur, seuils…).
  details: jsonb("details").$type<Record<string, unknown>>(),
  // Taille de l'échantillon analysé.
  sampleSize: integer("sample_size").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Partie 17 — Mémoire d'auto-réparation (auto-fix appris) ─────────────
// Chaque fois qu'une correction SÛRE est appliquée (via « Résolu » ou
// automatiquement pendant un scan), on mémorise la recette : type de problème
// + clé + action + paramètres. Les scans suivants rejouent ces recettes pour
// résoudre SEUL les mêmes défauts (ex: créer la règle de redirection manquante)
// sans intervention humaine. Table isolée, additive — ne remplace aucune
// mémoire existante (dev registry, teachings, KB…).
export const smartAutoFixes = pgTable("smart_auto_fixes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  // "redirection" | "health" | "path_alias" …
  problemType: varchar("problem_type", { length: 48 }).notNull(),
  // Clé/signature reconnaissable du défaut (ex: "bouton_favoris", "path:/xyz")
  matchKey: varchar("match_key", { length: 255 }).notNull(),
  // "create_redirect_rule" | "reset_health_check" | "create_path_alias" …
  action: varchar("action", { length: 48 }).notNull(),
  params: jsonb("params").$type<Record<string, unknown>>(),
  confidence: integer("confidence").default(100).notNull(),
  // Rejouer automatiquement à l'avenir (correction sûre) ?
  autoApply: boolean("auto_apply").default(true).notNull(),
  timesApplied: integer("times_applied").default(0).notNull(),
  lastAppliedAt: timestamp("last_applied_at"),
  learnedFrom: integer("learned_from"), // id de l'alerte d'origine
  createdBy: integer("created_by"), // PDG (null = système)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Partie 16 — Évolution autonome (préproduction / staging) ────────────
// Le Système Intelligent observe la plateforme (qualité faible, alertes
// critiques) et DÉPOSE automatiquement des propositions d'évolution au statut
// `brouillon`. Elles ne sont JAMAIS appliquées seules : cycle brouillon →
// (test) → attente de validation → approbation HUMAINE (PDG) → intégrée.
// Table isolée, additive. Fait partie du Smart Engine — ce n'est PAS un
// nouveau moteur.
export const smartStagingTypeEnum = pgEnum("smart_staging_type", [
  "optimisation",
  "correction",
  "evolution",
]);
export const smartStagingStatusEnum = pgEnum("smart_staging_status", [
  "brouillon", // proposé par le système, en attente
  "en_test", // en cours de vérification
  "a_valider", // prêt pour la décision humaine
  "approuve", // validé par le PDG (prêt à intégrer)
  "integre", // appliqué
  "rejete", // écarté par le PDG
]);
export const smartStaging = pgTable("smart_staging", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  type: smartStagingTypeEnum("type").notNull().default("optimisation"),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description"),
  // Note de risque affichée avant toute décision humaine.
  riskNote: text("risk_note"),
  status: smartStagingStatusEnum("status").notNull().default("brouillon"),
  // Origine : "evolution_autonome" (système) ou "manuel" (humain).
  origin: varchar("origin", { length: 48 }).default("evolution_autonome"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  // Décision humaine (PDG) — qui / quand.
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Rapport quotidien archivé et remis à la direction (point 39) ────────
// Le rapport n'était calculé qu'à l'ouverture de l'écran : aucune trace, et
// rien n'était remis si personne ne le consultait. Une ligne par jour.
export const smartDailyReports = pgTable("smart_daily_reports", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  // Date du rapport (une seule par jour) au format YYYY-MM-DD.
  reportDate: date("report_date").notNull().unique(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  summary: jsonb("summary").$type<Record<string, unknown>>().notNull(),
  anomalies: jsonb("anomalies").$type<Record<string, unknown>[]>().notNull().default([]),
  suggestions: jsonb("suggestions").$type<Record<string, unknown>[]>().notNull().default([]),
  // en_attente | remis | sans_destinataire | echec
  deliveryStatus: varchar("delivery_status", { length: 16 }).notNull().default("en_attente"),
  deliveredAt: timestamp("delivered_at"),
  recipients: jsonb("recipients").$type<number[]>().notNull().default([]),
  deliveryError: text("delivery_error"),
});
