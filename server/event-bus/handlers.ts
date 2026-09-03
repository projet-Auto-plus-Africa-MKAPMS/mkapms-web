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

  async smart_estimation_incomplete(payload) {
    const depart = texte(payload, "paysDepart") || "?";
    const arrivee = texte(payload, "paysArrivee") || "?";
    const corridor = `${depart}→${arrivee}`;
    const manques = texte(payload, "manques") || "sources non précisées";
    const cree = await raiseAlert({
      category: "service",
      title: `Coût total non chiffrable — ${corridor}`,
      description:
        `Un acheteur a demandé le coût complet d'un véhicule sur ${corridor} et la plateforme n'a pas pu l'assembler. Sources manquantes : ${manques}. ` +
        "Un acheteur qui ne connaît pas son coût total n'achète pas à distance.",
      level: "warning",
      targetType: "estimation_corridor",
      signature: `bus:estimation_incomplete:${corridor}`,
    });
    return cree
      ? `Alerte ouverte : estimation incomplète sur ${corridor}.`
      : `Alerte déjà ouverte pour ${corridor}.`;
  },

  /**
   * Un bouton qui ne mène à rien : le Système Intelligent ouvre l'alerte, et
   * MKA.P-MS Intelligences ouvre le dossier de développement correspondant —
   * une seule fois par bouton, à la première alerte, pour que 500 clics ne
   * fassent pas 500 dossiers.
   */
  async smart_bouton_sans_action(payload) {
    const code = texte(payload, "code") || "?";
    const ecran = texte(payload, "ecran") || "écran non transmis";
    const manque = texte(payload, "manque") || "action non déclarée au Moteur de boutons";
    const cree = await raiseAlert({
      category: "service",
      title: `Bouton sans action — ${code}`,
      description:
        `Un utilisateur a cliqué sur « ${code} » depuis ${ecran} et rien ne s'est produit. Cause : ${manque}. ` +
        "Un bouton visible qui ne fait rien fait douter de toute la plateforme.",
      level: "warning",
      targetType: "bouton",
      signature: `bus:bouton_sans_action:${code}`,
    });
    if (!cree) return `Alerte déjà ouverte pour le bouton ${code}.`;

    // Import différé : les Intelligences publient elles-mêmes sur le bus.
    const { proposer } = await import("../intelligences/service.js");
    const { dossier } = await proposer({
      besoin:
        `Bouton « ${code} » sans action réelle sur ${ecran}. ${manque} ` +
        "Brancher ce bouton sur une action exécutable (procédure serveur, destination existante) " +
        "ou retirer le bouton de l'écran. Aucun faux succès ne doit être affiché en attendant.",
    });
    return `Alerte ouverte pour ${code} et dossier de développement ${dossier?.id ?? "non ouvert"} demandé aux Intelligences.`;
  },

  async smart_cliquables_audit(payload) {
    const total = nombre(payload, "total") ?? 0;
    const ecrans = nombre(payload, "ecrans") ?? 0;
    const couverture = nombre(payload, "couvertureMoteur") ?? 0;
    const sansAction = nombre(payload, "sansAction") ?? 0;
    const mortes = nombre(payload, "destinationsMortes") ?? 0;

    // La mesure est conservée même quand tout va bien : c'est elle qui permet
    // de dire si la situation s'améliore d'une semaine à l'autre.
    await memoriser({
      categorie: "technique",
      cle: "auto_branchement:mesure",
      titre: "Cliquables — dernière mesure remise au Système Intelligent",
      contenu:
        `${total} cliquable(s) sur ${ecrans} écran(s), ${couverture} % pilotés par le Moteur de boutons. ` +
        `${sansAction} bouton(s) sans action, ${mortes} destination(s) inexistante(s).`,
      source: "event-bus.smart_cliquables_audit",
    });

    if (sansAction === 0 && mortes === 0) {
      return `Aucun défaut de cliquable : ${total} élément(s) sur ${ecrans} écran(s) tous branchés.`;
    }

    const cree = await raiseAlert({
      category: "service",
      title: `Écrans : ${sansAction} bouton(s) sans action, ${mortes} destination(s) inexistante(s)`,
      description:
        `Sur ${total} élément(s) cliquable(s) répartis sur ${ecrans} écran(s), ${couverture} % passent par le Moteur de boutons. ` +
        `${sansAction} bouton(s) ne déclenchent rien et ${mortes} destination(s) citées n'existent pas ` +
        "et ne sont rattrapées par aucune règle du Moteur de Redirection. Détail et propositions : Centre d'auto-branchement.",
      level: mortes > 20 || sansAction > 50 ? "important" : "warning",
      targetType: "cliquables",
      signature: "bus:cliquables_audit",
    });
    return cree
      ? `Alerte ouverte : ${sansAction} bouton(s) sans action, ${mortes} destination(s) inexistante(s).`
      : `Alerte déjà ouverte sur l'état des cliquables (${sansAction} sans action, ${mortes} destinations mortes).`;
  },

  async smart_cliquable_destination_morte(payload) {
    const destination = texte(payload, "destination") || "?";
    const occurrences = nombre(payload, "occurrences") ?? 0;
    const ecrans = texte(payload, "ecrans") || "écrans non transmis";

    const cree = await raiseAlert({
      category: "service",
      title: `Destination inexistante — ${destination}`,
      description:
        `${occurrences} endroit(s) envoient vers « ${destination} », qui n'est déclarée nulle part et qu'aucune règle ` +
        `du Moteur de Redirection ne rattrape. Écrans concernés : ${ecrans}.`,
      level: occurrences >= 10 ? "important" : "warning",
      targetType: "route",
      signature: `bus:cliquable_destination_morte:${destination}`,
    });
    if (!cree) return `Alerte déjà ouverte pour la destination ${destination}.`;

    const { proposer } = await import("../intelligences/service.js");
    const { dossier } = await proposer({
      besoin:
        `« ${destination} » est citée ${occurrences} fois dans les écrans (${ecrans}) mais n'existe pas. ` +
        "Décider : créer la page de cette section, ou déclarer au Moteur de Redirection la page existante qui la remplace, " +
        "ou corriger les liens. Ne pas masquer l'anomalie sans traiter la cause.",
    });
    return `Alerte ouverte pour ${destination} (${occurrences} endroit(s)) et dossier ${dossier?.id ?? "non ouvert"} demandé aux Intelligences.`;
  },

  async smart_ecrans_vides(payload) {
    const vides = nombre(payload, "vides") ?? 0;
    const total = nombre(payload, "total") ?? 0;
    const sections = nombre(payload, "sections") ?? 0;
    const principales = texte(payload, "principales") || "sections non transmises";

    await memoriser({
      categorie: "technique",
      cle: "auto_branchement:ecrans_vides",
      titre: "Écrans annoncés au visiteur sans contenu",
      contenu:
        `${vides} écran(s) sur ${total} listés au sommaire de leur section n'affichent qu'un gabarit. ` +
        `${sections} section(s) concernée(s) : ${principales}.`,
      source: "event-bus.smart_ecrans_vides",
    });

    if (vides === 0) return `Aucun écran vide : les ${total} écran(s) de section affichent du contenu.`;

    const cree = await raiseAlert({
      category: "service",
      title: `${vides} écran(s) annoncés au visiteur sans aucun contenu`,
      description:
        `${vides} écran(s) sur ${total} sont atteignables et listés au sommaire de leur section, mais n'affichent ` +
        `qu'un gabarit « Module … ». Sections les plus concernées : ${principales}. ` +
        "Ces écrans sont désormais annoncés « en préparation » au visiteur au lieu d'être présentés comme livrés, " +
        "mais le contenu reste à produire.",
      level: vides > 100 ? "important" : "warning",
      targetType: "cliquables",
      signature: "bus:ecrans_vides",
    });
    return cree
      ? `Alerte ouverte : ${vides} écran(s) annoncés sans contenu.`
      : `Alerte déjà ouverte sur les ${vides} écran(s) sans contenu.`;
  },

  async smart_atelier_non_conforme(payload) {
    const dossier = texte(payload, "dossier") || "?";
    const type = texte(payload, "type") || "contrôle";
    const points = texte(payload, "points") || "points non transmis";
    const cree = await raiseAlert({
      category: "service",
      title: `Contrôle atelier non conforme — ${dossier}`,
      description:
        `Le ${type.replace("_", " ")} du dossier ${dossier} n'est pas conforme : ${points}. ` +
        "Le véhicule ne doit pas être restitué dans cet état.",
      level: "important",
      targetType: "atelier_validation",
      signature: `bus:atelier_non_conforme:${dossier}`,
    });
    return cree
      ? `Alerte ouverte sur le dossier ${dossier}.`
      : `Alerte déjà ouverte sur le dossier ${dossier}.`;
  },

  async smart_atelier_stock_bas(payload) {
    const reference = texte(payload, "reference") || "?";
    const quantite = texte(payload, "quantite") || "0";
    const seuil = texte(payload, "seuil") || "0";
    const cree = await raiseAlert({
      category: "service",
      title: `Stock de pièce au seuil — ${reference}`,
      description:
        `La référence ${reference} est à ${quantite} pour un seuil d'alerte de ${seuil}. ` +
        "La commande reste une décision de l'atelier : la plateforme signale, elle n'achète pas à sa place.",
      level: "warning",
      targetType: "atelier_stock",
      signature: `bus:atelier_stock_bas:${reference}`,
    });
    return cree
      ? `Alerte ouverte pour la référence ${reference}.`
      : `Alerte déjà ouverte pour la référence ${reference}.`;
  },

  async smart_atelier_reappro_proposee(payload) {
    const id = nombre(payload, "propositionId");
    const reference = texte(payload, "reference") || "?";
    const garageId = texte(payload, "garageId") || "?";
    const quantite = texte(payload, "quantiteProposee") || "?";
    const origine = texte(payload, "origine") || "?";
    const prixConnu = texte(payload, "prixConnu") === "true";

    await memoriser({
      categorie: "technique",
      cle: `atelier:reappro:proposition:${id ?? reference}`,
      titre: `Réapprovisionnement proposé — ${reference} (garage ${garageId})`,
      contenu: `Proposition #${id ?? "?"} : ${quantite} × ${reference}, origine ${origine}, prix d'achat ${prixConnu ? "connu" : "INCONNU"}. En attente d'une décision humaine.`,
      liens: { garageId, reference },
      source: "event-bus.smart_atelier_reappro_proposee",
    });

    if (prixConnu) return `Proposition #${id} mémorisée (${reference}, prix connu).`;
    const cree = await raiseAlert({
      category: "service",
      title: `Réapprovisionnement sans prix d'achat — ${reference}`,
      description:
        `La proposition #${id} (garage ${garageId}) n'a pas de prix d'achat : la commande fournisseur sera refusée tant qu'il n'est pas renseigné, ` +
        "et la rupture durera. Renseignez le prix sur la ligne de stock ou lors de la validation.",
      level: "warning",
      targetType: "atelier_reappro",
      targetId: id ?? undefined,
      signature: `bus:atelier_reappro_sans_prix:${garageId}:${reference}`,
    });
    return cree
      ? `Alerte ouverte : proposition #${id} sans prix d'achat.`
      : `Alerte déjà ouverte : proposition sans prix pour ${reference}.`;
  },

  async smart_atelier_reappro_decidee(payload) {
    const id = nombre(payload, "propositionId");
    const reference = texte(payload, "reference") || "?";
    const garageId = texte(payload, "garageId") || "?";
    const decision = texte(payload, "decision");
    const motif = texte(payload, "motif");

    if (decision === "validee") {
      const closes = await db
        .update(smartAlerts)
        .set({ status: "resolved", resolvedAt: new Date() })
        .where(
          and(
            eq(smartAlerts.status, "open"),
            sql`${smartAlerts.metadata}->>'signature' IN (${`bus:atelier_stock_bas:${reference}`}, ${`bus:atelier_reappro_sans_prix:${garageId}:${reference}`})`,
          ),
        )
        .returning({ id: smartAlerts.id });
      return `Proposition #${id} validée : ${closes.length} alerte(s) de rupture refermée(s) pour ${reference}.`;
    }

    await memoriser({
      categorie: "technique",
      cle: `atelier:reappro:refus:${garageId}:${reference}`,
      titre: `Réapprovisionnement refusé — ${reference} (garage ${garageId})`,
      contenu: `Proposition #${id} refusée par l'atelier. Motif : ${motif || "non transmis"}. La rupture reste ouverte volontairement.`,
      liens: { garageId, reference },
      source: "event-bus.smart_atelier_reappro_decidee",
    });
    return `Refus de la proposition #${id} mémorisé (${reference}).`;
  },

  async smart_atelier_commande_passee(payload) {
    const id = nombre(payload, "commandeId");
    const numero = texte(payload, "numero") || "?";
    const garageId = texte(payload, "garageId") || "?";
    const fournisseur = texte(payload, "fournisseur") || "?";
    const total = nombre(payload, "totalCents") ?? 0;
    const statut = texte(payload, "statut");

    await memoriser({
      categorie: "technique",
      cle: `atelier:reappro:commande:${numero}`,
      titre: `Commande fournisseur ${numero} (garage ${garageId})`,
      contenu: `${(total / 100).toFixed(2)} € engagés auprès de ${fournisseur}, statut ${statut}. Engagement du mois : ${texte(payload, "engageApresCents")} / plafond ${texte(payload, "plafondCents")} cents.`,
      liens: { garageId, numero },
      source: "event-bus.smart_atelier_commande_passee",
    });

    if (statut === "envoyee") return `Commande ${numero} mémorisée : bon transmis au fournisseur.`;
    const cree = await raiseAlert({
      category: "service",
      title: `Bon de commande ${numero} non transmis au fournisseur`,
      description:
        `La commande ${numero} (${(total / 100).toFixed(2)} €, ${fournisseur}) est enregistrée mais le bon n'est pas parti par email ` +
        "(fournisseur sans adresse ou envoi d'email non configuré). L'atelier doit le transmettre lui-même, sinon la rupture dure.",
      level: "warning",
      targetType: "atelier_commande",
      targetId: id ?? undefined,
      signature: `bus:atelier_commande_a_transmettre:${numero}`,
    });
    return cree
      ? `Alerte ouverte : commande ${numero} à transmettre.`
      : `Alerte déjà ouverte : commande ${numero} à transmettre.`;
  },

  async smart_atelier_commande_receptionnee(payload) {
    const numero = texte(payload, "numero") || "?";
    const pieces = texte(payload, "piecesEntrees") || "0";
    const closes = await db
      .update(smartAlerts)
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(
        and(
          eq(smartAlerts.status, "open"),
          sql`${smartAlerts.metadata}->>'signature' = ${`bus:atelier_commande_a_transmettre:${numero}`}`,
        ),
      )
      .returning({ id: smartAlerts.id });
    await memoriser({
      categorie: "technique",
      cle: `atelier:reappro:reception:${numero}`,
      titre: `Commande ${numero} réceptionnée`,
      contenu: `${pieces} pièce(s) entrées en stock, mouvements tracés au nom de la commande.`,
      source: "event-bus.smart_atelier_commande_receptionnee",
    });
    return `Commande ${numero} réceptionnée (${pieces} pièce(s)) : ${closes.length} alerte(s) refermée(s).`;
  },

  async smart_atelier_plafond(payload, ctx) {
    const garageId = texte(payload, "garageId") || "?";
    const plafond = nombre(payload, "plafondCents") ?? 0;
    const engage = nombre(payload, "engageCents") ?? 0;
    const depasse = ctx.type === "atelier.reappro_plafond_depasse";
    const demande = nombre(payload, "demandeCents") ?? 0;
    const cree = await raiseAlert({
      category: "service",
      title: depasse
        ? `Commande fournisseur refusée : plafond dépassé (garage ${garageId})`
        : `Plafond de réapprovisionnement presque atteint (garage ${garageId})`,
      description: depasse
        ? `Une commande de ${(demande / 100).toFixed(2)} € a été refusée : ${(engage / 100).toFixed(2)} € déjà engagés sur un plafond de ${(plafond / 100).toFixed(2)} €. Relever le plafond ou réduire la commande.`
        : `${(engage / 100).toFixed(2)} € engagés sur ${(plafond / 100).toFixed(2)} € ce mois : les prochaines ruptures ne pourront plus être commandées sans décision.`,
      level: depasse ? "important" : "warning",
      targetType: "atelier_reappro",
      signature: `bus:atelier_plafond:${depasse ? "depasse" : "proche"}:${garageId}`,
    });
    return cree
      ? `Alerte plafond ${depasse ? "dépassé" : "proche"} ouverte pour le garage ${garageId}.`
      : `Alerte plafond déjà ouverte pour le garage ${garageId}.`;
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
