/**
 * Language OS — Registre multilingue MKA.P-MS (règles MOS #11/#12/#13/#14/#15).
 *
 * Couvre : interface (UI), annonces, messagerie, notifications, documents
 * (factures, contrats, devis), SEO, recherche multilingue, Intelligence (réponse dans
 * la langue de l'utilisateur), préférences utilisateur (mémorisation).
 *
 * Consolide et étend l'existant (aucune i18n structurée n'existait — ce
 * moteur pose les fondations complètes utilisables immédiatement).
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { bigserial, boolean, integer, jsonb, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db.js";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

// ── Schéma ──────────────────────────────────────────────────────────────
export const languageLanguages = pgTable("language_languages", {
  code: varchar("code", { length: 8 }).primaryKey(),
  code3: varchar("code3", { length: 3 }),
  nameNative: varchar("name_native", { length: 80 }).notNull(),
  nameFr: varchar("name_fr", { length: 80 }).notNull(),
  nameEn: varchar("name_en", { length: 80 }).notNull(),
  rtl: boolean("rtl").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const languageTranslations = pgTable("language_translations", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  namespace: varchar("namespace", { length: 48 }).notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  language: varchar("language", { length: 8 }).notNull(),
  value: text("value").notNull(),
  source: varchar("source", { length: 16 }).notNull().default("human"),
  validated: boolean("validated").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqNsKeyLang: unique("language_translations_unique").on(t.namespace, t.key, t.language),
}));

export const languageUserPreferences = pgTable("language_user_preferences", {
  userId: integer("user_id").primaryKey(),
  preferredLanguage: varchar("preferred_language", { length: 8 }).notNull(),
  translationLevel: varchar("translation_level", { length: 16 }).notNull().default("auto"),
  autoTranslateMessages: boolean("auto_translate_messages").notNull().default(true),
  autoTranslateAnnonces: boolean("auto_translate_annonces").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const languageHealthLog = pgTable("language_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Métadonnées ─────────────────────────────────────────────────────────
const LANGUAGE_OS_VERSION = "0.3.0";
const LANGUAGE_OS_MATURITY: MaturityLevel = "sprint_3_automation";
export const LANGUAGE_OS_META = {
  name: "language-os" as const,
  label: "Language Operating System" as const,
  version: LANGUAGE_OS_VERSION,
  maturityLevel: LANGUAGE_OS_MATURITY,
  contract: "server/language-os/index.ts",
};

// ── Service ─────────────────────────────────────────────────────────────
export async function listLanguages(activeOnly = true) {
  const q = db.select().from(languageLanguages).orderBy(languageLanguages.nameFr);
  return activeOnly ? q.where(eq(languageLanguages.active, true)) : q;
}

/**
 * Récupère un bundle de traductions pour un namespace + langue.
 * Fallback automatique vers 'fr' si une clé manque dans la langue demandée.
 */
export async function getTranslations(namespace: string, language: string): Promise<Record<string, string>> {
  const rows = await db
    .select()
    .from(languageTranslations)
    .where(and(eq(languageTranslations.namespace, namespace), inArray(languageTranslations.language, [language, "fr"])));
  const out: Record<string, string> = {};
  // Priorité : langue demandée, sinon fallback fr.
  for (const r of rows.filter((x) => x.language === "fr")) out[r.key] = r.value;
  for (const r of rows.filter((x) => x.language === language)) out[r.key] = r.value;
  return out;
}

/** Traduction unique (retourne la clé si aucune trad trouvée). */
export async function t(namespace: string, key: string, language: string): Promise<string> {
  const [row] = await db
    .select({ value: languageTranslations.value })
    .from(languageTranslations)
    .where(and(
      eq(languageTranslations.namespace, namespace),
      eq(languageTranslations.key, key),
      eq(languageTranslations.language, language),
    ))
    .limit(1);
  if (row) return row.value;
  // Fallback fr
  const [fr] = await db
    .select({ value: languageTranslations.value })
    .from(languageTranslations)
    .where(and(
      eq(languageTranslations.namespace, namespace),
      eq(languageTranslations.key, key),
      eq(languageTranslations.language, "fr"),
    ))
    .limit(1);
  return fr?.value ?? key;
}

export async function upsertTranslation(input: { namespace: string; key: string; language: string; value: string; source?: "human" | "auto" | "ai" | "mixed"; validated?: boolean }) {
  const values = {
    namespace: input.namespace,
    key: input.key,
    language: input.language,
    value: input.value,
    source: input.source ?? "human",
    validated: input.validated ?? false,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(languageTranslations)
    .values(values as any)
    .onConflictDoUpdate({
      target: [languageTranslations.namespace, languageTranslations.key, languageTranslations.language],
      set: { value: values.value, source: values.source, validated: values.validated, updatedAt: new Date() },
    })
    .returning();
  return row;
}

export async function bulkUpsertTranslations(items: Array<{ namespace: string; key: string; language: string; value: string; source?: "human" | "auto" | "ai" | "mixed" }>) {
  const results = [];
  for (const it of items) results.push(await upsertTranslation(it));
  return { inserted: results.length };
}

/** Retourne la préférence linguistique d'un utilisateur (ou défauts). */
export async function getUserLanguagePref(userId: number) {
  const [row] = await db.select().from(languageUserPreferences).where(eq(languageUserPreferences.userId, userId)).limit(1);
  return row ?? {
    userId, preferredLanguage: "fr", translationLevel: "auto" as const,
    autoTranslateMessages: true, autoTranslateAnnonces: true, updatedAt: new Date(),
  };
}

export async function setUserLanguagePref(userId: number, patch: Partial<{ preferredLanguage: string; translationLevel: string; autoTranslateMessages: boolean; autoTranslateAnnonces: boolean }>) {
  const [row] = await db
    .insert(languageUserPreferences)
    .values({
      userId,
      preferredLanguage: patch.preferredLanguage ?? "fr",
      translationLevel: patch.translationLevel ?? "auto",
      autoTranslateMessages: patch.autoTranslateMessages ?? true,
      autoTranslateAnnonces: patch.autoTranslateAnnonces ?? true,
    })
    .onConflictDoUpdate({ target: languageUserPreferences.userId, set: { ...patch, updatedAt: new Date() } })
    .returning();
  return row;
}

/**
 * Détection meilleure langue disponible pour un utilisateur donné, à partir
 * de : préférence explicite → header Accept-Language → pays → 'fr' par défaut.
 */
export function detectLanguage(input: { userPref?: string | null; acceptLanguage?: string | null; countryLanguages?: string[] | null }): string {
  if (input.userPref) return input.userPref;
  if (input.acceptLanguage) {
    const first = input.acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
    if (first) return first;
  }
  if (input.countryLanguages?.length) return input.countryLanguages[0];
  return "fr";
}

// ── Health / Feed / Dashboard ───────────────────────────────────────────
export async function healthStatus() {
  const startedAt = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let languages = 0, translations = 0, prefs = 0;
  try {
    const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(languageLanguages).where(eq(languageLanguages.active, true));
    languages = Number(a?.n ?? 0);
    const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(languageTranslations);
    translations = Number(b?.n ?? 0);
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(languageUserPreferences);
    prefs = Number(c?.n ?? 0);
  } catch { status = "degraded"; }
  return {
    engine: "language-os" as const, version: LANGUAGE_OS_VERSION, status,
    checkedAt: new Date().toISOString(),
    metrics: { languagesActive: languages, translations, userPreferences: prefs, responseMs: Date.now() - startedAt },
  };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: LANGUAGE_OS_META.name, label: LANGUAGE_OS_META.label,
    version: LANGUAGE_OS_VERSION, maturityLevel: LANGUAGE_OS_MATURITY,
    health: h.status, load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: 0 }, lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const h = await healthStatus();
  return { ...feed, businessMetrics: { languages_active: h.metrics.languagesActive, translations: h.metrics.translations, user_preferences: h.metrics.userPreferences }, recentEvents: [], recentErrors: [] };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const languageOsRouter = router({
  meta: publicProcedure.query(() => LANGUAGE_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  list: publicProcedure
    .input(z.object({ activeOnly: z.boolean().default(true) }).optional())
    .query(({ input }) => listLanguages(input?.activeOnly ?? true)),

  bundle: publicProcedure
    .input(z.object({ namespace: z.string().min(1).max(48), language: z.string().min(2).max(8) }))
    .query(({ input }) => getTranslations(input.namespace, input.language)),

  t: publicProcedure
    .input(z.object({ namespace: z.string().min(1).max(48), key: z.string().min(1).max(255), language: z.string().min(2).max(8) }))
    .query(({ input }) => t(input.namespace, input.key, input.language)),

  detect: publicProcedure
    .input(z.object({ userPref: z.string().nullable().optional(), acceptLanguage: z.string().nullable().optional(), countryLanguages: z.array(z.string()).nullable().optional() }))
    .query(({ input }) => ({ language: detectLanguage(input) })),

  upsert: adminProcedure
    .input(z.object({
      namespace: z.string().min(1).max(48), key: z.string().min(1).max(255),
      language: z.string().min(2).max(8), value: z.string().min(1).max(5000),
      source: z.enum(["human", "auto", "ai", "mixed"]).default("human"),
      validated: z.boolean().default(false),
    }))
    .mutation(({ input }) => upsertTranslation(input)),

  bulkUpsert: adminProcedure
    .input(z.object({
      items: z.array(z.object({
        namespace: z.string().min(1).max(48), key: z.string().min(1).max(255),
        language: z.string().min(2).max(8), value: z.string().min(1).max(5000),
        source: z.enum(["human", "auto", "ai", "mixed"]).default("human"),
      })).min(1).max(1000),
    }))
    .mutation(({ input }) => bulkUpsertTranslations(input.items)),

  preferences: router({
    me: protectedProcedure.query(({ ctx }) => getUserLanguagePref(ctx.user.uid)),
    update: protectedProcedure
      .input(z.object({
        preferredLanguage: z.string().min(2).max(8).optional(),
        translationLevel: z.enum(["auto", "human_only", "mixed"]).optional(),
        autoTranslateMessages: z.boolean().optional(),
        autoTranslateAnnonces: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => setUserLanguagePref(ctx.user.uid, input)),
  }),
});
