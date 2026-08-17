/**
 * Point 52 — service du connecteur Google Business Profile.
 *
 * Le connecteur ne fabrique aucune donnée. Tant qu'aucune identification Google
 * n'est enregistrée, son état est « non configuré » et il le dit : c'est
 * préférable à un connecteur qui se présente comme actif sans jamais avoir
 * dialogué avec Google.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db.js";
import { gbpLocations, gbpReviewSnapshots } from "./schema.js";
import { reputationOf } from "../../reputation-engine/service.js";

export type ConnectorState = "non_configure" | "configure" | "actif";

export interface ConnectorStatus {
  state: ConnectorState;
  /** Motif affiché tel quel à la direction. */
  message: string;
  /** Aucune valeur de secret n'est renvoyée, seulement leur présence. */
  credentials: { clientId: boolean; clientSecret: boolean; refreshToken: boolean };
  etablissements: number;
  etablissementsVerifies: number;
  dernierReleve: Date | null;
  relevesApi: number;
}

const REQUIRED_ENV = [
  "GOOGLE_BUSINESS_CLIENT_ID",
  "GOOGLE_BUSINESS_CLIENT_SECRET",
  "GOOGLE_BUSINESS_REFRESH_TOKEN",
] as const;

export async function connectorStatus(): Promise<ConnectorStatus> {
  const credentials = {
    clientId: !!process.env.GOOGLE_BUSINESS_CLIENT_ID,
    clientSecret: !!process.env.GOOGLE_BUSINESS_CLIENT_SECRET,
    refreshToken: !!process.env.GOOGLE_BUSINESS_REFRESH_TOKEN,
  };
  const manquants = REQUIRED_ENV.filter((k) => !process.env[k]);

  const [loc] = await db
    .select({
      total: sql<number>`count(*)::int`,
      verifies: sql<number>`count(*) filter (where ${gbpLocations.status} = 'verifie')::int`,
    })
    .from(gbpLocations);

  const [snap] = await db
    .select({
      dernier: sql<Date | null>`max(${gbpReviewSnapshots.collectedAt})`,
      api: sql<number>`count(*) filter (where ${gbpReviewSnapshots.fromApi})::int`,
    })
    .from(gbpReviewSnapshots);

  const etablissements = loc?.total ?? 0;
  const relevesApi = snap?.api ?? 0;

  if (manquants.length > 0) {
    return {
      state: "non_configure",
      message: `Connecteur non configuré : ${manquants.join(", ")} absent(s). Les avis Google ne peuvent pas être relevés automatiquement ; seuls des relevés saisis par la direction sont possibles.`,
      credentials,
      etablissements,
      etablissementsVerifies: loc?.verifies ?? 0,
      dernierReleve: snap?.dernier ?? null,
      relevesApi,
    };
  }
  if (relevesApi === 0) {
    return {
      state: "configure",
      message:
        "Identification Google enregistrée, mais aucun relevé n'a encore été obtenu par l'API : le connecteur n'est pas confirmé actif.",
      credentials,
      etablissements,
      etablissementsVerifies: loc?.verifies ?? 0,
      dernierReleve: snap?.dernier ?? null,
      relevesApi,
    };
  }
  return {
    state: "actif",
    message: `${relevesApi} relevé(s) obtenu(s) via l'API Google sur ${etablissements} établissement(s).`,
    credentials,
    etablissements,
    etablissementsVerifies: loc?.verifies ?? 0,
    dernierReleve: snap?.dernier ?? null,
    relevesApi,
  };
}

export async function declareLocation(input: {
  targetType: string;
  targetId: number;
  nom: string;
  countryCode?: string | null;
  ville?: string | null;
  placeId?: string | null;
  gbpLocationName?: string | null;
  gbpUrl?: string | null;
  notes?: string | null;
  actorId: number;
}): Promise<{ id: number; deja: boolean }> {
  const [existant] = await db
    .select({ id: gbpLocations.id })
    .from(gbpLocations)
    .where(
      and(
        eq(gbpLocations.targetType, input.targetType),
        eq(gbpLocations.targetId, input.targetId),
      ),
    )
    .limit(1);
  if (existant) return { id: existant.id, deja: true };

  const [cree] = await db
    .insert(gbpLocations)
    .values({
      targetType: input.targetType,
      targetId: input.targetId,
      nom: input.nom,
      countryCode: input.countryCode ?? null,
      ville: input.ville ?? null,
      placeId: input.placeId ?? null,
      gbpLocationName: input.gbpLocationName ?? null,
      gbpUrl: input.gbpUrl ?? null,
      declaredBy: input.actorId,
      notes: input.notes ?? null,
    })
    .returning({ id: gbpLocations.id });
  return { id: cree.id, deja: false };
}

export async function verifyLocation(input: {
  locationId: number;
  actorId: number;
  verifie: boolean;
  notes?: string | null;
}) {
  await db
    .update(gbpLocations)
    .set({
      status: input.verifie ? "verifie" : "suspendu",
      verifiedBy: input.actorId,
      verifiedAt: new Date(),
      notes: input.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(gbpLocations.id, input.locationId));
  return { ok: true };
}

/**
 * Relevé saisi par la direction depuis la fiche Google réelle.
 * `fromApi` reste faux : la provenance du chiffre doit rester lisible.
 */
export async function recordManualSnapshot(input: {
  locationId: number;
  averageRating: number;
  reviewCount: number;
  actorId: number;
  detail?: string | null;
}) {
  const [cree] = await db
    .insert(gbpReviewSnapshots)
    .values({
      locationId: input.locationId,
      averageRating: String(input.averageRating),
      reviewCount: input.reviewCount,
      collectionMode: "saisie_manuelle",
      collectedBy: input.actorId,
      fromApi: false,
      detail: input.detail ?? null,
    })
    .returning({ id: gbpReviewSnapshots.id });
  return { id: cree.id };
}

export interface SourcesComparees {
  locationId: number;
  nom: string;
  mkapms: { average: number | null; total: number; raison: string | null };
  google: {
    average: number | null;
    total: number;
    releveLe: Date | null;
    mode: string | null;
    raison: string | null;
  };
}

/**
 * Les deux sources côte à côte, jamais additionnées : une moyenne commune
 * mélangerait des avis dont les règles de dépôt et de modération diffèrent.
 */
export async function compareSources(locationId: number): Promise<SourcesComparees | null> {
  const [loc] = await db
    .select()
    .from(gbpLocations)
    .where(eq(gbpLocations.id, locationId))
    .limit(1);
  if (!loc) return null;

  const interne = await reputationOf({
    targetType: loc.targetType,
    targetId: loc.targetId,
  });

  const [snap] = await db
    .select()
    .from(gbpReviewSnapshots)
    .where(eq(gbpReviewSnapshots.locationId, locationId))
    .orderBy(desc(gbpReviewSnapshots.collectedAt))
    .limit(1);

  return {
    locationId,
    nom: loc.nom,
    mkapms: {
      average: interne.averageRating,
      total: interne.totalReviews,
      raison: interne.raison,
    },
    google: snap
      ? {
          average: snap.averageRating === null ? null : Number(snap.averageRating),
          total: snap.reviewCount,
          releveLe: snap.collectedAt,
          mode: snap.collectionMode,
          raison: null,
        }
      : {
          average: null,
          total: 0,
          releveLe: null,
          mode: null,
          raison: "Aucun relevé Google enregistré pour cet établissement.",
        },
  };
}

export async function listLocations(limit = 100) {
  return db
    .select()
    .from(gbpLocations)
    .orderBy(desc(gbpLocations.createdAt))
    .limit(limit);
}
