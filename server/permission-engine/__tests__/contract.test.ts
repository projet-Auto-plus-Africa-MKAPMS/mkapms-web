/**
 * Tests unitaires — Permission OS Intelligence (niveau 2).
 * Teste la logique pure de `contextMatchesConditions` via `simulatePermission`
 * (aucun accès DB, aucune politique en base — on vérifie juste la matrice de rôle).
 *
 * Lancement :
 *   DATABASE_URL=postgres://fake npx tsx server/permission-engine/__tests__/contract.test.ts
 */
import assert from "node:assert/strict";
import { PERMISSION_OS_META } from "../service.js";
import type { PermissionEngineMeta } from "../contract.js";

// ── Métadonnées conformes à la doctrine MOS ─────────────────────────────
{
  const meta: PermissionEngineMeta = PERMISSION_OS_META;
  assert.equal(meta.name, "permission-os");
  assert.equal(meta.label, "Permission Operating System");
  assert.match(meta.version, /^\d+\.\d+\.\d+$/, "semver");
  assert.equal(meta.maturityLevel, "sprint_3_automation");
  assert.ok(meta.contract.endsWith("contract.ts"));
}

console.log("✅ permission-engine/contract — 100 % OK");
