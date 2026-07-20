/**
 * Permission Operating System — Contract
 *
 * Types stables de la surface publique. Ce fichier est le seul autorisé à
 * être importé par d'autres moteurs pour interagir avec Permission OS.
 *
 * Doctrine MOS #12 (structure standardisée) + #14 (maturité) + #15
 * (complétude & évolution de l'existant). Ce moteur COMPLÈTE le
 * `server/permission-engine/` existant — il ne le remplace pas.
 */
import type { MaturityLevel } from "../identity-os/contract.js";
import type { UserRole } from "../../shared/roles.js";
import type { PermissionAction, PermissionModule } from "../../shared/permissions.js";

export type { MaturityLevel, PermissionAction, PermissionModule };

/**
 * Contexte d'évaluation d'une permission — utilisé par le niveau 2
 * (permissions contextuelles intelligentes).
 * Les autres moteurs (Identity OS, Country OS, futur Subscription OS) le
 * remplissent avant chaque appel à `resolve()` / `simulate()`.
 */
export interface PermissionContext {
  userId?: number | null;
  identityId?: number | null;
  role: UserRole;
  identityType?:
    | "visitor"
    | "user"
    | "pro"
    | "partner"
    | "franchisee"
    | "universe_operator"
    | "employee"
    | "admin"
    | "ai_agent";
  countryCode?: string | null; // ex "FR", "CI", "MA"
  universe?: string | null;    // "auto" | "immo" | "formation" | ...
  subscriptionTier?: "free" | "starter" | "pro" | "enterprise" | null;
  contractType?: "particulier" | "professionnel" | "franchise" | "partner" | null;
  accountAgeDays?: number | null;
  deviceTrusted?: boolean;
  riskScore?: number;          // 0..100 (Sprint 4 — Intelligence Engine feeds this)
  now?: Date;
}

/** Décision finale — verdict + explication + trace de la règle appliquée. */
export interface PermissionDecision {
  allowed: boolean;
  reason:
    | "role_matrix_pass"
    | "role_matrix_deny"
    | "policy_pass"
    | "policy_deny"
    | "temporary_grant_pass"
    | "delegation_pass"
    | "readonly_action"
    | "expired_grant"
    | "revoked_delegation"
    | "risk_too_high"
    | "unverified_email"
    | "unverified_phone"
    | "wrong_country"
    | "wrong_universe"
    | "wrong_subscription"
    | "no_matching_rule";
  policyId?: number | null;
  humanExplanation: string;    // phrase FR à afficher côté UI (règle PDG)
  evaluatedAt: string;         // ISO-8601
  contextSummary: Partial<PermissionContext>;
}

/**
 * Règle de politique contextuelle (niveau 2 — permissions intelligentes).
 * Stockée en base (`perm_policies`), évaluée par ordre de priorité.
 * Le premier match l'emporte (deny > allow explicite).
 */
export interface PermissionPolicy {
  id: number;
  name: string;
  module: PermissionModule | "*";        // "*" = toutes actions
  action: PermissionAction | "*";
  effect: "allow" | "deny";
  priority: number;                      // 0 = plus prioritaire
  conditions: PermissionPolicyCondition;
  active: boolean;
  createdBy?: number | null;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
}

export interface PermissionPolicyCondition {
  roles?: UserRole[];                    // OR entre rôles
  identityTypes?: string[];              // OR
  countries?: string[];                  // whitelist ("FR","CI")
  countriesExcept?: string[];            // blacklist
  universes?: string[];
  subscriptionTiers?: string[];
  contractTypes?: string[];
  minAccountAgeDays?: number;
  maxRiskScore?: number;
  requireEmailVerified?: boolean;
  requirePhoneVerified?: boolean;
  requireDeviceTrusted?: boolean;
  requireMfa?: boolean;
  timeWindow?: {
    dayOfWeek?: number[];                // 0..6 (0=dimanche)
    hourFrom?: number;                   // 0..23
    hourTo?: number;                     // 0..23
  };
}

/** Événements typés publiés par Permission OS. */
export type PermissionEvent =
  | { type: "permission.granted"; identityId: number | null; module: string; action?: string; policyId?: number | null; at: string }
  | { type: "permission.denied"; identityId: number | null; module: string; reason: string; at: string }
  | { type: "permission.delegation.created"; fromIdentityId: number; toIdentityId: number; module: string; at: string }
  | { type: "permission.delegation.revoked"; delegationId: number; at: string }
  | { type: "permission.policy.updated"; policyId: number; at: string };

/** Métadonnées de moteur (identiques par contrat au format Identity OS). */
export interface PermissionEngineMeta {
  name: "permission-os";
  label: "Permission Operating System";
  version: string;
  maturityLevel: MaturityLevel;
  contract: string;
}
