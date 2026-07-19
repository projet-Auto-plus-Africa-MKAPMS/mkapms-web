/**
 * MKA.P-MS Engine Registry — Contrats des moteurs (Phase 1, sujet 2).
 *
 * Formalise, pour chaque moteur, sa "surface déclarée" vis-à-vis des trois
 * moteurs transversaux de contrôle :
 *
 *  - Permission Engine  → pages / endpoints / actions + rôles autorisés
 *  - Redirection Engine → clés de redirection centralisées
 *  - Smart Engine       → signaux remontés (état, erreurs, anomalies…)
 *
 * Objectif (cahier des charges §34–36) : aucun moteur ne s'active sans matrice
 * de permissions, chaque navigation passe par une clé centralisée, et chaque
 * moteur remonte ses signaux au Smart Engine. Le contrat est défini en code
 * (source de vérité, typé) et exposé en lecture au PDG.
 *
 * 100 % additif : aucune table, aucun comportement existant modifié.
 */

/** Rôles applicatifs (alignés sur shared/roles.ts). */
export type EngineRole =
  | "user"
  | "pro"
  | "garage"
  | "employee"
  | "society"
  | "admin"
  | "super_admin";

/** Un point d'accès déclaré par un moteur au Permission Engine. */
export interface PermissionSurface {
  /** Clé stable de l'action/endpoint/page. Ex: "vo.dossier.view". */
  key: string;
  kind: "page" | "endpoint" | "action" | "export";
  /** Rôles autorisés. Vide = interne moteur uniquement (aucun accès direct). */
  roles: EngineRole[];
  description?: string;
}

/** Une clé de redirection déclarée par un moteur au Redirection Engine. */
export interface RedirectionSurface {
  /** Clé centralisée. Ex: "vo.dossier.open". */
  key: string;
  /** Destination par défaut (fallback si aucune règle PDG). */
  defaultTarget: string;
  description?: string;
}

/** Un signal remonté au Smart Engine. */
export interface SmartSignal {
  /** Type d'événement. Ex: "vo.step.blocked". */
  type: string;
  description?: string;
}

/** Contrat complet d'un moteur. */
export interface EngineContract {
  /** Doit correspondre à un `name` du catalogue (catalog.ts). */
  engine: string;
  version: string;
  permissions: PermissionSurface[];
  redirections: RedirectionSurface[];
  smartSignals: SmartSignal[];
}

/**
 * Contrats des moteurs déjà en place. On formalise ici la surface des moteurs
 * existants ; les nouveaux moteurs (payment, search…) ajouteront leur contrat
 * lors de leur création (Phase 2), ce qui les rendra activables.
 */
export const ENGINE_CONTRACTS: EngineContract[] = [
  {
    engine: "core",
    version: "1.0.0",
    permissions: [
      {
        key: "core.control.view",
        kind: "page",
        roles: ["super_admin", "admin"],
        description: "Centre de contrôle des moteurs (Direction).",
      },
    ],
    redirections: [
      { key: "core.control.open", defaultTarget: "/admin", description: "Ouvrir le centre de contrôle." },
    ],
    smartSignals: [
      { type: "core.event.dispatched", description: "Événement routé entre moteurs." },
      { type: "core.event.failed", description: "Échec de routage d'un événement." },
    ],
  },
  {
    engine: "permission",
    version: "1.0.0",
    permissions: [
      { key: "permission.matrix.view", kind: "page", roles: ["super_admin"], description: "Matrice des permissions." },
    ],
    redirections: [],
    smartSignals: [
      { type: "permission.denied", description: "Accès refusé (à analyser)." },
    ],
  },
  {
    engine: "redirection",
    version: "1.0.0",
    permissions: [
      { key: "redirection.rules.view", kind: "page", roles: ["super_admin"], description: "Règles de redirection." },
    ],
    redirections: [],
    smartSignals: [
      { type: "redirection.unmatched", description: "Clé demandée sans règle active." },
    ],
  },
  {
    engine: "smart",
    version: "1.0.0",
    permissions: [
      { key: "smart.control.view", kind: "page", roles: ["super_admin"], description: "Centre de contrôle Smart Engine." },
    ],
    redirections: [],
    smartSignals: [],
  },
  {
    engine: "vo",
    version: "1.0.0",
    permissions: [
      { key: "vo.dossier.view", kind: "page", roles: ["super_admin", "admin", "employee"], description: "VO Interne confidentiel (équipe)." },
      { key: "vo.pro.view", kind: "page", roles: ["user", "pro", "employee", "admin", "super_admin"], description: "VO Pro (aperçu ; usage sous abonnement)." },
    ],
    redirections: [
      { key: "vo.interne.open", defaultTarget: "/vo", description: "Ouvrir le VO Interne (équipe)." },
      { key: "vo.pro.open", defaultTarget: "/vente", description: "Ouvrir l'espace VO Pro." },
    ],
    smartSignals: [
      { type: "vo.step.blocked", description: "Étape VO bloquée faute de validation." },
    ],
  },
];

export function getContract(engine: string): EngineContract | undefined {
  return ENGINE_CONTRACTS.find((c) => c.engine === engine);
}

/** Vérifie qu'un moteur possède au moins une matrice de permissions (§35). */
export function hasPermissionMatrix(engine: string): boolean {
  const c = getContract(engine);
  return !!c && c.permissions.length > 0;
}

/** Synthèse par moteur (pour le portail PDG). */
export function contractSummary() {
  return ENGINE_CONTRACTS.map((c) => ({
    engine: c.engine,
    version: c.version,
    permissions: c.permissions.length,
    redirections: c.redirections.length,
    smartSignals: c.smartSignals.length,
    hasPermissionMatrix: c.permissions.length > 0,
  }));
}
