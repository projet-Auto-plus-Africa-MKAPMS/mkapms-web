/**
 * MKA.P-MS Intent Engine — mots-clés, questions et intentions (3 niveaux).
 *
 *   Mot-clé   → "location voiture"
 *   Question  → "où louer une voiture pas chère près de moi ?"
 *   Intention → "LOCATION+LOCAL+PRIX+DISPONIBILITE"
 *
 * Ces données alimentent le SEO, la recherche interne, les suggestions, les
 * recommandations, les contenus sociaux, la visibilité Intelligence/GEO et le ciblage
 * d'audience. Le `trendScore` est dérivé des signaux RÉELS de la plateforme
 * (recherches enregistrées) — aucune copie de contenu tiers.
 *
 * Brand-neutral, additif, idempotent (upsert par `intent_key`).
 */
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { visibilityIntents } from "./schema.js";
import { savedSearches } from "../modules/core.js";

interface IntentSeed {
  keyword: string;
  question: string;
  intention: string;
  topic: string;
}

/** Socle générique (brand-neutral) couvrant les intentions automobiles clés. */
const BASE_INTENTS: IntentSeed[] = [
  { keyword: "location voiture", question: "où louer une voiture pas chère près de moi ?", intention: "LOCATION+LOCAL+PRIX+DISPONIBILITE", topic: "location" },
  { keyword: "louer utilitaire", question: "où louer un utilitaire pour déménager ?", intention: "LOCATION+UTILITAIRE+LOCAL+DISPONIBILITE", topic: "location" },
  { keyword: "acheter voiture occasion", question: "où acheter une voiture d'occasion fiable ?", intention: "ACHAT+OCCASION+CONFIANCE+PRIX", topic: "achat" },
  { keyword: "voiture pas cher", question: "quelle voiture d'occasion pas chère acheter ?", intention: "ACHAT+PRIX+OCCASION", topic: "achat" },
  { keyword: "vendre ma voiture", question: "comment vendre rapidement ma voiture ?", intention: "VENTE+RAPIDITE+ESTIMATION", topic: "vente" },
  { keyword: "estimation voiture", question: "comment estimer le prix de ma voiture ?", intention: "VENTE+ESTIMATION+PRIX", topic: "vente" },
  { keyword: "garage près de moi", question: "où trouver un garage de confiance près de chez moi ?", intention: "REPARATION+LOCAL+CONFIANCE", topic: "garage" },
  { keyword: "carrosserie", question: "où faire réparer la carrosserie de ma voiture ?", intention: "REPARATION+CARROSSERIE+LOCAL", topic: "garage" },
  { keyword: "controle technique", question: "où faire un contrôle technique près de moi ?", intention: "CONTROLE_TECHNIQUE+LOCAL+RENDEZVOUS", topic: "controle_technique" },
  { keyword: "carte grise", question: "comment faire ma carte grise en ligne ?", intention: "DEMARCHE+CARTE_GRISE+EN_LIGNE", topic: "carte_grise" },
  { keyword: "pieces detachees auto", question: "où trouver des pièces détachées pour ma voiture ?", intention: "PIECES+DISPONIBILITE+PRIX", topic: "pieces" },
  { keyword: "depannage voiture", question: "comment être dépanné rapidement en cas de panne ?", intention: "DEPANNAGE+URGENCE+LOCAL", topic: "depannage" },
  { keyword: "vtc taxi", question: "comment réserver un VTC ou un taxi ?", intention: "TRANSPORT+VTC+RESERVATION", topic: "location" },
];

function normCountry(c?: string | null): string | null {
  if (!c) return null;
  return c.slice(0, 2).toUpperCase();
}

export interface IntentSeedResult {
  written: number;
  countries: string[];
}

/** Sème / met à jour le socle d'intentions pour un ou plusieurs pays. */
export async function seedIntents(countries: Array<string | null> = [null]): Promise<IntentSeedResult> {
  const now = new Date();
  let written = 0;
  const used = new Set<string>();
  for (const raw of countries.length ? countries : [null]) {
    const c = normCountry(raw);
    used.add(c ?? "GLOBAL");
    for (const it of BASE_INTENTS) {
      const key = `${it.topic}:${c ?? "global"}:${it.keyword}`.slice(0, 200);
      await db
        .insert(visibilityIntents)
        .values({
          intentKey: key,
          keyword: it.keyword,
          question: it.question,
          intention: it.intention,
          topic: it.topic,
          lang: "fr",
          country: c,
          source: "base",
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: visibilityIntents.intentKey,
          set: { question: it.question, intention: it.intention, updatedAt: now },
        });
      written += 1;
    }
  }
  return { written, countries: [...used] };
}

/** Map univers de recherche → topic d'intention. */
const UNIVERS_TOPIC: Record<string, string> = {
  vente: "achat",
  location: "location",
  garage: "garage",
  garages: "garage",
  pieces: "pieces",
  depannage: "depannage",
};

interface SearchFilters {
  q?: unknown;
  marque?: unknown;
  ville?: unknown;
  prixMax?: unknown;
}

/**
 * Dérive des intentions « tendance » à partir des recherches enregistrées
 * réelles. Chaque groupe (mot-clé normalisé) reçoit un `trendScore` = nombre de
 * recherches. Signal 100 % propriétaire, jamais copié d'un tiers.
 */
export async function deriveTrendsFromSearches(): Promise<{ derived: number }> {
  const rows = await db
    .select({ univers: savedSearches.univers, filters: savedSearches.filters })
    .from(savedSearches);

  const counter = new Map<string, { keyword: string; topic: string; hasCity: boolean; hasPrice: boolean; n: number }>();
  for (const r of rows) {
    const f = (r.filters ?? {}) as SearchFilters;
    const parts: string[] = [];
    if (typeof f.q === "string" && f.q.trim()) parts.push(f.q.trim());
    if (typeof f.marque === "string" && f.marque.trim()) parts.push(f.marque.trim());
    const keyword = parts.join(" ").toLowerCase().slice(0, 160);
    if (!keyword) continue;
    const topic = UNIVERS_TOPIC[r.univers] ?? "achat";
    const hasCity = typeof f.ville === "string" && f.ville.trim().length > 0;
    const hasPrice = f.prixMax != null && String(f.prixMax).length > 0;
    const key = `${topic}:${keyword}`;
    const cur = counter.get(key) ?? { keyword, topic, hasCity, hasPrice, n: 0 };
    cur.n += 1;
    cur.hasCity = cur.hasCity || hasCity;
    cur.hasPrice = cur.hasPrice || hasPrice;
    counter.set(key, cur);
  }

  const now = new Date();
  let derived = 0;
  for (const [, v] of counter) {
    const tags = [v.topic.toUpperCase()];
    if (v.hasCity) tags.push("LOCAL");
    if (v.hasPrice) tags.push("PRIX");
    tags.push("TENDANCE");
    const key = `${v.topic}:trend:${v.keyword}`.slice(0, 200);
    await db
      .insert(visibilityIntents)
      .values({
        intentKey: key,
        keyword: v.keyword,
        question: null,
        intention: tags.join("+"),
        topic: v.topic,
        lang: "fr",
        country: null,
        trendScore: v.n,
        source: "search_signal",
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: visibilityIntents.intentKey,
        set: { trendScore: v.n, intention: tags.join("+"), updatedAt: now },
      });
    derived += 1;
  }
  return { derived };
}

/** Intentions triées par tendance (pour tableau PDG et suggestions). */
export async function listIntents(opts: { topic?: string; country?: string | null; limit?: number } = {}) {
  const conds = [];
  if (opts.topic) conds.push(sql`${visibilityIntents.topic} = ${opts.topic}`);
  const c = normCountry(opts.country ?? null);
  if (c) conds.push(sql`(${visibilityIntents.country} = ${c} or ${visibilityIntents.country} is null)`);
  const base = db.select().from(visibilityIntents);
  const q = conds.length ? base.where(sql.join(conds, sql` and `)) : base;
  return q.orderBy(sql`${visibilityIntents.trendScore} desc`).limit(opts.limit ?? 100);
}
