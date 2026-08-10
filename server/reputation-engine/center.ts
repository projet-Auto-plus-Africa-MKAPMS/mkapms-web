/**
 * Point 55 — Centre Réputation PDG / Direction.
 *
 * Règle tenue partout dans ce fichier : on ne fabrique jamais une note globale
 * en mélangeant des professionnels différents ni deux sources différentes.
 *  - la « note plateforme » est la moyenne des avis MKA.P-MS uniquement, et le
 *    nombre d'avis sur lequel elle repose est toujours donné à côté ;
 *  - les avis Google sont présentés dans un bloc séparé, avec la date et le
 *    mode du relevé — jamais additionnés aux avis internes ;
 *  - une moyenne par pays ou par service reste une moyenne d'avis, pas une
 *    moyenne de professionnels : elle ne remplace pas la note de chacun.
 */
import { and, desc, gte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { reviewFraudSignals, reviewsV2 } from "../modules/reviews.js";
import { smartAlerts } from "../smart-engine/schema.js";
import { gbpLocations, gbpReviewSnapshots } from "../connectors/google-business/schema.js";
import { connectorStatus } from "../connectors/google-business/service.js";
import { REPUTATION_UNIVERS } from "./service.js";
import { reputationTrends, type ReputationTrend } from "./trends.js";
import { CONFIDENCE_VOLUME, platformAverage } from "./ranking.js";

const JOUR = 24 * 60 * 60 * 1000;

export interface GlobalReputation {
  /** null si aucun avis publié : jamais 0/5 affiché comme une note. */
  noteMoyenne: number | null;
  avisPublies: number;
  avisEnModeration: number;
  avisMasques: number;
  avisVerifies: number;
  tauxReponsePct: number;
  avis30Jours: number;
  raison: string | null;
}

async function globalReputation(): Promise<GlobalReputation> {
  const [row] = await db
    .select({
      publies: sql<number>`count(*) filter (where ${reviewsV2.status} = 'publie')::int`,
      enModeration: sql<number>`count(*) filter (where ${reviewsV2.status} = 'en_moderation')::int`,
      masques: sql<number>`count(*) filter (where ${reviewsV2.status} in ('masque','signale'))::int`,
      verifies: sql<number>`count(*) filter (where ${reviewsV2.status} = 'publie' and ${reviewsV2.verified})::int`,
      somme: sql<number>`coalesce(sum(${reviewsV2.ratingGlobal}) filter (where ${reviewsV2.status} = 'publie'), 0)::int`,
      repondus: sql<number>`count(*) filter (where ${reviewsV2.status} = 'publie' and ${reviewsV2.responseText} is not null)::int`,
      recents: sql<number>`count(*) filter (where ${reviewsV2.createdAt} >= now() - interval '30 days')::int`,
    })
    .from(reviewsV2);

  const publies = Number(row?.publies ?? 0);
  return {
    noteMoyenne: publies > 0 ? Math.round((Number(row.somme) / publies) * 100) / 100 : null,
    avisPublies: publies,
    avisEnModeration: Number(row?.enModeration ?? 0),
    avisMasques: Number(row?.masques ?? 0),
    avisVerifies: Number(row?.verifies ?? 0),
    tauxReponsePct: publies > 0 ? Math.round((Number(row.repondus) / publies) * 100) : 0,
    avis30Jours: Number(row?.recents ?? 0),
    raison: publies === 0 ? "Aucun avis publié : aucune note plateforme à afficher." : null,
  };
}

export interface ReputationBreakdown {
  cle: string;
  libelle: string;
  avis: number;
  noteMoyenne: number | null;
  avisVerifies: number;
  tauxReponsePct: number;
}

async function byCountry(): Promise<ReputationBreakdown[]> {
  const rows = await db
    .select({
      pays: reviewsV2.countryCode,
      avis: sql<number>`count(*)::int`,
      somme: sql<number>`sum(${reviewsV2.ratingGlobal})::int`,
      verifies: sql<number>`count(*) filter (where ${reviewsV2.verified})::int`,
      repondus: sql<number>`count(*) filter (where ${reviewsV2.responseText} is not null)::int`,
    })
    .from(reviewsV2)
    .where(sql`${reviewsV2.status} = 'publie'`)
    .groupBy(reviewsV2.countryCode)
    .orderBy(sql`count(*) desc`);

  return rows.map((r) => {
    const avis = Number(r.avis);
    return {
      cle: r.pays ?? "inconnu",
      // Un avis sans pays n'est pas rattaché de force à un pays par défaut.
      libelle: r.pays ?? "Pays non renseigné",
      avis,
      noteMoyenne: avis > 0 ? Math.round((Number(r.somme) / avis) * 100) / 100 : null,
      avisVerifies: Number(r.verifies),
      tauxReponsePct: avis > 0 ? Math.round((Number(r.repondus) / avis) * 100) : 0,
    };
  });
}

async function byService(): Promise<ReputationBreakdown[]> {
  const rows = await db
    .select({
      univers: reviewsV2.univers,
      avis: sql<number>`count(*)::int`,
      somme: sql<number>`sum(${reviewsV2.ratingGlobal})::int`,
      verifies: sql<number>`count(*) filter (where ${reviewsV2.verified})::int`,
      repondus: sql<number>`count(*) filter (where ${reviewsV2.responseText} is not null)::int`,
    })
    .from(reviewsV2)
    .where(sql`${reviewsV2.status} = 'publie'`)
    .groupBy(reviewsV2.univers)
    .orderBy(sql`count(*) desc`);

  return rows.map((r) => {
    const avis = Number(r.avis);
    return {
      cle: r.univers,
      libelle: REPUTATION_UNIVERS[r.univers] ?? r.univers,
      avis,
      noteMoyenne: avis > 0 ? Math.round((Number(r.somme) / avis) * 100) / 100 : null,
      avisVerifies: Number(r.verifies),
      tauxReponsePct: avis > 0 ? Math.round((Number(r.repondus) / avis) * 100) : 0,
    };
  });
}

export interface ProfessionalReputation {
  targetType: string;
  targetId: number;
  univers: string;
  libelleUnivers: string;
  avis: number;
  noteMoyenne: number;
  avisVerifies: number;
  avisSansReponse: number;
  /** Note lissée par le volume — sert au classement, pas à l'affichage public. */
  notePonderee: number;
  /** Vrai quand le volume est trop faible pour conclure. */
  volumeInsuffisant: boolean;
}

/**
 * Réputation professionnel par professionnel. Chaque ligne reste séparée : le
 * centre n'agrège pas des professionnels entre eux, ce qui produirait une note
 * qui n'appartient à personne.
 */
async function byProfessional(limit: number): Promise<ProfessionalReputation[]> {
  const { average: m } = await platformAverage();
  const rows = await db
    .select({
      targetType: reviewsV2.targetType,
      targetId: reviewsV2.targetId,
      univers: reviewsV2.univers,
      avis: sql<number>`count(*)::int`,
      somme: sql<number>`sum(${reviewsV2.ratingGlobal})::int`,
      verifies: sql<number>`count(*) filter (where ${reviewsV2.verified})::int`,
      sansReponse: sql<number>`count(*) filter (where ${reviewsV2.responseText} is null)::int`,
    })
    .from(reviewsV2)
    .where(sql`${reviewsV2.status} = 'publie'`)
    .groupBy(reviewsV2.targetType, reviewsV2.targetId, reviewsV2.univers)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  return rows.map((r) => {
    const avis = Number(r.avis);
    const moyenne = Number(r.somme) / avis;
    const ponderee =
      m > 0 ? (CONFIDENCE_VOLUME * m + moyenne * avis) / (CONFIDENCE_VOLUME + avis) : moyenne;
    return {
      targetType: r.targetType,
      targetId: r.targetId,
      univers: r.univers,
      libelleUnivers: REPUTATION_UNIVERS[r.univers] ?? r.univers,
      avis,
      noteMoyenne: Math.round(moyenne * 100) / 100,
      avisVerifies: Number(r.verifies),
      avisSansReponse: Number(r.sansReponse),
      notePonderee: Math.round(ponderee * 100) / 100,
      volumeInsuffisant: avis < 5,
    };
  });
}

export interface GoogleSourceView {
  etat: Awaited<ReturnType<typeof connectorStatus>>;
  etablissements: {
    locationId: number;
    nom: string;
    ville: string | null;
    pays: string | null;
    statut: string;
    /** Dernier relevé Google connu — null si aucun relevé n'a été fait. */
    note: number | null;
    avis: number | null;
    releveLe: Date | null;
    mode: string | null;
    fromApi: boolean;
  }[];
}

/**
 * Bloc Google, strictement séparé. Aucune moyenne commune n'est calculée avec
 * les avis MKA.P-MS : ce sont deux populations d'avis aux règles différentes.
 */
async function googleSource(): Promise<GoogleSourceView> {
  const etat = await connectorStatus();
  const rows = await db
    .select({
      locationId: gbpLocations.id,
      nom: gbpLocations.nom,
      ville: gbpLocations.ville,
      pays: gbpLocations.countryCode,
      statut: gbpLocations.status,
      note: gbpReviewSnapshots.averageRating,
      avis: gbpReviewSnapshots.reviewCount,
      releveLe: gbpReviewSnapshots.collectedAt,
      mode: gbpReviewSnapshots.collectionMode,
      fromApi: gbpReviewSnapshots.fromApi,
    })
    .from(gbpLocations)
    .leftJoin(
      gbpReviewSnapshots,
      sql`${gbpReviewSnapshots.id} = (
        select s.id from ${gbpReviewSnapshots} s
        where s.location_id = ${gbpLocations.id}
        order by s.collected_at desc limit 1
      )`,
    )
    .orderBy(desc(gbpLocations.createdAt))
    .limit(200);

  return {
    etat,
    etablissements: rows.map((r) => ({
      locationId: r.locationId,
      nom: r.nom,
      ville: r.ville,
      pays: r.pays,
      statut: r.statut,
      note: r.note === null ? null : Number(r.note),
      avis: r.avis === null ? null : Number(r.avis),
      releveLe: r.releveLe ?? null,
      mode: r.mode ?? null,
      fromApi: Boolean(r.fromApi),
    })),
  };
}

export interface ReputationCenterView {
  global: GlobalReputation;
  pays: ReputationBreakdown[];
  services: ReputationBreakdown[];
  professionnels: ProfessionalReputation[];
  signalements: {
    ouverts: number;
    critiques: number;
    derniers: {
      id: number;
      reviewId: number;
      type: string;
      severity: string;
      detail: string;
      createdAt: Date;
    }[];
  };
  reponses: {
    avisSansReponse: number;
    /** Avis publiés depuis plus de 7 jours et toujours sans réponse. */
    enRetard: number;
    tauxReponsePct: number;
  };
  tendances: ReputationTrend[];
  alertesIA: {
    id: number;
    titre: string;
    description: string | null;
    severite: string | null;
    creeLe: Date | null;
  }[];
  google: GoogleSourceView;
  /** Ce que le centre ne fait volontairement pas — affiché tel quel. */
  avertissements: string[];
}

export async function reputationCenter(
  options: { limitProfessionnels?: number } = {},
): Promise<ReputationCenterView> {
  const [global, pays, services, professionnels] = await Promise.all([
    globalReputation(),
    byCountry(),
    byService(),
    byProfessional(options.limitProfessionnels ?? 50),
  ]);

  const [signaux] = await db
    .select({
      ouverts: sql<number>`count(*) filter (where ${reviewFraudSignals.reviewed} = false)::int`,
      critiques: sql<number>`count(*) filter (where ${reviewFraudSignals.reviewed} = false and ${reviewFraudSignals.severity} = 'critique')::int`,
    })
    .from(reviewFraudSignals);

  const derniers = await db
    .select({
      id: reviewFraudSignals.id,
      reviewId: reviewFraudSignals.reviewId,
      type: reviewFraudSignals.signalType,
      severity: reviewFraudSignals.severity,
      detail: reviewFraudSignals.detail,
      createdAt: reviewFraudSignals.createdAt,
    })
    .from(reviewFraudSignals)
    .where(sql`${reviewFraudSignals.reviewed} = false`)
    .orderBy(desc(reviewFraudSignals.createdAt))
    .limit(20);

  const [reponses] = await db
    .select({
      sansReponse: sql<number>`count(*) filter (where ${reviewsV2.responseText} is null)::int`,
      enRetard: sql<number>`count(*) filter (where ${reviewsV2.responseText} is null and ${reviewsV2.createdAt} < now() - interval '7 days')::int`,
    })
    .from(reviewsV2)
    .where(sql`${reviewsV2.status} = 'publie'`);

  const alertes = await db
    .select({
      id: smartAlerts.id,
      titre: smartAlerts.title,
      description: smartAlerts.description,
      severite: smartAlerts.severity,
      creeLe: smartAlerts.createdAt,
    })
    .from(smartAlerts)
    .where(
      and(
        sql`${smartAlerts.category} = 'avis'`,
        sql`${smartAlerts.status} = 'open'`,
        gte(smartAlerts.createdAt, new Date(Date.now() - 90 * JOUR)),
      ),
    )
    .orderBy(desc(smartAlerts.createdAt))
    .limit(30);

  const [tendances, google] = await Promise.all([
    reputationTrends().catch(() => [] as ReputationTrend[]),
    googleSource().catch(
      (): GoogleSourceView => ({
        etat: {
          state: "non_configure",
          message: "Le connecteur Google Business Profile n'est pas interrogeable.",
          credentials: { clientId: false, clientSecret: false, refreshToken: false },
          etablissements: 0,
          etablissementsVerifies: 0,
          dernierReleve: null,
          relevesApi: 0,
        },
        etablissements: [],
      }),
    ),
  ]);

  return {
    global,
    pays,
    services,
    professionnels,
    signalements: {
      ouverts: Number(signaux?.ouverts ?? 0),
      critiques: Number(signaux?.critiques ?? 0),
      derniers,
    },
    reponses: {
      avisSansReponse: Number(reponses?.sansReponse ?? 0),
      enRetard: Number(reponses?.enRetard ?? 0),
      tauxReponsePct: global.tauxReponsePct,
    },
    tendances,
    alertesIA: alertes,
    google: google,
    avertissements: [
      "La note plateforme ne mélange pas les professionnels : c'est la moyenne des avis MKA.P-MS, pas une note attribuée à un professionnel.",
      "Les avis Google sont affichés à part et ne sont jamais additionnés aux avis MKA.P-MS.",
      "Une note reposant sur moins de 5 avis est signalée « volume insuffisant » : elle ne permet pas de conclure.",
    ],
  };
}
