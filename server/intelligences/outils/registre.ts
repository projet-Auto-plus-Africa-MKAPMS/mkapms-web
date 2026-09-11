/**
 * MKA.P-MS Intelligence — Tool Registry global.
 *
 * Ce fichier dit uniquement CE QUI EXISTE : le catalogue complet des outils
 * qu'un modèle peut demander. Il ne décide jamais qui a le droit de les
 * utiliser (politique.ts) et n'exécute jamais rien lui-même (executeur.ts) —
 * un outil demandé par un modèle traverse toujours politique → executeur →
 * audit avant qu'une seule ligne métier ne tourne.
 *
 * Règle de la direction (corrige une consigne précédente) : on ne retire
 * jamais une capacité du registre parce qu'elle est sensible. Elle y existe
 * toujours, verrouillée par ses propres champs (rôles, pays, abonnement,
 * risque, approbation) — l'absence d'implémentation réelle n'est jamais une
 * absence du registre. Une famille encore non câblée apparaît quand même,
 * avec `implementationStatus: "REGISTERED_NOT_IMPLEMENTED"`.
 *
 * Le système est mondial par conception : `allowedCountries`/
 * `blockedCountries` sont vérifiés par politique.ts contre le Country
 * Engine (server/country-os/) — jamais un pays par défaut codé en dur ici.
 */
import type { Permission } from "../capacites.js";
import type { OutilFonction } from "../provider.js";
import { OUTILS_VEHICULES } from "./familles/vehicules.js";
import { OUTILS_GLOBAUX } from "./familles/globales.js";

export const NIVEAUX_RISQUE = ["READ_ONLY", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type NiveauRisque = (typeof NIVEAUX_RISQUE)[number];

/**
 * `IMPLEMENTED` : code réel, testé, sans dépendance manquante.
 * `IMPLEMENTED_NOT_CONNECTED` : code réel écrit (avec repli honnête), mais
 *   dépend d'un fournisseur externe ou d'une source pas encore configurée.
 * `REGISTERED_NOT_IMPLEMENTED` : la fiche existe, aucun code d'exécution
 *   n'a encore été écrit.
 */
export const STATUTS_IMPLEMENTATION = ["IMPLEMENTED", "IMPLEMENTED_NOT_CONNECTED", "REGISTERED_NOT_IMPLEMENTED"] as const;
export type StatutImplementation = (typeof STATUTS_IMPLEMENTATION)[number];

/** Les familles couvertes au minimum (demande de la direction) — toute nouvelle famille s'ajoute ici. */
export const CATEGORIES = [
  "vehicules",
  "paiements",
  "remboursements",
  "payouts",
  "ledger_comptabilite",
  "fournisseurs",
  "pieces",
  "compatibilite_pieces",
  "stock",
  "transport",
  "livraison",
  "douane",
  "documents",
  "fichiers",
  "recherche",
  "communication",
  "notifications",
  "comptes",
  "roles",
  "permissions",
  "securite",
  "administration",
  "donnees",
  "marketplace",
  "railway_deploiement",
  "observabilite",
  "api_externes",
  "futurs_moteurs",
  "test", // outils de test du socle (server/intelligences/outils/outils-test.ts)
] as const;
export type Categorie = (typeof CATEGORIES)[number];

export interface OutilSpec {
  toolId: string;
  name: string;
  description: string;
  category: Categorie;
  version: string;
  /** JSON Schema des arguments attendus. */
  schemaInput: Record<string, unknown>;
  /** JSON Schema de ce que l'outil renvoie — documentaire. */
  schemaOutput: Record<string, unknown>;
  /** Vrai si la capacité existe quelque part (fournisseur ou code MKA.P-MS), même non connectée. */
  available: boolean;
  /** Interrupteur d'exploitation — indépendant de `available` : une capacité disponible peut rester éteinte. */
  enabled: boolean;
  implementationStatus: StatutImplementation;
  /** Rôles de session autorisés (userRoleEnum) à demander cet outil. */
  allowedRoles: string[];
  /** Codes pays (ISO 3166-1 alpha-2) autorisés ; `null` = tous les pays ouverts au Country Engine. */
  allowedCountries: string[] | null;
  /** Codes pays explicitement bloqués, prioritaires sur `allowedCountries`. */
  blockedCountries: string[];
  /** Permissions (server/intelligences/capacites.ts) exigées en plus du rôle. */
  requiredPermissions: Permission[];
  /** Palier d'abonnement/contrat exigé ; `null` = aucun. */
  requiredSubscription: string | null;
  /** Vrai si aucune exécution ne doit avoir lieu sans validation humaine explicite. */
  requiresHumanApproval: boolean;
  /** Vrai si une authentification forte (au-delà du rôle) est exigée avant exécution. */
  requiresStrongAuthentication: boolean;
  riskLevel: NiveauRisque;
  /** Base légale ou politique interne justifiant l'accès — texte, pas une valeur de secret. */
  legalBasis: string;
  /** D'où vient la capacité : "mkapms" (propriétaire) ou le nom d'un fournisseur externe. */
  provider: string;
  /** Repli déclaré si le fournisseur principal est indisponible ou absent pour ce pays. */
  fallback: string;
  /** État du moteur MKA.P-MS destiné à remplacer le fournisseur externe, s'il y en a un. */
  internalReplacementStatus: string;
  /** Vrai si rejouer l'outil avec les mêmes arguments ne change rien de plus. */
  idempotent: boolean;
  timeoutMs: number;
  auditCategory: string;
}

const OUTILS_TEST: OutilSpec[] = [
  {
    toolId: "test.lire_info_interne",
    name: "lire_info_interne",
    description: "Lit une information interne de test (aucune donnée réelle) pour vérifier la boucle d'outils.",
    category: "test",
    version: "1.0.0",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: { type: "object", properties: { info: { type: "string" }, horodatage: { type: "string" } } },
    available: true,
    enabled: true,
    implementationStatus: "IMPLEMENTED",
    allowedRoles: ["employee", "admin", "super_admin"],
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: ["READ"],
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: "READ_ONLY",
    legalBasis: "Aucune donnée réelle traitée.",
    provider: "mkapms",
    fallback: "Aucun nécessaire — outil propriétaire.",
    internalReplacementStatus: "Déjà propriétaire.",
    idempotent: true,
    timeoutMs: 3000,
    auditCategory: "test_lecture",
  },
  {
    toolId: "test.calcul_simple",
    name: "calcul_simple",
    description: "Additionne, soustrait, multiplie ou divise deux nombres — aucun effet de bord.",
    category: "test",
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
    available: true,
    enabled: true,
    implementationStatus: "IMPLEMENTED",
    allowedRoles: ["user", "pro", "garage", "society", "employee", "admin", "super_admin"],
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: ["READ"],
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: "READ_ONLY",
    legalBasis: "Aucune donnée réelle traitée.",
    provider: "mkapms",
    fallback: "Aucun nécessaire — calcul local.",
    internalReplacementStatus: "Déjà propriétaire.",
    idempotent: true,
    timeoutMs: 3000,
    auditCategory: "test_calcul",
  },
  {
    toolId: "test.recherche_simulee",
    name: "recherche_simulee",
    description: "Renvoie des résultats de recherche simulés (données inventées, jamais un vrai stock) pour vérifier le format d'un aller-retour outil.",
    category: "test",
    version: "1.0.0",
    schemaInput: { type: "object", properties: { requete: { type: "string" } }, required: ["requete"] },
    schemaOutput: { type: "object", properties: { resultats: { type: "array", items: { type: "string" } } } },
    available: true,
    enabled: true,
    implementationStatus: "IMPLEMENTED",
    allowedRoles: ["user", "pro", "garage", "society", "employee", "admin", "super_admin"],
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: ["READ"],
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: "LOW",
    legalBasis: "Données simulées uniquement.",
    provider: "mkapms",
    fallback: "Aucun nécessaire.",
    internalReplacementStatus: "Déjà propriétaire.",
    idempotent: true,
    timeoutMs: 3000,
    auditCategory: "test_recherche",
  },
  {
    toolId: "test.recuperer_statut",
    name: "recuperer_statut",
    description: "Renvoie un statut de test fixe — réservé à la direction, pour vérifier le refus par rôle.",
    category: "test",
    version: "1.0.0",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: { type: "object", properties: { statut: { type: "string" } } },
    available: true,
    enabled: true,
    implementationStatus: "IMPLEMENTED",
    allowedRoles: ["admin", "super_admin"],
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: ["ANALYZE"],
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: "READ_ONLY",
    legalBasis: "Aucune donnée réelle traitée.",
    provider: "mkapms",
    fallback: "Aucun nécessaire.",
    internalReplacementStatus: "Déjà propriétaire.",
    idempotent: true,
    timeoutMs: 3000,
    auditCategory: "test_statut",
  },
  {
    toolId: "test.action_sensible_simulee",
    name: "action_sensible_simulee",
    description: "Action de test qui SIMULE une action sensible (aucun effet réel) — sert uniquement à vérifier que la validation humaine bloque bien l'exécution tant qu'elle n'existe pas.",
    category: "test",
    version: "1.0.0",
    schemaInput: { type: "object", properties: { motif: { type: "string" } }, required: ["motif"] },
    schemaOutput: { type: "object", properties: { simule: { type: "boolean" } } },
    available: true,
    enabled: true,
    implementationStatus: "IMPLEMENTED",
    allowedRoles: ["admin", "super_admin"],
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: ["WRITE"],
    requiredSubscription: null,
    requiresHumanApproval: true,
    requiresStrongAuthentication: true,
    riskLevel: "MEDIUM",
    legalBasis: "Simulation uniquement, aucun effet réel.",
    provider: "mkapms",
    fallback: "Aucun — bloqué tant que l'approbation humaine en boucle n'existe pas.",
    internalReplacementStatus: "Sans objet (outil de test).",
    idempotent: false,
    timeoutMs: 3000,
    auditCategory: "test_sensible",
  },
];

export const OUTILS: OutilSpec[] = [...OUTILS_TEST, ...OUTILS_VEHICULES, ...OUTILS_GLOBAUX];

export function trouver(toolId: string): OutilSpec | null {
  return OUTILS.find((o) => o.toolId === toolId) ?? null;
}

export function listerActifs(): OutilSpec[] {
  return OUTILS.filter((o) => o.enabled);
}

export function listerParCategorie(categorie: Categorie): OutilSpec[] {
  return OUTILS.filter((o) => o.category === categorie);
}

export function resume(): {
  total: number;
  parStatut: Record<StatutImplementation, number>;
  parCategorie: { categorie: Categorie; total: number }[];
} {
  const parStatut = STATUTS_IMPLEMENTATION.reduce(
    (acc, s) => ({ ...acc, [s]: OUTILS.filter((o) => o.implementationStatus === s).length }),
    {} as Record<StatutImplementation, number>,
  );
  const parCategorie = CATEGORIES.map((categorie) => ({
    categorie,
    total: OUTILS.filter((o) => o.category === categorie).length,
  }));
  return { total: OUTILS.length, parStatut, parCategorie };
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
