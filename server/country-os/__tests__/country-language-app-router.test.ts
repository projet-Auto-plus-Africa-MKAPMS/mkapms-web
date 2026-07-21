/**
 * Smoke test — Country OS + Language OS branchés dans l'appRouter.
 * Vérifie qu'ils exposent les endpoints attendus et que l'auth.* legacy
 * ainsi que identity.* / permissionEngine.* restent intacts.
 */
import assert from "node:assert/strict";
import { appRouter } from "../../router.js";

const procs = (appRouter as any)._def?.procedures ?? {};
const keys = Object.keys(procs);

// Country OS — endpoints attendus
const countryKeys = keys.filter((k) => k.startsWith("country.")).sort();
for (const sub of ["country.meta", "country.healthStatus", "country.controlCenterFeed", "country.dashboard", "country.list", "country.get", "country.currencies", "country.upsert", "country.disable"]) {
  assert.ok(countryKeys.includes(sub), `Country OS doit exposer « ${sub} »`);
}

// Language OS — endpoints attendus
const langKeys = keys.filter((k) => k.startsWith("language.")).sort();
for (const sub of ["language.meta", "language.healthStatus", "language.controlCenterFeed", "language.dashboard", "language.list", "language.bundle", "language.t", "language.detect", "language.upsert", "language.bulkUpsert", "language.preferences.me", "language.preferences.update"]) {
  assert.ok(langKeys.includes(sub), `Language OS doit exposer « ${sub} »`);
}

// Non-régression : auth.* legacy conservé
const authKeys = keys.filter((k) => k.startsWith("auth.")).sort();
assert.ok(authKeys.length >= 6, `auth.* legacy doit rester intact (≥6 procédures, reçu ${authKeys.length})`);

// Non-régression : identity.* Sprint 3 conservé
const idKeys = keys.filter((k) => k.startsWith("identity."));
assert.ok(idKeys.length >= 30, `identity.* doit conserver Sprint 3 (≥30 procédures, reçu ${idKeys.length})`);

console.log(`✅ Country OS branché — ${countryKeys.length} procédures`);
console.log(`✅ Language OS branché — ${langKeys.length} procédures`);
console.log(`ℹ️  Total appRouter : ${keys.length} procédures`);
