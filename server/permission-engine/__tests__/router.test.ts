/**
 * Smoke test — router permission-engine complet, sans DB.
 * Vérifie la surface publique (endpoints existants + Sprint 3).
 */
import assert from "node:assert/strict";
import { permissionEngineRouter } from "../router.js";

const procs = (permissionEngineRouter as any)._def?.procedures ?? {};
const keys = Object.keys(procs);

// Endpoints EXISTANTS conservés (sprint 1 legacy)
const LEGACY = ["myAccess", "check", "logDenied", "journal", "stats", "grants", "grant", "revokeGrant"];
for (const k of LEGACY) {
  assert.ok(keys.includes(k), `permission-engine doit CONSERVER « ${k} » (règle #15)`);
}

// Endpoints AJOUTÉS Sprint 3
const ADDED = ["meta", "healthStatus", "controlCenterFeed", "dashboard", "resolve", "explain", "simulate"];
for (const k of ADDED) {
  assert.ok(keys.includes(k), `permission-engine doit exposer « ${k} » (Sprint 3)`);
}

// Sous-routers
const flat = keys.join(",");
for (const sub of [
  "policies.list",
  "policies.create",
  "policies.update",
  "policies.disable",
  "delegations.create",
  "delegations.list",
  "delegations.revoke",
  "resolutions.recent",
  "resolutions.counters",
]) {
  assert.ok(flat.includes(sub), `permission-engine doit exposer « ${sub} »`);
}

console.log(`✅ permission-engine/router — surface complète (${keys.length} procédures)`);
console.log("   procs:", keys.sort().join(", "));
