/**
 * Points 71-72-75 — tables du Centre de Commandes MKA.P-MS.
 *
 * Module additif et isolé (préfixe `cc_`). Il ne modifie aucune table
 * existante : une commande comprise devient une tâche du Centre d'Actions
 * (points 69-70), et un dossier de développement devient un passage du
 * pipeline obligatoire (point 76). Rien n'est exécuté ici directement.
 */
import {
  bigserial,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Point 71 — chaque demande reçue, écrite ou dictée, avec son interprétation
 * exacte. Une demande non comprise est conservée telle quelle : c'est ce qui
 * permet d'apprendre ce que la plateforme ne sait pas encore faire.
 */
export const ccCommands = pgTable("cc_commands", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  /** `ecrit` ou `vocal` — une commande dictée n'a pas le même régime. */
  channel: varchar("channel", { length: 12 }).notNull().default("ecrit"),
  rawText: text("raw_text").notNull(),
  language: varchar("language", { length: 8 }).notNull().default("fr"),
  /** Intention reconnue, ou null si la demande n'a pas été comprise. */
  intent: varchar("intent", { length: 60 }),
  actionType: varchar("action_type", { length: 120 }),
  entities: jsonb("entities").$type<Record<string, string>>().notNull().default({}),
  countryCode: varchar("country_code", { length: 4 }),
  riskLevel: integer("risk_level").notNull().default(1),
  /** `comprise` | `ambigue` | `hors_perimetre` | `refusee` */
  verdict: varchar("verdict", { length: 20 }).notNull(),
  reason: text("reason").notNull(),
  /** Tâche créée dans le Centre d'Actions, quand la demande était exécutable. */
  actionTaskId: integer("action_task_id"),
  /** Session vocale d'origine, pour les commandes dictées. */
  voiceSessionId: integer("voice_session_id"),
  actorId: integer("actor_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 72 — une session vocale. L'authentification forte est un fait
 * constaté, pas une case cochée : sans elle, aucune commande dictée n'est
 * transformée en action.
 */
export const ccVoiceSessions = pgTable("cc_voice_sessions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorId: integer("actor_id").notNull(),
  /** Moyen réellement vérifié (`mot_de_passe_ressaisi`, `code_2fa`…). */
  strongAuthMethod: varchar("strong_auth_method", { length: 40 }),
  strongAuthAt: timestamp("strong_auth_at"),
  /** `ouverte` | `expiree` | `fermee` */
  status: varchar("status", { length: 12 }).notNull().default("ouverte"),
  device: varchar("device", { length: 120 }),
  commandsCount: integer("commands_count").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 75 — dossier de l'agent développeur. Il porte le besoin, l'analyse
 * d'architecture et le plan ; la production de code n'est possible que si une
 * capacité de génération est réellement configurée, sinon le dossier le dit.
 */
export const ccDevRequests = pgTable("cc_dev_requests", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  need: text("need").notNull(),
  /** Modules/moteurs identifiés comme concernés par l'analyse. */
  scope: jsonb("scope").$type<string[]>().notNull().default([]),
  analysis: text("analysis"),
  plan: jsonb("plan").$type<{ step: string; detail: string }[]>().notNull().default([]),
  riskLevel: integer("risk_level").notNull().default(2),
  countryCode: varchar("country_code", { length: 4 }),
  /** Vrai seulement si une génération de code est réellement branchée. */
  generationAvailable: boolean("generation_available").notNull().default(false),
  /** `analyse` | `plan_pret` | `en_pipeline` | `bloque` | `livre` | `abandonne` */
  status: varchar("status", { length: 16 }).notNull().default("analyse"),
  blockedReason: text("blocked_reason"),
  /** Passage du pipeline obligatoire (point 76) ouvert pour ce dossier. */
  pipelineRunId: integer("pipeline_run_id"),
  requestedBy: integer("requested_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
