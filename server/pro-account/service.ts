/**
 * MKA.P-MS Pro Account Engine — dossier professionnel avant activation.
 *
 * Règle centrale : l'activation exige DEUX conditions indépendantes —
 * un dossier légal validé et un paiement confirmé. Aucune des deux n'est
 * déduite de l'autre, et aucune n'est supposée vraie.
 *
 * Les exigences (champs et justificatifs) dépendent du pays et du métier :
 * elles proviennent de la base, du Country OS et du catalogue métier, jamais
 * d'une liste figée dans le code de la page.
 */
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { getCountry } from "../country-os/index.js";
import { requirementsFor } from "../pro-portal/service.js";
import { notifyEvent } from "../notification-os/index.js";
import { proAccountApplications, proAccountRules } from "./schema.js";
import type { ProAccountDocument } from "./schema.js";
import { COUNTRY_RULES, FIELD_LABELS } from "./rules.js";

export interface ProAccountRequirements {
  countryCode: string;
  professionCode: string;
  /** Champs du dossier à remplir obligatoirement, avec leur libellé. */
  requiredFields: { key: string; label: string }[];
  /** Justificatifs à fournir (métier + pays + règle locale). */
  requiredDocs: string[];
  /** Libellé local du numéro d'immatriculation (SIREN, RCCM, NIF…). */
  registrationLabel: string;
  /** Le pays dispose-t-il d'un moyen de paiement ? Jamais supposé vrai. */
  paymentReady: boolean;
  notes: string | null;
}

/** Champs exigés partout : sans eux, aucun dossier professionnel n'a de sens. */
const BASE_FIELDS = [
  "contactFirstName",
  "contactLastName",
  "contactEmail",
  "contactPhone",
  "legalName",
  "addressLine",
  "city",
] as const;

/** Amorce des règles pays (idempotent : une règle existante fait autorité). */
export async function seedProAccountRules(): Promise<{ rules: number }> {
  let created = 0;
  for (const r of COUNTRY_RULES) {
    const [existing] = await db
      .select({ id: proAccountRules.id })
      .from(proAccountRules)
      .where(
        and(
          eq(proAccountRules.countryCode, r.countryCode),
          r.professionCode
            ? eq(proAccountRules.professionCode, r.professionCode)
            : isNull(proAccountRules.professionCode),
        ),
      );
    if (existing) continue;
    await db.insert(proAccountRules).values({
      countryCode: r.countryCode,
      professionCode: r.professionCode ?? null,
      requiredFields: r.requiredFields,
      requiredDocs: r.requiredDocs,
      registrationLabel: r.registrationLabel,
      notes: r.notes ?? null,
    });
    created += 1;
  }
  return { rules: created };
}

/**
 * Exigences réelles pour un couple pays/métier : règle pays, règle
 * pays+métier, justificatifs du métier et documents imposés par le pays.
 */
export async function requirementsForAccount(
  professionCode: string,
  countryCode: string,
): Promise<ProAccountRequirements> {
  const code = countryCode.toUpperCase();
  const rules = await db
    .select()
    .from(proAccountRules)
    .where(
      and(
        eq(proAccountRules.countryCode, code),
        eq(proAccountRules.active, true),
        or(isNull(proAccountRules.professionCode), eq(proAccountRules.professionCode, professionCode))!,
      ),
    );

  const fields = new Set<string>(BASE_FIELDS);
  const docs = new Set<string>();
  let registrationLabel = "Numéro d'immatriculation de l'entreprise";
  let notes: string | null = null;

  for (const r of rules) {
    for (const f of r.requiredFields ?? []) fields.add(f);
    for (const d of r.requiredDocs ?? []) docs.add(d);
    // La règle la plus spécifique (métier) l'emporte sur la règle pays.
    if (r.registrationLabel && (r.professionCode || registrationLabel === "Numéro d'immatriculation de l'entreprise")) {
      registrationLabel = r.registrationLabel;
    }
    if (r.notes) notes = r.notes;
  }

  // Justificatifs déjà déclarés par le métier et par le Country OS.
  for (const d of await requirementsFor(professionCode, code)) docs.add(d);

  const pays = await getCountry(code);

  return {
    countryCode: code,
    professionCode,
    requiredFields: Array.from(fields).map((key) => ({ key, label: FIELD_LABELS[key] ?? key })),
    requiredDocs: Array.from(docs),
    registrationLabel,
    paymentReady: (pays?.paymentMethods ?? []).length > 0,
    notes,
  };
}

type ApplicationRow = typeof proAccountApplications.$inferSelect;

export async function myApplication(userId: number): Promise<ApplicationRow | null> {
  const [row] = await db
    .select()
    .from(proAccountApplications)
    .where(eq(proAccountApplications.userId, userId))
    .orderBy(desc(proAccountApplications.updatedAt))
    .limit(1);
  return row ?? null;
}

export interface SaveApplicationInput {
  userId: number;
  sessionKey?: string | null;
  professionCode: string;
  countryCode: string;
  moduleCodes?: string[];
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  legalName?: string | null;
  legalForm?: string | null;
  registrationNumber?: string | null;
  vatNumber?: string | null;
  addressLine?: string | null;
  city?: string | null;
  postalCode?: string | null;
  website?: string | null;
  documents?: ProAccountDocument[];
  termsAccepted?: boolean;
}

/**
 * Enregistre le dossier sans le soumettre. Un dossier déjà validé ou actif
 * n'est jamais réécrit en silence par le formulaire.
 */
export async function saveApplication(input: SaveApplicationInput): Promise<ApplicationRow> {
  const existing = await myApplication(input.userId);
  if (existing && ["valide", "actif"].includes(existing.status)) return existing;

  const values = {
    userId: input.userId,
    sessionKey: input.sessionKey ?? existing?.sessionKey ?? null,
    professionCode: input.professionCode,
    countryCode: input.countryCode.toUpperCase(),
    moduleCodes: input.moduleCodes ?? existing?.moduleCodes ?? [],
    contactFirstName: input.contactFirstName ?? null,
    contactLastName: input.contactLastName ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    legalName: input.legalName ?? null,
    legalForm: input.legalForm ?? null,
    registrationNumber: input.registrationNumber ?? null,
    vatNumber: input.vatNumber ?? null,
    addressLine: input.addressLine ?? null,
    city: input.city ?? null,
    postalCode: input.postalCode ?? null,
    website: input.website ?? null,
    documents: input.documents ?? existing?.documents ?? [],
    termsAcceptedAt: input.termsAccepted ? new Date() : (existing?.termsAcceptedAt ?? null),
    updatedAt: new Date(),
  };

  if (existing) {
    const [row] = await db
      .update(proAccountApplications)
      .set(values)
      .where(eq(proAccountApplications.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db.insert(proAccountApplications).values(values).returning();
  return row;
}

export interface CompletenessReport {
  complete: boolean;
  missingFields: { key: string; label: string }[];
  missingDocs: string[];
  termsAccepted: boolean;
}

/** Contrôle du dossier au regard des exigences pays + métier. */
export async function checkCompleteness(application: ApplicationRow): Promise<CompletenessReport> {
  const req = await requirementsForAccount(application.professionCode, application.countryCode);
  const record = application as unknown as Record<string, unknown>;

  const missingFields = req.requiredFields.filter(({ key }) => {
    const value = record[key];
    return typeof value !== "string" || value.trim() === "";
  });

  const fournis = new Set(
    (application.documents ?? []).filter((d) => d.status === "fourni").map((d) => d.label),
  );
  const missingDocs = req.requiredDocs.filter((d) => !fournis.has(d));
  const termsAccepted = !!application.termsAcceptedAt;

  return {
    complete: missingFields.length === 0 && missingDocs.length === 0 && termsAccepted,
    missingFields,
    missingDocs,
    termsAccepted,
  };
}

/**
 * Soumet le dossier à vérification. Un dossier incomplet n'est PAS soumis :
 * on retourne précisément ce qui manque plutôt qu'un faux « en cours ».
 */
export async function submitApplication(userId: number): Promise<
  { ok: true; status: string; report: CompletenessReport } | { ok: false; report: CompletenessReport }
> {
  const application = await myApplication(userId);
  if (!application) throw new Error("Aucun dossier professionnel à soumettre.");

  const report = await checkCompleteness(application);
  if (!report.complete) return { ok: false, report };

  await db
    .update(proAccountApplications)
    .set({ status: "en_verification", submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(proAccountApplications.id, application.id));

  await notifyEvent({
    userId,
    event: "pro_dossier_recu",
    vars: { metier: application.professionCode, pays: application.countryCode },
    url: "/pro/dossier",
  }).catch(() => {});

  return { ok: true, status: "en_verification", report };
}

/** Décision humaine sur un dossier. L'activation reste séparée du paiement. */
export async function reviewApplication(input: {
  applicationId: number;
  reviewerId: number;
  decision: "valide" | "refuse" | "complement_requis";
  note?: string;
}): Promise<ApplicationRow> {
  const [row] = await db
    .update(proAccountApplications)
    .set({
      status: input.decision,
      reviewNote: input.note ?? null,
      reviewedBy: input.reviewerId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(proAccountApplications.id, input.applicationId))
    .returning();

  if (row) {
    await notifyEvent({
      userId: row.userId,
      event: "pro_dossier_decision",
      vars: {
        decision:
          input.decision === "valide"
            ? "validé"
            : input.decision === "refuse"
              ? "refusé"
              : "complément demandé",
        note: input.note ?? "Consultez votre dossier professionnel pour le détail.",
      },
      url: "/pro/dossier",
    }).catch(() => {});
  }
  return row;
}

/** Enregistre l'état de paiement du dossier, sans jamais l'inventer. */
export async function setPaymentStatus(input: {
  applicationId: number;
  paymentStatus: "non_requis" | "en_attente" | "confirme";
  paymentReference?: string | null;
}): Promise<ApplicationRow> {
  const [row] = await db
    .update(proAccountApplications)
    .set({
      paymentStatus: input.paymentStatus,
      paymentReference: input.paymentReference ?? null,
      updatedAt: new Date(),
    })
    .where(eq(proAccountApplications.id, input.applicationId))
    .returning();
  return row;
}

export interface ActivationResult {
  activated: boolean;
  /** Ce qui empêche encore l'activation. Vide seulement si tout est réuni. */
  blockers: string[];
  status: string;
}

/**
 * Active le compte professionnel — uniquement si dossier validé ET paiement
 * réglé (ou explicitement non requis). Sinon, on dit pourquoi.
 */
export async function activateAccount(applicationId: number): Promise<ActivationResult> {
  const [application] = await db
    .select()
    .from(proAccountApplications)
    .where(eq(proAccountApplications.id, applicationId));
  if (!application) throw new Error("Dossier introuvable.");

  const blockers: string[] = [];
  if (application.status !== "valide") blockers.push("Dossier légal non validé.");
  if (application.paymentStatus === "en_attente") blockers.push("Paiement non confirmé.");

  const report = await checkCompleteness(application);
  if (!report.complete) {
    for (const f of report.missingFields) blockers.push(`Information manquante : ${f.label}`);
    for (const d of report.missingDocs) blockers.push(`Justificatif manquant : ${d}`);
    if (!report.termsAccepted) blockers.push("Conditions non acceptées.");
  }

  if (blockers.length > 0) return { activated: false, blockers, status: application.status };

  await db
    .update(proAccountApplications)
    .set({ status: "actif", activatedAt: new Date(), updatedAt: new Date() })
    .where(eq(proAccountApplications.id, applicationId));

  await notifyEvent({
    userId: application.userId,
    event: "pro_compte_active",
    url: "/pro/dossier",
  }).catch(() => {});

  return { activated: true, blockers: [], status: "actif" };
}

export async function listApplications(status?: string) {
  const q = db.select().from(proAccountApplications);
  const rows = status
    ? await q.where(eq(proAccountApplications.status, status)).orderBy(desc(proAccountApplications.updatedAt)).limit(200)
    : await q.orderBy(desc(proAccountApplications.updatedAt)).limit(200);
  return rows;
}

/** Santé du moteur : sans règles pays, aucun dossier ne peut être contrôlé. */
export async function proAccountHealth(): Promise<{
  health: "ok" | "degraded" | "down";
  rules: number;
  applications: number;
  enAttenteVerification: number;
  details: string[];
}> {
  const details: string[] = [];
  try {
    const [rules] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(proAccountRules)
      .where(eq(proAccountRules.active, true));
    const [apps] = await db.select({ n: sql<number>`count(*)::int` }).from(proAccountApplications);
    const [waiting] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(proAccountApplications)
      .where(eq(proAccountApplications.status, "en_verification"));

    const nbRules = rules?.n ?? 0;
    if (nbRules === 0) details.push("aucune règle pays active : les dossiers ne peuvent pas être contrôlés");

    return {
      // La charge de travail (dossiers à vérifier) n'est PAS un défaut de santé.
      health: nbRules === 0 ? "degraded" : "ok",
      rules: nbRules,
      applications: apps?.n ?? 0,
      enAttenteVerification: waiting?.n ?? 0,
      details,
    };
  } catch (err) {
    return {
      health: "down",
      rules: 0,
      applications: 0,
      enAttenteVerification: 0,
      details: [(err as Error).message],
    };
  }
}
