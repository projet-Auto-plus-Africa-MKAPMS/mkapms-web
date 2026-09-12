/**
 * Chantier de développement — Planning Agent (point 8 de la demande).
 *
 * Avant une demande de construction ou de modification substantielle, un
 * plan structuré est produit et conservé — mais il n'est jamais un verrou
 * bloquant chaque petite action : c'est la Policy Engine (server/
 * intelligences/outils/politique.ts), par outil et par niveau de risque, qui
 * décide de ce qui s'exécute réellement. Ce plan sert de fil conducteur au
 * modèle pendant la boucle d'outils, pas de porte d'approbation séparée.
 *
 * Passe par server/intelligences/routeur.ts, comme tout appel modèle de ce
 * moteur — jamais provider.ts directement.
 */
import { router } from "../routeur.js";

export interface PlanChantier {
  objectif: string;
  fichiersConcernes: string[];
  outilsNecessaires: string[];
  risques: string[];
  ordreExecution: string[];
  criteresValidation: string[];
}

const SCHEMA_PLAN = {
  type: "object",
  properties: {
    objectif: { type: "string" },
    fichiersConcernes: { type: "array", items: { type: "string" } },
    outilsNecessaires: { type: "array", items: { type: "string" } },
    risques: { type: "array", items: { type: "string" } },
    ordreExecution: { type: "array", items: { type: "string" } },
    criteresValidation: { type: "array", items: { type: "string" } },
  },
  required: ["objectif", "fichiersConcernes", "outilsNecessaires", "risques", "ordreExecution", "criteresValidation"],
} as const;

export interface ResultatPlan {
  ok: boolean;
  plan: PlanChantier | null;
  motif: string;
  texteBrut: string;
}

export async function planifier(input: {
  objectif: string;
  role: string | null;
  contexteProjet: string;
  outilsDisponibles: string[];
}): Promise<ResultatPlan> {
  const r = await router({
    capacite: "raisonnement",
    moteur: "intelligences",
    role: input.role,
    systeme:
      "Tu es l'agent de planification du Chantier de développement MKA.P-MS Intelligence. " +
      "Avant de construire ou modifier un projet, tu produis un plan structuré, concret et court : " +
      "quels fichiers seront touchés, quels outils du Tool Registry seront nécessaires (parmi ceux disponibles), " +
      "quels sont les risques réels (ex. dépendance manquante, script de build absent), dans quel ordre agir, " +
      "et comment on saura que c'est réussi. Réponds uniquement avec le JSON demandé, sans texte autour.",
    message: [
      `Objectif demandé : ${input.objectif}`,
      "",
      `Contexte du projet :\n${input.contexteProjet}`,
      "",
      `Outils réellement disponibles pour cette exécution : ${input.outilsDisponibles.join(", ")}`,
    ].join("\n"),
    sortieStructuree: { nom: "plan_chantier", schema: SCHEMA_PLAN, strict: true },
    confidentialite: "interne",
    maxTokens: 1200,
  });

  if (!r.ok) {
    return { ok: false, plan: null, motif: r.motif, texteBrut: "" };
  }

  try {
    const brut = JSON.parse(r.texte) as PlanChantier;
    return { ok: true, plan: brut, motif: "", texteBrut: r.texte };
  } catch {
    return {
      ok: false,
      plan: null,
      motif: "Le plan renvoyé par le fournisseur n'est pas un JSON valide malgré la sortie structurée demandée.",
      texteBrut: r.texte,
    };
  }
}

/** Rendu texte du plan pour l'injecter tel quel dans le fil de conversation de la boucle d'outils. */
export function rendrePlan(plan: PlanChantier): string {
  return [
    `Objectif : ${plan.objectif}`,
    `Fichiers concernés : ${plan.fichiersConcernes.join(", ") || "à déterminer en cours de route"}`,
    `Outils nécessaires : ${plan.outilsNecessaires.join(", ") || "aucun identifié à l'avance"}`,
    `Risques identifiés : ${plan.risques.join(" | ") || "aucun identifié à l'avance"}`,
    `Ordre d'exécution prévu : ${plan.ordreExecution.map((e, i) => `${i + 1}. ${e}`).join(" ")}`,
    `Critères de validation : ${plan.criteresValidation.join(" | ")}`,
  ].join("\n");
}
