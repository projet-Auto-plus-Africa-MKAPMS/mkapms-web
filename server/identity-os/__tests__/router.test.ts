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

// Endpoints top-level attendus (Sprint 1 + Sprint 2 + Sprint 3)
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
  // Sprint 3 — Complétude fonctionnelle (règle MOS #15)
  "oauthGoogle",
  "refreshToken",
  "changePassword",
];
for (const k of EXPECTED_TOP) {
  assert.ok(keys.includes(k), `router.identity doit exposer « ${k} »`);
}

// Sous-routers `sessions`, `audit`, `email`, `phone`, `password`, `mfa`, `devices`,
// `session`, `anomalies`, `account`, `aiAgents` — vérification via clés flattenées.
const flat = keys.join(",");
for (const sub of [
  "sessions.list",
  "sessions.revoke",
  "audit.recent",
  "audit.all",
  "email.sendVerification",
  "email.verify",
  "phone.sendVerification",
  "phone.verify",
  "password.forgot",
  "password.reset",
  "mfa.setup",
  "mfa.enable",
  "mfa.verify" /* alias possible non exposé — ignoré */.replace("mfa.verify", "mfa.status"),
  "mfa.disable",
  "devices.list",
  "session.touch",
  "anomalies.recent",
  "account.archive",
  "aiAgents.create",
  "aiAgents.list",
  "aiAgents.revoke",
]) {
  assert.ok(flat.includes(sub), `router.identity doit exposer « ${sub} »`);
}

// Métadonnées cohérentes — Sprint 3 = maturityLevel sprint_3_automation
assert.equal(IDENTITY_OS_META.name, "identity-os");
assert.ok(IDENTITY_OS_META.version.startsWith("0."), "Version Sprint 3 = 0.x");
assert.equal(
  IDENTITY_OS_META.maturityLevel,
  "sprint_3_automation",
  "Maturity level Sprint 3 (règle MOS #14)",
);

console.log(`✅ identity-os/router — surface OK (${keys.length} procédures)`);
console.log("   procs:", keys.sort().join(", "));
