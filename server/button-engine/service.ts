/**
 * MKA.P-MS Button Engine — Service.
 *
 * Le moteur répond à deux questions :
 *  1. « ce bouton, qu'est-ce qu'il fait ? » → `resoudreAction` ;
 *  2. « où en est-on des boutons de la plateforme ? » → `inventaire`.
 *
 * Il ne fabrique aucune action : une action inconnue du catalogue est rendue
 * inconnue, et une action déclarée sans exécution serveur est rendue
 * `non_branchee` avec le manque nommé.
 */
import { ACTIONS_BOUTONS, actionParCode, type ActionBouton, type GenreAction } from "./catalogue.js";
import { resolveKey, reportOutcome } from "../redirection-engine/service.js";
import { isRoutablePath } from "../data/client-routes.js";
import { BOUTONS_SANS_ACTION } from "../data/boutons-sans-action.js";
import { emitSafe } from "../event-bus/service.js";
import { heartbeat } from "../engine-registry/service.js";

export interface ActionResolue {
  code: string;
  connue: boolean;
  genre: GenreAction | null;
  libelle: string | null;
  /** Destination effective (après Moteur de Redirection) ou identifiant. */
  cible: string | null;
  /** Vrai quand la destination vient d'une règle du Moteur de Redirection. */
  parRedirection: boolean;
  /** Destination catalogée qui ne correspond à aucune route existante. */
  cibleCassee: boolean;
  manque: string | null;
}

function inconnue(code: string): ActionResolue {
  return {
    code,
    connue: false,
    genre: null,
    libelle: null,
    cible: null,
    parRedirection: false,
    cibleCassee: false,
    manque: "Ce bouton n'est pas déclaré au Moteur de boutons.",
  };
}

export async function resoudreAction(
  code: string,
  who?: { userId?: number; role?: string; source?: string },
): Promise<ActionResolue> {
  const action = actionParCode(code);
  if (!action) return inconnue(code);

  let cible = action.cible ?? null;
  let parRedirection = false;

  if (action.genre === "navigation" && action.cleRedirection) {
    const regle = await resolveKey(action.cleRedirection, who);
    if (regle.matched && regle.target) {
      cible = regle.target;
      parRedirection = true;
    }
  }

  const cibleCassee =
    action.genre === "navigation" && !!cible && !cible.startsWith("http") && !isRoutablePath(cible);

  return {
    code: action.code,
    connue: true,
    genre: action.genre,
    libelle: action.libelle,
    cible,
    parRedirection,
    cibleCassee,
    manque: action.manque ?? null,
  };
}

export interface ClicInput {
  code: string;
  source?: string;
  outcome: "navigated" | "not_found" | "error";
  resolvedTo?: string;
  error?: string;
}

/**
 * Résultat réel d'un clic.
 *
 * Trois moteurs travaillent ici sans qu'un agent soit présent :
 *  - le Moteur de Redirection journalise le parcours ;
 *  - l'Event Bus remet l'échec au Système Intelligent, qui ouvre l'alerte de
 *    direction et demande à MKA.P-MS Intelligences le dossier de correction ;
 *  - le registre des moteurs reçoit le battement de cœur du Moteur de boutons.
 */
export async function signalerClic(
  input: ClicInput,
  who?: { userId?: number; role?: string },
): Promise<{ recorded: true }> {
  const action = actionParCode(input.code);

  await reportOutcome(
    {
      key: `bouton:${input.code}`,
      source: input.source,
      outcome: input.outcome,
      resolvedTo: input.resolvedTo,
      error: input.error,
    },
    who,
  );

  if (input.outcome !== "navigated") {
    await emitSafe({
      type: "bouton.sans_action",
      source: "boutons",
      payload: {
        code: input.code,
        ecran: input.source ?? action?.ecran ?? "",
        manque:
          input.error ??
          action?.manque ??
          (action
            ? `Destination « ${input.resolvedTo ?? action.cible ?? "?"} » introuvable.`
            : "Bouton non déclaré au Moteur de boutons."),
      },
    });
  }

  await heartbeat("boutons", "ok", {
    message: `Dernier clic : ${input.code} (${input.outcome}).`,
  });

  return { recorded: true };
}

export interface LigneInventaire {
  code: string;
  libelle: string;
  ecran: string;
  genre: GenreAction;
  cible: string | null;
  manque: string | null;
}

export interface InventaireBoutons {
  /** Actions déclarées au moteur, par genre. */
  parGenre: Record<GenreAction, number>;
  /** Actions déclarées mais sans exécution serveur : dette nommée. */
  nonBranchees: LigneInventaire[];
  /** Destinations catalogées qui ne mènent à aucune route existante. */
  ciblesCassees: LigneInventaire[];
  /** Boutons encore muets à l'écran, non déclarés au moteur. */
  boutonsMuets: number;
  ecransMuets: number;
}

export function inventaire(): InventaireBoutons {
  const parGenre: Record<GenreAction, number> = {
    navigation: 0,
    appel: 0,
    email: 0,
    document: 0,
    formulaire: 0,
    non_branchee: 0,
  };
  const nonBranchees: LigneInventaire[] = [];
  const ciblesCassees: LigneInventaire[] = [];

  const ligne = (a: ActionBouton): LigneInventaire => ({
    code: a.code,
    libelle: a.libelle,
    ecran: a.ecran,
    genre: a.genre,
    cible: a.cible ?? null,
    manque: a.manque ?? null,
  });

  for (const action of ACTIONS_BOUTONS) {
    parGenre[action.genre] += 1;
    if (action.genre === "non_branchee") nonBranchees.push(ligne(action));
    if (
      action.genre === "navigation" &&
      action.cible &&
      !action.cible.startsWith("http") &&
      !isRoutablePath(action.cible)
    ) {
      ciblesCassees.push(ligne(action));
    }
  }

  const ecrans = new Set(BOUTONS_SANS_ACTION.map((b) => b.fichier));
  return {
    parGenre,
    nonBranchees,
    ciblesCassees,
    boutonsMuets: BOUTONS_SANS_ACTION.length,
    ecransMuets: ecrans.size,
  };
}
