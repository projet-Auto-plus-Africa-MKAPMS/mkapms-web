/**
 * Point 57 — pages publiques de réputation, exploitables par les moteurs de
 * recherche et les assistants IA autorisés.
 *
 * Le contenu est fabriqué uniquement à partir d'avis réellement publiés : notes,
 * volumes, part d'expériences vérifiées, date du dernier avis. Aucun texte
 * marketing, aucune note inventée. Quand un univers n'a pas encore d'avis, la
 * page le dit — c'est ce qui fait la valeur de la source.
 *
 * Précision honnête : rendre la page compréhensible n'oblige aucun assistant IA
 * à citer MKA.P-MS. On améliore la qualité de la source, rien de plus.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { reviewsV2 } from "../modules/reviews.js";
import { garagesPublics, partsShops } from "../schema.js";
import { REPUTATION_UNIVERS } from "./service.js";

/** Une page n'est publiée que si l'univers a de vrais avis derrière. */
const MIN_AVIS_PAR_CIBLE = 1;

export interface PublicReputationEntry {
  targetType: string;
  targetId: number;
  /** Nom réel de la fiche, ou null si la fiche métier n'est pas résoluble. */
  nom: string | null;
  ville: string | null;
  pays: string | null;
  url: string | null;
  avis: number;
  noteMoyenne: number;
  avisVerifies: number;
  dernierAvisLe: Date | null;
}

export interface PublicReputationPage {
  univers: string;
  libelle: string;
  entrees: PublicReputationEntry[];
  /** Totaux de la page, calculés sur les avis affichés uniquement. */
  totalAvis: number;
  noteMoyenne: number | null;
  /** Phrase d'état affichée quand la page est vide, pour ne rien inventer. */
  raison: string | null;
}

async function nomsDesCibles(
  targetType: string,
  ids: number[],
): Promise<Map<number, { nom: string; ville: string | null; pays: string | null; url: string | null }>> {
  const out = new Map<number, { nom: string; ville: string | null; pays: string | null; url: string | null }>();
  if (ids.length === 0) return out;

  if (targetType === "garage") {
    const rows = await db
      .select({
        id: garagesPublics.id,
        nom: garagesPublics.name,
        slug: garagesPublics.slug,
        ville: garagesPublics.city,
        pays: garagesPublics.country,
      })
      .from(garagesPublics)
      .where(and(eq(garagesPublics.status, "valide"), sql`${garagesPublics.id} = any(${ids})`));
    for (const r of rows) {
      out.set(r.id, {
        nom: r.nom,
        ville: r.ville,
        pays: r.pays,
        url: `/garages/${r.slug || r.id}`,
      });
    }
    return out;
  }

  if (targetType === "boutique_pieces") {
    const rows = await db
      .select({
        id: partsShops.id,
        nom: partsShops.nom,
        ville: partsShops.ville,
        pays: partsShops.countryCode,
      })
      .from(partsShops)
      .where(sql`${partsShops.id} = any(${ids})`);
    for (const r of rows) {
      out.set(r.id, { nom: r.nom, ville: r.ville, pays: r.pays, url: "/pieces" });
    }
    return out;
  }

  return out;
}

/**
 * Page publique de réputation d'un univers. Les cibles dont la fiche métier
 * n'est pas résoluble sont écartées : publier « garage #42 » n'aiderait
 * personne, ni un visiteur ni un moteur.
 */
export async function publicReputationPage(
  univers: string,
  limit = 50,
): Promise<PublicReputationPage> {
  const libelle = REPUTATION_UNIVERS[univers] ?? univers;
  const rows = await db
    .select({
      targetType: reviewsV2.targetType,
      targetId: reviewsV2.targetId,
      avis: sql<number>`count(*)::int`,
      somme: sql<number>`sum(${reviewsV2.ratingGlobal})::int`,
      verifies: sql<number>`count(*) filter (where ${reviewsV2.verified})::int`,
      dernier: sql<Date>`max(${reviewsV2.createdAt})`,
    })
    .from(reviewsV2)
    .where(
      and(
        eq(reviewsV2.univers, univers),
        sql`${reviewsV2.status} = 'publie'`,
        sql`${reviewsV2.visibility} = 'public'`,
      ),
    )
    .groupBy(reviewsV2.targetType, reviewsV2.targetId)
    .having(sql`count(*) >= ${MIN_AVIS_PAR_CIBLE}`)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  if (rows.length === 0) {
    return {
      univers,
      libelle,
      entrees: [],
      totalAvis: 0,
      noteMoyenne: null,
      raison: `Aucun avis publié pour ${libelle} : cette page n'affiche aucune note tant qu'aucun client n'a déposé d'avis.`,
    };
  }

  const parType = new Map<string, number[]>();
  for (const r of rows) {
    const l = parType.get(r.targetType) ?? [];
    l.push(r.targetId);
    parType.set(r.targetType, l);
  }
  const noms = new Map<string, Map<number, { nom: string; ville: string | null; pays: string | null; url: string | null }>>();
  for (const [type, ids] of parType) {
    noms.set(type, await nomsDesCibles(type, ids));
  }

  const entrees: PublicReputationEntry[] = [];
  let totalAvis = 0;
  let somme = 0;
  for (const r of rows) {
    const fiche = noms.get(r.targetType)?.get(r.targetId);
    if (!fiche) continue;
    const avis = Number(r.avis);
    totalAvis += avis;
    somme += Number(r.somme);
    entrees.push({
      targetType: r.targetType,
      targetId: r.targetId,
      nom: fiche.nom,
      ville: fiche.ville,
      pays: fiche.pays,
      url: fiche.url,
      avis,
      noteMoyenne: Math.round((Number(r.somme) / avis) * 100) / 100,
      avisVerifies: Number(r.verifies),
      dernierAvisLe: r.dernier ? new Date(r.dernier) : null,
    });
  }

  if (entrees.length === 0) {
    return {
      univers,
      libelle,
      entrees: [],
      totalAvis: 0,
      noteMoyenne: null,
      raison: `Des avis existent pour ${libelle}, mais aucune fiche publique correspondante n'est disponible : rien n'est affiché plutôt qu'une liste sans nom.`,
    };
  }

  return {
    univers,
    libelle,
    entrees,
    totalAvis,
    noteMoyenne: Math.round((somme / totalAvis) * 100) / 100,
    raison: null,
  };
}

/** Univers ayant réellement des avis publics — sert au sitemap et au menu. */
export async function universWithPublicReviews(): Promise<
  { univers: string; libelle: string; avis: number }[]
> {
  const rows = await db
    .select({
      univers: reviewsV2.univers,
      avis: sql<number>`count(*)::int`,
    })
    .from(reviewsV2)
    .where(and(sql`${reviewsV2.status} = 'publie'`, sql`${reviewsV2.visibility} = 'public'`))
    .groupBy(reviewsV2.univers)
    .orderBy(desc(sql`count(*)`));

  return rows.map((r) => ({
    univers: r.univers,
    libelle: REPUTATION_UNIVERS[r.univers] ?? r.univers,
    avis: Number(r.avis),
  }));
}
