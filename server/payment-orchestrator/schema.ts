/**
 * MKA.P-MS Payment Orchestrator — schéma (tables isolées).
 *
 * Objectif (point 29) : pouvoir ajouter un prestataire de paiement sans
 * reconstruire le parcours d'achat. Un prestataire est une DONNÉE
 * (pays, devises, moyens, services, priorité), pas une branche `if` dans le
 * code métier. Le cœur ne connaît que des connecteurs.
 */
import {
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
 * Prestataires déclarés. Déclaré ≠ utilisable : un prestataire n'est
 * sélectionné que si son connecteur est réellement implémenté ET configuré.
 */
export const paymentProviders = pgTable(
  "payment_providers",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    label: varchar("label", { length: 80 }).notNull(),
    /** Pays couverts. `["*"]` = tous les pays. */
    countries: jsonb("countries").$type<string[]>().notNull().default(["*"]),
    /** Devises acceptées. `["*"]` = toutes. */
    currencies: jsonb("currencies").$type<string[]>().notNull().default(["*"]),
    /** Moyens de paiement portés (card, bank_transfer, wallet, mobile_money…). */
    methods: jsonb("methods").$type<string[]>().notNull().default([]),
    /** Services couverts. `["*"]` = tous les univers. */
    services: jsonb("services").$type<string[]>().notNull().default(["*"]),
    /** Priorité de sélection : le plus petit gagne. */
    priority: integer("priority").notNull().default(100),
    /**
     * Le connecteur d'exécution existe-t-il dans le code ?
     * Un prestataire non intégré reste visible dans le registre mais n'est
     * jamais sélectionné : on ne promet pas un paiement impossible.
     */
    integrated: boolean("integrated").notNull().default(false),
    /** Nom de la variable d'environnement qui prouve la configuration. */
    configEnvKey: varchar("config_env_key", { length: 64 }),
    active: boolean("active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    activeIdx: index("payment_providers_active_idx").on(t.active, t.priority),
  }),
);

/**
 * Journal des décisions de routage. Sert à l'audit mondial (point 28) :
 * on doit pouvoir expliquer POURQUOI un paiement est parti chez tel
 * prestataire — ou pourquoi il n'a pas pu partir du tout.
 */
export const paymentRoutingDecisions = pgTable(
  "payment_routing_decisions",
  {
    id: serial("id").primaryKey(),
    countryCode: varchar("country_code", { length: 4 }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull(),
    service: varchar("service", { length: 64 }),
    method: varchar("method", { length: 24 }),
    /** Prestataire retenu, ou `null` si aucun n'était utilisable. */
    providerCode: varchar("provider_code", { length: 32 }),
    /** Raison lisible de la décision (retenue ou refus). */
    reason: varchar("reason", { length: 200 }).notNull(),
    /** Codes écartés et motif, pour comprendre après coup. */
    rejected: jsonb("rejected").$type<{ code: string; reason: string }[]>().notNull().default([]),
    userId: integer("user_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    countryIdx: index("payment_routing_decisions_country_idx").on(t.countryCode, t.createdAt),
  }),
);
