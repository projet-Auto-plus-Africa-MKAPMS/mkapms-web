/**
 * Parties 6 & 7 — Apprentissage automatique + Base de connaissances officielle
 *
 * Mémoire officielle de MKA.P-MS. À chaque action (recherche, dépôt d'annonce,
 * nouvelle version/pièce/garage/mot-clé…), on « observe » la donnée : si elle
 * est cohérente et revient plusieurs fois, elle est promue de "proposée" à
 * "confirmée". Aucune donnée n'est perdue.
 *
 * Le système ne décide jamais seul : les entrées confirmées automatiquement
 * restent visibles au PDG qui peut les rejeter. Il ne modifie aucune règle
 * métier ni le code principal.
 */
import { db } from "../../db.js";
import { smartKbEntries } from "../schema.js";
import { and, desc, eq, sql } from "drizzle-orm";
// Renfort P8 — seuil de confirmation dynamique par domaine (fallback = KB_CONFIRM_THRESHOLD).
import { getConfirmThreshold } from "./domain-thresholds.js";

export const KB_DOMAINS = [
  "vehicule",
  "piece",
  "panne",
  "utilisateur",
  "recherche",
  "mot_cle",
  "service",
  "garage",
] as const;
export type KbDomain = (typeof KB_DOMAINS)[number];

// Nombre d'observations avant promotion automatique en "confirmée".
export const KB_CONFIRM_THRESHOLD = 3;

export interface ObserveInput {
  domain: KbDomain;
  type: string;
  value: string;
  parentKey?: string;
  attributes?: Record<string, unknown>;
  source?: string;
  userId?: number;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildSignature(domain: string, type: string, parentKey: string | undefined, value: string): string {
  return [domain, type, normalize(parentKey ?? ""), normalize(value)].join("|").slice(0, 768);
}

/**
 * Observe une donnée. Crée l'entrée (proposée) ou incrémente ses observations.
 * Promotion automatique en "confirmée" au seuil. Ne jette jamais : les valeurs
 * vides/trop courtes sont ignorées silencieusement (rien à apprendre).
 */
export async function observe(input: ObserveInput) {
  const value = (input.value ?? "").trim();
  if (value.length < 2) return null; // rien de cohérent à apprendre
  if (!KB_DOMAINS.includes(input.domain)) return null;

  const signature = buildSignature(input.domain, input.type, input.parentKey, value);

  const [existing] = await db
    .select()
    .from(smartKbEntries)
    .where(eq(smartKbEntries.signature, signature))
    .limit(1);

  if (existing) {
    const newCount = (existing.observations ?? 1) + 1;
    // Renfort P8 — seuil dynamique par domaine (mot_cle:8, vehicule:2, ...)
    // Le fallback est KB_CONFIRM_THRESHOLD (3), donc 100% rétro-compatible.
    const threshold = getConfirmThreshold(existing.domain);
    const promote = existing.status === "proposed" && newCount >= threshold;
    await db
      .update(smartKbEntries)
      .set({
        observations: newCount,
        status: promote ? "confirmed" : existing.status,
        // Fusion non destructive des attributs
        attributes: input.attributes
          ? { ...(existing.attributes ?? {}), ...input.attributes }
          : existing.attributes,
        updatedAt: new Date(),
      })
      .where(eq(smartKbEntries.id, existing.id));
    return { ...existing, observations: newCount, status: promote ? "confirmed" : existing.status };
  }

  const [row] = await db
    .insert(smartKbEntries)
    .values({
      domain: input.domain,
      type: input.type,
      value,
      parentKey: input.parentKey ?? null,
      attributes: input.attributes ?? null,
      signature,
      firstSource: input.source ?? "systeme",
      createdBy: input.userId ?? null,
    })
    .returning();
  return row;
}

/** Observe plusieurs entrées en une fois (best-effort, jamais bloquant). */
export async function observeMany(inputs: ObserveInput[]) {
  for (const i of inputs) {
    try {
      await observe(i);
    } catch {
      // apprentissage best-effort : ne jamais casser l'action utilisateur
    }
  }
}

export async function listKB(domain?: string, status?: string, limit = 200) {
  const conditions = [];
  if (domain) conditions.push(eq(smartKbEntries.domain, domain));
  if (status) conditions.push(eq(smartKbEntries.status, status as "proposed" | "confirmed" | "rejected"));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db
    .select()
    .from(smartKbEntries)
    .where(where)
    .orderBy(desc(smartKbEntries.observations), desc(smartKbEntries.updatedAt))
    .limit(limit);
}

export async function kbStats() {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      proposed: sql<number>`count(*) filter (where ${smartKbEntries.status} = 'proposed')::int`,
      confirmed: sql<number>`count(*) filter (where ${smartKbEntries.status} = 'confirmed')::int`,
      rejected: sql<number>`count(*) filter (where ${smartKbEntries.status} = 'rejected')::int`,
      observations: sql<number>`coalesce(sum(${smartKbEntries.observations}), 0)::int`,
    })
    .from(smartKbEntries);

  const byDomain = await db
    .select({
      domain: smartKbEntries.domain,
      count: sql<number>`count(*)::int`,
      confirmed: sql<number>`count(*) filter (where ${smartKbEntries.status} = 'confirmed')::int`,
    })
    .from(smartKbEntries)
    .groupBy(smartKbEntries.domain)
    .orderBy(sql`count(*) DESC`);

  return { totals, byDomain };
}

export async function validateKB(id: number, approved: boolean) {
  await db
    .update(smartKbEntries)
    .set({ status: approved ? "confirmed" : "rejected", updatedAt: new Date() })
    .where(eq(smartKbEntries.id, id));
  return { ok: true };
}

// ── Extracteurs d'apprentissage automatique ────────────────────────────────

const STOPWORDS = new Set([
  "le","la","les","un","une","des","de","du","et","ou","a","au","aux","en","pour",
  "avec","sur","dans","par","occasion","voiture","auto","vehicule","pas","cher",
]);

/**
 * À partir d'une recherche, apprend les mots-clés et les filtres véhicule
 * (marque/modèle/catégorie). Best-effort, jamais bloquant.
 */
export async function learnFromSearch(params: {
  query?: string | null;
  filters?: Record<string, unknown> | null;
  ville?: string | null;
  userId?: number;
}) {
  const obs: ObserveInput[] = [];
  const q = (params.query ?? "").trim();
  if (q.length >= 2) {
    obs.push({ domain: "recherche", type: "requete", value: q, source: "recherche", userId: params.userId });
    for (const word of q.split(/[\s,]+/)) {
      const w = word.trim();
      if (w.length >= 3 && !STOPWORDS.has(normalize(w))) {
        obs.push({ domain: "mot_cle", type: "terme", value: w, source: "recherche", userId: params.userId });
      }
    }
  }
  const f = params.filters ?? {};
  const marque = typeof f.marque === "string" ? f.marque : undefined;
  const modele = typeof f.modele === "string" ? f.modele : undefined;
  const categorie = typeof f.categorie === "string" ? f.categorie : undefined;
  if (marque) obs.push({ domain: "vehicule", type: "marque", value: marque, source: "recherche", userId: params.userId });
  if (marque && modele)
    obs.push({ domain: "vehicule", type: "modele", value: modele, parentKey: marque, source: "recherche", userId: params.userId });
  if (categorie) obs.push({ domain: "vehicule", type: "categorie", value: categorie, source: "recherche", userId: params.userId });
  if (params.ville) obs.push({ domain: "utilisateur", type: "zone", value: params.ville, source: "recherche", userId: params.userId });

  await observeMany(obs);
}
