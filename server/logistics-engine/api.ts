/**
 * Logistics Engine — API MKA.P-MS pour transporteurs (§74 de l'addendum,
 * LOT 4). Surface REST dédiée : un transporteur s'authentifie par clé API
 * (`x-mka-carrier-key`, jamais un cookie/session plateforme), jamais par
 * tRPC. Même principe de sécurité que `server/intelligences/api-v1.ts` et
 * `server/stripeWebhook.ts` : la clé n'est jamais journalée, aucune donnée
 * sensible ne traverse cette API en clair.
 *
 * Montée sous `/api/logistics` dans `server/index.ts`.
 */
import { Router, type Request, type Response } from "express";
import {
  ajouterPreuveLeg,
  choisirOptionDevis,
  creerExpedition,
  genererDevis,
  mettreAJourStatutLeg,
  obtenirLegDuTransporteur,
  obtenirSuiviExpedition,
  reserverExpedition,
  traiterWebhookTransporteur,
  verifierCleApiTransporteur,
} from "./service.js";
import { CARRIER_CATEGORIES, TRACKING_STATUSES } from "./contract.js";

export const logisticsApi = Router();

interface CarrierAuth {
  id: number;
  carrierCode: string;
}

async function authentifierTransporteur(req: Request, res: Response): Promise<CarrierAuth | null> {
  const cle = req.headers["x-mka-carrier-key"];
  if (typeof cle !== "string" || !cle) {
    res.status(401).json({ error: "En-tête x-mka-carrier-key manquant." });
    return null;
  }
  const auth = await verifierCleApiTransporteur(cle);
  if (!auth) {
    res.status(401).json({ error: "Clé API transporteur invalide ou inactive." });
    return null;
  }
  return auth;
}

function erreur(res: Response, e: unknown) {
  res.status(400).json({ error: e instanceof Error ? e.message : String(e) });
}

// POST /logistics/quotes — un transporteur peut aussi demander un devis interne (rare, surtout usage Direction via tRPC).
logisticsApi.post("/quotes", async (req, res) => {
  const auth = await authentifierTransporteur(req, res);
  if (!auth) return;
  try {
    const { categorie, originePays, destinationPays, ...rest } = req.body ?? {};
    if (!CARRIER_CATEGORIES.includes(categorie)) return void res.status(400).json({ error: `categorie invalide : "${categorie}".` });
    const result = await genererDevis({ categorie, originePays: originePays ?? null, destinationPays: destinationPays ?? null, ...rest });
    res.status(201).json(result);
  } catch (e) {
    erreur(res, e);
  }
});

// POST /logistics/shipments — un transporteur peut déclarer une expédition qu'il opère déjà (mono-leg, lui-même).
logisticsApi.post("/shipments", async (req, res) => {
  const auth = await authentifierTransporteur(req, res);
  if (!auth) return;
  try {
    const body = req.body ?? {};
    const { shipment, legs } = await creerExpedition({
      sourceType: "api_transporteur",
      categorie: body.categorie,
      originePays: body.originePays ?? null,
      destinationPays: body.destinationPays ?? null,
      origineVille: body.origineVille,
      destinationVille: body.destinationVille,
      poidsKg: body.poidsKg,
      valeurDeclaree: body.valeurDeclaree,
      devise: body.devise,
      legs: [{ carrierCode: auth.carrierCode, mode: body.mode ?? "route", ...body.leg }],
      actorId: null,
    });
    res.status(201).json({ shipment, legs });
  } catch (e) {
    erreur(res, e);
  }
});

// GET /logistics/shipments/:id
logisticsApi.get("/shipments/:id", async (req, res) => {
  const auth = await authentifierTransporteur(req, res);
  if (!auth) return;
  try {
    const suivi = await obtenirSuiviExpedition(Number(req.params.id));
    res.json(suivi);
  } catch (e) {
    erreur(res, e);
  }
});

async function statutTransporteur(req: Request, res: Response, status: (typeof TRACKING_STATUSES)[number]) {
  const auth = await authentifierTransporteur(req, res);
  if (!auth) return;
  try {
    const shipmentId = Number(req.params.id);
    const leg = await obtenirLegDuTransporteur(shipmentId, auth.carrierCode);
    const result = await mettreAJourStatutLeg({
      legId: leg.id,
      status,
      source: "api_transporteur",
      rawCarrierStatus: typeof req.body?.rawStatus === "string" ? req.body.rawStatus : null,
      detail: typeof req.body === "object" ? req.body : {},
    });
    res.json(result);
  } catch (e) {
    erreur(res, e);
  }
}

// POST /logistics/shipments/:id/accept
logisticsApi.post("/shipments/:id/accept", (req, res) => statutTransporteur(req, res, "BOOKED"));
// POST /logistics/shipments/:id/pickup
logisticsApi.post("/shipments/:id/pickup", (req, res) => statutTransporteur(req, res, req.body?.scheduled ? "PICKUP_SCHEDULED" : "PICKED_UP"));
// POST /logistics/shipments/:id/handover
logisticsApi.post("/shipments/:id/handover", (req, res) => statutTransporteur(req, res, "HANDED_OVER"));
// POST /logistics/shipments/:id/delivery
logisticsApi.post("/shipments/:id/delivery", (req, res) => statutTransporteur(req, res, "DELIVERED"));

// POST /logistics/shipments/:id/status — mise à jour générique, statut au choix du transporteur.
logisticsApi.post("/shipments/:id/status", async (req, res) => {
  const auth = await authentifierTransporteur(req, res);
  if (!auth) return;
  const status = req.body?.status;
  if (!TRACKING_STATUSES.includes(status)) return void res.status(400).json({ error: `status invalide : "${status}".` });
  return statutTransporteur(req, res, status);
});

// POST /logistics/shipments/:id/incident — échec ou litige, jamais un statut positif fabriqué.
logisticsApi.post("/shipments/:id/incident", async (req, res) => {
  const type = req.body?.type === "dispute" ? "DISPUTED" : "FAILED";
  return statutTransporteur(req, res, type);
});

// POST /logistics/shipments/:id/proof — preuve d'enlèvement/remise/livraison.
logisticsApi.post("/shipments/:id/proof", async (req, res) => {
  const auth = await authentifierTransporteur(req, res);
  if (!auth) return;
  try {
    const shipmentId = Number(req.params.id);
    const leg = await obtenirLegDuTransporteur(shipmentId, auth.carrierCode);
    const { type, url } = req.body ?? {};
    if (typeof type !== "string" || typeof url !== "string") return void res.status(400).json({ error: "type et url requis." });
    const result = await ajouterPreuveLeg({ legId: leg.id, type, url });
    res.json(result);
  } catch (e) {
    erreur(res, e);
  }
});

/**
 * POST /logistics/webhooks/:carrierCode — réception asynchrone (push
 * transporteur). Signature vérifiée via `x-mka-carrier-signature` contre le
 * secret réel configuré pour ce transporteur (Carrier Connector Engine) :
 * sans secret réel, jamais traité comme un succès (voir
 * `traiterWebhookTransporteur`, honnêteté NOT_CONNECTED).
 */
logisticsApi.post("/webhooks/:carrierCode", async (req, res) => {
  try {
    const result = await traiterWebhookTransporteur({
      carrierCode: req.params.carrierCode,
      payload: req.body ?? {},
      signatureHeader: (req.headers["x-mka-carrier-signature"] as string | undefined) ?? null,
    });
    res.status(result.ok ? 200 : 401).json(result);
  } catch (e) {
    erreur(res, e);
  }
});

// Réservation interne (Direction/admin) exposée aussi côté REST pour un futur portail transporteur — reste distincte de tRPC.
logisticsApi.post("/shipments/:id/reserve", async (req, res) => {
  const auth = await authentifierTransporteur(req, res);
  if (!auth) return;
  try {
    const result = await reserverExpedition({ shipmentId: Number(req.params.id), actorId: null });
    res.json(result);
  } catch (e) {
    erreur(res, e);
  }
});

logisticsApi.post("/quotes/:id/choose", async (req, res) => {
  const auth = await authentifierTransporteur(req, res);
  if (!auth) return;
  try {
    const result = await choisirOptionDevis({ quoteId: Number(req.params.id), tier: req.body?.tier, actorId: null });
    res.json(result);
  } catch (e) {
    erreur(res, e);
  }
});
