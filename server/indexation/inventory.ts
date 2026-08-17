/**
 * MKA.P-MS Indexation Monitor — échantillon réel d'URLs (point 93).
 *
 * L'échantillon n'est jamais inventé : chaque URL est construite depuis une
 * ligne réellement présente en base (une annonce publiée, un garage validé,
 * une pièce en vente, une page programmatique indexable…). Si une famille n'a
 * aucune donnée, elle est signalée vide — jamais remplie par un exemple
 * fictif, ce qui donnerait un rapport faux.
 */
import { sql } from "drizzle-orm";
import { db } from "../db.js";

/** Familles exigées par le point 93 (véhicule, pièce, garage, location, CT, pro, service, promotion, pays, catégorie). */
export const FAMILLES = [
  "vehicule",
  "piece",
  "garage",
  "location",
  "controle_technique",
  "pro",
  "service",
  "promotion",
  "pays",
  "categorie",
] as const;

export type Famille = (typeof FAMILLES)[number];

/**
 * Deux tuyaux distincts, jamais mélangés (points 94-95) :
 *  • `annonce`  → véhicules d'occasion : SEO d'annonce, pages indexables,
 *    données structurées adaptées, images, contenu local, GEO/IA ;
 *  • `produit`  → pièces et accessoires : données structurées Product, flux
 *    marchand quand l'éligibilité est réelle, images / Lens.
 */
export type Pipeline = "annonce" | "produit" | "page";

export interface UrlCandidate {
  url: string;
  famille: Famille;
  pipeline: Pipeline;
  source: string;
  pays?: string | null;
}

export interface FamilleInventory {
  famille: Famille;
  pipeline: Pipeline;
  candidats: UrlCandidate[];
  /** Nombre total de pages publiques de cette famille (pas seulement l'échantillon). */
  totalPubliques: number;
  motifVide: string | null;
}

/** Requête tolérante : une table absente ne fait pas échouer l'audit entier. */
async function safeRows<T>(runner: () => Promise<T[]>): Promise<T[] | null> {
  try {
    return await runner();
  } catch {
    return null;
  }
}

async function count(table: string, where?: string): Promise<number> {
  if (!/^[a-z0-9_]+$/.test(table)) return 0;
  try {
    const res = await db.execute(
      sql.raw(`SELECT COUNT(*)::int AS n FROM "${table}"${where ? ` WHERE ${where}` : ""}`),
    );
    return Number((res.rows?.[0] as { n?: number })?.n ?? 0);
  } catch {
    return 0;
  }
}

/**
 * Lit un échantillon générique sur une table réelle, avec la fabrique d'URL du
 * domaine. Aucune colonne obligatoire n'est supposée : la requête est faite en
 * SQL brut et les colonnes absentes sont simplement ignorées.
 */
async function sample(
  table: string,
  columns: string[],
  where: string | null,
  limit: number,
): Promise<Record<string, unknown>[]> {
  if (!/^[a-z0-9_]+$/.test(table)) return [];
  const cols = columns.filter((c) => /^[a-z0-9_]+$/.test(c));
  if (cols.length === 0) return [];
  const rows = await safeRows(async () => {
    const res = await db.execute(
      sql.raw(
        `SELECT ${cols.map((c) => `"${c}"`).join(", ")} FROM "${table}"${
          where ? ` WHERE ${where}` : ""
        } ORDER BY 1 DESC LIMIT ${Math.max(1, Math.min(limit, 20))}`,
      ),
    );
    return (res.rows ?? []) as Record<string, unknown>[];
  });
  return rows ?? [];
}

export interface InventoryOptions {
  /** Nombre d'URLs prélevées par famille. */
  parFamille?: number;
}

/**
 * Construit l'échantillon réel. `pays` reste nul quand la donnée n'existe pas
 * en base : on ne devine pas un pays pour rendre le rapport plus joli.
 */
export async function buildUrlSample(options?: InventoryOptions): Promise<FamilleInventory[]> {
  const n = options?.parFamille ?? 3;
  const out: FamilleInventory[] = [];

  // ── Véhicules (tuyau annonce) ──────────────────────────────────────────────
  const vehicules = await sample(
    "annonces",
    ["id", "categorie_annonce", "vendeur_type", "pays", "type_annonce"],
    "status = 'publiee'",
    n * 2,
  );
  const vehiculeCandidats: UrlCandidate[] = [];
  const locationCandidats: UrlCandidate[] = [];
  for (const row of vehicules) {
    const id = Number(row.id);
    const cat = String(row.categorie_annonce ?? "") || null;
    const vendeur = String(row.vendeur_type ?? "") || null;
    const typeAnnonce = String(row.type_annonce ?? "");
    const base =
      cat === "officielle"
        ? "/acheter/mkapms-officiel"
        : cat === "professionnelle" || vendeur === "professionnel" || vendeur === "concession"
          ? "/acheter/professionnel"
          : "/acheter/particulier";
    const cible: UrlCandidate = {
      url: typeAnnonce === "location" ? `/louer/particulier/vehicule/${id}` : `${base}/vehicule/${id}`,
      famille: typeAnnonce === "location" ? "location" : "vehicule",
      pipeline: "annonce",
      source: `annonces#${id}`,
      pays: (row.pays as string) ?? null,
    };
    (cible.famille === "location" ? locationCandidats : vehiculeCandidats).push(cible);
  }

  out.push({
    famille: "vehicule",
    pipeline: "annonce",
    candidats: vehiculeCandidats.slice(0, n),
    totalPubliques: await count("annonces", "status = 'publiee'"),
    motifVide: vehiculeCandidats.length === 0 ? "aucune annonce véhicule publiée en base" : null,
  });
  out.push({
    famille: "location",
    pipeline: "annonce",
    candidats: locationCandidats.slice(0, n),
    totalPubliques: await count("annonces", "status = 'publiee' AND type_annonce = 'location'"),
    motifVide: locationCandidats.length === 0 ? "aucune annonce de location publiée en base" : null,
  });

  // ── Pièces (tuyau produit) ─────────────────────────────────────────────────
  const pieces = await sample("pieces", ["id", "slug", "nom"], null, n);
  const pieceCandidats = pieces.map((row) => ({
    url: `/pieces-detachees/piece/${row.slug ? String(row.slug) : Number(row.id)}`,
    famille: "piece" as Famille,
    pipeline: "produit" as Pipeline,
    source: `pieces#${Number(row.id)}`,
  }));
  out.push({
    famille: "piece",
    pipeline: "produit",
    candidats: pieceCandidats,
    totalPubliques: await count("pieces"),
    motifVide: pieceCandidats.length === 0 ? "aucune pièce enregistrée en base" : null,
  });

  // ── Garages ────────────────────────────────────────────────────────────────
  const garages = await sample("garages_publics", ["id", "slug", "pays"], "status = 'valide'", n);
  const garageCandidats = garages.map((row) => ({
    url: `/garages/${row.slug ? String(row.slug) : Number(row.id)}`,
    famille: "garage" as Famille,
    pipeline: "page" as Pipeline,
    source: `garages_publics#${Number(row.id)}`,
    pays: (row.pays as string) ?? null,
  }));
  out.push({
    famille: "garage",
    pipeline: "page",
    candidats: garageCandidats,
    totalPubliques: await count("garages_publics", "status = 'valide'"),
    motifVide: garageCandidats.length === 0 ? "aucun garage validé en base" : null,
  });

  // ── Pages programmatiques : contrôle technique, services, pays, catégories ─
  const pagesSeo = await safeRows(async () => {
    const res = await db.execute(
      sql.raw(
        `SELECT slug, type FROM "seo_pages" WHERE indexed = true ORDER BY updated_at DESC NULLS LAST LIMIT 400`,
      ),
    );
    return (res.rows ?? []) as { slug: string; type: string | null }[];
  });

  const seoPages = pagesSeo ?? [];
  const parMotif: Record<string, (p: { slug: string; type: string | null }) => boolean> = {
    controle_technique: (p) => /controle-technique|contr[oô]le-technique/.test(p.slug),
    service: (p) => /garage|reparation|entretien|depannage|lavage|carrosserie/.test(p.slug),
    pays: (p) => p.type === "pays" || /^pays\//.test(p.slug),
    categorie: (p) => p.type === "categorie" || /^(marque|modele|categorie)\//.test(p.slug),
  };

  for (const famille of ["controle_technique", "service", "pays", "categorie"] as Famille[]) {
    const filtre = parMotif[famille];
    const matches = seoPages.filter(filtre);
    out.push({
      famille,
      pipeline: "page",
      candidats: matches.slice(0, n).map((p) => ({
        url: `/${p.slug.replace(/^\/+/, "")}`,
        famille,
        pipeline: "page" as Pipeline,
        source: `seo_pages:${p.slug}`,
      })),
      totalPubliques: matches.length,
      motifVide:
        matches.length === 0
          ? seoPages.length === 0
            ? "aucune page programmatique indexable (seo_pages vide ou absente)"
            : `aucune page programmatique de la famille ${famille}`
          : null,
    });
  }

  // ── Professionnels ─────────────────────────────────────────────────────────
  const pros = await safeRows(async () => {
    const res = await db.execute(
      sql.raw(
        `SELECT id, slug FROM "garages_publics" WHERE status = 'valide' ORDER BY id DESC LIMIT ${n}`,
      ),
    );
    return (res.rows ?? []) as { id: number; slug: string | null }[];
  });
  const proCandidats: UrlCandidate[] = [
    { url: "/espace-pro", famille: "pro", pipeline: "page", source: "route:/espace-pro" },
    { url: "/pro/portail", famille: "pro", pipeline: "page", source: "route:/pro/portail" },
    ...(pros ?? []).slice(0, 1).map((p) => ({
      url: `/garages/${p.slug ?? p.id}`,
      famille: "pro" as Famille,
      pipeline: "page" as Pipeline,
      source: `pro:garages_publics#${p.id}`,
    })),
  ];
  out.push({
    famille: "pro",
    pipeline: "page",
    candidats: proCandidats.slice(0, n),
    totalPubliques: proCandidats.length,
    motifVide: null,
  });

  // ── Promotions ─────────────────────────────────────────────────────────────
  const promos = await sample("publicites", ["id", "statut"], "statut = 'active'", n);
  const promoCandidats: UrlCandidate[] = promos.map((row) => ({
    url: `/publicite/${Number(row.id)}`,
    famille: "promotion" as Famille,
    pipeline: "page" as Pipeline,
    source: `publicites#${Number(row.id)}`,
  }));
  out.push({
    famille: "promotion",
    pipeline: "page",
    candidats:
      promoCandidats.length > 0
        ? promoCandidats
        : [
            {
              url: "/acheter/promotions",
              famille: "promotion",
              pipeline: "page",
              source: "route:/acheter/promotions",
            },
          ],
    totalPubliques: await count("publicites", "statut = 'active'"),
    motifVide: promoCandidats.length === 0 ? "aucune promotion active : seule la page de liste est contrôlée" : null,
  });

  return out;
}

/** Nombre de pages publiques par famille, pour le moniteur PDG (point 99). */
export async function publicPageCounts(): Promise<Record<string, number>> {
  const [vehicules, locations, pieces, garages, seo, promos] = await Promise.all([
    count("annonces", "status = 'publiee'"),
    count("annonces", "status = 'publiee' AND type_annonce = 'location'"),
    count("pieces"),
    count("garages_publics", "status = 'valide'"),
    count("seo_pages", "indexed = true"),
    count("publicites", "statut = 'active'"),
  ]);
  return {
    vehicules: Math.max(0, vehicules - locations),
    locations,
    pieces,
    garages,
    pages_programmatiques: seo,
    promotions: promos,
  };
}

/** Dernières annonces publiées, pour la surveillance continue. */
export async function recentAnnonceUrls(limit = 50): Promise<UrlCandidate[]> {
  const rows = await safeRows(async () => {
    const res = await db.execute(
      sql.raw(
        `SELECT id, categorie_annonce, vendeur_type, type_annonce, pays FROM "annonces" WHERE status = 'publiee' ORDER BY updated_at DESC NULLS LAST LIMIT ${Math.min(limit, 200)}`,
      ),
    );
    return (res.rows ?? []) as Record<string, unknown>[];
  });
  return (rows ?? []).map((row) => {
    const id = Number(row.id);
    const cat = String(row.categorie_annonce ?? "");
    const base =
      cat === "officielle"
        ? "/acheter/mkapms-officiel"
        : cat === "professionnelle"
          ? "/acheter/professionnel"
          : "/acheter/particulier";
    const location = String(row.type_annonce ?? "") === "location";
    return {
      url: location ? `/louer/particulier/vehicule/${id}` : `${base}/vehicule/${id}`,
      famille: (location ? "location" : "vehicule") as Famille,
      pipeline: "annonce" as Pipeline,
      source: `annonces#${id}`,
      pays: (row.pays as string) ?? null,
    };
  });
}
