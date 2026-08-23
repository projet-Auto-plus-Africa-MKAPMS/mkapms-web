/**
 * Points 105-106 — traitements réellement exécutés à la remise d'un événement.
 *
 * Chaque abonnement pointe vers l'un de ces traitements. Ils appellent le code
 * existant des moteurs : le bus ne réimplémente rien, il relie. Un traitement
 * qui échoue renvoie une erreur — elle est enregistrée sur la remise, pas
 * avalée.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { smartAlerts } from "../smart-engine/schema.js";
import { onAnnoncePublished } from "../seo-hooks.js";
import { onPieceChanged } from "../product-engine/service.js";
import { raiseAlert } from "../smart-engine/services/alert-engine.js";
import { record as auditRecord } from "../audit-os/index.js";
import { ecrire as memoriser, retenir } from "../intelligences/memoire.js";

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

  async smart_retabli(payload) {
    const moteur = texte(payload, "moteur");
    if (!moteur) throw new Error("Charge invalide : « moteur » absent.");
    const closes = await db
      .update(smartAlerts)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(
        and(
          eq(smartAlerts.status, "open"),
          eq(smartAlerts.category, "moteur"),
          sql`${smartAlerts.metadata}->>'signature' LIKE ${`bus:moteur:${moteur}:%`}`,
        ),
      )
      .returning({ id: smartAlerts.id });
    return closes.length > 0
      ? `Moteur ${moteur} rétabli : ${closes.length} alerte(s) refermée(s).`
      : `Moteur ${moteur} rétabli : aucune alerte ouverte à refermer.`;
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

  /**
   * Un échange Intelligence réussi n'a rien à signaler. Un échange refusé par
   * le fournisseur, en revanche, rend l'assistant public muet : c'est une panne
   * visible par les clients, pas un détail technique.
   */
  async smart_intelligences(payload) {
    const cote = texte(payload, "cote") || "inconnu";
    const ok = payload.ok === true;
    if (ok) return `Échange Intelligence (${cote}) abouti : rien à signaler.`;
    const fournisseur = texte(payload, "fournisseur") || "aucun fournisseur routable";
    const cree = await raiseAlert({
      category: "moteur",
      title: `MKA.P-MS Intelligences sans réponse (${cote})`,
      description: `Un appel au fournisseur de modèle n'a pas abouti (${fournisseur}). Côté public, l'assistant reste muet ; côté direction, la génération de code est refusée. Vérifier la clé du fournisseur et le plafond journalier.`,
      level: cote === "public" ? "critical" : "important",
      signature: `bus:intelligences:${cote}`,
    });
    return cree
      ? `Alerte ouverte : appel Intelligence en échec (${cote}).`
      : `Alerte déjà ouverte pour les échecs Intelligence (${cote}).`;
  },

  /**
   * Point 138 — MKA.P-MS Intelligences entend le bus, et point 139 — elle en
   * apprend. L'événement va en mémoire technique ; un événement d'échec devient
   * en plus une expérience que la prochaine mission consultera avant de repartir
   * de zéro. Aucune action corrective n'est déclenchée ici : écouter n'est pas
   * agir, et agir dépend du curseur d'autonomie.
   */
  async intelligences_memoire(payload, ctx) {
    const resume = Object.entries(payload)
      .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
      .map(([k, v]) => `${k} : ${String(v).slice(0, 200)}`)
      .join("\n");

    const ECHECS: Record<string, string> = {
      "paiement.echoue": "paiement",
      "moteur.degrade": "moteurs",
      "bouton.casse": "code",
      "seo.erreur": "seo",
    };
    const domaine = ECHECS[ctx.type];

    await memoriser({
      categorie: "technique",
      cle: `bus:${ctx.type}`,
      titre: `Événement ${ctx.type} (${ctx.source})`,
      contenu: resume || "Événement sans champ exploitable.",
      liens: { evenement: ctx.type, source: ctx.source },
      source: "event_bus",
    });

    if (!domaine) return `Événement ${ctx.type} mémorisé (mémoire technique).`;

    const x = await retenir({
      domaine,
      probleme: `${ctx.type} — ${resume}`,
      diagnostic: `Signalé par le bus depuis ${ctx.source}. Cause non encore établie.`,
      solution: "",
      resultat: "signale",
      blocage: "Aucune correction tentée : écouter n'est pas agir.",
    });
    return x.recurrent
      ? `Échec ${ctx.type} mémorisé : cas déjà rencontré, compteur d'occurrences incrémenté.`
      : `Échec ${ctx.type} mémorisé comme nouvelle expérience #${x.id}.`;
  },

  /**
   * Un véhicule qu'un acheteur ne pourra pas immatriculer chez lui n'est pas un
   * incident technique : c'est du stock invendable dans ce pays. La direction
   * doit le savoir, une seule fois par annonce et par pays.
   */
  async smart_risque_import(payload) {
    const id = nombre(payload, "annonceId");
    const pays = texte(payload, "paysDestination") || "pays non précisé";
    if (id === null) throw new Error("Charge invalide : « annonceId » absent ou non numérique.");
    const motif = texte(payload, "motif") || "motif non transmis";
    const cree = await raiseAlert({
      category: "annonce",
      title: `Véhicule non importable — annonce ${id} vers ${pays}`,
      description: `${motif} Cette annonce est visible depuis ${pays} alors qu'elle n'y est pas exploitable : soit la règle pays est à confirmer, soit l'annonce doit être masquée pour ce pays.`,
      level: "important",
      targetType: "annonce",
      targetId: id,
      signature: `bus:risque_import:${id}:${pays}`,
    });
    return cree
      ? `Alerte ouverte : annonce ${id} non importable vers ${pays}.`
      : `Alerte déjà ouverte pour l'annonce ${id} vers ${pays} : pas de doublon créé.`;
  },

  async smart_livraison_vehicule_bloquee(payload) {
    const id = nombre(payload, "expeditionId");
    const etape = texte(payload, "etape") || "étape non précisée";
    if (id === null) throw new Error("Charge invalide : « expeditionId » absent ou non numérique.");
    const note = texte(payload, "note") || "aucun motif transmis";
    const cree = await raiseAlert({
      category: "service",
      title: `Acheminement bloqué — expédition ${id} à l'étape ${etape}`,
      description: `${note} Un véhicule immobilisé engage un gardiennage et un client qui attend : l'étape doit être débloquée ou le client prévenu.`,
      level: "important",
      targetType: "vd_expedition",
      targetId: id,
      signature: `bus:vd_bloquee:${id}:${etape}`,
    });
    return cree
      ? `Alerte ouverte : expédition ${id} bloquée à l'étape ${etape}.`
      : `Alerte déjà ouverte pour l'expédition ${id} à l'étape ${etape}.`;
  },

  async smart_livraison_vehicule_sans_prix(payload) {
    const mode = texte(payload, "mode") || "mode non précisé";
    const depart = texte(payload, "paysDepart") || "?";
    const arrivee = texte(payload, "paysArrivee") || "?";
    const corridor = `${depart}→${arrivee}`;
    const cree = await raiseAlert({
      category: "service",
      title: `Acheminement sans barème — ${corridor} (${mode})`,
      description:
        `Un client a demandé un prix d'acheminement sur ${corridor} en ${mode} et aucun barème applicable n'existe : il repart sans prix. ` +
        "Il faut soit une grille interne, soit un transporteur contractualisé sur ce corridor.",
      level: "warning",
      targetType: "vd_corridor",
      signature: `bus:vd_sans_prix:${mode}:${corridor}`,
    });
    return cree
      ? `Alerte ouverte : aucun barème sur ${corridor} en ${mode}.`
      : `Alerte déjà ouverte pour ${corridor} en ${mode}.`;
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
