/**
 * Order Engine — service (Plan Maître Fournisseurs §36-37, section
 * "COMMANDES"). Portail « Véhicule sur commande » (demande PDG).
 *
 * Reprend le relais du Vehicle Engine (LOT 2) une fois un véhicule publié :
 * ce service ne lit/écrit jamais une table d'un autre moteur, il ne connaît
 * que des entiers libres (vehicleItemId, annonceId, supplierProfileId,
 * customerId, employeeId) passés par l'appelant ou stockés ici.
 */
import { desc, eq, notInArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { emitSafe } from "../event-bus/service.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";
import {
  orderDecisions,
  orderDocuments,
  orderEngineAuditLog,
  orderItems,
  orderStatusHistory,
} from "./schema.js";
import {
  CUSTOMER_ORDER_STATUSES,
  EMPLOYEE_ONLY_DOCUMENT_TYPES,
  INTERNAL_STATUS_TRANSITIONS,
  ORDER_ENGINE_META,
  TERMINAL_INTERNAL_STATUSES,
  type CustomerOrderStatus,
  type InternalOrderStatus,
  type OrderDecision,
  type OrderDocumentType,
  type PublicListingLabel,
} from "./contract.js";

export const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_1_minimal";

export class OrderEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderEngineError";
  }
}

function reference(): string {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MKA-CMD-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}

async function journaliser(input: { orderItemId: number | null; action: string; actorId?: number | null; detail?: Record<string, unknown> }) {
  await db.insert(orderEngineAuditLog).values({
    orderItemId: input.orderItemId,
    action: input.action,
    actorId: input.actorId ?? null,
    detail: input.detail ?? {},
  });
}

async function obtenirCommande(orderItemId: number) {
  const [row] = await db.select().from(orderItems).where(eq(orderItems.id, orderItemId)).limit(1);
  if (!row) throw new OrderEngineError(`Commande ${orderItemId} introuvable.`);
  return row;
}

/**
 * Crée une commande pour un véhicule sur commande déjà publié (vehicleItemId
 * + annonceId existent côté Vehicle Engine — jamais vérifiés ici en lisant
 * ses tables, l'appelant garantit leur validité via le contrat du Vehicle
 * Engine). Statut initial toujours "vehicule_selectionne" : le reste de la
 * progression est explicite, jamais déduit.
 */
export async function creerCommande(input: {
  vehicleItemId: number;
  annonceId: number;
  supplierProfileId: number;
  customerId: number;
  currency?: string;
}) {
  const [row] = await db
    .insert(orderItems)
    .values({
      reference: reference(),
      vehicleItemId: input.vehicleItemId,
      annonceId: input.annonceId,
      supplierProfileId: input.supplierProfileId,
      customerId: input.customerId,
      currency: input.currency ?? "EUR",
      status: "vehicule_selectionne",
    })
    .returning();
  await db.insert(orderStatusHistory).values({
    orderItemId: row.id,
    status: "vehicule_selectionne",
    actorType: "systeme",
    actorId: null,
    note: "Commande créée.",
  });
  await journaliser({ orderItemId: row.id, action: "commande.creee", actorId: input.customerId });
  await emitSafe({
    source: ORDER_ENGINE_META.name,
    type: "commande.creee",
    payload: { orderItemId: row.id, vehicleItemId: input.vehicleItemId, customerId: input.customerId },
  });
  return row;
}

/**
 * Attribution d'un véhicule à un employé (section 7, demande PDG). Un seul
 * employé attribué à la fois ; ré-attribuer remplace explicitement, ne
 * fusionne jamais silencieusement.
 */
export async function attribuerEmploye(input: { orderItemId: number; employeeId: number; actorId: number }) {
  await obtenirCommande(input.orderItemId);
  await db
    .update(orderItems)
    .set({ assignedEmployeeId: input.employeeId, assignedAt: new Date(), assignedBy: input.actorId, updatedAt: new Date() })
    .where(eq(orderItems.id, input.orderItemId));
  await journaliser({ orderItemId: input.orderItemId, action: "commande.employe_attribue", actorId: input.actorId, detail: { employeeId: input.employeeId } });
  await emitSafe({
    source: ORDER_ENGINE_META.name,
    type: "commande.employe_attribue",
    payload: { orderItemId: input.orderItemId, employeeId: input.employeeId, actorId: input.actorId },
  });
}

/**
 * Avance le statut interne (section 8, demande PDG). Rejette toute
 * transition hors de `INTERNAL_STATUS_TRANSITIONS` — jamais un saut d'étape
 * silencieux. "decision_finale" se pose via `poserDecision()`, jamais ici.
 */
export async function avancerStatut(input: {
  orderItemId: number;
  to: InternalOrderStatus;
  actorType: "systeme" | "employe" | "fournisseur" | "client";
  actorId: number | null;
  note?: string;
}) {
  const commande = await obtenirCommande(input.orderItemId);
  const from = commande.status as InternalOrderStatus;
  const allowed = INTERNAL_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(input.to)) {
    throw new OrderEngineError(`Transition refusée : "${from}" → "${input.to}" n'est pas autorisée.`);
  }
  await db.update(orderItems).set({ status: input.to, updatedAt: new Date() }).where(eq(orderItems.id, input.orderItemId));
  await db.insert(orderStatusHistory).values({
    orderItemId: input.orderItemId,
    status: input.to,
    actorType: input.actorType,
    actorId: input.actorId,
    note: input.note,
  });
  await journaliser({ orderItemId: input.orderItemId, action: "commande.statut_change", actorId: input.actorId, detail: { from, to: input.to } });
  await emitSafe({
    source: ORDER_ENGINE_META.name,
    type: "commande.statut_change",
    payload: { orderItemId: input.orderItemId, from, to: input.to, actorId: input.actorId },
  });
  return { from, to: input.to };
}

/**
 * Décision finale après visite/inspection (section 10, demande PDG) :
 * "accepte" | "retourne" | "garde". Toujours posée par un humain (employé).
 */
export async function poserDecision(input: { orderItemId: number; decision: OrderDecision; decidedBy: number; note?: string; returnReference?: string }) {
  const commande = await obtenirCommande(input.orderItemId);
  if (commande.status !== "pret_visite_livraison" && commande.status !== "decision_finale") {
    throw new OrderEngineError(`Décision impossible : la commande n'est pas prête pour une décision (statut actuel "${commande.status}").`);
  }
  if (commande.status === "pret_visite_livraison") {
    await avancerStatut({ orderItemId: input.orderItemId, to: "decision_finale", actorType: "employe", actorId: input.decidedBy, note: "Passage en décision finale." });
  }
  await db
    .insert(orderDecisions)
    .values({ orderItemId: input.orderItemId, decision: input.decision, decidedBy: input.decidedBy, note: input.note, returnReference: input.returnReference })
    .onConflictDoUpdate({
      target: orderDecisions.orderItemId,
      set: { decision: input.decision, decidedBy: input.decidedBy, note: input.note, returnReference: input.returnReference, createdAt: new Date() },
    });
  await journaliser({ orderItemId: input.orderItemId, action: "commande.decision_prise", actorId: input.decidedBy, detail: { decision: input.decision } });
  await emitSafe({
    source: ORDER_ENGINE_META.name,
    type: "commande.decision_prise",
    payload: { orderItemId: input.orderItemId, decision: input.decision, actorId: input.decidedBy },
  });
}

/** Enregistre qu'un document a été généré pour cette commande (section 11). Aucun stockage de fichier ici — voir `orderDocuments` (schema.ts). */
export async function enregistrerDocument(input: { orderItemId: number; documentType: OrderDocumentType; docDocumentId: number; generatedBy?: number }) {
  await obtenirCommande(input.orderItemId);
  const [row] = await db
    .insert(orderDocuments)
    .values({ orderItemId: input.orderItemId, documentType: input.documentType, docDocumentId: input.docDocumentId, generatedBy: input.generatedBy })
    .returning();
  await journaliser({ orderItemId: input.orderItemId, action: "commande.document_genere", actorId: input.generatedBy, detail: { documentType: input.documentType } });
  await emitSafe({
    source: ORDER_ENGINE_META.name,
    type: "commande.document_genere",
    payload: { orderItemId: input.orderItemId, documentType: input.documentType, docDocumentId: input.docDocumentId },
  });
  return row;
}

export async function listerDocuments(orderItemId: number, options?: { employeeView: boolean }) {
  const rows = await db.select().from(orderDocuments).where(eq(orderDocuments.orderItemId, orderItemId)).orderBy(desc(orderDocuments.createdAt));
  if (options?.employeeView) return rows;
  // Vue client (section 6, demande PDG) : jamais les documents internes réservés.
  return rows.filter((r) => !EMPLOYEE_ONLY_DOCUMENT_TYPES.includes(r.documentType as OrderDocumentType));
}

/**
 * Dérive le statut client (section 9, demande PDG) à partir du statut
 * interne — toujours une fonction pure, jamais un second champ stocké qui
 * pourrait diverger de l'historique réel (`orderStatusHistory`).
 */
export function deriveCustomerStatus(internal: InternalOrderStatus, decision?: OrderDecision | null): CustomerOrderStatus {
  switch (internal) {
    case "vehicule_selectionne":
    case "disponibilite_confirmee":
      return "vehicule_reserve";
    case "documents_controles":
    case "prix_marge_valides":
    case "commande_fournisseur_creee":
      return "paiement_recu";
    case "vehicule_en_preparation":
      return "vehicule_en_preparation";
    case "transport_organise":
    case "inspection_realisee":
      return "pret_inspection_livraison";
    case "pret_visite_livraison":
      return "pret_inspection_livraison";
    case "decision_finale":
      if (decision === "accepte") return "vehicule_remis_livre";
      return "solde_valide";
    case "annulee":
      return "annulee";
    case "litige":
      return "litige_en_cours";
    case "remboursee":
      return "rembourse";
    default: {
      const _exhaustive: never = internal;
      return _exhaustive;
    }
  }
}

/**
 * Les deux statuts publics affichés AVANT toute commande (sections 3 et 6,
 * demande PDG). `hasActiveOrder` vient de l'appelant (une requête sur
 * `order_items` filtrée par vehicleItemId, pas un second champ caché ici) ;
 * `vehiclePhysicallyReceived` vient du Vehicle Engine (jamais déduit ici).
 */
export function derivePublicListingLabel(input: { hasActiveOrder: boolean; vehiclePhysicallyReceived: boolean }): PublicListingLabel {
  return input.vehiclePhysicallyReceived || input.hasActiveOrder ? "disponible_sur_visite" : "disponible_sur_commande";
}

export async function obtenirCommandeDetail(orderItemId: number) {
  const commande = await obtenirCommande(orderItemId);
  const historique = await db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderItemId, orderItemId)).orderBy(orderStatusHistory.createdAt);
  const [decision] = await db.select().from(orderDecisions).where(eq(orderDecisions.orderItemId, orderItemId)).limit(1);
  return { commande, historique, decision: decision ?? null };
}

export async function listerCommandesEmploye(employeeId: number) {
  return db.select().from(orderItems).where(eq(orderItems.assignedEmployeeId, employeeId)).orderBy(desc(orderItems.updatedAt));
}

export async function listerCommandesClient(customerId: number) {
  return db.select().from(orderItems).where(eq(orderItems.customerId, customerId)).orderBy(desc(orderItems.updatedAt));
}

export async function journalAudit(orderItemId: number, limit = 200) {
  return db.select().from(orderEngineAuditLog).where(eq(orderEngineAuditLog.orderItemId, orderItemId)).orderBy(desc(orderEngineAuditLog.createdAt)).limit(limit);
}

// ── Health + Dashboard + Feed (standards MOS, règle #13) ────────────────

export async function healthStatus() {
  const startedAt = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let message: string | undefined;
  let total = 0;
  let enCours = 0;
  try {
    const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(orderItems);
    total = Number(t?.n ?? 0);
    const [c] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(orderItems)
      .where(notInArray(orderItems.status, TERMINAL_INTERNAL_STATUSES));
    enCours = Number(c?.n ?? 0);
  } catch (e) {
    status = "degraded";
    message = (e as Error).message;
  }
  return {
    engine: ORDER_ENGINE_META.name,
    version: VERSION,
    status,
    checkedAt: new Date().toISOString(),
    message,
    metrics: { total, enCours, responseMs: Date.now() - startedAt },
  };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const h = await healthStatus();
  return {
    engine: ORDER_ENGINE_META.name,
    label: ORDER_ENGINE_META.label,
    version: VERSION,
    maturityLevel: MATURITY,
    health: h.status,
    load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - startedAt },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(),
    status: "staging",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const parStatut = await db.select({ status: orderItems.status, n: sql<number>`count(*)::int` }).from(orderItems).groupBy(orderItems.status);
  const businessMetrics: Record<string, number | string | null> = {};
  for (const r of parStatut) businessMetrics[`commandes_${r.status}`] = Number(r.n);
  return { ...feed, businessMetrics, recentEvents: [], recentErrors: [] };
}
