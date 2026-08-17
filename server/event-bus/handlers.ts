/**
 * Points 105-106 — traitements réellement exécutés à la remise d'un événement.
 *
 * Chaque abonnement pointe vers l'un de ces traitements. Ils appellent le code
 * existant des moteurs : le bus ne réimplémente rien, il relie. Un traitement
 * qui échoue renvoie une erreur — elle est enregistrée sur la remise, pas
 * avalée.
 */
import { onAnnoncePublished } from "../seo-hooks.js";
import { onPieceChanged } from "../product-engine/service.js";
import { raiseAlert } from "../smart-engine/services/alert-engine.js";
import { record as auditRecord } from "../audit-os/index.js";

export type Charge = Record<string, unknown>;

export type Handler = (payload: Charge, contexte: { type: string; source: string }) => Promise<string>;

function texte(payload: Charge, cle: string): string {
  const v = payload[cle];
  return typeof v === "string" ? v : String(v ?? "");
}

function nombre(payload: Charge, cle: string): number | null {
  const v = payload[cle];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  return null;
}

const handlers: Record<string, Handler> = {
  async seo_annonce(payload, ctx) {
    const id = nombre(payload, "annonceId");
    if (id === null) throw new Error("Charge invalide : « annonceId » absent ou non numérique.");
    await onAnnoncePublished(id, ctx.type === "annonce.modifiee" ? "updated" : "published");
    return `Annonce ${id} mise sous surveillance d'indexation et soumise.`;
  },

  async produit_sync(payload) {
    const source = texte(payload, "source");
    const id = nombre(payload, "sourceId");
    const declencheur = texte(payload, "declencheur");
    if (source !== "parts_catalog" && source !== "pieces") {
      throw new Error(`Source produit inconnue : « ${source} ».`);
    }
    if (id === null) throw new Error("Charge invalide : « sourceId » absent ou non numérique.");
    if (
      declencheur !== "depot" &&
      declencheur !== "modification" &&
      declencheur !== "vente" &&
      declencheur !== "suppression"
    ) {
      throw new Error(`Déclencheur produit inconnu : « ${declencheur} ».`);
    }
    await onPieceChanged(source, id, declencheur);
    return `Fiche produit ${source}#${id} resynchronisée (${declencheur}).`;
  },

  async smart_alerte(payload) {
    const moteur = texte(payload, "moteur");
    const etat = texte(payload, "etat") || "inconnu";
    if (!moteur) throw new Error("Charge invalide : « moteur » absent.");
    const cree = await raiseAlert({
      category: "moteur",
      title: `Moteur ${moteur} en état « ${etat} »`,
      description:
        "Signalé par le bus d'événements. Tant que la cause n'est pas traitée, les services qui dépendent de ce moteur restent incertains.",
      level: etat === "down" ? "critical" : "important",
      targetType: "engine",
      signature: `bus:moteur:${moteur}:${etat}`,
    });
    return cree
      ? `Alerte ouverte pour le moteur ${moteur} (${etat}).`
      : `Alerte déjà ouverte pour le moteur ${moteur} (${etat}) : pas de doublon créé.`;
  },

  async smart_alerte_paiement(payload) {
    const reference = texte(payload, "reference");
    const motif = texte(payload, "motif") || "motif non transmis par le prestataire";
    if (!reference) throw new Error("Charge invalide : « reference » absente.");
    const cree = await raiseAlert({
      category: "paiement",
      title: `Paiement refusé — ${reference}`,
      description: `Motif rapporté : ${motif}. Un encaissement refusé est une perte directe, pas un incident d'affichage.`,
      level: "critical",
      signature: `bus:paiement:${reference}`,
    });
    return cree
      ? `Alerte critique ouverte pour le paiement ${reference}.`
      : `Alerte déjà ouverte pour le paiement ${reference}.`;
  },

  async audit_trace(payload, ctx) {
    await auditRecord({
      actorId: null,
      action: `bus.${ctx.type}`,
      entityType: "event_bus",
      result: "success",
      metadata: { source: ctx.source, payload },
    });
    return `Événement ${ctx.type} tracé au journal d'audit.`;
  },
};

export function getHandler(code: string): Handler | null {
  return handlers[code] ?? null;
}

export const HANDLER_CODES = Object.keys(handlers);
