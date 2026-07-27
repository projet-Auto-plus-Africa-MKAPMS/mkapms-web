/**
 * Search OS — moteur de recherche unifié (Phase 52).
 *
 * Un seul point d'entrée pour rechercher sur toute la plateforme :
 * annonces (véhicules), garages/professionnels, villes et services. Ne
 * duplique aucune donnée : interroge les tables existantes (`annonces`,
 * `garages`). Recherche « intelligente » : normalisation (accents/casse),
 * tolérance aux fautes (tokens + ILIKE), synonymes et suggestions.
 *
 * Interconnexion : Supervision & Opérations (feed MOS).
 */
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { annonces, garages } from "../schema.js";
import { publicProcedure, adminProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

// ── Synonymes (expansion de requête) ─────────────────────────────────────
const SYNONYMS: Record<string, string[]> = {
  voiture: ["auto", "vehicule", "véhicule"],
  auto: ["voiture", "vehicule"],
  moto: ["scooter", "deux-roues"],
  utilitaire: ["camionnette", "fourgon"],
  camion: ["poids lourd", "utilitaire"],
  garage: ["mecanicien", "mécanicien", "atelier", "reparateur"],
  location: ["louer", "louer voiture", "rental"],
  vente: ["acheter", "achat", "occasion"],
  electrique: ["électrique", "ev", "zero emission"],
  pieces: ["pièces", "piece", "accessoire"],
};

/** Normalise : minuscules + suppression des accents. */
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Découpe la requête en tokens significatifs + étend avec les synonymes. */
export function expandTokens(q: string): string[] {
  const base = normalize(q).split(/\s+/).filter((t) => t.length >= 2);
  const extra: string[] = [];
  for (const t of base) {
    const syn = SYNONYMS[t];
    if (syn) extra.push(...syn.map(normalize));
  }
  return Array.from(new Set([...base, ...extra]));
}

export type SearchType = "annonce" | "garage" | "ville" | "service";

export interface SearchHit {
  type: SearchType;
  id: number;
  title: string;
  subtitle?: string;
  url: string;
  score: number;
}

// Services statiques indexés (portes d'entrée métier).
const SERVICES: { title: string; url: string; keywords: string[] }[] = [
  { title: "Garage automobile", url: "/garages", keywords: ["garage", "mecanique", "reparation", "entretien"] },
  { title: "Contrôle technique", url: "/service/controle-technique", keywords: ["controle technique", "ct", "contre visite"] },
  { title: "Carrosserie", url: "/service/carrosserie", keywords: ["carrosserie", "peinture", "debosselage", "pare-brise"] },
  { title: "Carte grise", url: "/demarches", keywords: ["carte grise", "immatriculation", "administratif", "ww"] },
  { title: "Pièces détachées", url: "/pieces", keywords: ["pieces", "piece detachee", "accessoire"] },
  { title: "Location de véhicule", url: "/louer", keywords: ["location", "louer", "vtc", "taxi"] },
  { title: "Achat de véhicule", url: "/acheter", keywords: ["acheter", "achat", "occasion", "vente"] },
  { title: "Dépannage / remorquage", url: "/depannage", keywords: ["depannage", "remorquage", "panne"] },
];

// ── Recherche ─────────────────────────────────────────────────────────────
async function searchAnnonces(tokens: string[], limit: number): Promise<SearchHit[]> {
  if (tokens.length === 0) return [];
  const conds = tokens.flatMap((t) => [
    ilike(annonces.titre, `%${t}%`),
    ilike(annonces.marque, `%${t}%`),
    ilike(annonces.modele, `%${t}%`),
    ilike(annonces.ville, `%${t}%`),
  ]);
  const rows = await db
    .select({ id: annonces.id, titre: annonces.titre, marque: annonces.marque, modele: annonces.modele, ville: annonces.ville, prix: annonces.prix, boosted: annonces.boosted })
    .from(annonces)
    .where(and(eq(annonces.status, "publiee"), or(...conds)))
    .orderBy(desc(annonces.boosted), desc(annonces.publishedAt))
    .limit(limit);
  return rows.map((r) => ({
    type: "annonce" as const,
    id: r.id,
    title: r.titre,
    subtitle: [`${r.marque} ${r.modele}`.trim(), r.ville ?? undefined].filter(Boolean).join(" · "),
    url: `/vehicule/${r.id}`,
    score: r.boosted ? 2 : 1,
  }));
}

async function searchGarages(tokens: string[], limit: number): Promise<SearchHit[]> {
  if (tokens.length === 0) return [];
  const conds = tokens.flatMap((t) => [
    ilike(garages.name, `%${t}%`),
    ilike(garages.city, `%${t}%`),
    ilike(garages.description, `%${t}%`),
  ]);
  const rows = await db
    .select({ id: garages.id, name: garages.name, slug: garages.slug, city: garages.city, rating: garages.rating })
    .from(garages)
    .where(and(eq(garages.status, "active"), or(...conds)))
    .orderBy(desc(garages.rating))
    .limit(limit);
  return rows.map((r) => ({
    type: "garage" as const,
    id: Number(r.id),
    title: r.name,
    subtitle: [r.city ?? undefined, r.rating ? `★ ${r.rating}` : undefined].filter(Boolean).join(" · "),
    url: `/garages/${r.slug}`,
    score: 1,
  }));
}

function searchServices(tokens: string[]): SearchHit[] {
  if (tokens.length === 0) return [];
  const hits: SearchHit[] = [];
  SERVICES.forEach((svc, i) => {
    const hay = normalize(svc.title + " " + svc.keywords.join(" "));
    const match = tokens.some((t) => hay.includes(t));
    if (match) hits.push({ type: "service", id: i, title: svc.title, url: svc.url, score: 1.5 });
  });
  return hits;
}

async function searchVilles(tokens: string[], limit: number): Promise<SearchHit[]> {
  if (tokens.length === 0) return [];
  const conds = tokens.map((t) => ilike(annonces.ville, `%${t}%`));
  const rows = await db
    .select({ ville: annonces.ville, n: sql<number>`count(*)::int` })
    .from(annonces)
    .where(and(eq(annonces.status, "publiee"), or(...conds)))
    .groupBy(annonces.ville)
    .orderBy(sql`count(*) desc`)
    .limit(limit);
  return rows
    .filter((r) => r.ville)
    .map((r, i) => ({
      type: "ville" as const,
      id: i,
      title: r.ville as string,
      subtitle: `${r.n} annonce(s)`,
      url: `/ville/${normalize(r.ville as string).replace(/\s+/g, "-")}`,
      score: 1,
    }));
}

export interface SearchResult {
  query: string;
  tokens: string[];
  total: number;
  results: SearchHit[];
  byType: Record<SearchType, number>;
}

export async function search(q: string, opts?: { types?: SearchType[]; limit?: number }): Promise<SearchResult> {
  const tokens = expandTokens(q);
  const limit = opts?.limit ?? 10;
  const want = (t: SearchType) => !opts?.types || opts.types.includes(t);

  const [annoncesHits, garagesHits, villesHits] = await Promise.all([
    want("annonce") ? searchAnnonces(tokens, limit) : Promise.resolve([]),
    want("garage") ? searchGarages(tokens, limit) : Promise.resolve([]),
    want("ville") ? searchVilles(tokens, 5) : Promise.resolve([]),
  ]);
  const servicesHits = want("service") ? searchServices(tokens) : [];

  const results = [...servicesHits, ...annoncesHits, ...garagesHits, ...villesHits].sort((a, b) => b.score - a.score);
  const byType: Record<SearchType, number> = { annonce: annoncesHits.length, garage: garagesHits.length, ville: villesHits.length, service: servicesHits.length };
  return { query: q, tokens, total: results.length, results, byType };
}

/** Suggestions (autocomplétion) : marques + villes les plus fréquentes. */
export async function suggest(prefix: string, limit = 8): Promise<string[]> {
  const p = normalize(prefix);
  if (p.length < 1) return [];
  const [marques, villes] = await Promise.all([
    db.select({ v: annonces.marque, n: sql<number>`count(*)::int` }).from(annonces)
      .where(and(eq(annonces.status, "publiee"), ilike(annonces.marque, `${p}%`)))
      .groupBy(annonces.marque).orderBy(sql`count(*) desc`).limit(limit),
    db.select({ v: annonces.ville, n: sql<number>`count(*)::int` }).from(annonces)
      .where(and(eq(annonces.status, "publiee"), ilike(annonces.ville, `${p}%`)))
      .groupBy(annonces.ville).orderBy(sql`count(*) desc`).limit(limit),
  ]);
  const out = [...marques.map((r) => r.v), ...villes.map((r) => r.v)].filter(Boolean) as string[];
  return Array.from(new Set(out)).slice(0, limit);
}

// ── Métadonnées / Health / Feed / Dashboard ──────────────────────────────
const V = "0.1.0";
const M: MaturityLevel = "sprint_2_complete";
export const SEARCH_OS_META = {
  name: "search-os" as const,
  label: "Search Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/search-os/index.ts",
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let indexable = 0;
  try {
    const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(annonces).where(eq(annonces.status, "publiee"));
    indexable = Number(a?.n ?? 0);
  } catch { status = "degraded"; }
  return { engine: "search-os" as const, version: V, status, checkedAt: new Date().toISOString(), metrics: { indexableAnnonces: indexable, responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: SEARCH_OS_META.name, label: SEARCH_OS_META.label,
    version: V, maturityLevel: M, health: h.status,
    load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const h = await healthStatus();
  return { ...feed, businessMetrics: { indexable_annonces: h.metrics.indexableAnnonces, services: SERVICES.length }, recentEvents: [], recentErrors: [] };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const searchOsRouter = router({
  meta: publicProcedure.query(() => SEARCH_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  query: publicProcedure
    .input(z.object({
      q: z.string().min(1).max(120),
      types: z.array(z.enum(["annonce", "garage", "ville", "service"])).optional(),
      limit: z.number().int().min(1).max(50).default(10),
    }))
    .query(({ input }) => search(input.q, { types: input.types, limit: input.limit })),

  suggest: publicProcedure
    .input(z.object({ prefix: z.string().min(1).max(60), limit: z.number().int().min(1).max(20).default(8) }))
    .query(({ input }) => suggest(input.prefix, input.limit)),
});
