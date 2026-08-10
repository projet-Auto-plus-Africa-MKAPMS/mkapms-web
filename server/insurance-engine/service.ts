/**
 * Insurance Engine (point 45) — service.
 *
 * Règle centrale : la plateforme ne fixe aucun prix d'assurance. Elle met en
 * relation, garde la trace de ce qui a réellement été transmis, et affiche une
 * offre uniquement quand un humain l'a saisie. Une demande sans assureur
 * partenaire dans le pays est enregistrée et annoncée comme telle — jamais
 * présentée comme « transmise ».
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { notifyDirection, notifyEvent } from "../notification-os/triggers.js";
import {
  INSURANCE_FORMULAS,
  INSURANCE_USAGES,
  insurancePartners,
  insuranceQuoteRequests,
  type InsuranceFormula,
  type InsuranceUsage,
} from "./schema.js";

export const INSURANCE_FORMULA_LABELS: Record<InsuranceFormula, string> = {
  tiers: "Au tiers",
  tiers_plus: "Tiers étendu",
  tous_risques: "Tous risques",
};

export const INSURANCE_USAGE_LABELS: Record<InsuranceUsage, string> = {
  personnel: "Personnel",
  trajet_travail: "Trajet domicile-travail",
  professionnel: "Professionnel",
  vtc_taxi: "VTC / Taxi",
  flotte: "Flotte d'entreprise",
};

export function insuranceCatalog() {
  return {
    formulas: INSURANCE_FORMULAS.map((code) => ({
      code,
      label: INSURANCE_FORMULA_LABELS[code],
    })),
    usages: INSURANCE_USAGES.map((code) => ({
      code,
      label: INSURANCE_USAGE_LABELS[code],
    })),
  };
}

function reference(): string {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ASSU-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}

export interface InsurancePartnerView {
  id: number;
  name: string;
  countryCode: string;
  formulas: string[];
  usages: string[];
  status: string;
}

/**
 * Assureurs actifs du pays. Le tableau vide est une information : il signifie
 * qu'aucun partenaire n'est référencé, ce que la page doit dire au visiteur.
 */
export async function listInsurancePartners(
  countryCode?: string,
): Promise<InsurancePartnerView[]> {
  const rows = await db
    .select()
    .from(insurancePartners)
    .where(
      countryCode
        ? and(
            eq(insurancePartners.countryCode, countryCode),
            eq(insurancePartners.status, "actif"),
          )
        : eq(insurancePartners.status, "actif"),
    )
    .orderBy(insurancePartners.name);

  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    countryCode: p.countryCode,
    formulas: p.formulas ?? [],
    usages: p.usages ?? [],
    status: p.status,
  }));
}

export interface QuoteRequestInput {
  userId?: number | null;
  countryCode: string;
  city?: string | null;
  formula: InsuranceFormula;
  usage: InsuranceUsage;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  plate?: string | null;
  driverLicenseYear?: number | null;
  claimsLast3Years?: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  message?: string | null;
}

export interface QuoteRequestResult {
  reference: string;
  status: string;
  /** Assureurs réellement sollicités — 0 signifie « personne à contacter ». */
  contactedPartners: { id: number; name: string }[];
  raison?: string;
}

/**
 * Enregistre une demande et la dirige vers les assureurs qui couvrent
 * réellement le pays, la formule et l'usage demandés.
 */
export async function requestQuote(input: QuoteRequestInput): Promise<QuoteRequestResult> {
  const partners = await listInsurancePartners(input.countryCode);
  const eligible = partners.filter(
    (p) =>
      (p.formulas.length === 0 || p.formulas.includes(input.formula)) &&
      (p.usages.length === 0 || p.usages.includes(input.usage)),
  );

  const status = eligible.length > 0 ? "transmise" : "sans_assureur";
  const [row] = await db
    .insert(insuranceQuoteRequests)
    .values({
      reference: reference(),
      userId: input.userId ?? null,
      countryCode: input.countryCode,
      city: input.city ?? null,
      formula: input.formula,
      usage: input.usage,
      vehicleBrand: input.vehicleBrand ?? null,
      vehicleModel: input.vehicleModel ?? null,
      vehicleYear: input.vehicleYear ?? null,
      plate: input.plate ?? null,
      driverLicenseYear: input.driverLicenseYear ?? null,
      claimsLast3Years: input.claimsLast3Years ?? null,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      message: input.message ?? null,
      status,
      contactedPartners: eligible.map((p) => p.id),
    })
    .returning();

  if (input.userId) {
    await notifyEvent({
      userId: input.userId,
      event: eligible.length > 0 ? "assurance_demande_recue" : "assurance_sans_assureur",
      vars: {
        reference: row.reference,
        formule: INSURANCE_FORMULA_LABELS[input.formula],
        assureurs: eligible.length,
        pays: input.countryCode,
      },
      url: "/operations/m-k-a-p-m-s-assurance",
    });
  }

  await notifyDirection(
    "assurance_demande_a_traiter",
    {
      reference: row.reference,
      pays: input.countryCode,
      formule: INSURANCE_FORMULA_LABELS[input.formula],
      detail:
        eligible.length > 0
          ? `${eligible.length} assureur(s) sollicité(s) : ${eligible.map((p) => p.name).join(", ")}.`
          : `Aucun assureur partenaire ne couvre ${input.countryCode} pour cette formule : la demande attend un partenaire.`,
    },
    "/operations/m-k-a-p-m-s-assurance",
  );

  return {
    reference: row.reference,
    status,
    contactedPartners: eligible.map((p) => ({ id: p.id, name: p.name })),
    raison:
      eligible.length > 0
        ? undefined
        : `Aucun assureur partenaire référencé pour ${input.countryCode} avec cette formule et cet usage. La demande est enregistrée, pas transmise.`,
  };
}

/** Demandes d'un compte, pour qu'il suive sa propre demande. */
export async function myQuoteRequests(userId: number, limit = 20) {
  return db
    .select()
    .from(insuranceQuoteRequests)
    .where(eq(insuranceQuoteRequests.userId, userId))
    .orderBy(desc(insuranceQuoteRequests.createdAt))
    .limit(limit);
}

export async function listQuoteRequests(filter: {
  status?: string;
  countryCode?: string;
  limit?: number;
}) {
  const conds = [];
  if (filter.status) conds.push(eq(insuranceQuoteRequests.status, filter.status));
  if (filter.countryCode)
    conds.push(eq(insuranceQuoteRequests.countryCode, filter.countryCode));

  const q = db.select().from(insuranceQuoteRequests);
  const rows = await (conds.length ? q.where(and(...conds)) : q)
    .orderBy(desc(insuranceQuoteRequests.createdAt))
    .limit(filter.limit ?? 100);
  return rows;
}

/**
 * Enregistre une offre reçue d'un assureur. Le montant vient d'un humain :
 * aucun calcul automatique, car une prime engage l'assureur.
 */
export async function recordOffer(input: {
  id: number;
  partnerId: number;
  amount: string;
  currency: string;
  validUntil?: Date | null;
  note?: string | null;
  userId: number;
}) {
  const [row] = await db
    .update(insuranceQuoteRequests)
    .set({
      offerPartnerId: input.partnerId,
      offerAmount: input.amount,
      offerCurrency: input.currency,
      offerValidUntil: input.validUntil ?? null,
      offerNote: input.note ?? null,
      offerBy: input.userId,
      offerAt: new Date(),
      status: "offre_recue",
      updatedAt: new Date(),
    })
    .where(eq(insuranceQuoteRequests.id, input.id))
    .returning();

  if (row?.userId) {
    await notifyEvent({
      userId: row.userId,
      event: "assurance_offre_disponible",
      vars: {
        reference: row.reference,
        montant: `${input.amount} ${input.currency}`,
      },
      url: "/operations/m-k-a-p-m-s-assurance",
    });
  }
  return row ?? null;
}

export async function setQuoteStatus(id: number, status: string) {
  const [row] = await db
    .update(insuranceQuoteRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(insuranceQuoteRequests.id, id))
    .returning();
  return row ?? null;
}

export async function upsertInsurancePartner(input: {
  id?: number;
  name: string;
  countryCode: string;
  formulas: string[];
  usages: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  status: string;
  note?: string | null;
}) {
  if (input.id) {
    const [row] = await db
      .update(insurancePartners)
      .set({
        name: input.name,
        countryCode: input.countryCode,
        formulas: input.formulas,
        usages: input.usages,
        contactEmail: input.contactEmail ?? null,
        contactPhone: input.contactPhone ?? null,
        status: input.status,
        note: input.note ?? null,
        updatedAt: new Date(),
      })
      .where(eq(insurancePartners.id, input.id))
      .returning();
    return row ?? null;
  }
  const [row] = await db
    .insert(insurancePartners)
    .values({
      name: input.name,
      countryCode: input.countryCode,
      formulas: input.formulas,
      usages: input.usages,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      status: input.status,
      note: input.note ?? null,
    })
    .returning();
  return row;
}

export interface InsuranceHealth {
  status: "ok" | "degraded" | "down";
  message: string;
  metrics: {
    assureursActifs: number;
    demandes: number;
    sansAssureur: number;
    offresRecues: number;
  };
}

/**
 * Santé du moteur. Des demandes sans assureur ne sont pas une panne technique,
 * mais un manque de couverture : c'est signalé en « dégradé » avec la raison,
 * pas masqué derrière un « ok ».
 */
export async function insuranceEngineHealth(): Promise<InsuranceHealth> {
  const [partners] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(insurancePartners)
    .where(eq(insurancePartners.status, "actif"));
  const [total] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(insuranceQuoteRequests);
  const [orphan] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(insuranceQuoteRequests)
    .where(eq(insuranceQuoteRequests.status, "sans_assureur"));
  const [offers] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(insuranceQuoteRequests)
    .where(eq(insuranceQuoteRequests.status, "offre_recue"));

  const metrics = {
    assureursActifs: partners?.n ?? 0,
    demandes: total?.n ?? 0,
    sansAssureur: orphan?.n ?? 0,
    offresRecues: offers?.n ?? 0,
  };

  if (metrics.assureursActifs === 0) {
    return {
      status: "degraded",
      message:
        "Aucun assureur partenaire référencé : les demandes sont enregistrées mais ne peuvent être transmises.",
      metrics,
    };
  }
  if (metrics.sansAssureur > 0) {
    return {
      status: "degraded",
      message: `${metrics.sansAssureur} demande(s) sans assureur couvrant le pays demandé.`,
      metrics,
    };
  }
  return { status: "ok", message: "Demandes dirigées vers les assureurs référencés.", metrics };
}
