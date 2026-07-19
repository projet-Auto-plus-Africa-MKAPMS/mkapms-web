/**
 * Identity OS — Contrat API (Sprint 0)
 *
 * Ce fichier définit la SURFACE PUBLIQUE de l'Identity Operating System.
 * Il n'implémente pas encore la logique (Sprint 1).
 *
 * Principe : autonome ET collaboratif (règle MOS #11).
 * Les autres moteurs interagissent avec Identity OS UNIQUEMENT via
 * les types exportés ici — jamais en accédant à la table `users`
 * directement.
 */

/** 9 types d'identité MKA.P-MS. Ordre stable — utilisé comme enum en DB. */
export const IDENTITY_TYPES = [
  "visitor",
  "user",
  "pro",
  "partner",
  "franchisee",
  "universe_operator",
  "employee",
  "admin",
  "ai_agent",
] as const;
export type IdentityType = (typeof IDENTITY_TYPES)[number];

/** Rôles fins portés par une identité (une identité peut en cumuler). */
export const IDENTITY_ROLES = [
  "buyer", "seller", "renter", "lessor",
  "garage_owner", "mechanic", "carrier",
  "franchisee_owner", "universe_operator",
  "employee_support", "employee_dev", "employee_ops",
  "admin", "super_admin", "pdg",
  "ai_agent_garage", "ai_agent_sales", "ai_agent_seo",
  "ai_agent_accounting", "ai_agent_marketing", "ai_agent_support",
] as const;
export type IdentityRole = (typeof IDENTITY_ROLES)[number];

/** Contexte enrichi d'une identité (calculé côté serveur à chaque me()). */
export interface IdentityContext {
  id: number;
  type: IdentityType;
  roles: IdentityRole[];
  countryCode?: string;   // ISO 3166-1 alpha-2 — vient du Country OS
  languageCode?: string;  // ISO 639-1 — vient du Language OS
  status: "active" | "suspended" | "archived";
  createdAt: string;
  lastLoginAt?: string;
}

/** Événements Identity OS — consommés par les autres moteurs via bus interne. */
export type IdentityEvent =
  | { type: "identity.created"; identityId: number; identityType: IdentityType }
  | { type: "identity.upgraded"; identityId: number; from: IdentityType; to: IdentityType }
  | { type: "identity.suspended"; identityId: number; reason: string }
  | { type: "identity.reactivated"; identityId: number }
  | { type: "identity.session.started"; identityId: number; sessionId: string; deviceId?: string }
  | { type: "identity.session.ended"; identityId: number; sessionId: string; reason: "logout" | "expired" | "revoked" }
  | { type: "identity.security.alert"; identityId?: number; kind: "brute_force" | "unusual_location" | "leaked_credentials"; details: unknown };

/** Rôles requis pour un type d'identité (défauts — extensibles par admin). */
export const DEFAULT_ROLES_BY_TYPE: Record<IdentityType, IdentityRole[]> = {
  visitor: [],
  user: ["buyer", "renter"],
  pro: ["seller", "lessor"],
  partner: [],
  franchisee: ["franchisee_owner"],
  universe_operator: ["universe_operator"],
  employee: ["employee_support"],
  admin: ["admin"],
  ai_agent: [],
};

// ────────────────────────────────────────────────────────────────────────
// Standards MOS transversaux (règles 12, 13, 14 — v1.2)
// ────────────────────────────────────────────────────────────────────────

/** Niveaux de maturité normalisés (règle MOS #14). */
export const MATURITY_LEVELS = [
  "sprint_0_architecture",
  "sprint_1_minimal",
  "sprint_2_complete",
  "sprint_3_automation",
  "sprint_4_intelligence",
  "sprint_5_optimization",
] as const;
export type MaturityLevel = (typeof MATURITY_LEVELS)[number];

/**
 * Feed standardisé consommé par le MOS Control Center et par les deux
 * moteurs centraux (Intelligence & Decision + Autonomous Operations).
 * Chaque moteur MOS DOIT retourner ce même format (règle #13).
 */
export interface ControlCenterFeed {
  engine: string;              // identifiant technique stable
  label: string;               // nom lisible
  version: string;             // semver
  maturityLevel: MaturityLevel;
  health: "ok" | "degraded" | "down" | "unknown";
  load: {
    // Nombre d'événements traités dans les 5 dernières minutes.
    events5m: number;
    // Nombre d'événements sur les 24 dernières heures.
    events24h: number;
  };
  performance: {
    // Temps de réponse observé pour l'appel courant (ms).
    lastResponseMs: number;
  };
  errors: {
    // Nombre d'erreurs sur les 24 dernières heures (best-effort).
    last24h: number;
  };
  lastSyncAt: string;          // ISO-8601
  status: "active" | "read_only" | "maintenance" | "disabled" | "staging";
}

/**
 * Payload retourné par le tableau de bord dédié d'un moteur (règle #13).
 * Généralise le `ControlCenterFeed` en ajoutant des métriques métier
 * spécifiques via `businessMetrics`.
 */
export interface EngineDashboard extends ControlCenterFeed {
  businessMetrics: Record<string, number | string | null>;
  recentEvents: Array<{
    at: string;
    action: string;
    metadata?: Record<string, unknown>;
  }>;
  recentErrors: Array<{
    at: string;
    message: string;
  }>;
}
