/**
 * Points 104-107 — tables du bus d'événements. Additif : les événements
 * eux-mêmes restent dans `engine_events` (registre des moteurs), on ajoute ici
 * les abonnements, les remises et les passes de distribution.
 */
import {
  bigserial,
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

/** Qui écoute quoi. Une ligne par couple (moteur, type d'événement). */
export const ebSubscriptions = pgTable(
  "eb_subscriptions",
  {
    id: serial("id").primaryKey(),
    engine: varchar("engine", { length: 64 }).notNull(),
    eventType: varchar("event_type", { length: 128 }).notNull(),
    handler: varchar("handler", { length: 64 }).notNull(),
    effet: text("effet").notNull().default(""),
    actif: boolean("actif").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique("eb_subscriptions_unique").on(t.engine, t.eventType)],
);

/** Une remise = un événement présenté à un abonné. C'est la preuve du point 106. */
export const ebDeliveries = pgTable("eb_deliveries", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  eventId: integer("event_id").notNull(),
  eventType: varchar("event_type", { length: 128 }).notNull(),
  engine: varchar("engine", { length: 64 }).notNull(),
  handler: varchar("handler", { length: 64 }).notNull(),
  /** "remise" | "echec" | "ignoree" */
  statut: varchar("statut", { length: 16 }).notNull().default("remise"),
  tentatives: integer("tentatives").notNull().default(1),
  dureeMs: integer("duree_ms").notNull().default(0),
  detail: text("detail").notNull().default(""),
  erreur: text("erreur").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Passe de distribution : ce que le bus a traité, et ce qu'il n'a pas pu traiter. */
export const ebDispatchRuns = pgTable("eb_dispatch_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  trigger: varchar("trigger", { length: 24 }).notNull().default("auto"),
  requestedBy: integer("requested_by"),
  evenements: integer("evenements").notNull().default(0),
  remises: integer("remises").notNull().default(0),
  echecs: integer("echecs").notNull().default(0),
  orphelins: integer("orphelins").notNull().default(0),
  detail: jsonb("detail").$type<{ type: string; resultat: string }[]>().default([]),
});
