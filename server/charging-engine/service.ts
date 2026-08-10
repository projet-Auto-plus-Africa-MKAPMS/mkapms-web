/**
 * Charging Engine (point 45) — service.
 *
 * Une recherche sans résultat doit dire pourquoi : « aucune borne référencée
 * dans ce pays » n'est pas la même information que « aucune borne ne
 * correspond à vos filtres ». Sans cette distinction, un visiteur croirait sa
 * ville dépourvue de bornes alors que l'annuaire est simplement vide.
 */
import { and, asc, desc, eq, gte, ilike, sql } from "drizzle-orm";
import { db } from "../db.js";
import { notifyDirection } from "../notification-os/triggers.js";
import {
  CHARGING_ACCESS,
  CHARGING_CONNECTORS,
  chargingPoints,
  type ChargingAccess,
  type ChargingConnector,
} from "./schema.js";

export const CONNECTOR_LABELS: Record<ChargingConnector, string> = {
  type2: "Type 2",
  ccs: "CCS Combo",
  chademo: "CHAdeMO",
  type1: "Type 1",
  domestique: "Prise domestique",
};

export const ACCESS_LABELS: Record<ChargingAccess, string> = {
  public: "Public",
  reserve_clients: "Réservé aux clients",
  prive: "Privé",
  abonnement: "Sur abonnement",
};

export function chargingCatalog() {
  return {
    connectors: CHARGING_CONNECTORS.map((code) => ({ code, label: CONNECTOR_LABELS[code] })),
    access: CHARGING_ACCESS.map((code) => ({ code, label: ACCESS_LABELS[code] })),
  };
}

export interface ChargingSearchInput {
  countryCode: string;
  city?: string | null;
  connector?: ChargingConnector | null;
  minPowerKw?: number | null;
  access?: ChargingAccess | null;
  limit?: number;
}

export interface ChargingSearchResult {
  points: {
    id: number;
    name: string;
    operator: string | null;
    city: string;
    postalCode: string | null;
    address: string | null;
    connectors: string[];
    powerKw: number | null;
    outlets: number | null;
    access: string;
    pricingNote: string | null;
    openingHours: string | null;
    hasCoordinates: boolean;
  }[];
  /** Bornes publiées dans le pays, tous filtres ignorés. */
  totalInCountry: number;
  raison: string | null;
}

export async function searchChargingPoints(
  input: ChargingSearchInput,
): Promise<ChargingSearchResult> {
  const [countryCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(chargingPoints)
    .where(
      and(
        eq(chargingPoints.countryCode, input.countryCode),
        eq(chargingPoints.status, "publie"),
      ),
    );
  const totalInCountry = countryCount?.n ?? 0;

  const conds = [
    eq(chargingPoints.countryCode, input.countryCode),
    eq(chargingPoints.status, "publie"),
  ];
  if (input.city) conds.push(ilike(chargingPoints.city, `%${input.city}%`));
  if (input.access) conds.push(eq(chargingPoints.access, input.access));
  if (input.minPowerKw) conds.push(gte(chargingPoints.powerKw, input.minPowerKw));
  if (input.connector)
    conds.push(sql`${chargingPoints.connectors} ? ${input.connector}::text`);

  const rows = await db
    .select()
    .from(chargingPoints)
    .where(and(...conds))
    .orderBy(desc(chargingPoints.powerKw), asc(chargingPoints.city))
    .limit(input.limit ?? 60);

  let raison: string | null = null;
  if (rows.length === 0) {
    raison =
      totalInCountry === 0
        ? `Aucune borne n'est encore référencée pour ${input.countryCode}. L'annuaire se remplit par les déclarations validées — il n'affiche pas de borne supposée.`
        : "Aucune borne référencée ne correspond à ces filtres. Élargissez la puissance, la prise ou la ville.";
  }

  return {
    points: rows.map((p) => ({
      id: p.id,
      name: p.name,
      operator: p.operator,
      city: p.city,
      postalCode: p.postalCode,
      address: p.address,
      connectors: p.connectors ?? [],
      powerKw: p.powerKw,
      outlets: p.outlets,
      access: p.access,
      pricingNote: p.pricingNote,
      openingHours: p.openingHours,
      hasCoordinates: p.latitude !== null && p.longitude !== null,
    })),
    totalInCountry,
    raison,
  };
}

export interface DeclarePointInput {
  userId?: number | null;
  name: string;
  operator?: string | null;
  countryCode: string;
  city: string;
  postalCode?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  connectors: ChargingConnector[];
  powerKw?: number | null;
  outlets?: number | null;
  access: ChargingAccess;
  pricingNote?: string | null;
  openingHours?: string | null;
}

/** Une déclaration n'est jamais publiée automatiquement. */
export async function declareChargingPoint(input: DeclarePointInput) {
  const [row] = await db
    .insert(chargingPoints)
    .values({
      name: input.name,
      operator: input.operator ?? null,
      countryCode: input.countryCode,
      city: input.city,
      postalCode: input.postalCode ?? null,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      connectors: input.connectors,
      powerKw: input.powerKw ?? null,
      outlets: input.outlets ?? null,
      access: input.access,
      pricingNote: input.pricingNote ?? null,
      openingHours: input.openingHours ?? null,
      source: "declaration",
      declaredBy: input.userId ?? null,
      status: "en_attente",
    })
    .returning();

  await notifyDirection(
    "borne_declaration_a_valider",
    {
      ville: `${input.city} (${input.countryCode})`,
      operateur: input.operator ?? input.name,
      detail: `${input.connectors.map((c) => CONNECTOR_LABELS[c]).join(", ") || "prise non précisée"}${
        input.powerKw ? ` — ${input.powerKw} kW` : ""
      } — accès ${ACCESS_LABELS[input.access]}.`,
    },
    "/labs/energy-recharge",
  );

  return {
    id: row.id,
    status: row.status,
    message:
      "Borne enregistrée en attente de vérification : elle n'apparaît dans l'annuaire qu'après validation.",
  };
}

export async function listChargingPoints(filter: {
  status?: string;
  countryCode?: string;
  limit?: number;
}) {
  const conds = [];
  if (filter.status) conds.push(eq(chargingPoints.status, filter.status));
  if (filter.countryCode) conds.push(eq(chargingPoints.countryCode, filter.countryCode));
  const q = db.select().from(chargingPoints);
  return (conds.length ? q.where(and(...conds)) : q)
    .orderBy(desc(chargingPoints.createdAt))
    .limit(filter.limit ?? 200);
}

export async function reviewChargingPoint(input: {
  id: number;
  decision: "publie" | "rejete" | "hors_service";
  reviewerId: number;
  note?: string | null;
}) {
  const [row] = await db
    .update(chargingPoints)
    .set({
      status: input.decision,
      reviewedBy: input.reviewerId,
      reviewedAt: new Date(),
      reviewNote: input.note ?? null,
      updatedAt: new Date(),
    })
    .where(eq(chargingPoints.id, input.id))
    .returning();
  return row ?? null;
}

export interface ChargingHealth {
  status: "ok" | "degraded" | "down";
  message: string;
  metrics: { publiees: number; enAttente: number; horsService: number; sansCoordonnees: number };
}

export async function chargingEngineHealth(): Promise<ChargingHealth> {
  const rows = await db
    .select({ status: chargingPoints.status, n: sql<number>`count(*)::int` })
    .from(chargingPoints)
    .groupBy(chargingPoints.status);
  const by = new Map(rows.map((r) => [r.status, r.n]));

  const [noCoords] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(chargingPoints)
    .where(and(eq(chargingPoints.status, "publie"), sql`${chargingPoints.latitude} is null`));

  const metrics = {
    publiees: by.get("publie") ?? 0,
    enAttente: by.get("en_attente") ?? 0,
    horsService: by.get("hors_service") ?? 0,
    sansCoordonnees: noCoords?.n ?? 0,
  };

  if (metrics.publiees === 0) {
    return {
      status: "degraded",
      message:
        "Aucune borne publiée : l'annuaire répond, mais il n'a rien à proposer et le dit au visiteur.",
      metrics,
    };
  }
  if (metrics.enAttente > 0) {
    return {
      status: "ok",
      message: `${metrics.publiees} borne(s) publiée(s), ${metrics.enAttente} en attente de vérification.`,
      metrics,
    };
  }
  return { status: "ok", message: `${metrics.publiees} borne(s) publiée(s).`, metrics };
}
