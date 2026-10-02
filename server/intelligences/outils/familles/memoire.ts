/**
 * MKA.P-MS AI — Tool Registry, famille "memoire" (LOT IA02F).
 *
 * Réutilise les moteurs déjà écrits dans ce même lot (memoire-utilisateur.ts,
 * memoire-projet.ts, in_messages pour la recherche de conversation) — aucune
 * logique dupliquée. Tous réellement implémentés : la mémoire utilisateur et
 * la mémoire projet existent désormais, isolation testée.
 */
import type { Categorie, NiveauRisque, OutilSpec, StatutImplementation } from "../registre.js";

const CATEGORY: Categorie = "memoire";

function outil(partiel: {
  toolId: string;
  name: string;
  description: string;
  schemaInput: Record<string, unknown>;
  schemaOutput: Record<string, unknown>;
  implementationStatus: StatutImplementation;
  riskLevel: NiveauRisque;
  requiresHumanApproval?: boolean;
}): OutilSpec {
  return {
    toolId: partiel.toolId,
    name: partiel.name,
    description: partiel.description,
    category: CATEGORY,
    version: "1.0.0",
    schemaInput: partiel.schemaInput,
    schemaOutput: partiel.schemaOutput,
    available: true,
    enabled: true,
    implementationStatus: partiel.implementationStatus,
    allowedRoles: ["super_admin"],
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: ["READ"],
    requiredSubscription: null,
    requiresHumanApproval: partiel.requiresHumanApproval ?? false,
    requiresStrongAuthentication: false,
    riskLevel: partiel.riskLevel,
    legalBasis: "Mémoire propre au compte appelant — jamais un accès à la mémoire d'un autre compte.",
    provider: "mkapms",
    fallback: "Aucun nécessaire — moteur propriétaire.",
    internalReplacementStatus: "Déjà propriétaire.",
    idempotent: partiel.riskLevel === "READ_ONLY",
    timeoutMs: 5000,
    auditCategory: "memoire",
  };
}

export const OUTILS_MEMOIRE: OutilSpec[] = [
  outil({
    toolId: "memory.read",
    name: "read",
    description: "Lit la mémoire utilisateur (préférences, choix persistants, contexte métier durable) — jamais celle d'un autre compte.",
    schemaInput: { type: "object", properties: { categorie: { type: "string" } }, required: [] },
    schemaOutput: { type: "object", properties: { entrees: { type: "array" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
  }),
  outil({
    toolId: "memory.write",
    name: "write",
    description: "Écrit une entrée de mémoire utilisateur — jamais automatique depuis un message : toujours une demande explicite.",
    schemaInput: {
      type: "object",
      properties: { categorie: { type: "string" }, cle: { type: "string" }, contenu: { type: "string" } },
      required: ["categorie", "cle", "contenu"],
    },
    schemaOutput: { type: "object", properties: { id: { type: "number" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
  }),
  outil({
    toolId: "memory.update",
    name: "update",
    description: "Modifie une entrée de mémoire utilisateur déjà existante.",
    schemaInput: { type: "object", properties: { id: { type: "number" }, contenu: { type: "string" } }, required: ["id"] },
    schemaOutput: { type: "object", properties: { id: { type: "number" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
  }),
  outil({
    toolId: "memory.delete",
    name: "delete",
    description: "Supprime une entrée de mémoire utilisateur.",
    schemaInput: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "MEDIUM",
    requiresHumanApproval: false,
  }),
  outil({
    toolId: "conversation.search",
    name: "conversationSearch",
    description: "Recherche plein texte dans les conversations déjà tenues par ce compte — jamais celles d'un autre compte.",
    schemaInput: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
    schemaOutput: { type: "object", properties: { resultats: { type: "array" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
  }),
  outil({
    toolId: "project.memory.read",
    name: "projectMemoryRead",
    description: "Lit la mémoire structurée d'un projet Chantier (objectifs, décisions, erreurs, environnement…) — refuse si le projet n'appartient pas à l'appelant.",
    schemaInput: { type: "object", properties: { projetId: { type: "number" } }, required: ["projetId"] },
    schemaOutput: { type: "object", properties: { entrees: { type: "array" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
  }),
  outil({
    toolId: "project.memory.write",
    name: "projectMemoryWrite",
    description: "Ajoute une entrée à la mémoire d'un projet (décision, erreur rencontrée, convention adoptée…) — append-only, jamais un écrasement.",
    schemaInput: {
      type: "object",
      properties: { projetId: { type: "number" }, type: { type: "string" }, titre: { type: "string" }, contenu: { type: "string" } },
      required: ["projetId", "type", "contenu"],
    },
    schemaOutput: { type: "object", properties: { id: { type: "number" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
  }),
  outil({
    toolId: "automobile.rechercherMemoire",
    name: "rechercherMemoireAutomobile",
    description:
      "Interroge la Mémoire automobile (marques, types de véhicules, énergies, carrosseries, transmissions, systèmes et familles de pièces). Sans texte de recherche, renvoie l'état de la mémoire : nombre de nœuds par domaine et type, et les sources. Chaque résultat dit son statut : « propose » = vu une seule fois, NON confirmé (le référentiel de départ est une connaissance générale non vérifiée) ; « confirme » = constaté par au moins trois observations indépendantes. Ne jamais présenter un nœud « propose » comme un fait certain, ne jamais inventer ce qui n'y figure pas (années, modèles, groupes propriétaires, compatibilités de pièces) : dire que la mémoire ne le contient pas.",
    schemaInput: {
      type: "object",
      properties: { recherche: { type: "string" }, domaine: { type: "string" }, type: { type: "string" }, limite: { type: "number" } },
      required: [],
    },
    schemaOutput: { type: "object", properties: { resultats: { type: "array" }, etat: { type: "object" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
  }),
];
