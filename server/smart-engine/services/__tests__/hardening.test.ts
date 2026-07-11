/**
 * Tests unitaires — Smart Engine hardening
 *
 * Pure logique, aucun accès base de données. Vérifie que les fonctions
 * utilitaires ajoutées se comportent correctement.
 *
 * Lancement : `npx tsx server/smart-engine/services/__tests__/hardening.test.ts`
 * (aucun framework de test n'est requis dans le projet — ces tests
 * utilisent `node:assert` disponible par défaut).
 */
import assert from "node:assert/strict";
import { hammingDistance } from "../photo-perceptual.js";
import {
  normalizeEmail,
  normalizePhone,
  computeDeviceFingerprint,
  computeRiskScore,
  isDisposableEmail,
} from "../risk-scoring.js";
import { getConfirmThreshold, DEFAULT_CONFIRM_THRESHOLD } from "../domain-thresholds.js";
import {
  assertRate,
  tryRate,
  sanitizeTeachMessage,
  _resetRateLimiterForTests,
  MAX_TEACH_MESSAGE_LENGTH,
} from "../rate-limiter.js";

// ── Hamming distance ────────────────────────────────────────────────────
assert.equal(hammingDistance("ffff", "ffff"), 0, "hash identique = distance 0");
assert.equal(hammingDistance("ffff", "0000"), 16, "hash opposé = distance 16 bits");
assert.equal(hammingDistance("abcd", "abce"), 2, "1 chiffre hex diff = 2 bits");
assert.equal(hammingDistance("", "abcd"), Number.MAX_SAFE_INTEGER, "empty guard");

// ── Normalisation email ────────────────────────────────────────────────
assert.equal(normalizeEmail("John.Doe+shop@Gmail.com"), "johndoe@gmail.com", "gmail: pts + alias");
assert.equal(normalizeEmail("john.doe@yahoo.com"), "john.doe@yahoo.com", "yahoo: garder points");
assert.equal(normalizeEmail("test@googlemail.com"), "test@gmail.com", "googlemail = gmail");
assert.equal(normalizeEmail(""), null);
assert.equal(normalizeEmail("nope"), null);

// ── Normalisation téléphone ────────────────────────────────────────────
assert.equal(normalizePhone("06 12 34 56 78"), "+33612345678", "FR local");
assert.equal(normalizePhone("+33 (0)6-12-34-56-78"), "+33612345678", "FR international bruité");
assert.equal(normalizePhone("123"), null, "trop court");
assert.equal(normalizePhone(null), null);

// ── Device fingerprint ─────────────────────────────────────────────────
const fp1 = computeDeviceFingerprint({
  userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/120.0",
  language: "fr-FR",
  timezone: "Europe/Paris",
});
const fp2 = computeDeviceFingerprint({
  userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/121.0", // version différente
  language: "fr-FR",
  timezone: "Europe/Paris",
});
assert.equal(fp1, fp2, "insensible aux versions mineures");
assert.equal(fp1.length, 16, "hash court");

// ── Disposable email ───────────────────────────────────────────────────
assert.equal(isDisposableEmail("a@mailinator.com"), true);
assert.equal(isDisposableEmail("a@gmail.com"), false);

// ── Risk score ─────────────────────────────────────────────────────────
const low = computeRiskScore({ freshAccount: true });
assert.equal(low.score, 5);
assert.equal(low.severity, "info");

const high = computeRiskScore({
  duplicateNormalizedEmail: true,
  duplicateDeviceFingerprint: true,
  abnormalActivity: true,
});
assert.equal(high.score, 90);
assert.equal(high.severity, "critical");
assert.ok(high.reasons.includes("duplicateNormalizedEmail"));

const capped = computeRiskScore({
  duplicateNormalizedEmail: true,
  duplicateNormalizedPhone: true,
  duplicateDeviceFingerprint: true,
  sharedIp: true,
  disposableEmailDomain: true,
  freshAccount: true,
  abnormalActivity: true,
});
assert.equal(capped.score, 100, "score plafonné à 100");

// ── Seuils dynamiques ──────────────────────────────────────────────────
assert.equal(getConfirmThreshold("mot_cle"), 8);
assert.equal(getConfirmThreshold("vehicule"), 2);
assert.equal(getConfirmThreshold("inconnu"), DEFAULT_CONFIRM_THRESHOLD, "fallback");

// ── Rate limiter ───────────────────────────────────────────────────────
_resetRateLimiterForTests();
for (let i = 0; i < 5; i++) {
  assertRate("user:1", { max: 5, windowMs: 60_000 });
}
assert.throws(
  () => assertRate("user:1", { max: 5, windowMs: 60_000 }),
  /Trop de requêtes/,
  "6e appel refusé",
);
assert.equal(tryRate("user:2", { max: 1, windowMs: 60_000 }), true);
assert.equal(tryRate("user:2", { max: 1, windowMs: 60_000 }), false, "2e appel refusé (soft)");

// ── Sanitize teach message ─────────────────────────────────────────────
assert.equal(sanitizeTeachMessage("  hello  "), "hello");
assert.equal(sanitizeTeachMessage(""), null);
assert.equal(sanitizeTeachMessage("x".repeat(5000)).length, MAX_TEACH_MESSAGE_LENGTH);

console.log("✅ Tous les tests Smart Engine hardening passent.");
