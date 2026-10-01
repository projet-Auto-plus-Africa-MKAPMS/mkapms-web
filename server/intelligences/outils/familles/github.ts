/**
 * MKA.P-MS AI — Tool Registry, famille GitHub (catégorie « developpement »).
 *
 * Deux outils en LECTURE SEULE, qui utilisent le jeton déposé dans le Coffre
 * secret (server/intelligences/github.ts). Aucun ne pousse, ne lance un
 * workflow ni ne fusionne : le PDG déploie à la main, le moteur pousse le code
 * par la session de développement. Lancer le workflow Android sera un outil
 * distinct, avec approbation humaine.
 *
 * Réservés au PDG, comme le coffre dont ils dépendent.
 */
import type { OutilSpec } from "../registre.js";

const COMMUN = {
  version: "1.0.0",
  available: true,
  enabled: true,
  implementationStatus: "IMPLEMENTED" as const,
  allowedRoles: ["super_admin"],
  allowedCountries: null,
  blockedCountries: [],
  requiredPermissions: ["READ" as const],
  requiredSubscription: null,
  requiresHumanApproval: false,
  requiresStrongAuthentication: false,
  riskLevel: "READ_ONLY" as const,
  provider: "GitHub (jeton du coffre secret, lecture seule)",
  internalReplacementStatus: "Sans objet — GitHub est l'hébergeur du code.",
  idempotent: true,
  timeoutMs: 20_000,
  auditCategory: "developpement_github",
};

export const OUTILS_GITHUB: OutilSpec[] = [
  {
    ...COMMUN,
    toolId: "developpement.githubVerifierConnexion",
    name: "githubVerifierConnexion",
    description:
      "Vérifie que le jeton GitHub déposé dans le Coffre secret donne bien accès au dépôt de la plateforme, et dit si c'est en lecture seule ou en lecture/écriture. Ne renvoie jamais le jeton. Sans jeton déposé, répond comment le déposer.",
    category: "developpement",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: {
      type: "object",
      properties: { ok: { type: "boolean" }, detail: { type: "string" }, depot: { type: "string" }, droits: { type: "object" } },
    },
    legalBasis: "Lecture d'un seul dépôt appartenant à l'entreprise, avec un jeton que le PDG a lui-même déposé ; usage journalisé dans le coffre.",
    fallback: "Jeton absent, refusé ou réseau indisponible : l'outil le dit tel quel — jamais une connexion supposée.",
  },
  {
    ...COMMUN,
    toolId: "developpement.githubExecutionsAndroid",
    name: "githubExecutionsAndroid",
    description:
      "Liste les 5 dernières exécutions du workflow GitHub « Android — App Bundles » (statut, branche, commit) et les fichiers .aab produits par la dernière exécution réussie. Lecture seule : ne lance rien, ne publie rien.",
    category: "developpement",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: {
      type: "object",
      properties: { ok: { type: "boolean" }, detail: { type: "string" }, executions: { type: "array" }, dernierSucces: { type: ["object", "null"] } },
    },
    legalBasis: "Lecture de l'historique d'un workflow du dépôt de l'entreprise, avec un jeton que le PDG a lui-même déposé ; usage journalisé dans le coffre.",
    fallback: "Jeton absent, refusé ou réseau indisponible : l'outil le dit tel quel — jamais un historique supposé.",
  },
];
