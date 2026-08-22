/**
 * Point 145 — les actions du propriétaire, depuis le contrôle web.
 *
 * Ce fichier ne crée aucun moteur : il **relie** les commandes de direction aux
 * moteurs qui existent déjà (Centre de Commandes, Résilience, registre central,
 * Fabrique Intelligence, autonomie, mémoire fédérée). Chaque action passe par
 * la même chaîne, sans exception :
 *
 *   authentification → permission technique → niveau d'autonomie
 *   → effet réel ou proposition → journal
 *
 * Deux distinctions sont tenues volontairement :
 *
 *  - **proposer n'est pas exécuter.** Une action dont l'effet est irréversible
 *    (déploiement, retour arrière, maintenance, arrêt d'un moteur) ne s'exécute
 *    pas sur un clic : elle ouvre une demande de confirmation critique de la
 *    Résilience, avec sa phrase de confirmation. C'est le PDG qui confirme.
 *  - **consulter n'est pas agir.** Les dix-neuf actions demandées comprennent
 *    des consultations : elles n'exigent que READ et ne demandent aucune
 *    confirmation.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { listCommands, listDevRequests } from "../command-center/service.js";
import { getEngine, listEngines, setState } from "../engine-registry/service.js";
import {
  classifyRisk,
  confirmCritical,
  listPipelines,
  recordPipelineStep,
  requestCriticalConfirmation,
  setEmergency,
} from "../resilience/service.js";
import { providerStates, setProviderSuspended, costSummary } from "../ai-fabric/service.js";
import { registre, type Permission } from "./capacites.js";
import { etat as etatAutonomie, regler as reglerAutonomie } from "./autonomie.js";
import {
  attribuer,
  tableau as tableauPermissions,
  verifier,
  type Portee,
} from "./permissions.js";
import { evaluation } from "./evaluation.js";
import { etat as etatShadow, regler as reglerShadow } from "./shadow.js";
import { etat as etatMemoire } from "./memoire.js";
import { missions } from "./orchestrateur.js";
import { inActions, inCapaciteEtat } from "./schema.js";

/** Les dix-neuf actions de la liste, dans l'ordre où elles ont été demandées. */
export const CODES_ACTION = [
  "activer_capacite",
  "desactiver_capacite",
  "changer_fournisseur",
  "changer_moteur",
  "changer_autonomie",
  "autoriser_action",
  "voir_missions",
  "voir_erreurs",
  "voir_couts",
  "voir_code",
  "voir_tests",
  "deployer",
  "retour_arriere",
  "maintenance",
  "arreter_moteur",
  "reactiver_moteur",
  "modifier_permissions",
  "voir_memoire",
  "voir_connecteurs",
] as const;
export type CodeAction = (typeof CODES_ACTION)[number];

export interface SpecAction {
  code: CodeAction;
  libelle: string;
  /** Ce que l'action fait réellement, en clair. */
  effet: string;
  permission: Permission;
  /** Domaine du curseur d'autonomie qui la gouverne. */
  domaine: string;
  /** Vrai quand l'action ne fait que lire : aucun effet, aucune confirmation. */
  lecture: boolean;
  /**
   * Vrai quand l'effet est sensible ou irréversible : l'action ouvre alors une
   * demande de confirmation au lieu de s'exécuter.
   */
  confirmation: boolean;
  /** Paramètre attendu, pour que l'écran sache quoi demander. */
  argument: string;
}

export const ACTIONS: SpecAction[] = [
  {
    code: "activer_capacite",
    libelle: "Activer une capacité",
    effet: "Rouvre une capacité du registre au routeur, si un fournisseur la rend réellement joignable.",
    permission: "ADMINISTRATION",
    domaine: "moteurs",
    lecture: false,
    confirmation: false,
    argument: "code de la capacité",
  },
  {
    code: "desactiver_capacite",
    libelle: "Désactiver une capacité",
    effet: "Refuse la capacité à tous les moteurs, même si le fournisseur répond. Le motif est rendu aux appelants.",
    permission: "ADMINISTRATION",
    domaine: "moteurs",
    lecture: false,
    confirmation: false,
    argument: "code de la capacité",
  },
  {
    code: "changer_fournisseur",
    libelle: "Changer de fournisseur",
    effet: "Impose un fournisseur pour une capacité, ou rend la main au routage par confidentialité, pays et coût.",
    permission: "ADMINISTRATION",
    domaine: "moteurs",
    lecture: false,
    confirmation: false,
    argument: "capacité:fournisseur (ou capacité: pour rendre la main)",
  },
  {
    code: "changer_moteur",
    libelle: "Changer de moteur",
    effet: "Nomme le moteur MKA.P-MS candidat d'une capacité et sa part de trafic, dans les paliers prouvés.",
    permission: "ADMINISTRATION",
    domaine: "moteurs",
    lecture: false,
    confirmation: false,
    argument: "capacité:moteur:part",
  },
  {
    code: "changer_autonomie",
    libelle: "Changer le niveau d'autonomie",
    effet: "Règle le curseur 1 à 7 d'un domaine. Un motif écrit est exigé et conservé.",
    permission: "ADMINISTRATION",
    domaine: "global",
    lecture: false,
    confirmation: false,
    argument: "domaine:niveau",
  },
  {
    code: "autoriser_action",
    libelle: "Autoriser une action",
    effet: "Confirme une demande critique en attente, avec sa phrase de confirmation. C'est cette action qui débloque les effets irréversibles préparés par les autres.",
    permission: "ADMINISTRATION",
    domaine: "global",
    lecture: false,
    confirmation: false,
    argument: "identifiant de la demande",
  },
  {
    code: "voir_missions",
    libelle: "Consulter les missions",
    effet: "Missions de l'orchestrateur, avec l'étape d'arrêt quand elles se sont arrêtées.",
    permission: "READ",
    domaine: "global",
    lecture: true,
    confirmation: false,
    argument: "",
  },
  {
    code: "voir_erreurs",
    libelle: "Consulter les erreurs",
    effet: "Appels refusés et échecs fournisseurs réellement constatés, avec leur motif.",
    permission: "READ",
    domaine: "global",
    lecture: true,
    confirmation: false,
    argument: "",
  },
  {
    code: "voir_couts",
    libelle: "Consulter les coûts",
    effet: "Consommation par fournisseur, en distinguant coût mesuré et coût non renseigné.",
    permission: "READ",
    domaine: "global",
    lecture: true,
    confirmation: false,
    argument: "",
  },
  {
    code: "voir_code",
    libelle: "Consulter le code généré",
    effet: "Dossiers de développement produits par le système, avec leur état de pipeline.",
    permission: "READ",
    domaine: "code",
    lecture: true,
    confirmation: false,
    argument: "",
  },
  {
    code: "voir_tests",
    libelle: "Consulter les tests",
    effet: "Passages de pipeline et contrôles associés, franchis ou bloqués.",
    permission: "READ",
    domaine: "code",
    lecture: true,
    confirmation: false,
    argument: "",
  },
  {
    code: "deployer",
    libelle: "Déployer",
    effet: "Franchit l'étape de mise en production d'un passage de pipeline. Refusé si une étape obligatoire manque.",
    permission: "DEPLOY",
    domaine: "code",
    lecture: false,
    confirmation: true,
    argument: "identifiant du passage",
  },
  {
    code: "retour_arriere",
    libelle: "Retour arrière",
    effet: "Déclare le retour arrière d'un passage de pipeline et le rouvre à la surveillance.",
    permission: "DEPLOY",
    domaine: "code",
    lecture: false,
    confirmation: true,
    argument: "identifiant du passage",
  },
  {
    code: "maintenance",
    libelle: "Mettre en maintenance",
    effet: "Ferme la plateforme au public sans rien détruire, à l'échelle mondiale ou d'un pays.",
    permission: "INFRASTRUCTURE",
    domaine: "infrastructure",
    lecture: false,
    confirmation: true,
    argument: "mondial | pays:CODE | ouvert",
  },
  {
    code: "arreter_moteur",
    libelle: "Arrêter un moteur",
    effet: "Suspend un moteur du registre central. Ses dépendants sont nommés avant la confirmation.",
    permission: "INFRASTRUCTURE",
    domaine: "infrastructure",
    lecture: false,
    confirmation: true,
    argument: "nom du moteur",
  },
  {
    code: "reactiver_moteur",
    libelle: "Réactiver un moteur",
    effet: "Remet un moteur en service et lui rend ses appels.",
    permission: "INFRASTRUCTURE",
    domaine: "infrastructure",
    lecture: false,
    confirmation: false,
    argument: "nom du moteur",
  },
  {
    code: "modifier_permissions",
    libelle: "Modifier les permissions",
    effet: "Attribue ou retire une permission technique à un rôle ou à un moteur.",
    permission: "ADMINISTRATION",
    domaine: "global",
    lecture: false,
    confirmation: false,
    argument: "role|moteur:cible:PERM,PERM",
  },
  {
    code: "voir_memoire",
    libelle: "Consulter la mémoire",
    effet: "Mémoire fédérée, catégorie par catégorie, avec son détenteur réel.",
    permission: "READ",
    domaine: "global",
    lecture: true,
    confirmation: false,
    argument: "",
  },
  {
    code: "voir_connecteurs",
    libelle: "Consulter les connecteurs",
    effet: "Fournisseurs déclarés, état constaté, résidence des données et motif d'indisponibilité.",
    permission: "READ",
    domaine: "global",
    lecture: true,
    confirmation: false,
    argument: "",
  },
];

export function specAction(code: string): SpecAction | null {
  return ACTIONS.find((a) => a.code === code) ?? null;
}

export interface ResultatAction {
  code: string;
  /** `execute`, `propose`, `refuse` — jamais « fait » quand rien n'a eu lieu. */
  resultat: "execute" | "propose" | "refuse";
  detail: string;
  /** Données consultées, pour les actions de lecture. */
  donnees?: unknown;
  /** Demande de confirmation ouverte, quand l'effet est irréversible. */
  confirmation?: { id: number; phrase: string };
}

async function tracer(input: {
  code: string;
  argument: string;
  resultat: ResultatAction["resultat"];
  detail: string;
  actorId?: number;
  pipelineRunId?: number;
}): Promise<void> {
  await db.insert(inActions).values({
    commande: input.code.slice(0, 48),
    argument: input.argument.slice(0, 2000),
    resultat: input.resultat,
    detail: input.detail.slice(0, 4000),
    pipelineRunId: input.pipelineRunId ?? null,
    actorId: input.actorId ?? null,
  });
}

async function activerCapacite(
  capacite: string,
  actif: boolean,
  motif: string,
  actorId?: number,
): Promise<ResultatAction> {
  const constate = (await registre()).find((c) => c.code === capacite);
  if (!constate) {
    return { code: actif ? "activer_capacite" : "desactiver_capacite", resultat: "refuse", detail: `Capacité inconnue « ${capacite} ».` };
  }

  const [ligne] = await db
    .select()
    .from(inCapaciteEtat)
    .where(eq(inCapaciteEtat.capacite, capacite))
    .limit(1);

  if (ligne) {
    await db
      .update(inCapaciteEtat)
      .set({ actif, motif, actorId: actorId ?? null, updatedAt: new Date() })
      .where(eq(inCapaciteEtat.id, ligne.id));
  } else {
    await db.insert(inCapaciteEtat).values({ capacite, actif, motif, actorId: actorId ?? null });
  }

  // Activer une capacité ne la rend pas joignable : on le dit, plutôt que de
  // laisser croire que le fournisseur est revenu.
  const reserve =
    actif && constate.etat !== "disponible"
      ? ` Attention : elle reste ${constate.etat} pour le moment — ${constate.motif}`
      : "";

  return {
    code: actif ? "activer_capacite" : "desactiver_capacite",
    resultat: "execute",
    detail: `« ${constate.libelle} » ${actif ? "activée" : "désactivée"} par la direction.${reserve}`,
  };
}

async function changerFournisseur(
  argument: string,
  motif: string,
  actorId?: number,
): Promise<ResultatAction> {
  const [capacite, fournisseur = ""] = argument.split(":").map((p) => p.trim());
  const constate = (await registre()).find((c) => c.code === capacite);
  if (!constate) {
    return { code: "changer_fournisseur", resultat: "refuse", detail: `Capacité inconnue « ${capacite} ».` };
  }

  if (fournisseur) {
    const etats = await providerStates();
    const cible = etats.find((e) => e.code === fournisseur);
    if (!cible) {
      return {
        code: "changer_fournisseur",
        resultat: "refuse",
        detail: `Fournisseur « ${fournisseur} » absent de la Fabrique : aucun appel ne peut lui être adressé.`,
      };
    }
    if (cible.status !== "actif" && cible.status !== "configure") {
      return {
        code: "changer_fournisseur",
        resultat: "refuse",
        detail: `Fournisseur « ${cible.label} » en état ${cible.status} : l'imposer produirait des échecs. ${cible.statusReason}`.trim(),
      };
    }
  }

  const [ligne] = await db
    .select()
    .from(inCapaciteEtat)
    .where(eq(inCapaciteEtat.capacite, capacite))
    .limit(1);

  if (ligne) {
    await db
      .update(inCapaciteEtat)
      .set({
        fournisseurImpose: fournisseur || null,
        motif,
        actorId: actorId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(inCapaciteEtat.id, ligne.id));
  } else {
    await db.insert(inCapaciteEtat).values({
      capacite,
      fournisseurImpose: fournisseur || null,
      motif,
      actorId: actorId ?? null,
    });
  }

  return {
    code: "changer_fournisseur",
    resultat: "execute",
    detail: fournisseur
      ? `« ${constate.libelle} » passe par ${fournisseur}. Le routage par confidentialité, pays et coût est contourné pour cette capacité.`
      : `« ${constate.libelle} » revient au routage automatique de la Fabrique Intelligence.`,
  };
}

async function changerMoteur(
  argument: string,
  motif: string,
  actorId?: number,
): Promise<ResultatAction> {
  const [capacite, moteur = "", part = ""] = argument.split(":").map((p) => p.trim());
  const r = await reglerShadow({
    capacite,
    candidat: moteur || undefined,
    actif: true,
    part: part === "" ? undefined : Number(part),
    motif,
    actorId,
  });
  return {
    code: "changer_moteur",
    resultat: r.ok ? "execute" : "refuse",
    detail: r.detail,
  };
}

async function deployer(
  argument: string,
  motif: string,
  actorId: number,
): Promise<ResultatAction> {
  const id = Number(argument);
  if (!Number.isInteger(id) || id <= 0) {
    return { code: "deployer", resultat: "refuse", detail: "Identifiant de passage attendu." };
  }
  const r = await recordPipelineStep({
    id,
    step: "production",
    status: "ok",
    detail: `Mise en production décidée par la direction. ${motif}`.trim(),
  });
  return {
    code: "deployer",
    resultat: r.ok ? "execute" : "refuse",
    detail: r.detail,
  };
}

async function retourArriere(
  argument: string,
  motif: string,
): Promise<ResultatAction> {
  const id = Number(argument);
  if (!Number.isInteger(id) || id <= 0) {
    return { code: "retour_arriere", resultat: "refuse", detail: "Identifiant de passage attendu." };
  }
  const r = await recordPipelineStep({
    id,
    step: "rollback",
    status: "ok",
    detail: `Retour arrière décidé par la direction. ${motif}`.trim(),
  });
  return {
    code: "retour_arriere",
    resultat: r.ok ? "execute" : "refuse",
    detail: `${r.detail} Le passage reste sous surveillance : un retour arrière n'est pas une fin de dossier.`,
  };
}

async function maintenance(
  argument: string,
  motif: string,
  actorId: number,
): Promise<ResultatAction> {
  const [portee, code = ""] = argument.split(":").map((p) => p.trim());
  if (portee === "ouvert") {
    const r = await setEmergency({
      scope: "mondial",
      level: "ouvert",
      reason: motif,
      actorId,
    });
    return { code: "maintenance", resultat: r.ok ? "execute" : "refuse", detail: r.detail };
  }
  const r = await setEmergency({
    scope: portee === "pays" ? "pays" : "mondial",
    scopeKey: code,
    level: "maintenance",
    reason: motif,
    publicMessage: motif,
    actorId,
  });
  return { code: "maintenance", resultat: r.ok ? "execute" : "refuse", detail: r.detail };
}

async function arreterMoteur(nom: string, motif: string, actorId: number): Promise<ResultatAction> {
  const moteur = await getEngine(nom);
  if (!moteur) {
    return { code: "arreter_moteur", resultat: "refuse", detail: `Moteur « ${nom} » absent du registre central.` };
  }
  await setState(nom, "disabled", actorId);
  // Un fournisseur porte le même nom que son connecteur : on le suspend aussi
  // quand il en existe un, sinon les appels continueraient de partir.
  const etats = await providerStates();
  if (etats.some((e) => e.code === nom)) {
    await setProviderSuspended({ code: nom, suspended: true, actorId });
  }
  return {
    code: "arreter_moteur",
    resultat: "execute",
    detail: `Moteur « ${moteur.label ?? nom} » suspendu. Motif : ${motif || "non renseigné"}.`,
  };
}

async function reactiverMoteur(nom: string, motif: string, actorId: number): Promise<ResultatAction> {
  const moteur = await getEngine(nom);
  if (!moteur) {
    return { code: "reactiver_moteur", resultat: "refuse", detail: `Moteur « ${nom} » absent du registre central.` };
  }
  await setState(nom, "active", actorId);
  const etats = await providerStates();
  if (etats.some((e) => e.code === nom)) {
    await setProviderSuspended({ code: nom, suspended: false, actorId });
  }
  return {
    code: "reactiver_moteur",
    resultat: "execute",
    detail: `Moteur « ${moteur.label ?? nom} » réactivé. Motif : ${motif || "non renseigné"}.`,
  };
}

async function modifierPermissions(
  argument: string,
  motif: string,
  actorId?: number,
): Promise<ResultatAction> {
  const [portee, cible = "", liste = ""] = argument.split(":").map((p) => p.trim());
  if (portee !== "role" && portee !== "moteur") {
    return {
      code: "modifier_permissions",
      resultat: "refuse",
      detail: "Portée attendue : « role » ou « moteur ».",
    };
  }
  const r = await attribuer({
    portee: portee as Portee,
    cible,
    permissions: liste
      .split(",")
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean),
    motif,
    actorId,
  });
  return {
    code: "modifier_permissions",
    resultat: r.ok ? "execute" : "refuse",
    detail: r.detail,
  };
}

async function lecture(code: CodeAction): Promise<unknown> {
  switch (code) {
    case "voir_missions":
      return missions(60);
    case "voir_erreurs": {
      const e = await evaluation(30);
      return { fournisseurs: e.fournisseurs, manques: e.manques };
    }
    case "voir_couts":
      return costSummary(30);
    case "voir_code":
      return listDevRequests(40);
    case "voir_tests":
      return listPipelines(40);
    case "voir_memoire":
      return etatMemoire();
    case "voir_connecteurs":
      return providerStates();
    default:
      return null;
  }
}

export interface DemandeAction {
  code: string;
  argument?: string;
  motif?: string;
  role: string | null;
  actorId: number;
  /** Phrase de confirmation, quand le PDG confirme une action sensible. */
  phrase?: string;
}

/**
 * Exécute une action de direction. Le retour dit toujours ce qui a réellement
 * eu lieu : exécuté, proposé et en attente de confirmation, ou refusé avec le
 * motif.
 */
export async function executer(demande: DemandeAction): Promise<ResultatAction> {
  const s = specAction(demande.code);
  if (!s) {
    return { code: demande.code, resultat: "refuse", detail: `Action inconnue « ${demande.code} ».` };
  }

  const argument = (demande.argument ?? "").trim();
  const motif = (demande.motif ?? "").trim();

  const droit = await verifier({
    role: demande.role,
    moteur: "intelligences",
    permission: s.permission,
  });
  if (!droit.autorise) {
    const refus: ResultatAction = { code: s.code, resultat: "refuse", detail: droit.motif };
    await tracer({ ...refus, argument, actorId: demande.actorId });
    return refus;
  }

  if (!s.lecture && motif.length < 4) {
    const refus: ResultatAction = {
      code: s.code,
      resultat: "refuse",
      detail: "Motif écrit exigé : une action de direction sans motif ne serait pas explicable plus tard.",
    };
    await tracer({ ...refus, argument, actorId: demande.actorId });
    return refus;
  }

  if (s.lecture) {
    const donnees = await lecture(s.code);
    await tracer({
      code: s.code,
      argument,
      resultat: "execute",
      detail: `Consultation : ${s.libelle}.`,
      actorId: demande.actorId,
    });
    return { code: s.code, resultat: "execute", detail: s.effet, donnees };
  }

  /**
   * Effet sensible : on ouvre une demande de confirmation au lieu d'agir. Rien
   * n'est appliqué avant que le PDG ne renvoie la phrase exacte.
   */
  if (s.confirmation && !demande.phrase) {
    const dependants =
      s.code === "arreter_moteur"
        ? (await listEngines())
            .filter((e) => (e.dependencies ?? []).includes(argument))
            .map((e) => e.name)
        : [];

    const requete = await requestCriticalConfirmation({
      actionType: `intelligences_${s.code}`,
      title: `${s.libelle} — ${argument || "sans argument"}`,
      impact:
        `${s.effet} Motif de la direction : ${motif}.` +
        (dependants.length > 0
          ? ` Moteurs dépendants qui perdront ce service : ${dependants.join(", ")}.`
          : ""),
      reversible: s.code === "maintenance" || s.code === "arreter_moteur",
      params: { argument, motif },
      requestedBy: demande.actorId,
    });

    const propose: ResultatAction = {
      code: s.code,
      resultat: "propose",
      detail: `Action préparée, pas exécutée. Confirmation attendue avec la phrase « ${requete.challenge} » (risque ${classifyRisk(
        s.code,
      )}/3).`,
      confirmation: { id: requete.id, phrase: requete.challenge },
    };
    await tracer({ ...propose, argument, actorId: demande.actorId });
    return propose;
  }

  let resultat: ResultatAction;
  switch (s.code) {
    case "activer_capacite":
      resultat = await activerCapacite(argument, true, motif, demande.actorId);
      break;
    case "desactiver_capacite":
      resultat = await activerCapacite(argument, false, motif, demande.actorId);
      break;
    case "changer_fournisseur":
      resultat = await changerFournisseur(argument, motif, demande.actorId);
      break;
    case "changer_moteur":
      resultat = await changerMoteur(argument, motif, demande.actorId);
      break;
    case "changer_autonomie": {
      const [domaine, niveau] = argument.split(":").map((p) => p.trim());
      const n = Number(niveau);
      if (![1, 2, 3, 4, 5, 6, 7].includes(n)) {
        resultat = { code: s.code, resultat: "refuse", detail: "Niveau attendu entre 1 et 7." };
        break;
      }
      await reglerAutonomie({
        domaine,
        niveau: n as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        motif,
        actorId: demande.actorId,
      });
      resultat = {
        code: s.code,
        resultat: "execute",
        detail: `Domaine « ${domaine} » réglé au niveau ${n}. Le curseur limite ce que la plateforme fait seule, il n'élargit pas les permissions.`,
      };
      break;
    }
    case "autoriser_action": {
      if (!demande.phrase) {
        resultat = {
          code: s.code,
          resultat: "refuse",
          detail:
            "Phrase de confirmation manquante : une action critique ne se débloque pas d'un clic.",
        };
        break;
      }
      const r = await confirmCritical(Number(argument), demande.actorId, demande.phrase);
      resultat = { code: s.code, resultat: r.ok ? "execute" : "refuse", detail: r.detail };
      break;
    }
    case "deployer":
      resultat = await deployer(argument, motif, demande.actorId);
      break;
    case "retour_arriere":
      resultat = await retourArriere(argument, motif);
      break;
    case "maintenance":
      resultat = await maintenance(argument, motif, demande.actorId);
      break;
    case "arreter_moteur":
      resultat = await arreterMoteur(argument, motif, demande.actorId);
      break;
    case "reactiver_moteur":
      resultat = await reactiverMoteur(argument, motif, demande.actorId);
      break;
    case "modifier_permissions":
      resultat = await modifierPermissions(argument, motif, demande.actorId);
      break;
    default:
      resultat = {
        code: s.code,
        resultat: "refuse",
        detail: "Action reconnue mais sans effet branché : rien n'a été exécuté.",
      };
  }

  await tracer({
    code: s.code,
    argument,
    resultat: resultat.resultat,
    detail: resultat.detail,
    actorId: demande.actorId,
  });
  return resultat;
}

/** Journal des actions de direction, du plus récent au plus ancien. */
export async function journal(limit = 80) {
  return db.select().from(inActions).orderBy(desc(inActions.id)).limit(limit);
}

/**
 * Tableau de bord des actions : ce que le rôle peut réellement déclencher
 * aujourd'hui, et ce qui exigera une confirmation.
 */
export async function tableauDeBord(role: string | null): Promise<{
  actions: (SpecAction & { disponible: boolean; motif: string })[];
  permissions: Awaited<ReturnType<typeof tableauPermissions>>;
  autonomie: Awaited<ReturnType<typeof etatAutonomie>>;
  shadow: Awaited<ReturnType<typeof etatShadow>>;
  commandes: Awaited<ReturnType<typeof listCommands>>;
}> {
  const actions: (SpecAction & { disponible: boolean; motif: string })[] = [];
  for (const a of ACTIONS) {
    const droit = await verifier({ role, moteur: "intelligences", permission: a.permission });
    actions.push({
      ...a,
      disponible: droit.autorise,
      motif: droit.autorise
        ? a.confirmation
          ? "Disponible, sous confirmation écrite."
          : "Disponible."
        : droit.motif,
    });
  }

  return {
    actions,
    permissions: await tableauPermissions(),
    autonomie: await etatAutonomie(),
    shadow: await etatShadow(),
    commandes: await listCommands(30),
  };
}
