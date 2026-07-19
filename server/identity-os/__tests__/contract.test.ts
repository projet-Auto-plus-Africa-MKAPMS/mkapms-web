/**
 * Tests unitaires — Identity OS (Sprint 1)
 *
 * Pure logique / contrat : aucun accès base de données.
 * Vérifie que le contrat public de l'Identity OS reste stable et que les
 * défauts par type restent alignés avec la doctrine MOS.
 *
 * Lancement :
 *   npx tsx server/identity-os/__tests__/contract.test.ts
 */
import assert from "node:assert/strict";
import {
  IDENTITY_TYPES,
  IDENTITY_ROLES,
  DEFAULT_ROLES_BY_TYPE,
  type IdentityType,
} from "../contract.js";
import { IDENTITY_OS_META } from "../service.js";

// ── Types : les 9 identités MOS doivent toutes être présentes ──────────
const EXPECTED_TYPES: IdentityType[] = [
  "visitor",
  "user",
  "pro",
  "partner",
  "franchisee",
  "universe_operator",
  "employee",
  "admin",
  "ai_agent",
];

assert.deepEqual(
  [...IDENTITY_TYPES].sort(),
  [...EXPECTED_TYPES].sort(),
  "IDENTITY_TYPES doit contenir exactement les 9 types de la doctrine MOS",
);

// ── Rôles : au moins les rôles humains principaux ──────────────────────
const MUST_HAVE_ROLES = [
  "buyer",
  "seller",
  "renter",
  "lessor",
  "admin",
  "super_admin",
  "pdg",
];
for (const r of MUST_HAVE_ROLES) {
  assert.ok(
    (IDENTITY_ROLES as readonly string[]).includes(r),
    `IDENTITY_ROLES doit contenir « ${r} »`,
  );
}

// ── Rôles par défaut : cohérence par type ──────────────────────────────
assert.deepEqual(
  DEFAULT_ROLES_BY_TYPE.visitor,
  [],
  "Un visitor n'a aucun rôle par défaut",
);
assert.ok(
  DEFAULT_ROLES_BY_TYPE.user.includes("buyer"),
  "Un user est acheteur par défaut",
);
assert.ok(
  DEFAULT_ROLES_BY_TYPE.pro.includes("seller"),
  "Un pro est vendeur par défaut",
);
assert.ok(
  DEFAULT_ROLES_BY_TYPE.admin.includes("admin"),
  "Un admin porte le rôle admin",
);

// Tous les types ont une clé dans DEFAULT_ROLES_BY_TYPE
for (const t of IDENTITY_TYPES) {
  assert.ok(
    Array.isArray(DEFAULT_ROLES_BY_TYPE[t]),
    `DEFAULT_ROLES_BY_TYPE.${t} doit être un tableau`,
  );
}

// ── Métadonnées du moteur ───────────────────────────────────────────────
assert.equal(IDENTITY_OS_META.name, "identity-os");
assert.match(
  IDENTITY_OS_META.version,
  /^\d+\.\d+\.\d+$/,
  "Version au format semver",
);
assert.ok(
  IDENTITY_OS_META.contract.endsWith("contract.ts"),
  "Le contrat pointe bien sur contract.ts",
);

console.log("✅ identity-os/contract — 100 % OK");
