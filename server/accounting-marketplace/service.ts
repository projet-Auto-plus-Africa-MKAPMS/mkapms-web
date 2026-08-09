/**
 * Marketplace Comptabilité (point 26 B) — « je cherche un comptable ».
 *
 * Recherche par pays → ville → spécialité → langue → disponibilité → note.
 * Aucune note, aucun tarif et aucune disponibilité ne sont inventés : un champ
 * absent reste absent côté résultat, il n'est jamais remplacé par une valeur
 * flatteuse.
 */
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "../db.js";
import { accountantProfiles, accountantRequests } from "./schema.js";

export interface AccountantSearch {
  countryCode: string;
  city?: string | null;
  specialty?: string | null;
  language?: string | null;
  availableOnly?: boolean;
  limit?: number;
}

export async function searchAccountants(input: AccountantSearch) {
  const conditions: SQL[] = [
    eq(accountantProfiles.published, true),
    eq(accountantProfiles.verified, true),
    eq(accountantProfiles.countryCode, input.countryCode.toUpperCase()),
  ];
  if (input.city) {
    conditions.push(sql`lower(${accountantProfiles.city}) = lower(${input.city})`);
  }
  if (input.specialty) {
    conditions.push(sql`${accountantProfiles.specialties} ? ${input.specialty}`);
  }
  if (input.language) {
    conditions.push(sql`${accountantProfiles.languages} ? ${input.language}`);
  }
  if (input.availableOnly) {
    conditions.push(eq(accountantProfiles.availability, "disponible"));
  }

  const rows = await db
    .select()
    .from(accountantProfiles)
    .where(and(...conditions))
    // Les mieux notés d'abord, mais une fiche sans note n'est pas cachée :
    // elle passe simplement après, sans note affichée.
    .orderBy(desc(accountantProfiles.ratingAvg), desc(accountantProfiles.ratingCount))
    .limit(input.limit ?? 40);

  return rows.map((r) => ({
    ...r,
    tarif: r.hourlyRate === null ? null : `${r.hourlyRate} ${r.currency}`,
    noteAffichable: r.ratingCount > 0 ? r.ratingAvg : null,
  }));
}

export async function upsertProfile(input: {
  userId: number;
  displayName: string;
  countryCode: string;
  city?: string | null;
  postalCode?: string | null;
  cabinetId?: number | null;
  specialties?: string[];
  languages?: string[];
  hourlyRate?: number | null;
  currency?: string;
  availability?: string;
  bio?: string | null;
}) {
  const existing = await db
    .select({ id: accountantProfiles.id })
    .from(accountantProfiles)
    .where(eq(accountantProfiles.userId, input.userId))
    .limit(1);

  const values = {
    userId: input.userId,
    cabinetId: input.cabinetId ?? null,
    displayName: input.displayName,
    countryCode: input.countryCode.toUpperCase(),
    city: input.city ?? null,
    postalCode: input.postalCode ?? null,
    specialties: input.specialties ?? [],
    languages: input.languages ?? ["fr"],
    hourlyRate: input.hourlyRate === null || input.hourlyRate === undefined ? null : String(input.hourlyRate),
    currency: input.currency ?? "EUR",
    availability: input.availability ?? "disponible",
    bio: input.bio ?? null,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    const [row] = await db
      .update(accountantProfiles)
      .set(values)
      .where(eq(accountantProfiles.id, existing[0].id))
      .returning();
    return row;
  }
  const [row] = await db.insert(accountantProfiles).values(values).returning();
  return row;
}

export async function myProfile(userId: number) {
  const [row] = await db
    .select()
    .from(accountantProfiles)
    .where(eq(accountantProfiles.userId, userId))
    .limit(1);
  return row ?? null;
}

/** Publication réservée à l'administration : la vérification reste humaine. */
export async function reviewProfile(input: { id: number; verified: boolean; published: boolean }) {
  const [row] = await db
    .update(accountantProfiles)
    .set({ verified: input.verified, published: input.published, updatedAt: new Date() })
    .where(eq(accountantProfiles.id, input.id))
    .returning();
  return row ?? null;
}

export async function createRequest(input: {
  userId: number;
  accountantId?: number | null;
  countryCode: string;
  city?: string | null;
  specialty?: string | null;
  message?: string | null;
}) {
  const [row] = await db
    .insert(accountantRequests)
    .values({
      userId: input.userId,
      accountantId: input.accountantId ?? null,
      countryCode: input.countryCode.toUpperCase(),
      city: input.city ?? null,
      specialty: input.specialty ?? null,
      message: input.message ?? null,
    })
    .returning();
  return row;
}

export async function myRequests(userId: number) {
  return db
    .select()
    .from(accountantRequests)
    .where(eq(accountantRequests.userId, userId))
    .orderBy(desc(accountantRequests.createdAt))
    .limit(100);
}

export interface MarketplaceHealth {
  health: "ok" | "degraded" | "down";
  fichesPubliees: number;
  fichesEnAttente: number;
  paysCouverts: string[];
  demandesSansReponse: number;
  details: string[];
}

export async function marketplaceHealth(): Promise<MarketplaceHealth> {
  const [published] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(accountantProfiles)
    .where(and(eq(accountantProfiles.published, true), eq(accountantProfiles.verified, true)));

  const [pending] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(accountantProfiles)
    .where(eq(accountantProfiles.verified, false));

  const countries = await db
    .selectDistinct({ code: accountantProfiles.countryCode })
    .from(accountantProfiles)
    .where(eq(accountantProfiles.published, true));

  const [openRequests] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(accountantRequests)
    .where(eq(accountantRequests.status, "envoyee"));

  const publiees = Number(published?.n ?? 0);
  const details = [
    `${publiees} fiche(s) publiée(s) et vérifiée(s) sur ${countries.length} pays.`,
    `${Number(pending?.n ?? 0)} fiche(s) en attente de vérification humaine.`,
    `${Number(openRequests?.n ?? 0)} demande(s) client sans réponse.`,
  ];
  if (publiees === 0) {
    details.push("Annuaire vide : la recherche « je cherche un comptable » ne renverra aucun résultat.");
  }

  return {
    // Un annuaire vide est un manque de contenu, pas une panne du moteur :
    // il est signalé « partiel », jamais masqué par un vert de complaisance.
    health: publiees > 0 ? "ok" : "degraded",
    fichesPubliees: publiees,
    fichesEnAttente: Number(pending?.n ?? 0),
    paysCouverts: countries.map((c) => c.code),
    demandesSansReponse: Number(openRequests?.n ?? 0),
    details,
  };
}
