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
import { annonces } from "../schema.js";
import { emitSafe } from "../event-bus/service.js";
import { createDocument } from "../document-os/index.js";
import { createPaymentCheckout } from "../payment-engine/checkout.js";
import { openPayoutSchedule } from "../payout-engine/service.js";
import { libererReservation, marquerVendu, reserverVehicule } from "../vehicle-engine/service.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";
import {
  orderDecisions,
  orderDocuments,
  orderEngineAuditLog,
  orderItems,
  orderListings,
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
  type ListingCreationMode,
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
 * Enregistre qu'une annonce déjà publiée (par le Vehicle Engine, mode assisté
 * par IA — OU par le bouton « Manuel », qui réutilise le système de dépôt
 * existant `annonces.create`) est un « véhicule sur commande » lié à un
 * fournisseur. Toujours posé par un employé ; `creationMode` est une
 * traçabilité, jamais une condition : les deux modes produisent exactement
 * la même ligne ici. Une annonce ne peut être liée qu'une seule fois.
 */
export async function enregistrerAnnonceSurCommande(input: {
  annonceId: number;
  supplierProfileId: number;
  vehicleItemId?: number | null;
  creationMode: ListingCreationMode;
  employeeId: number;
}) {
  const existant = await obtenirListingParAnnonce(input.annonceId);
  if (existant) throw new OrderEngineError(`L'annonce ${input.annonceId} est déjà enregistrée comme véhicule sur commande.`);
  const [row] = await db
    .insert(orderListings)
    .values({
      annonceId: input.annonceId,
      supplierProfileId: input.supplierProfileId,
      vehicleItemId: input.vehicleItemId ?? null,
      creationMode: input.creationMode,
      createdByEmployeeId: input.employeeId,
    })
    .returning();
  await journaliser({ orderItemId: null, action: "commande.annonce_liee", actorId: input.employeeId, detail: { annonceId: input.annonceId, creationMode: input.creationMode } });
  await emitSafe({
    source: ORDER_ENGINE_META.name,
    type: "commande.annonce_liee",
    payload: { annonceId: input.annonceId, supplierProfileId: input.supplierProfileId, vehicleItemId: input.vehicleItemId ?? null, creationMode: input.creationMode, employeeId: input.employeeId },
  });
  return row;
}

export async function obtenirListingParAnnonce(annonceId: number) {
  const [row] = await db.select().from(orderListings).where(eq(orderListings.annonceId, annonceId)).limit(1);
  return row ?? null;
}

/**
 * Crée une commande pour un véhicule sur commande déjà publié et lié
 * (`enregistrerAnnonceSurCommande`). `supplierProfileId`/`vehicleItemId` sont
 * TOUJOURS relus depuis `order_listings`, jamais fournis par l'appelant —
 * un client ne doit jamais connaître ni transmettre ces identifiants
 * fournisseur. Statut initial toujours "vehicule_selectionne" : le reste de
 * la progression est explicite, jamais déduit. Une seule commande active à
 * la fois par annonce (un retour peut légitimement en précéder une seconde).
 */
export async function creerCommande(input: { annonceId: number; customerId: number; currency?: string }) {
  const listing = await obtenirListingParAnnonce(input.annonceId);
  if (!listing) throw new OrderEngineError(`L'annonce ${input.annonceId} n'est pas enregistrée comme véhicule sur commande.`);

  const commandesExistantes = await db.select().from(orderItems).where(eq(orderItems.annonceId, input.annonceId));
  if (commandesExistantes.some((c) => !TERMINAL_INTERNAL_STATUSES.includes(c.status as InternalOrderStatus))) {
    throw new OrderEngineError(`Une commande est déjà en cours sur l'annonce ${input.annonceId}.`);
  }

  const [row] = await db
    .insert(orderItems)
    .values({
      reference: reference(),
      vehicleItemId: listing.vehicleItemId,
      annonceId: input.annonceId,
      supplierProfileId: listing.supplierProfileId,
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
    payload: { orderItemId: row.id, vehicleItemId: listing.vehicleItemId, customerId: input.customerId },
  });
  // Cohérence avec le Vehicle Engine (mode assisté par IA) : best-effort,
  // ne doit jamais faire échouer la commande déjà créée côté client.
  if (listing.vehicleItemId) {
    await reserverVehicule({ vehicleItemId: listing.vehicleItemId, reservedBy: input.customerId, actorId: input.customerId }).catch(() => {});
  }
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
 * "accepte" | "retourne" | "garde". Toujours posée par un humain (employé) —
 * jamais une IA, et jamais conditionnée par une IA. Fait elle-même avancer
 * la commande jusqu'à l'issue correspondante (vendue / retour_en_cours /
 * remise_en_stock) dans le même appel — jamais une seconde action humaine
 * séparée pour une seule décision. "garde" remet automatiquement l'annonce
 * en disponibilité (section « décision finale », demande PDG du 21/10) :
 * dans tous les cas sauf "accepte" l'annonce n'a jamais quitté "publiee",
 * donc rien à y remettre.
 *
 * Pour "accepte" : si la commande vient du mode assisté par IA
 * (`vehicleItemId` renseigné), le Vehicle Engine possède déjà sa propre
 * chaîne complète et déjà câblée (vehicule vendu → annonce "vendue" →
 * versement fournisseur réel via l'événement `vehicule.vendu`, voir
 * `server/event-bus/handlers.ts: payout_vehicule_vendu`) — jamais dupliquée
 * ici, sous peine d'un double versement. Sinon (bouton « Manuel », aucun
 * Vehicle Engine impliqué), ce moteur reste seul responsable.
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

  const issue: InternalOrderStatus = input.decision === "accepte" ? "vendue" : input.decision === "retourne" ? "retour_en_cours" : "remise_en_stock";
  await avancerStatut({ orderItemId: input.orderItemId, to: issue, actorType: "employe", actorId: input.decidedBy, note: `Décision « ${input.decision} » appliquée.` });

  if (input.decision === "accepte") {
    if (commande.vehicleItemId) {
      // Mode assisté par IA : délègue entièrement au Vehicle Engine, qui
      // met l'annonce à "vendue" lui-même et déclenche son propre versement.
      await marquerVendu({ vehicleItemId: commande.vehicleItemId, actorId: input.decidedBy });
    } else {
      await db.update(annonces).set({ status: "vendue", updatedAt: new Date() }).where(eq(annonces.id, commande.annonceId));
      // Versement fournisseur réel dans le ledger existant (Payout Engine) —
      // conséquence déterministe de la décision humaine qui vient d'être
      // posée, jamais une action automatique indépendante. Rien à verser si
      // le prix fournisseur n'a jamais été validé (étape "prix_marge_valides"
      // jamais passée, ex. décision prise manuellement hors séquence en test).
      if (commande.supplierPriceConfidential) {
        await openPayoutSchedule({
          sourceType: "vehicle_sale",
          sourceId: input.orderItemId,
          targetType: "supplier",
          supplierProfileId: commande.supplierProfileId,
          grossAmount: Number(commande.supplierPriceConfidential),
          currency: commande.currency,
          commissionRatePct: 0,
        });
      }
    }
  } else if (commande.vehicleItemId) {
    // "retourne" / "garde" : la vente n'a pas eu lieu — la réservation posée
    // par `creerCommande` sur le Vehicle Engine doit être relâchée (best-
    // effort), sans quoi ce véhicule resterait verrouillé "RESERVED" pour
    // toujours, jamais présentable à un autre client (section « décision
    // finale », demande PDG du 21/10).
    await libererReservation({
      vehicleItemId: commande.vehicleItemId,
      reason: input.decision === "retourne" ? "Retour du véhicule au fournisseur." : "Véhicule gardé en stock, remis en disponibilité.",
      actorId: input.decidedBy,
    }).catch(() => {});
  }
}

/**
 * Prix et marge (section 8, étape "Prix et marge validés", demande PDG) —
 * toujours une saisie humaine, jamais recalculée depuis une estimation.
 * `supplierPrice` reste strictement confidentiel (jamais exposé côté
 * client) ; sert plus tard au versement fournisseur réel si la vente est
 * acceptée (`poserDecision`).
 */
export async function validerPrixEtMarge(input: {
  orderItemId: number;
  totalAmount: number;
  depositAmount: number;
  balanceAmount: number;
  supplierPrice: number;
  currency?: string;
  actorId: number;
}) {
  const commande = await obtenirCommande(input.orderItemId);
  const margin = input.totalAmount - input.supplierPrice;
  await db
    .update(orderItems)
    .set({
      totalAmount: String(input.totalAmount),
      depositAmount: String(input.depositAmount),
      balanceAmount: String(input.balanceAmount),
      supplierPriceConfidential: String(input.supplierPrice),
      marginConfidential: String(margin),
      priceMarginValidatedBy: input.actorId,
      priceMarginValidatedAt: new Date(),
      currency: input.currency ?? commande.currency,
      updatedAt: new Date(),
    })
    .where(eq(orderItems.id, input.orderItemId));
  await journaliser({ orderItemId: input.orderItemId, action: "commande.prix_marge_valides", actorId: input.actorId, detail: { totalAmount: input.totalAmount } });
  await avancerStatut({ orderItemId: input.orderItemId, to: "prix_marge_valides", actorType: "employe", actorId: input.actorId, note: "Prix et marge validés." });
  return { totalAmount: input.totalAmount, depositAmount: input.depositAmount, balanceAmount: input.balanceAmount, margin };
}

/**
 * Checkout Stripe réel pour l'acompte/le solde (jamais un second système de
 * paiement) — voir `server/payment-engine/checkout.ts`. Toujours à
 * l'initiative du client ; la confirmation réelle n'arrive que via le
 * webhook Stripe (`confirmerAcompteRecu`/`confirmerSoldeRecu`).
 */
export async function creerCheckoutAcompte(input: { orderItemId: number; customerId: number; successPath: string; cancelPath: string }) {
  const commande = await obtenirCommande(input.orderItemId);
  if (commande.customerId !== input.customerId) throw new OrderEngineError("Accès refusé.");
  if (!commande.depositAmount) throw new OrderEngineError("Aucun montant d'acompte n'a encore été validé pour cette commande.");
  return createPaymentCheckout({
    userId: input.customerId,
    kind: "vehicule_sur_commande_acompte",
    amount: Number(commande.depositAmount),
    currency: commande.currency,
    label: `Acompte — commande ${commande.reference}`,
    metadata: { orderItemId: input.orderItemId },
    successPath: input.successPath,
    cancelPath: input.cancelPath,
  });
}

export async function creerCheckoutSolde(input: { orderItemId: number; customerId: number; successPath: string; cancelPath: string }) {
  const commande = await obtenirCommande(input.orderItemId);
  if (commande.customerId !== input.customerId) throw new OrderEngineError("Accès refusé.");
  if (!commande.balanceAmount) throw new OrderEngineError("Aucun montant de solde n'a encore été validé pour cette commande.");
  return createPaymentCheckout({
    userId: input.customerId,
    kind: "vehicule_sur_commande_solde",
    amount: Number(commande.balanceAmount),
    currency: commande.currency,
    label: `Solde — commande ${commande.reference}`,
    metadata: { orderItemId: input.orderItemId },
    successPath: input.successPath,
    cancelPath: input.cancelPath,
  });
}

/**
 * Confirmation réelle d'un paiement (appelée depuis `stripeWebhook.ts`,
 * jamais directement par le client). Idempotente : un webhook Stripe peut
 * être livré plusieurs fois pour le même événement. N'avance jamais le
 * statut interne elle-même — l'employé reste seul décisionnaire de la suite
 * (règle PDG : aucune action réelle automatique sans décision humaine) ;
 * elle rend seulement le paiement visible dans son tableau de bord.
 */
export async function confirmerAcompteRecu(input: { orderItemId: number; amount: number; currency: string; paymentId: number }): Promise<boolean> {
  const commande = await obtenirCommande(input.orderItemId);
  if (commande.depositPaymentRef) return false;
  await db.update(orderItems).set({ depositPaymentRef: input.paymentId, updatedAt: new Date() }).where(eq(orderItems.id, input.orderItemId));
  await journaliser({ orderItemId: input.orderItemId, action: "commande.acompte_recu", actorId: commande.customerId, detail: { amount: input.amount, currency: input.currency } });
  await emitSafe({ source: ORDER_ENGINE_META.name, type: "commande.acompte_recu", payload: { orderItemId: input.orderItemId, amount: input.amount, currency: input.currency } });
  return true;
}

export async function confirmerSoldeRecu(input: { orderItemId: number; amount: number; currency: string; paymentId: number }): Promise<boolean> {
  const commande = await obtenirCommande(input.orderItemId);
  if (commande.balancePaymentRef) return false;
  await db.update(orderItems).set({ balancePaymentRef: input.paymentId, updatedAt: new Date() }).where(eq(orderItems.id, input.orderItemId));
  await journaliser({ orderItemId: input.orderItemId, action: "commande.solde_recu", actorId: commande.customerId, detail: { amount: input.amount, currency: input.currency } });
  await emitSafe({ source: ORDER_ENGINE_META.name, type: "commande.solde_recu", payload: { orderItemId: input.orderItemId, amount: input.amount, currency: input.currency } });
  return true;
}

/**
 * Correspondance entre un type de document de commande (contrat public,
 * section 11) et le `typeCode` réellement rendu par le Document OS existant
 * — jamais un second registre de templates. `null` = document de référence
 * produit par un autre moteur déjà existant (Carte Grise Engine pour la
 * cession, moteurs comptables pour les pièces comptables) : jamais généré
 * ici, seulement rattaché via `enregistrerDocument()` avec son vrai
 * `docDocumentId`.
 */
const DOCUMENT_TYPE_CODES: Record<OrderDocumentType, string | null> = {
  devis: "devis",
  reservation: "reservation",
  bon_commande: "bon_commande",
  contrat: "contrat_vente",
  recu_acompte: "recu",
  facture_finale: "facture",
  facture_solde: "facture",
  pv_inspection: "proces_verbal",
  pv_remise: "proces_verbal",
  ordre_mission_transporteur: "ordre_mission_transporteur",
  dossier_retour: "dossier_retour",
  document_cession: null,
  garantie: "attestation",
  document_comptable: null,
};

function montantDocument(commande: typeof orderItems.$inferSelect, documentType: OrderDocumentType): number | undefined {
  switch (documentType) {
    case "facture_finale":
      return commande.totalAmount != null ? Number(commande.totalAmount) : undefined;
    case "recu_acompte":
      return commande.depositAmount != null ? Number(commande.depositAmount) : undefined;
    case "facture_solde":
      return commande.balanceAmount != null ? Number(commande.balanceAmount) : undefined;
    default:
      return undefined;
  }
}

/**
 * Génère réellement un document via le Document OS existant et le rattache
 * à la commande — jamais un second système de documents. Pour un type de
 * référence (`document_cession`/`document_comptable`), utilisez
 * `enregistrerDocument()` directement avec le `docDocumentId` réel produit
 * par le moteur propriétaire.
 */
export async function genererDocumentCommande(input: { orderItemId: number; documentType: OrderDocumentType; actorId: number }) {
  const typeCode = DOCUMENT_TYPE_CODES[input.documentType];
  if (!typeCode) {
    throw new OrderEngineError(`"${input.documentType}" est un document de référence produit par un autre moteur — utilisez enregistrerDocument() avec son docDocumentId réel.`);
  }
  const commande = await obtenirCommande(input.orderItemId);
  const amount = montantDocument(commande, input.documentType);
  const doc = await createDocument({
    typeCode,
    ownerUserId: commande.customerId,
    authorUserId: input.actorId,
    linkedEntityType: "order_item",
    linkedEntityId: input.orderItemId,
    amountTtc: amount,
    currency: commande.currency,
  });
  return enregistrerDocument({ orderItemId: input.orderItemId, documentType: input.documentType, docDocumentId: doc.id, generatedBy: input.actorId });
}

/**
 * Remboursement (section 10 : « calcul des frais/remboursements selon
 * contrat ») — toujours une action humaine distincte, jamais déduite d'un
 * changement de statut. Depuis "litige", fait avancer vers "remboursee" ;
 * depuis "retournee" (retour déjà clos), le statut reste "retournee" — le
 * remboursement est alors une information financière additionnelle, jamais
 * une réécriture du sort réel du véhicule.
 */
export async function rembourserCommande(input: { orderItemId: number; amount: number; currency: string; actorId: number; note?: string }) {
  const commande = await obtenirCommande(input.orderItemId);
  if (commande.status === "litige") {
    await avancerStatut({ orderItemId: input.orderItemId, to: "remboursee", actorType: "employe", actorId: input.actorId, note: input.note });
  } else if (commande.status !== "retournee" && commande.status !== "remboursee") {
    throw new OrderEngineError(`Remboursement impossible depuis le statut "${commande.status}".`);
  }
  await journaliser({ orderItemId: input.orderItemId, action: "commande.remboursee", actorId: input.actorId, detail: { amount: input.amount, currency: input.currency } });
  await emitSafe({
    source: ORDER_ENGINE_META.name,
    type: "commande.remboursee",
    payload: { orderItemId: input.orderItemId, amount: input.amount, currency: input.currency },
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
      // Transitoire : `poserDecision()` fait immédiatement avancer vers
      // vendue/retour_en_cours/remise_en_stock dans le même appel — ce cas
      // ne devrait jamais être observé au repos.
      return "solde_valide";
    case "vendue":
      return "vehicule_remis_livre";
    case "retour_en_cours":
    case "retournee":
    case "remise_en_stock":
      // Du point de vue de CE client, sa commande ne va pas plus loin —
      // jamais le vocabulaire interne (retour, remise en stock) exposé.
      return "annulee";
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
 * Les deux statuts publics affichés sur la fiche produit (sections 3 et 6,
 * demande PDG) — toujours dérivés, jamais un 3e champ stocké. Avant
 * "vehicule_en_preparation", le véhicule est encore fondamentalement chez le
 * fournisseur ("disponible sur commande"). À partir de la préparation (le
 * transport/l'inspection sont engagés), ou après une décision "garde" (déjà
 * inspecté, donc réellement présentable), il devient "disponible sur
 * visite". Aucun statut actif → toujours "disponible sur commande".
 */
const STATUTS_PHYSIQUEMENT_PRESENTABLE: InternalOrderStatus[] = [
  "vehicule_en_preparation",
  "transport_organise",
  "inspection_realisee",
  "pret_visite_livraison",
  "decision_finale",
  "remise_en_stock",
];

export function derivePublicListingLabel(internalStatus: InternalOrderStatus | null): PublicListingLabel {
  if (internalStatus && STATUTS_PHYSIQUEMENT_PRESENTABLE.includes(internalStatus)) return "disponible_sur_visite";
  return "disponible_sur_commande";
}

/**
 * Statut public pour une annonce donnée (appelé par `annonces.get`, jamais
 * en lisant directement `order_items` depuis un autre moteur). Prend la
 * commande la plus récente, active ou non — une commande terminale
 * (vendue/retournée/annulée/remboursée) ne doit plus influencer le statut
 * public de l'annonce (sauf "remise_en_stock", intentionnellement présentable).
 */
export async function obtenirLabelPublicParAnnonce(annonceId: number): Promise<PublicListingLabel> {
  const [derniere] = await db
    .select({ status: orderItems.status })
    .from(orderItems)
    .where(eq(orderItems.annonceId, annonceId))
    .orderBy(desc(orderItems.updatedAt))
    .limit(1);
  if (!derniere) return "disponible_sur_commande";
  const status = derniere.status as InternalOrderStatus;
  if (["vendue", "retournee", "annulee", "remboursee"].includes(status)) return "disponible_sur_commande";
  return derivePublicListingLabel(status);
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
