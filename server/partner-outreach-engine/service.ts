/**
 * Partner Outreach Engine — service (LOT 1bis du Plan Maître Fournisseurs).
 *
 * Couvre la prospection à froid (P1/P2 de la mission Direction 26/10) :
 * enregistrer un contact approché, suivre sa réponse, le qualifier, et le
 * promouvoir vers `partner-engine` (candidature) ou `supplier-engine` (fiche
 * fournisseur) une fois qualifié — jamais recréer ces moteurs, seulement les
 * nourrir en amont de leur propre entrée.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";
import { emitSafe } from "../event-bus/service.js";
import {
  outreachContacts,
  outreachHealthLog,
  outreachStatusLog,
} from "./schema.js";
import {
  OUTREACH_STATUSES,
  PARTNER_OUTREACH_ENGINE_META,
  type OutreachCapacity,
  type OutreachCategory,
  type OutreachCommercialModel,
  type OutreachContactInput,
  type OutreachStatus,
} from "./contract.js";

export const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_1_minimal";

function reference(): string {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `OUT-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}

async function journaliser(input: {
  outreachContactId: number;
  action: string;
  actorId?: number | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  detail?: Record<string, unknown>;
}) {
  await db.insert(outreachStatusLog).values({
    outreachContactId: input.outreachContactId,
    action: input.action,
    actorId: input.actorId ?? null,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? null,
    detail: input.detail ?? {},
  });
}

/**
 * Enregistre un contact. Idempotent par e-mail (ON CONFLICT côté SQL pour
 * l'import en masse ; ici, vérifie l'existence pour ne jamais dupliquer un
 * contact déjà approché).
 */
export async function enregistrerContact(input: OutreachContactInput, createdBy?: number | null) {
  const email = input.email.trim().toLowerCase();
  const [existant] = await db.select().from(outreachContacts).where(eq(outreachContacts.email, email)).limit(1);
  if (existant) return existant;

  const [row] = await db
    .insert(outreachContacts)
    .values({
      reference: reference(),
      email,
      domain: input.domain ?? email.split("@")[1] ?? null,
      companyName: input.companyName ?? null,
      country: input.country ?? null,
      city: input.city ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      category: input.category ?? null,
      capacities: input.capacities ?? [],
      zonesDesservies: input.zonesDesservies ?? [],
      langues: input.langues ?? [],
      modeleCommercial: input.modeleCommercial ?? null,
      source: input.source ?? "campagne_26_10",
      createdBy: createdBy ?? null,
    })
    .returning();

  await journaliser({ outreachContactId: row.id, action: "contact.cree", actorId: createdBy ?? null, toStatus: row.status });
  await emitSafe({
    source: PARTNER_OUTREACH_ENGINE_META.name,
    type: "outreach.contact_created",
    payload: { outreachContactId: row.id, email: row.email },
  });
  return row;
}

/** Import en masse — chaque ligne passe par enregistrerContact (même garde anti-doublon, jamais de double import silencieux en cas de ré-exécution). */
export async function importerContacts(inputs: OutreachContactInput[], createdBy?: number | null) {
  const resultats = { crees: 0, dejaExistants: 0, total: inputs.length };
  for (const input of inputs) {
    const avant = await db.select({ id: outreachContacts.id }).from(outreachContacts).where(eq(outreachContacts.email, input.email.trim().toLowerCase())).limit(1);
    if (avant.length > 0) {
      resultats.dejaExistants++;
      continue;
    }
    await enregistrerContact(input, createdBy);
    resultats.crees++;
  }
  return resultats;
}

export async function lister(filtres?: { status?: OutreachStatus; category?: OutreachCategory; search?: string }) {
  const conditions = [];
  if (filtres?.status) conditions.push(eq(outreachContacts.status, filtres.status));
  if (filtres?.category) conditions.push(eq(outreachContacts.category, filtres.category));
  const rows = await db
    .select()
    .from(outreachContacts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(outreachContacts.updatedAt));
  if (!filtres?.search) return rows;
  const q = filtres.search.toLowerCase();
  return rows.filter(
    (r) =>
      r.email.toLowerCase().includes(q) ||
      (r.companyName ?? "").toLowerCase().includes(q) ||
      (r.domain ?? "").toLowerCase().includes(q) ||
      (r.country ?? "").toLowerCase().includes(q),
  );
}

export async function obtenir(id: number) {
  const [row] = await db.select().from(outreachContacts).where(eq(outreachContacts.id, id)).limit(1);
  return row ?? null;
}

/**
 * Change le statut avec audit. Aucune transition n'est interdite ici : le
 * funnel n'est pas strictement linéaire (un contact peut revenir de
 * "a_verifier" à "contacte", ou passer directement de "identifie" à
 * "non_livre" si l'e-mail rebondit immédiatement) — seule la décision
 * humaine qui l'actionne est journalisée, jamais devinée.
 */
export async function changerStatut(id: number, toStatus: OutreachStatus, actorId: number, note?: string) {
  const contact = await obtenir(id);
  if (!contact) throw new Error(`Contact outreach #${id} introuvable.`);
  const fromStatus = contact.status as OutreachStatus;
  await db
    .update(outreachContacts)
    .set({ status: toStatus, updatedAt: new Date(), ...(note ? { qualificationNote: note } : {}) })
    .where(eq(outreachContacts.id, id));
  await journaliser({ outreachContactId: id, action: "statut.change", actorId, fromStatus, toStatus, detail: note ? { note } : undefined });
  await emitSafe({
    source: PARTNER_OUTREACH_ENGINE_META.name,
    type: "outreach.status_changed",
    payload: { outreachContactId: id, from: fromStatus, to: toStatus, actorId },
  });
  return obtenir(id);
}

/**
 * Enregistre une réponse réellement reçue (jamais déduite d'un "envoyé").
 * Passe automatiquement le statut à "reponse_recue" sauf si déjà plus avancé
 * dans le funnel (ne fait jamais régresser un contact déjà qualifié/pilote/actif).
 */
export async function enregistrerReponse(id: number, resume: string, actorId: number) {
  const contact = await obtenir(id);
  if (!contact) throw new Error(`Contact outreach #${id} introuvable.`);
  const avance = new Set<OutreachStatus>(["qualifie", "pilote", "actif"]);
  const nouveauStatut: OutreachStatus = avance.has(contact.status as OutreachStatus)
    ? (contact.status as OutreachStatus)
    : "reponse_recue";
  await db
    .update(outreachContacts)
    .set({ responseReceivedAt: new Date(), responseSummary: resume, status: nouveauStatut, updatedAt: new Date() })
    .where(eq(outreachContacts.id, id));
  await journaliser({ outreachContactId: id, action: "reponse.enregistree", actorId, fromStatus: contact.status, toStatus: nouveauStatut, detail: { resume } });
  await emitSafe({ source: PARTNER_OUTREACH_ENGINE_META.name, type: "outreach.response_recorded", payload: { outreachContactId: id } });
  return obtenir(id);
}

/** Enregistre un brouillon de réponse — jamais envoyé automatiquement (règle explicite de la mission). */
export async function enregistrerBrouillonReponse(id: number, texte: string, actorId: number) {
  await db.update(outreachContacts).set({ draftReplyText: texte, updatedAt: new Date() }).where(eq(outreachContacts.id, id));
  await journaliser({ outreachContactId: id, action: "brouillon.enregistre", actorId });
  return obtenir(id);
}

/** Marque une annonce d'envoi — honnête : "envoyé" ne veut pas dire "reçu" (règle explicite de la mission). */
export async function marquerEnvoye(id: number, actorId: number) {
  const contact = await obtenir(id);
  if (!contact) throw new Error(`Contact outreach #${id} introuvable.`);
  const nouveauStatut: OutreachStatus = contact.status === "identifie" ? "contacte" : (contact.status as OutreachStatus);
  await db.update(outreachContacts).set({ emailSentAt: new Date(), status: nouveauStatut, updatedAt: new Date() }).where(eq(outreachContacts.id, id));
  await journaliser({ outreachContactId: id, action: "email.envoye", actorId, fromStatus: contact.status, toStatus: nouveauStatut });
  return obtenir(id);
}

export async function marquerNonLivre(id: number, actorId: number, motif?: string) {
  await db.update(outreachContacts).set({ emailBounced: true, status: "non_livre", updatedAt: new Date() }).where(eq(outreachContacts.id, id));
  await journaliser({ outreachContactId: id, action: "email.non_livre", actorId, toStatus: "non_livre", detail: motif ? { motif } : undefined });
  return obtenir(id);
}

export async function historique(id: number) {
  return db.select().from(outreachStatusLog).where(eq(outreachStatusLog.outreachContactId, id)).orderBy(desc(outreachStatusLog.createdAt));
}

export async function statistiques() {
  const rows = await db
    .select({ status: outreachContacts.status, n: sql<number>`count(*)::int` })
    .from(outreachContacts)
    .groupBy(outreachContacts.status);
  const parStatut: Record<string, number> = {};
  for (const s of OUTREACH_STATUSES) parStatut[s] = 0;
  for (const r of rows) parStatut[r.status] = Number(r.n);
  const [total] = await db.select({ n: sql<number>`count(*)::int` }).from(outreachContacts);
  return { total: Number(total?.n ?? 0), parStatut };
}

export async function healthStatus() {
  const startedAt = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let message: string | undefined;
  let total = 0;
  try {
    const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(outreachContacts);
    total = Number(t?.n ?? 0);
  } catch (e) {
    status = "degraded";
    message = (e as Error).message;
  }
  const row = { status, checkedAt: new Date().toISOString(), message, metrics: { contactsTotal: total, responseMs: Date.now() - startedAt } };
  await db.insert(outreachHealthLog).values({ status, message, metrics: row.metrics }).catch(() => undefined);
  return { engine: PARTNER_OUTREACH_ENGINE_META.name, version: VERSION, ...row };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const h = await healthStatus();
  return {
    engine: PARTNER_OUTREACH_ENGINE_META.name,
    label: PARTNER_OUTREACH_ENGINE_META.label,
    version: VERSION,
    maturityLevel: MATURITY,
    health: h.status,
    load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - startedAt },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(),
    status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const stats = await statistiques();
  const businessMetrics: Record<string, number | string | null> = { contacts_total: stats.total };
  for (const [statut, n] of Object.entries(stats.parStatut)) businessMetrics[`contacts_${statut}`] = n;
  return { ...feed, businessMetrics, recentEvents: [], recentErrors: [] };
}
