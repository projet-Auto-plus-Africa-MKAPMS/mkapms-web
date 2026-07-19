/**
 * Smoke test — assemblage du router Identity OS.
 * Vérifie qu'il peut être importé sans erreur et expose la surface attendue.
 * Ne se connecte à AUCUNE base : `db` reste importé mais aucune requête n'est exécutée.
 *
 * Lancement :
 *   DATABASE_URL=postgres://fake npx tsx server/identity-os/__tests__/router.test.ts
 */
import assert from "node:assert/strict";
import { identityRouter } from "../router.js";
import { IDENTITY_OS_META } from "../service.js";

const procs = (identityRouter as any)._def?.procedures ?? {};
const keys = Object.keys(procs);

// Endpoints top-level attendus (Sprint 1 + Sprint 2)
const EXPECTED_TOP = [
  "meta",
  "healthStatus",
  "me",
  "reportEvent",
  "types",
  // Sprint 2 — MOS Control Center + Dashboard (règles #13/#14)
  "controlCenterFeed",
  "dashboard",
  // Sprint 2 — Bridge auth → identity (non destructif)
  "login",
  "register",
  "logout",
];
for (const k of EXPECTED_TOP) {
  assert.ok(keys.includes(k), `router.identity doit exposer « ${k} »`);
}

// Sous-routers `sessions` et `audit` (via clés flattenées "sessions.list", etc.)
const flat = keys.join(",");
for (const sub of ["sessions.list", "sessions.revoke", "audit.recent", "audit.all"]) {
  assert.ok(flat.includes(sub), `router.identity doit exposer « ${sub} »`);
}

// Métadonnées cohérentes
assert.equal(IDENTITY_OS_META.name, "identity-os");
assert.ok(IDENTITY_OS_META.version.startsWith("0."), "Version Sprint 2 = 0.x");
assert.equal(
  IDENTITY_OS_META.maturityLevel,
  "sprint_2_complete",
  "Maturity level Sprint 2 (règle MOS #14)",
);

console.log(`✅ identity-os/router — surface OK (${keys.length} procédures)`);
console.log("   procs:", keys.sort().join(", "));
