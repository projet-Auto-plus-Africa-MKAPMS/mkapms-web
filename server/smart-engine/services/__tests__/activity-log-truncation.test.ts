/**
 * Tests unitaires — Troncature des colonnes bornées de smart_activity_log
 *
 * Pure logique, aucun accès base de données. Couvre le correctif du 26/11/2026 :
 * `smart_activity_log` a des colonnes `action varchar(64)`, `target_type varchar(32)`
 * et `result varchar(32)` ; avant correctif, une valeur trop longue venue d'un
 * appelant faisait échouer l'INSERT entier côté Postgres ("value too long for
 * type character varying(32)"), perdant la trace de l'action au lieu de la tronquer.
 *
 * Lancement : `npx tsx server/smart-engine/services/__tests__/activity-log-truncation.test.ts`
 * (aucun framework de test n'est requis dans le projet — ces tests
 * utilisent `node:assert` disponible par défaut).
 */
import assert from "node:assert/strict";
import { clip } from "../activity-log.js";

// ── clip() ───────────────────────────────────────────────────────────────
assert.equal(clip("accepted", 32), "accepted", "chaîne courte inchangée");
assert.equal(clip("x".repeat(40), 32), "x".repeat(32), "chaîne trop longue tronquée à max");
assert.equal(clip(undefined, 32), null, "undefined -> null, jamais de crash");
assert.equal(clip(null, 32), null, "null -> null");
assert.equal(clip("", 32), "", "chaîne vide préservée telle quelle");

console.log("✅ Tous les tests de troncature smart_activity_log passent.");
