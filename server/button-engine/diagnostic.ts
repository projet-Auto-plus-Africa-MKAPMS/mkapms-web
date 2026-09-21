/**
 * Contrat de diagnostic remis par le Moteur de boutons à MKA PMS IA.
 *
 * Il décrit uniquement des faits déjà connus au moment du clic. Il ne propose
 * jamais de modifier la production : l'action possible reste une instruction
 * de diagnostic/correction à traiter par branche, tests et Pull Request.
 */
import type { ActionBouton } from "./catalogue.js";
import type { DiagnosticMoteur } from "../engine-registry/diagnostic-contract.js";

export type TypeErreurBouton =
  | "action_non_declaree"
  | "action_non_branchee"
  | "destination_introuvable"
  | "execution_en_erreur";

export interface DiagnosticBouton extends DiagnosticMoteur {
  moteur: "boutons";
  typeErreur: TypeErreurBouton;
  permission: string;
  evenement: "bouton.sans_action";
  dependance: "redirection" | "service_proprietaire" | "catalogue_boutons";
  gravite: "warning" | "important";
}

export function construireDiagnosticBouton(input: {
  code: string;
  source?: string;
  outcome: "not_found" | "error";
  resolvedTo?: string;
  error?: string;
  action?: ActionBouton | null;
}): DiagnosticBouton {
  const action = input.action ?? null;
  const route = input.source?.startsWith("/") ? input.source : action?.ecran ?? null;

  if (!action) {
    return {
      moteur: "boutons",
      composant: input.code,
      univers: null,
      typeErreur: "action_non_declaree",
      contexte: `Le code « ${input.code} » a été utilisé par un écran mais n'existe pas dans le catalogue du Moteur de boutons.`,
      route,
      permission: "buttonEngine.signaler (publicProcedure, identité facultative journalisée)",
      evenement: "bouton.sans_action",
      redirection: null,
      dependance: "catalogue_boutons",
      elementsTechniques: [`code=${input.code}`, `outcome=${input.outcome}`],
      gravite: "important",
      actionPossible: "Identifier l'action métier attendue, la déclarer au catalogue existant, puis tester l'écran et le service propriétaire.",
      testsRequis: ["check:boutons", "check:cliquables", "test du moteur propriétaire"],
      traceId: null,
    };
  }

  if (action.genre === "non_branchee") {
    return {
      moteur: "boutons",
      composant: input.code,
      univers: null,
      typeErreur: "action_non_branchee",
      contexte: action.manque ?? "L'action est déclarée mais aucun traitement réel n'est branché.",
      route,
      permission: "buttonEngine.signaler (publicProcedure, identité facultative journalisée)",
      evenement: "bouton.sans_action",
      redirection: null,
      dependance: "service_proprietaire",
      elementsTechniques: [`code=${input.code}`, `genre=${action.genre}`, `ecran=${action.ecran}`],
      gravite: "warning",
      actionPossible: "Auditer le moteur métier propriétaire et brancher son service réel avant de rendre cette action exécutable.",
      testsRequis: ["check:boutons", "test du service propriétaire"],
      traceId: null,
    };
  }

  const destination = input.resolvedTo ?? action.cible ?? "";
  const executionEnErreur = input.outcome === "error";
  return {
    moteur: "boutons",
    composant: input.code,
    univers: null,
    typeErreur: executionEnErreur ? "execution_en_erreur" : "destination_introuvable",
    contexte: input.error || `La destination résolue « ${destination || "non renseignée"} » n'a pas abouti.`,
    route,
    permission: "buttonEngine.signaler (publicProcedure, identité facultative journalisée)",
    evenement: "bouton.sans_action",
    redirection: action.cleRedirection ?? null,
    dependance: action.genre === "navigation" ? "redirection" : "service_proprietaire",
    elementsTechniques: [
      `code=${input.code}`,
      `genre=${action.genre}`,
      `outcome=${input.outcome}`,
      ...(destination ? [`destination=${destination}`] : []),
    ],
    gravite: executionEnErreur ? "important" : "warning",
    actionPossible:
      action.genre === "navigation"
        ? "Vérifier la clé et la règle du Moteur de Redirection, l'existence de la route, puis les permissions de la page cible."
        : "Vérifier le gestionnaire de l'écran, le contrat du service propriétaire et ses permissions.",
    testsRequis:
      action.genre === "navigation"
        ? ["check:routes", "test du Moteur de Redirection", "test de permission de la cible"]
        : ["test du gestionnaire", "test du service propriétaire", "test de permission"],
    traceId: null,
  };
}
