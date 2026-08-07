/**
 * MKA.P-MS Global Visibility Engine — Moteur Central de Visibilité Mondiale.
 *
 * Coordonne, sous un seul moteur, la visibilité de la plateforme :
 *  - SEO classique (déjà couvert par le SEO OS — non dupliqué ici) ;
 *  - visibilité auprès des assistants IA / moteurs génératifs (GEO) ;
 *  - audience propriétaire ;
 *  - canaux de diffusion (réseaux sociaux) pilotés par configuration ;
 *  - publication organique préparée sous validation humaine (aucune dépense).
 *
 * Principe « injection automatique » : une information créée une fois
 * (annonce, service, promotion…) est ingérée ici et déclinée automatiquement
 * pour chaque canal actif. Rien n'est publié tant que ce n'est pas validé
 * (ou explicitement autorisé en auto-publication par règle du canal).
 *
 * Isolé, additif, connecté au registre central, supervisé par le Système
 * Intelligent. Aucun nom de service tiers dans le cœur : les canaux vivent en
 * base et le format de déclinaison dépend de la famille de canal (`kind`).
 */
import { z } from "zod";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { publicProcedure, adminProcedure, pdgProcedure, router } from "../trpc.js";
import {
  visibilityChannels,
  visibilityContent,
  visibilityVariants,
  visibilityPublications,
  visibilityEvents,
  visibilityAudiences,
} from "./schema.js";
import {
  generateVariant,
  type ChannelKind,
  type CentralContent,
} from "./content-engine.js";
import { rebuildAudiences } from "./audience-engine.js";
import { logActivity } from "../smart-engine/services/activity-log.js";
import type {
  ControlCenterFeed,
  EngineDashboard,
  MaturityLevel,
} from "../identity-os/contract.js";

// ── Canaux par défaut (neutres : le nom du service tiers vit dans `config`) ──
interface ChannelSeed {
  channelKey: string;
  label: string;
  kind: ChannelKind;
  requiresBudget: boolean;
  autoPublish: boolean;
  config?: Record<string, unknown>;
}

const DEFAULT_CHANNELS: ChannelSeed[] = [
  // Moteur de recherche mondial (SEO) — organique, gratuit.
  { channelKey: "moteur_recherche", label: "Moteur de recherche mondial", kind: "search", requiresBudget: false, autoPublish: true },
  // Assistants IA de recherche / moteurs génératifs (GEO) — organique.
  { channelKey: "assistants_ia", label: "Assistants IA de recherche (GEO)", kind: "ai_assistant", requiresBudget: false, autoPublish: true },
  { channelKey: "moteurs_generatifs", label: "Moteurs génératifs (aperçus IA)", kind: "ai_assistant", requiresBudget: false, autoPublish: true },
  // Réseaux sociaux — connecteurs configurables (marque en `config.connector`).
  { channelKey: "reseau_video_court", label: "Réseau vidéo court", kind: "social", requiresBudget: false, autoPublish: false, config: { connector: "video_court", format: "video" } },
  { channelKey: "reseau_video_long", label: "Réseau vidéo long", kind: "social", requiresBudget: false, autoPublish: false, config: { connector: "video_long", format: "video" } },
  { channelKey: "reseau_photo", label: "Réseau photo & stories", kind: "social", requiresBudget: false, autoPublish: false, config: { connector: "photo", format: "image" } },
  { channelKey: "reseau_social_general", label: "Réseau social généraliste", kind: "social", requiresBudget: false, autoPublish: false, config: { connector: "general", format: "text" } },
  { channelKey: "reseau_professionnel", label: "Réseau professionnel (partenaires)", kind: "social", requiresBudget: false, autoPublish: false, config: { connector: "pro", format: "text" } },
  // Canal interne (notifications / bannières plateforme) — organique.
  { channelKey: "diffusion_interne", label: "Diffusion interne plateforme", kind: "internal", requiresBudget: false, autoPublish: true },
];

let seededChannels = false;
/** Crée les canaux par défaut manquants (idempotent). */
export async function ensureChannelsSeeded(): Promise<void> {
  if (seededChannels) return;
  for (const c of DEFAULT_CHANNELS) {
    await db
      .insert(visibilityChannels)
      .values({
        channelKey: c.channelKey,
        label: c.label,
        kind: c.kind,
        requiresBudget: c.requiresBudget,
        autoPublish: c.autoPublish,
        config: c.config ?? null,
      })
      .onConflictDoNothing({ target: visibilityChannels.channelKey });
  }
  seededChannels = true;
}

export interface IngestInput {
  sourceType: string;
  sourceId?: string | null;
  title: string;
  body: string;
  lang?: string | null;
  country?: string | null;
  mediaUrl?: string | null;
  link?: string | null;
  keywords?: string[];
}

export interface IngestResult {
  contentId: number;
  variants: number;
  publicationsPrepared: number;
  autoPublished: number;
}

/**
 * Injection automatique : crée le contenu central, génère une déclinaison par
 * canal actif et prépare les publications (validation humaine par défaut).
 * Fire-and-forget côté appelant — ne doit jamais casser le flux métier.
 */
export async function ingest(input: IngestInput): Promise<IngestResult> {
  await ensureChannelsSeeded();

  const [content] = await db
    .insert(visibilityContent)
    .values({
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      title: input.title.slice(0, 200),
      body: input.body.slice(0, 2000),
      lang: input.lang ?? "fr",
      country: input.country ?? null,
      mediaUrl: input.mediaUrl ?? null,
      link: input.link ?? null,
      status: "ready",
    })
    .returning({ id: visibilityContent.id });

  const central: CentralContent = {
    title: input.title,
    body: input.body,
    link: input.link,
    lang: input.lang,
    country: input.country,
    keywords: input.keywords,
  };

  const channels = await db
    .select()
    .from(visibilityChannels)
    .where(eq(visibilityChannels.enabled, true));

  let variantsCount = 0;
  let prepared = 0;
  let autoPublished = 0;

  for (const ch of channels) {
    const v = generateVariant(central, ch.kind as ChannelKind);
    const [variant] = await db
      .insert(visibilityVariants)
      .values({
        contentId: content.id,
        channelKey: ch.channelKey,
        text: v.text,
        hashtags: v.hashtags,
        status: ch.autoPublish ? "validated" : "prepared",
      })
      .returning({ id: visibilityVariants.id });
    variantsCount += 1;

    const willAutoPublish = ch.autoPublish && !ch.requiresBudget;
    await db.insert(visibilityPublications).values({
      variantId: variant.id,
      contentId: content.id,
      channelKey: ch.channelKey,
      country: input.country ?? null,
      lang: input.lang ?? "fr",
      status: willAutoPublish ? "published" : "prepared",
      publishedAt: willAutoPublish ? new Date() : null,
      detail: willAutoPublish
        ? "Publié automatiquement (canal organique gratuit)."
        : "Préparé — en attente de validation humaine.",
    });
    if (willAutoPublish) autoPublished += 1;
    else prepared += 1;

    await db.insert(visibilityEvents).values({
      channelKey: ch.channelKey,
      kind: willAutoPublish ? "impression" : "prepared",
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      country: input.country ?? null,
      value: 1,
    });
  }

  logActivity({
    action: "visibility.ingested",
    targetType: "page",
    data: {
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      variants: variantsCount,
      autoPublished,
      prepared,
    },
    result: "success",
  }).catch(() => {});

  return { contentId: content.id, variants: variantsCount, publicationsPrepared: prepared, autoPublished };
}

/** Valide (et marque publiée) une publication préparée. */
export async function validatePublication(id: number, userId?: number) {
  const [pub] = await db
    .update(visibilityPublications)
    .set({ status: "published", publishedAt: new Date(), validatedBy: userId ?? null, detail: "Validé et publié (organique)." })
    .where(eq(visibilityPublications.id, id))
    .returning();
  if (pub?.variantId) {
    await db
      .update(visibilityVariants)
      .set({ status: "published" })
      .where(eq(visibilityVariants.id, pub.variantId));
  }
  logActivity({ action: "visibility.published", userId, targetType: "page", data: { publicationId: id, channel: pub?.channelKey }, result: "success" }).catch(() => {});
  return pub ?? null;
}

export interface VisibilityOverview {
  generatedAt: string;
  channels: { total: number; enabled: number; social: number; organic: number };
  content24h: number;
  publications: { prepared: number; published: number; failed: number };
  events24h: { impressions: number; clicks: number; conversions: number };
  audiences: { total: number; owner: number; external: number };
  byChannel: Array<{ channelKey: string; label: string; kind: string; enabled: boolean; publications: number }>;
}

export async function overview(): Promise<VisibilityOverview> {
  await ensureChannelsSeeded();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const channels = await db.select().from(visibilityChannels);
  const [c24] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(visibilityContent)
    .where(gte(visibilityContent.createdAt, since));

  const pubRows = await db
    .select({ status: visibilityPublications.status, n: sql<number>`count(*)::int` })
    .from(visibilityPublications)
    .groupBy(visibilityPublications.status);
  const pubMap: Record<string, number> = {};
  for (const r of pubRows) pubMap[r.status] = Number(r.n);

  const evRows = await db
    .select({ kind: visibilityEvents.kind, n: sql<number>`count(*)::int` })
    .from(visibilityEvents)
    .where(gte(visibilityEvents.createdAt, since))
    .groupBy(visibilityEvents.kind);
  const evMap: Record<string, number> = {};
  for (const r of evRows) evMap[r.kind] = Number(r.n);

  const perChannel = await db
    .select({ channelKey: visibilityPublications.channelKey, n: sql<number>`count(*)::int` })
    .from(visibilityPublications)
    .groupBy(visibilityPublications.channelKey);
  const perMap: Record<string, number> = {};
  for (const r of perChannel) perMap[r.channelKey] = Number(r.n);

  const audRows = await db
    .select({ source: visibilityAudiences.source, n: sql<number>`count(*)::int` })
    .from(visibilityAudiences)
    .groupBy(visibilityAudiences.source);
  const audMap: Record<string, number> = {};
  for (const r of audRows) audMap[r.source] = Number(r.n);

  return {
    generatedAt: new Date().toISOString(),
    channels: {
      total: channels.length,
      enabled: channels.filter((c) => c.enabled).length,
      social: channels.filter((c) => c.kind === "social").length,
      organic: channels.filter((c) => !c.requiresBudget).length,
    },
    content24h: Number(c24?.n ?? 0),
    publications: {
      prepared: pubMap["prepared"] ?? 0,
      published: pubMap["published"] ?? 0,
      failed: pubMap["failed"] ?? 0,
    },
    events24h: {
      impressions: evMap["impression"] ?? 0,
      clicks: evMap["click"] ?? 0,
      conversions: evMap["conversion"] ?? 0,
    },
    audiences: {
      total: (audMap["owner"] ?? 0) + (audMap["external_ad"] ?? 0),
      owner: audMap["owner"] ?? 0,
      external: audMap["external_ad"] ?? 0,
    },
    byChannel: channels
      .map((c) => ({ channelKey: c.channelKey, label: c.label, kind: c.kind, enabled: c.enabled, publications: perMap[c.channelKey] ?? 0 }))
      .sort((a, b) => b.publications - a.publications),
  };
}

// ── Métadonnées / Health / Feed / Dashboard (standard MOS) ────────────────
const V = "0.1.0";
const M: MaturityLevel = "sprint_1_minimal";
export const VISIBILITY_OS_META = {
  name: "visibility-os" as const,
  label: "Global Visibility Engine" as const,
  version: V,
  maturityLevel: M,
  contract: "server/visibility-os/index.ts",
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let channels = 0;
  try {
    await ensureChannelsSeeded();
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(visibilityChannels);
    channels = Number(row?.n ?? 0);
    if (channels === 0) status = "degraded";
  } catch {
    status = "down";
  }
  return { engine: "visibility-os" as const, version: V, status, checkedAt: new Date().toISOString(), metrics: { channels, responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  let events24h = 0;
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(visibilityEvents).where(gte(visibilityEvents.createdAt, since));
    events24h = Number(row?.n ?? 0);
  } catch { /* non bloquant */ }
  return {
    engine: VISIBILITY_OS_META.name,
    label: VISIBILITY_OS_META.label,
    version: V,
    maturityLevel: M,
    health: h.status,
    load: { events5m: 0, events24h },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(),
    status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const ov = await overview();
  return {
    ...feed,
    businessMetrics: {
      channels: ov.channels.total,
      channels_enabled: ov.channels.enabled,
      content_24h: ov.content24h,
      publications_prepared: ov.publications.prepared,
      publications_published: ov.publications.published,
    },
    recentEvents: [],
    recentErrors: [],
  };
}

// ── Router tRPC ───────────────────────────────────────────────────────────
export const visibilityOsRouter = router({
  meta: publicProcedure.query(() => VISIBILITY_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),
  overview: adminProcedure.query(() => overview()),

  channels: adminProcedure.query(async () => {
    await ensureChannelsSeeded();
    return db.select().from(visibilityChannels).orderBy(visibilityChannels.kind, visibilityChannels.label);
  }),

  setChannel: pdgProcedure
    .input(z.object({ channelKey: z.string(), enabled: z.boolean().optional(), autoPublish: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (input.enabled !== undefined) patch.enabled = input.enabled;
      if (input.autoPublish !== undefined) patch.autoPublish = input.autoPublish;
      const [row] = await db.update(visibilityChannels).set(patch).where(eq(visibilityChannels.channelKey, input.channelKey)).returning();
      return row ?? null;
    }),

  content: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional())
    .query(async ({ input }) => {
      return db.select().from(visibilityContent).orderBy(desc(visibilityContent.createdAt)).limit(input?.limit ?? 30);
    }),

  publications: adminProcedure
    .input(z.object({ status: z.string().optional(), channelKey: z.string().optional(), limit: z.number().min(1).max(200).default(50) }).optional())
    .query(async ({ input }) => {
      const conds = [];
      if (input?.status) conds.push(eq(visibilityPublications.status, input.status));
      if (input?.channelKey) conds.push(eq(visibilityPublications.channelKey, input.channelKey));
      const q = db.select().from(visibilityPublications);
      const rows = conds.length
        ? await q.where(and(...conds)).orderBy(desc(visibilityPublications.createdAt)).limit(input?.limit ?? 50)
        : await q.orderBy(desc(visibilityPublications.createdAt)).limit(input?.limit ?? 50);
      return rows;
    }),

  variantsFor: adminProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(visibilityVariants).where(eq(visibilityVariants.contentId, input.contentId));
    }),

  validatePublication: pdgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input, ctx }) => validatePublication(input.id, ctx.user.uid)),

  // ── Moteur d'Audience mondial ─────────────────────────────────────────
  audiences: adminProcedure
    .input(z.object({ dimension: z.string().optional(), source: z.string().optional(), country: z.string().optional(), limit: z.number().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      const conds = [];
      if (input?.dimension) conds.push(eq(visibilityAudiences.dimension, input.dimension));
      if (input?.source) conds.push(eq(visibilityAudiences.source, input.source));
      if (input?.country) conds.push(eq(visibilityAudiences.country, input.country.slice(0, 2).toUpperCase()));
      const q = db.select().from(visibilityAudiences);
      return conds.length
        ? q.where(and(...conds)).orderBy(desc(visibilityAudiences.size)).limit(input?.limit ?? 100)
        : q.orderBy(desc(visibilityAudiences.size)).limit(input?.limit ?? 100);
    }),

  rebuildAudiences: pdgProcedure.mutation(async () => {
    const res = await rebuildAudiences();
    logActivity({ action: "visibility.audiences_rebuilt", targetType: "page", data: { ...res }, result: "success" }).catch(() => {});
    return res;
  }),

  ingest: pdgProcedure
    .input(
      z.object({
        sourceType: z.string(),
        sourceId: z.string().optional(),
        title: z.string().min(1),
        body: z.string().min(1),
        lang: z.string().optional(),
        country: z.string().optional(),
        mediaUrl: z.string().optional(),
        link: z.string().optional(),
        keywords: z.array(z.string()).optional(),
      }),
    )
    .mutation(({ input }) => ingest(input)),
});
