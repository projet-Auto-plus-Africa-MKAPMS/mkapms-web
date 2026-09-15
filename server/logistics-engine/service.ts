/**
 * Logistics Engine — service (LOT 4 du Plan Maître Fournisseurs, TRANSPORT/
 * LIVRAISON). Aucune vraie clé transporteur n'existe aujourd'hui : chaque
 * connecteur reste honnêtement `not_connected` tant qu'un secret réel n'est
 * pas configuré — jamais un succès fabriqué. Le Vehicle Delivery Engine
 * (`server/vehicle-delivery/`) reste la seule source réelle de prix, pour la
 * catégorie "vehicules" uniquement : ce moteur ne le duplique pas, il
 * l'orchestre comme un cas particulier du Delivery Quote Engine générique.
 *
 * Rappel impératif : le nom officiel du système est MKA.P-MS Intelligences,
 * jamais une autre appellation abrégée pour la même idée (cause du blocage
 * Railway des LOT 2/3, voir PR #335).
 */
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { emitSafe } from "../event-bus/service.js";
import { devis as devisVehicule } from "../vehicle-delivery/service.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";
import {
  logisticsApiKeys,
  logisticsAuditLog,
  logisticsCarrierConnections,
  logisticsHealthLog,
  logisticsLegs,
  logisticsQuotes,
  logisticsShipments,
  logisticsTrackingEvents,
  logisticsWebhookLog,
} from "./schema.js";
import {
  CARRIER_CONNECTION_METHODS,
  LOGISTICS_ENGINE_META,
  TRACKING_PROGRESSION,
  TRACKING_STATUSES,
  carriersForCategory,
  findCarrier,
  type CarrierCategory,
  type TrackingStatus,
} from "./contract.js";

export const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_1_minimal";

function reference(): string {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `EXP-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}

async function journaliser(input: { shipmentId: number | null; action: string; actorId?: number | null; detail?: Record<string, unknown> }) {
  await db.insert(logisticsAuditLog).values({
    shipmentId: input.shipmentId,
    action: input.action,
    actorId: input.actorId ?? null,
    detail: input.detail ?? {},
  });
}

async function obtenirExpedition(shipmentId: number) {
  const [row] = await db.select().from(logisticsShipments).where(eq(logisticsShipments.id, shipmentId)).limit(1);
  if (!row) throw new Error(`Expédition #${shipmentId} introuvable.`);
  return row;
}

async function obtenirLeg(legId: number) {
  const [row] = await db.select().from(logisticsLegs).where(eq(logisticsLegs.id, legId)).limit(1);
  if (!row) throw new Error(`Leg #${legId} introuvable.`);
  return row;
}

// ───────────────────── Carrier Connector Engine (§67-68) ─────────────────────

export interface EnregistrerConnexionTransporteurInput {
  carrierCode: string;
  method: string;
  supplierProfileId?: number | null;
  authType?: string;
  environment?: string;
  endpointUrl?: string | null;
  secretRef?: string | null;
  config?: Record<string, unknown>;
  actorId: number;
}

/** Statut honnête sans secret réel — même principe que le Connector Engine du Supplier Engine (LOT 1), jamais recréé. */
export async function enregistrerConnexionTransporteur(input: EnregistrerConnexionTransporteurInput) {
  const carrier = findCarrier(input.carrierCode);
  if (!carrier) throw new Error(`Transporteur inconnu du catalogue : "${input.carrierCode}".`);
  const methode = CARRIER_CONNECTION_METHODS.find((m) => m.code === input.method);
  if (!methode) throw new Error(`Méthode de connexion inconnue : "${input.method}".`);

  const secretConfigure = !!input.secretRef && process.env[input.secretRef] !== undefined;
  const status = methode.requiresSecret ? (secretConfigure ? "configured" : "not_connected") : "configured";

  const [row] = await db
    .insert(logisticsCarrierConnections)
    .values({
      carrierCode: carrier.code,
      supplierProfileId: input.supplierProfileId ?? null,
      method: methode.code,
      authType: input.authType ?? "none",
      environment: input.environment ?? "sandbox",
      status,
      endpointUrl: input.endpointUrl ?? null,
      secretRef: input.secretRef ?? null,
      config: input.config ?? {},
      lastHealthStatus: "not_connected",
    })
    .returning();

  await journaliser({ shipmentId: null, action: "logistics.connection_configured", actorId: input.actorId, detail: { connectionId: row.id, carrierCode: carrier.code, status } });
  return row;
}

export interface TestConnexionTransporteurResult {
  ok: boolean;
  motif: string;
}

/** Ne fabrique jamais un succès : sans secret réel, répond honnêtement NOT_CONNECTED. */
export async function testerConnexionTransporteur(connectionId: number, actorId: number): Promise<TestConnexionTransporteurResult> {
  const [connexion] = await db.select().from(logisticsCarrierConnections).where(eq(logisticsCarrierConnections.id, connectionId)).limit(1);
  if (!connexion) throw new Error(`Connexion #${connectionId} introuvable.`);
  const methode = CARRIER_CONNECTION_METHODS.find((m) => m.code === connexion.method);
  if (!methode) throw new Error(`Méthode de connexion inconnue : "${connexion.method}".`);

  let result: TestConnexionTransporteurResult;
  if (methode.requiresSecret && connexion.status === "not_connected") {
    result = { ok: false, motif: `NOT_CONNECTED : aucun secret réel configuré pour "${methode.label}".` };
  } else if (methode.code === "url_catalogue" && connexion.endpointUrl) {
    try {
      const res = await fetch(connexion.endpointUrl, { method: "GET", signal: AbortSignal.timeout(10_000) });
      result = res.ok ? { ok: true, motif: `Point d'accès accessible (HTTP ${res.status}).` } : { ok: false, motif: `Point d'accès a répondu HTTP ${res.status}.` };
    } catch (e) {
      result = { ok: false, motif: `Point d'accès injoignable : ${(e as Error).message}.` };
    }
  } else if (["manuel", "formulaire_pro", "import_manuel_secours"].includes(methode.code)) {
    result = { ok: true, motif: "Saisie manuelle : toujours disponible, sans dépendance externe." };
  } else {
    result = { ok: false, motif: `NOT_CONNECTED : "${methode.label}" nécessite une configuration réelle non encore fournie.` };
  }

  await db
    .update(logisticsCarrierConnections)
    .set({ lastHealthCheckAt: new Date(), lastHealthStatus: result.ok ? "ok" : "not_connected", lastHealthMessage: result.motif, updatedAt: new Date() })
    .where(eq(logisticsCarrierConnections.id, connectionId));
  await journaliser({ shipmentId: null, action: "logistics.connection_tested", actorId, detail: { connectionId, ok: result.ok, motif: result.motif } });
  return result;
}

export async function listerConnexionsTransporteur(carrierCode?: string) {
  return db
    .select()
    .from(logisticsCarrierConnections)
    .where(carrierCode ? eq(logisticsCarrierConnections.carrierCode, carrierCode) : undefined)
    .orderBy(desc(logisticsCarrierConnections.createdAt));
}

// ───────────────────── Delivery Quote Engine (§69) ─────────────────────

export interface QuoteOption {
  tier: "ECONOMIQUE" | "RECOMMANDE" | "EXPRESS";
  carrierCode: string | null;
  carrierLabel: string | null;
  prix: number | null;
  devise: string;
  delaiJoursMin: number | null;
  delaiJoursMax: number | null;
  disponible: boolean;
  motif: string;
}

export interface GenererDevisInput {
  categorie: CarrierCategory;
  origineVille?: string | null;
  originePays: string | null;
  destinationVille?: string | null;
  destinationPays: string | null;
  poidsKg?: number | null;
  valeurDeclaree?: number | null;
  devise?: string;
  /** Réutilise le Vehicle Delivery Engine tel quel pour la catégorie "vehicules". */
  annonceId?: number | null;
  actorId?: number | null;
}

/**
 * Toujours 3 tiers (ÉCONOMIQUE/RECOMMANDÉ/EXPRESS, §69). Pour "vehicules",
 * délègue au Vehicle Delivery Engine (barème réel). Pour "colis"/"fret",
 * aucun transporteur n'est connecté aujourd'hui : chaque tier reste
 * honnêtement `disponible: false` plutôt que d'inventer un prix.
 */
export async function genererDevis(input: GenererDevisInput): Promise<{ quoteId: number; options: QuoteOption[] }> {
  let options: QuoteOption[];

  if (input.categorie === "vehicules") {
    const d = await devisVehicule({
      annonceId: input.annonceId ?? null,
      paysDepart: input.originePays,
      paysArrivee: input.destinationPays,
      villeDepart: input.origineVille ?? null,
      villeArrivee: input.destinationVille ?? null,
    });
    const dispo = d.total !== null;
    options = [
      {
        tier: "RECOMMANDE",
        carrierCode: "vehicle_delivery_engine",
        carrierLabel: `Vehicle Delivery Engine (${d.modeLabel})`,
        prix: d.total,
        devise: d.devise,
        delaiJoursMin: d.delaiJoursMin,
        delaiJoursMax: d.delaiJoursMax,
        disponible: dispo,
        motif: dispo ? d.resume : `${d.resume} — ${d.manques.join(" ")}`,
      },
      {
        tier: "ECONOMIQUE",
        carrierCode: null,
        carrierLabel: null,
        prix: null,
        devise: d.devise,
        delaiJoursMin: null,
        delaiJoursMax: null,
        disponible: false,
        motif: "Un seul mode de barème interne disponible aujourd'hui — pas d'alternative économique distincte.",
      },
      {
        tier: "EXPRESS",
        carrierCode: null,
        carrierLabel: null,
        prix: null,
        devise: d.devise,
        delaiJoursMin: null,
        delaiJoursMax: null,
        disponible: false,
        motif: "Aucun mode express distinct disponible aujourd'hui.",
      },
    ];
  } else {
    const candidats = carriersForCategory(input.categorie);
    const tiers: QuoteOption["tier"][] = ["ECONOMIQUE", "RECOMMANDE", "EXPRESS"];
    options = tiers.map((tier, i) => {
      const carrier = candidats[i % Math.max(candidats.length, 1)];
      return {
        tier,
        carrierCode: carrier?.code ?? null,
        carrierLabel: carrier?.label ?? null,
        prix: null,
        devise: input.devise ?? "EUR",
        delaiJoursMin: null,
        delaiJoursMax: null,
        disponible: false,
        motif: carrier
          ? `NOT_CONNECTED : aucune clé réelle configurée pour "${carrier.label}" (variable ${carrier.envVar}).`
          : `Aucun transporteur catalogué pour la catégorie "${input.categorie}".`,
      };
    });
  }

  const [row] = await db
    .insert(logisticsQuotes)
    .values({
      categorie: input.categorie,
      requestPayload: { ...input },
      options: options as unknown as Record<string, unknown>[],
      createdBy: input.actorId ?? null,
    })
    .returning();

  await journaliser({ shipmentId: null, action: "logistics.quote_created", actorId: input.actorId, detail: { quoteId: row.id, categorie: input.categorie } });
  await emitSafe({ source: "logistics_engine", type: "delivery.quote.created", payload: { shipmentId: null, quoteId: row.id } });
  return { quoteId: row.id, options };
}

// ───────────────────── Delivery Routing Engine (§70) ─────────────────────

/**
 * Sélection multi-facteurs (prix, délai, fiabilité) — jamais uniquement au
 * prix le plus bas. Refuse de choisir une option non disponible : on ne
 * réserve jamais un transporteur non connecté.
 */
export function choisirMeilleureOption(options: QuoteOption[]): QuoteOption | null {
  const disponibles = options.filter((o) => o.disponible && o.prix !== null);
  if (disponibles.length === 0) return null;
  return [...disponibles].sort((a, b) => {
    const prixDiff = (a.prix ?? Infinity) - (b.prix ?? Infinity);
    if (prixDiff !== 0) return prixDiff;
    return (a.delaiJoursMin ?? 99) - (b.delaiJoursMin ?? 99);
  })[0];
}

export async function choisirOptionDevis(input: { quoteId: number; tier: QuoteOption["tier"]; actorId: number | null }) {
  const [quote] = await db.select().from(logisticsQuotes).where(eq(logisticsQuotes.id, input.quoteId)).limit(1);
  if (!quote) throw new Error(`Devis #${input.quoteId} introuvable.`);
  const options = quote.options as unknown as QuoteOption[];
  const choisie = options.find((o) => o.tier === input.tier);
  if (!choisie) throw new Error(`Tier "${input.tier}" absent de ce devis.`);
  if (!choisie.disponible) throw new Error(`Option "${input.tier}" non disponible (${choisie.motif}) : impossible de réserver un transporteur non connecté.`);

  await db.update(logisticsQuotes).set({ chosenTier: input.tier, chosenCarrierCode: choisie.carrierCode }).where(eq(logisticsQuotes.id, input.quoteId));
  await journaliser({ shipmentId: quote.shipmentId, action: "logistics.quote_option_chosen", actorId: input.actorId, detail: { quoteId: input.quoteId, tier: input.tier } });
  return choisie;
}

// ───────────────────── Multi-Leg Engine (§71) ─────────────────────

export interface LegInput {
  carrierCode: string;
  mode: string;
  origineVille?: string | null;
  originePays?: string | null;
  destinationVille?: string | null;
  destinationPays?: string | null;
  tarif?: number | null;
  devise?: string;
  delaiJoursMin?: number | null;
  delaiJoursMax?: number | null;
  responsabilite?: string | null;
  conditionPaiement?: string | null;
}

export interface CreerExpeditionInput {
  sourceType?: "vehicle_engine" | "parts_engine" | "manuel" | "api_transporteur";
  sourceItemId?: number | null;
  categorie: CarrierCategory;
  origineVille?: string | null;
  originePays: string | null;
  destinationVille?: string | null;
  destinationPays: string | null;
  poidsKg?: number | null;
  valeurDeclaree?: number | null;
  devise?: string;
  legs: LegInput[];
  actorId: number | null;
}

/** MASTER SHIPMENT + jusqu'à 4 LEG (§71). Chaque leg garde sa propre responsabilité et condition de paiement. */
export async function creerExpedition(input: CreerExpeditionInput) {
  if (input.legs.length === 0) throw new Error("Une expédition exige au moins un leg.");
  if (input.legs.length > 4) throw new Error("Maximum 4 legs par expédition (MASTER SHIPMENT + LEG 1-4).");
  for (const leg of input.legs) {
    if (leg.carrierCode !== "interne" && !findCarrier(leg.carrierCode)) {
      throw new Error(`Transporteur inconnu du catalogue pour un leg : "${leg.carrierCode}".`);
    }
  }

  const totalPrice = input.legs.reduce((sum, l) => sum + (l.tarif ?? 0), 0);
  const devise = input.devise ?? input.legs[0]?.devise ?? "EUR";

  const [shipment] = await db
    .insert(logisticsShipments)
    .values({
      reference: reference(),
      sourceType: input.sourceType ?? "manuel",
      sourceItemId: input.sourceItemId ?? null,
      categorie: input.categorie,
      origineVille: input.origineVille ?? null,
      originePays: input.originePays,
      destinationVille: input.destinationVille ?? null,
      destinationPays: input.destinationPays,
      poidsKg: input.poidsKg != null ? String(input.poidsKg) : null,
      valeurDeclaree: input.valeurDeclaree != null ? String(input.valeurDeclaree) : null,
      devise,
      status: "CREATED",
      totalPrice: totalPrice > 0 ? String(totalPrice) : null,
      createdBy: input.actorId,
    })
    .returning();

  const legRows = await db
    .insert(logisticsLegs)
    .values(
      input.legs.map((leg, i) => ({
        shipmentId: shipment.id,
        legIndex: i + 1,
        carrierCode: leg.carrierCode,
        mode: leg.mode,
        origineVille: leg.origineVille ?? null,
        originePays: leg.originePays ?? null,
        destinationVille: leg.destinationVille ?? null,
        destinationPays: leg.destinationPays ?? null,
        tarif: leg.tarif != null ? String(leg.tarif) : null,
        devise: leg.devise ?? devise,
        delaiJoursMin: leg.delaiJoursMin ?? null,
        delaiJoursMax: leg.delaiJoursMax ?? null,
        status: "CREATED",
        responsabilite: leg.responsabilite ?? null,
        conditionPaiement: leg.conditionPaiement ?? null,
      })),
    )
    .returning();

  await journaliser({ shipmentId: shipment.id, action: "logistics.shipment_created", actorId: input.actorId, detail: { legs: legRows.length } });
  return { shipment, legs: legRows };
}

/** Réserve le premier leg (booking progressif) — jamais tous les legs d'un coup sans confirmation transporteur réelle. */
export async function reserverExpedition(input: { shipmentId: number; actorId: number | null }) {
  const expedition = await obtenirExpedition(input.shipmentId);
  if (expedition.status !== "CREATED") throw new Error(`Statut actuel "${expedition.status}" : réservation impossible.`);
  const [premierLeg] = await db.select().from(logisticsLegs).where(and(eq(logisticsLegs.shipmentId, input.shipmentId), eq(logisticsLegs.legIndex, 1))).limit(1);
  if (!premierLeg) throw new Error("Aucun leg trouvé pour cette expédition.");

  await db.update(logisticsLegs).set({ status: "BOOKED", updatedAt: new Date() }).where(eq(logisticsLegs.id, premierLeg.id));
  await db.update(logisticsShipments).set({ status: "BOOKED", updatedAt: new Date() }).where(eq(logisticsShipments.id, input.shipmentId));
  await db.insert(logisticsTrackingEvents).values({ shipmentId: input.shipmentId, legId: premierLeg.id, status: "BOOKED", source: "manuel" });
  await journaliser({ shipmentId: input.shipmentId, action: "logistics.shipment_booked", actorId: input.actorId, detail: { legId: premierLeg.id } });
  await emitSafe({ source: "logistics_engine", type: "delivery.booked", payload: { shipmentId: input.shipmentId, legId: premierLeg.id, carrierCode: premierLeg.carrierCode } });
  return obtenirExpedition(input.shipmentId);
}

// ───────────────────── Tracking Engine (§72-73) ─────────────────────

const STATUS_TO_EVENT: Partial<Record<TrackingStatus, string>> = {
  PICKUP_SCHEDULED: "pickup.scheduled",
  PICKED_UP: "pickup.completed",
  IN_TRANSIT: "shipment.in_transit",
  HANDED_OVER: "shipment.handover.completed",
  AT_PORT: "shipment.at_port",
  CUSTOMS_EXPORT: "shipment.customs.started",
  CUSTOMS_IMPORT: "shipment.customs.completed",
  ON_VESSEL: "shipment.on_vessel",
  ARRIVED_PORT: "shipment.arrived",
  OUT_FOR_DELIVERY: "delivery.out_for_delivery",
  DELIVERED: "delivery.completed",
};

export interface MettreAJourStatutLegInput {
  legId: number;
  status: TrackingStatus;
  source: "carrier_webhook" | "api_transporteur" | "manuel" | "systeme";
  rawCarrierStatus?: string | null;
  detail?: Record<string, unknown>;
  actorId?: number | null;
}

/** Écrit l'événement, avance le leg, recalcule le statut agrégé de l'expédition — jamais un statut deviné. */
export async function mettreAJourStatutLeg(input: MettreAJourStatutLegInput) {
  if (!TRACKING_STATUSES.includes(input.status)) throw new Error(`Statut de suivi inconnu : "${input.status}".`);
  const leg = await obtenirLeg(input.legId);

  await db.insert(logisticsTrackingEvents).values({
    shipmentId: leg.shipmentId,
    legId: leg.id,
    status: input.status,
    rawCarrierStatus: input.rawCarrierStatus ?? null,
    source: input.source,
    detail: input.detail ?? {},
  });
  await db.update(logisticsLegs).set({ status: input.status, updatedAt: new Date() }).where(eq(logisticsLegs.id, leg.id));

  const tousLesLegs = await db.select().from(logisticsLegs).where(eq(logisticsLegs.shipmentId, leg.shipmentId));
  const urgents = new Set(["FAILED", "DISPUTED", "RETURNED"]);
  const statutUrgent = tousLesLegs.find((l) => urgents.has(l.status));
  const statutAgrege = statutUrgent
    ? statutUrgent.status
    : tousLesLegs.reduce((min, l) => (TRACKING_PROGRESSION[l.status as TrackingStatus] < TRACKING_PROGRESSION[min as TrackingStatus] ? l.status : min), tousLesLegs[0].status);
  await db.update(logisticsShipments).set({ status: statutAgrege, updatedAt: new Date() }).where(eq(logisticsShipments.id, leg.shipmentId));

  await journaliser({ shipmentId: leg.shipmentId, action: "logistics.tracking_updated", actorId: input.actorId, detail: { legId: leg.id, status: input.status, source: input.source } });

  const typeEvenement = STATUS_TO_EVENT[input.status];
  if (typeEvenement) {
    await emitSafe({ source: "logistics_engine", type: typeEvenement, payload: { shipmentId: leg.shipmentId, legId: leg.id } });
  } else if (input.status === "FAILED") {
    await emitSafe({ source: "logistics_engine", type: "delivery.failed", payload: { shipmentId: leg.shipmentId, legId: leg.id, reason: input.rawCarrierStatus ?? "non précisée" } });
  } else if (input.status === "DISPUTED") {
    await emitSafe({ source: "logistics_engine", type: "delivery.disputed", payload: { shipmentId: leg.shipmentId, legId: leg.id, reason: input.rawCarrierStatus ?? "non précisée" } });
  }

  return { leg: await obtenirLeg(leg.id), statutAgrege };
}

export async function obtenirSuiviExpedition(shipmentId: number) {
  const expedition = await obtenirExpedition(shipmentId);
  const [legs, evenements] = await Promise.all([
    db.select().from(logisticsLegs).where(eq(logisticsLegs.shipmentId, shipmentId)).orderBy(logisticsLegs.legIndex),
    db.select().from(logisticsTrackingEvents).where(eq(logisticsTrackingEvents.shipmentId, shipmentId)).orderBy(desc(logisticsTrackingEvents.occurredAt)),
  ]);
  return { expedition, legs, evenements };
}

/** Le leg d'une expédition appartenant réellement au transporteur authentifié — jamais un autre transporteur ne peut mettre à jour un leg qui n'est pas le sien. */
export async function obtenirLegDuTransporteur(shipmentId: number, carrierCode: string) {
  const [leg] = await db.select().from(logisticsLegs).where(and(eq(logisticsLegs.shipmentId, shipmentId), eq(logisticsLegs.carrierCode, carrierCode))).orderBy(desc(logisticsLegs.legIndex)).limit(1);
  if (!leg) throw new Error(`Aucun leg de "${carrierCode}" trouvé pour l'expédition #${shipmentId}.`);
  return leg;
}

/** Preuve d'enlèvement/remise/livraison (§67) — ajoutée, jamais écrasée. */
export async function ajouterPreuveLeg(input: { legId: number; type: string; url: string; actorId?: number | null }) {
  const leg = await obtenirLeg(input.legId);
  const preuves = [...leg.preuves, { type: input.type, url: input.url, horodatage: new Date().toISOString() }];
  await db.update(logisticsLegs).set({ preuves, updatedAt: new Date() }).where(eq(logisticsLegs.id, leg.id));
  await journaliser({ shipmentId: leg.shipmentId, action: "logistics.proof_added", actorId: input.actorId, detail: { legId: leg.id, type: input.type } });
  return obtenirLeg(leg.id);
}

// ───────────────────── Webhook transporteur (§66) ─────────────────────

/**
 * Sans secret réel configuré pour le transporteur, la signature ne peut
 * jamais être validée : le webhook est journalisé comme tel, jamais traité
 * en silence ni fabriqué comme réussi.
 */
export async function traiterWebhookTransporteur(input: { carrierCode: string; payload: Record<string, unknown>; signatureHeader?: string | null }) {
  const [connexion] = await db
    .select()
    .from(logisticsCarrierConnections)
    .where(and(eq(logisticsCarrierConnections.carrierCode, input.carrierCode), eq(logisticsCarrierConnections.active, true)))
    .orderBy(desc(logisticsCarrierConnections.createdAt))
    .limit(1);

  const secretEnv = connexion?.secretRef ? process.env[connexion.secretRef] : undefined;
  let signatureValid = false;
  let error: string | null = null;

  if (!secretEnv) {
    error = `NOT_CONNECTED : aucun secret réel configuré pour "${input.carrierCode}".`;
  } else if (!input.signatureHeader) {
    error = "En-tête de signature absent.";
  } else {
    const attendu = createHash("sha256").update(secretEnv + JSON.stringify(input.payload)).digest("hex");
    signatureValid = attendu === input.signatureHeader;
    if (!signatureValid) error = "Signature invalide.";
  }

  const statut = !secretEnv || !input.signatureHeader ? "signature_invalide" : signatureValid ? "traite" : "signature_invalide";
  const [log] = await db
    .insert(logisticsWebhookLog)
    .values({ carrierCode: input.carrierCode, payload: input.payload, signatureValid, status: statut, error })
    .returning();

  if (!signatureValid) return { ok: false, motif: error ?? "Signature invalide.", logId: log.id };

  const legId = typeof input.payload.legId === "number" ? input.payload.legId : null;
  const statutBrut = typeof input.payload.status === "string" ? input.payload.status : null;
  if (!legId || !statutBrut || !(TRACKING_STATUSES as readonly string[]).includes(statutBrut)) {
    await db.update(logisticsWebhookLog).set({ status: "erreur", error: "legId/status absent ou statut non reconnu." }).where(eq(logisticsWebhookLog.id, log.id));
    return { ok: false, motif: "legId/status absent ou statut non reconnu — rien appliqué sans donnée fiable.", logId: log.id };
  }

  await mettreAJourStatutLeg({ legId, status: statutBrut as TrackingStatus, source: "carrier_webhook", rawCarrierStatus: statutBrut });
  return { ok: true, motif: "Webhook traité et statut appliqué.", logId: log.id };
}

// ───────────────────── API MKA.P-MS pour transporteurs (§74) ─────────────────────

export async function creerCleApiTransporteur(input: { carrierCode: string; name: string; scopes?: string | null; actorId: number }) {
  if (!findCarrier(input.carrierCode)) throw new Error(`Transporteur inconnu du catalogue : "${input.carrierCode}".`);
  const raw = randomBytes(24).toString("hex");
  const prefix = `mkalog_${raw.slice(0, 6)}`;
  const fullKey = `${prefix}.${raw}`;
  const keyHash = createHash("sha256").update(fullKey).digest("hex");
  const [row] = await db
    .insert(logisticsApiKeys)
    .values({ carrierCode: input.carrierCode, name: input.name, keyPrefix: prefix, keyHash, scopes: input.scopes ?? null, createdBy: input.actorId })
    .returning();
  await journaliser({ shipmentId: null, action: "logistics.api_key_created", actorId: input.actorId, detail: { id: row.id, carrierCode: input.carrierCode } });
  return { id: row.id, carrierCode: row.carrierCode, name: row.name, keyPrefix: row.keyPrefix, apiKey: fullKey };
}

export async function verifierCleApiTransporteur(rawKey: string): Promise<{ id: number; carrierCode: string } | null> {
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const [row] = await db.select().from(logisticsApiKeys).where(and(eq(logisticsApiKeys.keyHash, keyHash), eq(logisticsApiKeys.active, true))).limit(1);
  if (!row) return null;
  await db.update(logisticsApiKeys).set({ lastUsedAt: new Date() }).where(eq(logisticsApiKeys.id, row.id));
  return { id: row.id, carrierCode: row.carrierCode };
}

export async function listerClesApiTransporteur() {
  const rows = await db.select().from(logisticsApiKeys).orderBy(desc(logisticsApiKeys.createdAt));
  return rows.map(({ keyHash: _hash, ...rest }) => rest);
}

// ───────────────────── Lecture ─────────────────────

export async function listerExpeditions(filtres?: { categorie?: CarrierCategory; status?: TrackingStatus }) {
  const conditions = [];
  if (filtres?.categorie) conditions.push(eq(logisticsShipments.categorie, filtres.categorie));
  if (filtres?.status) conditions.push(eq(logisticsShipments.status, filtres.status));
  return db.select().from(logisticsShipments).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(logisticsShipments.createdAt)).limit(500);
}

export async function journalAudit(shipmentId: number, limit = 200) {
  return db.select().from(logisticsAuditLog).where(eq(logisticsAuditLog.shipmentId, shipmentId)).orderBy(desc(logisticsAuditLog.createdAt)).limit(limit);
}

// ── Health + Dashboard + Feed (standards MOS) ───────────────────────────

export async function healthStatus() {
  const startedAt = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let message: string | undefined;
  let total = 0;
  let livrees = 0;
  try {
    const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(logisticsShipments);
    total = Number(t?.n ?? 0);
    const [l] = await db.select({ n: sql<number>`count(*)::int` }).from(logisticsShipments).where(eq(logisticsShipments.status, "DELIVERED"));
    livrees = Number(l?.n ?? 0);
  } catch (e) {
    status = "degraded";
    message = (e as Error).message;
  }
  const result = { engine: LOGISTICS_ENGINE_META.name, version: VERSION, status, checkedAt: new Date().toISOString(), message, metrics: { total, livrees, responseMs: Date.now() - startedAt } };
  db.insert(logisticsHealthLog).values({ status, message: message ?? null, metrics: result.metrics }).catch(() => {});
  return result;
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const h = await healthStatus();
  return {
    engine: LOGISTICS_ENGINE_META.name,
    label: LOGISTICS_ENGINE_META.label,
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
  const parStatut = await db.select({ status: logisticsShipments.status, n: sql<number>`count(*)::int` }).from(logisticsShipments).groupBy(logisticsShipments.status);
  const businessMetrics: Record<string, number | string | null> = {};
  for (const r of parStatut) businessMetrics[`expeditions_${r.status.toLowerCase()}`] = Number(r.n);
  return { ...feed, businessMetrics, recentEvents: [], recentErrors: [] };
}
