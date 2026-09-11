/**
 * MKA.P-MS Intelligence — Tool Registry.
 *
 * Ce fichier dit uniquement CE QUI EXISTE : le catalogue des outils qu'un
 * modèle peut demander. Il ne décide jamais qui a le droit de les utiliser
 * (server/intelligences/outils/politique.ts) et n'exécute jamais rien
 * lui-même (server/intelligences/outils/executeur.ts) — un outil demandé par
 * un modèle n'est jamais exécuté directement : il traverse toujours
 * politique → executeur → audit avant qu'une seule ligne métier ne tourne.
 *
 * Aucune logique métier ici, aucune valeur de secret, aucun outil de
 * paiement/suppression/production/rôles tant que la direction n'a pas validé
 * le mécanisme sur des outils sans risque.
 */
import type { Permission } from "../capacites.js";
import type { OutilFonction } from "../provider.js";

export const NIVEAUX_RISQUE = ["READ_ONLY", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type NiveauRisque = (typeof NIVEAUX_RISQUE)[number];

export interface OutilSpec {
  toolId: string;
  name: string;
  description: string;
  version: string;
  /** JSON Schema des arguments attendus. */
  schemaInput: Record<string, unknown>;
  /** JSON Schema de ce que l'outil renvoie — documentaire pour l'instant. */
  schemaOutput: Record<string, unknown>;
  /** Rôles de session autorisés (userRoleEnum) à demander cet outil. */
  allowedRoles: string[];
  /** Permissions (server/intelligences/capacites.ts) exigées en plus du rôle. */
  requiredPermissions: Permission[];
  /** Vrai si aucune exécution ne doit avoir lieu sans validation humaine explicite. */
  requiresHumanApproval: boolean;
  riskLevel: NiveauRisque;
  /** Vrai si rejouer l'outil avec les mêmes arguments ne change rien de plus. */
  idempotent: boolean;
  timeoutMs: number;
  /** D'où vient l'outil : "mkapms" (propriétaire) ou le nom d'un fournisseur externe. */
  source: string;
  enabled: boolean;
  auditCategory: string;
}

export const OUTILS: OutilSpec[] = [
  {
    toolId: "test.lire_info_interne",
    name: "lire_info_interne",
    description: "Lit une information interne de test (aucune donnée réelle) pour vérifier la boucle d'outils.",
    version: "1.0.0",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: {
      type: "object",
      properties: { info: { type: "string" }, horodatage: { type: "string" } },
    },
    allowedRoles: ["employee", "admin", "super_admin"],
    requiredPermissions: ["READ"],
    requiresHumanApproval: false,
    riskLevel: "READ_ONLY",
    idempotent: true,
    timeoutMs: 3000,
    source: "mkapms",
    enabled: true,
    auditCategory: "test_lecture",
  },
  {
    toolId: "test.calcul_simple",
    name: "calcul_simple",
    description: "Additionne, soustrait, multiplie ou divise deux nombres — aucun effet de bord.",
    version: "1.0.0",
    schemaInput: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
        operation: { type: "string", enum: ["addition", "soustraction", "multiplication", "division"] },
      },
      required: ["a", "b", "operation"],
    },
    schemaOutput: { type: "object", properties: { resultat: { type: "number" } } },
    allowedRoles: ["user", "pro", "garage", "society", "employee", "admin", "super_admin"],
    requiredPermissions: ["READ"],
    requiresHumanApproval: false,
    riskLevel: "READ_ONLY",
    idempotent: true,
    timeoutMs: 3000,
    source: "mkapms",
    enabled: true,
    auditCategory: "test_calcul",
  },
  {
    toolId: "test.recherche_simulee",
    name: "recherche_simulee",
    description: "Renvoie des résultats de recherche simulés (données inventées, jamais un vrai stock) pour vérifier le format d'un aller-retour outil.",
    version: "1.0.0",
    schemaInput: {
      type: "object",
      properties: { requete: { type: "string" } },
      required: ["requete"],
    },
    schemaOutput: {
      type: "object",
      properties: { resultats: { type: "array", items: { type: "string" } } },
    },
    allowedRoles: ["user", "pro", "garage", "society", "employee", "admin", "super_admin"],
    requiredPermissions: ["READ"],
    requiresHumanApproval: false,
    riskLevel: "LOW",
    idempotent: true,
    timeoutMs: 3000,
    source: "mkapms",
    enabled: true,
    auditCategory: "test_recherche",
  },
  {
    toolId: "test.recuperer_statut",
    name: "recuperer_statut",
    description: "Renvoie un statut de test fixe — réservé à la direction, pour vérifier le refus par rôle.",
    version: "1.0.0",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: { type: "object", properties: { statut: { type: "string" } } },
    allowedRoles: ["admin", "super_admin"],
    requiredPermissions: ["ANALYZE"],
    requiresHumanApproval: false,
    riskLevel: "READ_ONLY",
    idempotent: true,
    timeoutMs: 3000,
    source: "mkapms",
    enabled: true,
    auditCategory: "test_statut",
  },
  {
    toolId: "test.action_sensible_simulee",
    name: "action_sensible_simulee",
    description: "Action de test qui SIMULE une action sensible (aucun effet réel) — sert uniquement à vérifier que la validation humaine bloque bien l'exécution tant qu'elle n'existe pas.",
    version: "1.0.0",
    schemaInput: { type: "object", properties: { motif: { type: "string" } }, required: ["motif"] },
    schemaOutput: { type: "object", properties: { simule: { type: "boolean" } } },
    allowedRoles: ["admin", "super_admin"],
    requiredPermissions: ["WRITE"],
    requiresHumanApproval: true,
    riskLevel: "MEDIUM",
    idempotent: false,
    timeoutMs: 3000,
    source: "mkapms",
    enabled: true,
    auditCategory: "test_sensible",
  },
];

export function trouver(toolId: string): OutilSpec | null {
  return OUTILS.find((o) => o.toolId === toolId) ?? null;
}

export function listerActifs(): OutilSpec[] {
  return OUTILS.filter((o) => o.enabled);
}

/** Conversion vers le format que provider.ts transmet au fournisseur. */
export function versOutilFonction(outil: OutilSpec): OutilFonction {
  return {
    type: "function",
    function: {
      name: outil.toolId,
      description: outil.description,
      parameters: outil.schemaInput,
    },
  };
}
