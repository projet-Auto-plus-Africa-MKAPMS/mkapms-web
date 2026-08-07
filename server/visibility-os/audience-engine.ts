/**
 * MKA.P-MS Global Audience Engine — Moteur d'Audience mondial.
 *
 * Construit des audiences à partir des signaux RÉELS et gratuits de la
 * plateforme (annonces publiées, comptes, recherches enregistrées, favoris),
 * segmentées par dimension : pays, ville, langue, type de compte, marque,
 * modèle, véhicule, service, intention, comportement.
 *
 * Deux natures d'audience (règle PDG) :
 *  - `owner`      : audience propriétaire, gratuite à construire et à activer.
 *  - `external_ad`: audience destinée à une diffusion sponsorisée externe —
 *    TOUJOURS préparée en `draft`, jamais activée sans décision (aucune
 *    dépense implicite).
 *
 * 100 % additif : lit les tables existantes en lecture seule, écrit uniquement
 * dans `visibility_audiences`. Idempotent (upsert par `audience_key`).
 */
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { visibilityAudiences } from "./schema.js";
import { annonces, favoris, users } from "../schema.js";
import { savedSearches } from "../modules/core.js";

type Dimension =
  | "country"
  | "city"
  | "account_type"
  | "brand"
  | "model"
  | "intention"
  | "behavior";

interface AudienceRow {
  audienceKey: string;
  label: string;
  dimension: Dimension;
  value: string;
  country: string | null;
  size: number;
  source: "owner" | "external_ad";
  status: "draft" | "ready" | "active";
  metadata?: Record<string, unknown>;
}

function normCountry(c?: string | null): string | null {
  if (!c) return null;
  return c.slice(0, 2).toUpperCase();
}

async function upsert(rows: AudienceRow[]): Promise<number> {
  let n = 0;
  const now = new Date();
  for (const r of rows) {
    if (!r.value || r.size <= 0) continue;
    await db
      .insert(visibilityAudiences)
      .values({
        audienceKey: r.audienceKey.slice(0, 180),
        label: r.label.slice(0, 200),
        dimension: r.dimension,
        value: r.value.slice(0, 160),
        country: r.country,
        size: r.size,
        source: r.source,
        status: r.status,
        metadata: r.metadata ?? null,
        refreshedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: visibilityAudiences.audienceKey,
        set: { size: r.size, label: r.label.slice(0, 200), refreshedAt: now, updatedAt: now },
      });
    n += 1;
  }
  return n;
}

export interface AudienceBuildResult {
  owner: number;
  externalPrepared: number;
  dimensions: Record<string, number>;
}

/**
 * (Re)construit les audiences propriétaires à partir des données réelles.
 * Pour chaque segment propriétaire significatif, prépare aussi une audience
 * publicitaire externe équivalente en `draft` (prête à activer, sans budget).
 */
export async function rebuildAudiences(): Promise<AudienceBuildResult> {
  const owner: AudienceRow[] = [];

  // 1. Marque × pays (à partir des annonces publiées) — intention d'achat.
  const brandCountry = await db
    .select({
      brand: annonces.marque,
      country: annonces.pays,
      n: sql<number>`count(*)::int`,
    })
    .from(annonces)
    .where(sql`${annonces.marque} is not null`)
    .groupBy(annonces.marque, annonces.pays);
  for (const r of brandCountry) {
    const c = normCountry(r.country);
    if (!r.brand) continue;
    owner.push({
      audienceKey: `owner:brand:${c ?? "ALL"}:${r.brand.toLowerCase()}`,
      label: `Intéressés ${r.brand}${c ? ` (${c})` : ""}`,
      dimension: "brand",
      value: r.brand,
      country: c,
      size: Number(r.n),
      source: "owner",
      status: "ready",
      metadata: { basis: "annonces_publiees" },
    });
  }

  // 2. Ville (stock local) — intention locale.
  const cities = await db
    .select({ city: annonces.ville, country: annonces.pays, n: sql<number>`count(*)::int` })
    .from(annonces)
    .where(sql`${annonces.ville} is not null`)
    .groupBy(annonces.ville, annonces.pays);
  for (const r of cities) {
    if (!r.city) continue;
    const c = normCountry(r.country);
    owner.push({
      audienceKey: `owner:city:${c ?? "ALL"}:${r.city.toLowerCase()}`,
      label: `Zone locale ${r.city}${c ? ` (${c})` : ""}`,
      dimension: "city",
      value: r.city,
      country: c,
      size: Number(r.n),
      source: "owner",
      status: "ready",
      metadata: { basis: "stock_local" },
    });
  }

  // 3. Pays global (comptes) — audience nationale.
  const countries = await db
    .select({ country: users.country, n: sql<number>`count(*)::int` })
    .from(users)
    .groupBy(users.country);
  for (const r of countries) {
    const c = normCountry(r.country);
    if (!c) continue;
    owner.push({
      audienceKey: `owner:country:${c}`,
      label: `Comptes ${c}`,
      dimension: "country",
      value: c,
      country: c,
      size: Number(r.n),
      source: "owner",
      status: "ready",
      metadata: { basis: "comptes" },
    });
  }

  // 4. Type de compte (particulier / pro).
  const accountTypes = await db
    .select({ type: users.accountType, n: sql<number>`count(*)::int` })
    .from(users)
    .groupBy(users.accountType);
  for (const r of accountTypes) {
    if (!r.type) continue;
    owner.push({
      audienceKey: `owner:account_type:${r.type}`,
      label: `Comptes ${r.type}`,
      dimension: "account_type",
      value: r.type,
      country: null,
      size: Number(r.n),
      source: "owner",
      status: "ready",
      metadata: { basis: "comptes" },
    });
  }

  // 5. Intention (recherches enregistrées par univers) — signal d'intention.
  const intents = await db
    .select({ univers: savedSearches.univers, n: sql<number>`count(*)::int` })
    .from(savedSearches)
    .groupBy(savedSearches.univers);
  for (const r of intents) {
    if (!r.univers) continue;
    owner.push({
      audienceKey: `owner:intention:${r.univers}`,
      label: `Intention ${r.univers} (recherches actives)`,
      dimension: "intention",
      value: r.univers,
      country: null,
      size: Number(r.n),
      source: "owner",
      status: "ready",
      metadata: { basis: "recherches_enregistrees" },
    });
  }

  // 6. Comportement — comptes ayant mis en favori (engagement).
  const [fav] = await db.select({ n: sql<number>`count(distinct ${favoris.userId})::int` }).from(favoris);
  const favCount = Number(fav?.n ?? 0);
  if (favCount > 0) {
    owner.push({
      audienceKey: "owner:behavior:favoris",
      label: "Comportement : comptes engagés (favoris)",
      dimension: "behavior",
      value: "favoris",
      country: null,
      size: favCount,
      source: "owner",
      status: "ready",
      metadata: { basis: "favoris" },
    });
  }

  const ownerWritten = await upsert(owner);

  // 7. Miroir publicitaire externe (draft) — préparé mais jamais activé.
  //    On ne prépare que les segments propriétaires les plus grands.
  const external: AudienceRow[] = owner
    .filter((a) => a.size >= 1 && (a.dimension === "brand" || a.dimension === "city" || a.dimension === "country"))
    .map((a) => ({
      ...a,
      audienceKey: a.audienceKey.replace(/^owner:/, "ext:"),
      label: `${a.label} — campagne (brouillon)`,
      source: "external_ad" as const,
      status: "draft" as const,
      metadata: { ...(a.metadata ?? {}), note: "Prête à activer — nécessite un budget média. Aucune dépense engagée." },
    }));
  const externalWritten = await upsert(external);

  const dims: Record<string, number> = {};
  for (const a of owner) dims[a.dimension] = (dims[a.dimension] ?? 0) + 1;

  return { owner: ownerWritten, externalPrepared: externalWritten, dimensions: dims };
}
