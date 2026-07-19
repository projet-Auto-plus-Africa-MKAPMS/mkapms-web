/**
 * Identity OS — point d'entrée public
 *
 * Fournit :
 *   • le sous-router tRPC (`identityRouter`)
 *   • les types du contrat (import depuis `contract.ts`)
 *   • les helpers d'audit / résolution utilisables côté serveur
 *
 * Aucune fuite de logique privée : les autres moteurs interagissent avec
 * l'Identity OS uniquement via ces exports (règle MOS #11 — moteurs
 * autonomes et collaboratifs).
 */
export { identityRouter } from "./router.js";
export * as identitySchema from "./schema.js";
export {
  audit,
  controlCenterFeed,
  dashboard,
  healthStatus,
  IDENTITY_OS_META,
  listActiveSessions,
  recentAudit,
  resolveIdentityForUser,
  revokeSession,
} from "./service.js";
export {
  IDENTITY_TYPES,
  IDENTITY_ROLES,
  DEFAULT_ROLES_BY_TYPE,
  MATURITY_LEVELS,
  type ControlCenterFeed,
  type EngineDashboard,
  type IdentityContext,
  type IdentityEvent,
  type IdentityRole,
  type IdentityType,
  type MaturityLevel,
} from "./contract.js";
