/**
 * Point 56 — la réputation devient un signal du moteur d'Audience.
 *
 * Deux décisions symétriques, et c'est tout l'intérêt :
 *  - satisfaction élevée ET volume suffisant → on PEUT proposer de mettre en
 *    avant. « Peut » : c'est une recommandation, jamais une mise en avant
 *    appliquée toute seule ;
 *  - beaucoup de consultations MAIS mauvaises évaluations → on signale AVANT
 *    d'augmenter la visibilité. Pousser plus de visiteurs vers un service mal
 *    évalué abîme la plateforme entière, pas seulement le professionnel.
 *
 * Rien n'est publié, activé ni budgété ici : ce module produit des constats.
 */
import { and, gte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { reviewsV2 } from "../modules/reviews.js";
import { smartActivityLog } from "../smart-engine/schema.js";
import { garagesPublics } from "../schema.js";
import { REPUTATION_UNIVERS } from "./service.js";

const JOUR = 24 * 60 * 60 * 1000;

/** En dessous, la satisfaction n'est pas assez documentée pour promouvoir. */
const VOLUME_FIABLE = 10;
/** Note à partir de laquelle une mise en avant peut se justifier. */
const NOTE_EXCELLENTE = 4.3;
/** Note en dessous de laquelle augmenter la visibilité est risqué. */
const NOTE_RISQUE = 3.2;
/** Consultations à partir desquelles une mauvaise note devient un vrai sujet. */
const CONSULTATIONS_SIGNIFICATIVES = 50;

export interface AudienceAdvice {
  kind: "recommander_mise_en_avant" | "risque_avant_mise_en_avant" | "volume_insuffisant";
  targetType: string;
  targetId: number;
  univers: string;
  libelleUnivers: string;
  avis: number;
  noteMoyenne: number;
  avisVerifies: number;
  consultations30j: number | null;
  constat: string;
  /** Vrai seulement quand la donnée suffit à décider. */
  decidable: boolean;
}

/** Consultations réelles des fiches garages publiques, par identifiant de fiche. */
async function garageConsultations(): Promise<Map<number, number>> {
  const depuis = new Date(Date.now() - 30 * JOUR);
  const fiches = await db
    .select({ id: garagesPublics.id, slug: garagesPublics.slug })
    .from(garagesPublics);
  if (fiches.length === 0) return new Map();

  const visites = await db
    .select({
      page: sql<string>`${smartActivityLog.data}->>'page'`,
      n: sql<number>`count(*)::int`,
    })
    .from(smartActivityLog)
    .where(
      and(
        sql`${smartActivityLog.action} = 'page.visit'`,
        gte(smartActivityLog.createdAt, depuis),
        sql`${smartActivityLog.data}->>'page' like '/garages/%'`,
      ),
    )
    .groupBy(sql`${smartActivityLog.data}->>'page'`);

  const parSlug = new Map<string, number>();
  for (const v of visites) {
    const slug = (v.page ?? "").replace(/^\/garages\//, "").split(/[/?#]/)[0];
    if (!slug) continue;
    parSlug.set(slug, (parSlug.get(slug) ?? 0) + Number(v.n));
  }
  return new Map(
    fiches
      .map((f) => [f.id, parSlug.get(f.slug) ?? 0] as const)
      .filter(([, n]) => n > 0),
  );
}

/**
 * Constats de réputation destinés au moteur d'Audience. Les consultations ne
 * sont connues que pour les fiches réellement suivies (garages) : ailleurs le
 * champ vaut `null` plutôt qu'un zéro qui laisserait croire à une absence de
 * trafic.
 */
export async function audienceAdvice(limit = 100): Promise<AudienceAdvice[]> {
  const rows = await db
    .select({
      targetType: reviewsV2.targetType,
      targetId: reviewsV2.targetId,
      univers: reviewsV2.univers,
      avis: sql<number>`count(*)::int`,
      somme: sql<number>`sum(${reviewsV2.ratingGlobal})::int`,
      verifies: sql<number>`count(*) filter (where ${reviewsV2.verified})::int`,
    })
    .from(reviewsV2)
    .where(sql`${reviewsV2.status} = 'publie'`)
    .groupBy(reviewsV2.targetType, reviewsV2.targetId, reviewsV2.univers)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  const consultationsGarage = await garageConsultations().catch(() => new Map<number, number>());
  const advices: AudienceAdvice[] = [];

  for (const r of rows) {
    const avis = Number(r.avis);
    const note = Math.round((Number(r.somme) / avis) * 100) / 100;
    const consultations =
      r.targetType === "garage" ? consultationsGarage.get(r.targetId) ?? 0 : null;
    const base = {
      targetType: r.targetType,
      targetId: r.targetId,
      univers: r.univers,
      libelleUnivers: REPUTATION_UNIVERS[r.univers] ?? r.univers,
      avis,
      noteMoyenne: note,
      avisVerifies: Number(r.verifies),
      consultations30j: consultations,
    };

    if (
      note <= NOTE_RISQUE &&
      consultations !== null &&
      consultations >= CONSULTATIONS_SIGNIFICATIVES
    ) {
      advices.push({
        ...base,
        kind: "risque_avant_mise_en_avant",
        constat: `${consultations} consultations en 30 jours pour ${note}/5 sur ${avis} avis : augmenter la visibilité aggraverait l'insatisfaction. À traiter avant toute mise en avant.`,
        decidable: true,
      });
      continue;
    }

    if (avis < VOLUME_FIABLE) {
      advices.push({
        ...base,
        kind: "volume_insuffisant",
        constat: `${avis} avis seulement : la satisfaction n'est pas assez documentée pour décider d'une mise en avant.`,
        decidable: false,
      });
      continue;
    }

    if (note >= NOTE_EXCELLENTE) {
      advices.push({
        ...base,
        kind: "recommander_mise_en_avant",
        constat: `${note}/5 sur ${avis} avis dont ${base.avisVerifies} expérience(s) vérifiée(s) : une mise en avant peut être proposée à la direction.`,
        decidable: true,
      });
      continue;
    }

    if (note <= NOTE_RISQUE) {
      advices.push({
        ...base,
        kind: "risque_avant_mise_en_avant",
        constat: `${note}/5 sur ${avis} avis : ne pas augmenter la visibilité avant amélioration.`,
        decidable: true,
      });
    }
  }

  return advices;
}
