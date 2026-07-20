/**
 * Tests unitaires — Identity OS Crypto (TOTP RFC 6238, tokens, OTP, base32).
 * Pure logique, aucun accès DB.
 */
import assert from "node:assert/strict";
import {
  base32Encode,
  base32Decode,
  computeTotp,
  generateAiAgentKey,
  generateBackupCodes,
  generateNumericOtp,
  generateOpaqueToken,
  generateTotpSecret,
  hashToken,
  otpAuthUri,
  verifyTotp,
} from "../crypto.js";

// ── Base32 round-trip ────────────────────────────────────────────────────
{
  const buf = Buffer.from("MKA.P-MS Identity OS", "utf8");
  const enc = base32Encode(buf);
  const dec = base32Decode(enc);
  assert.equal(dec.toString("utf8"), "MKA.P-MS Identity OS");
}

// ── TOTP RFC 6238 (vecteurs de test officiels) ──────────────────────────
// Secret officiel du RFC : "12345678901234567890" — clé base32
{
  const rfcSecret = base32Encode(Buffer.from("12345678901234567890", "utf8"));
  const at59s = computeTotp(rfcSecret, 59_000);
  assert.equal(at59s, "287082", `TOTP à T=59s = 287082 (RFC 6238), reçu ${at59s}`);
  const at1111111109 = computeTotp(rfcSecret, 1_111_111_109_000);
  assert.equal(at1111111109, "081804", `TOTP RFC vecteur t=1111111109`);
}

// ── TOTP verify avec dérive ±1 fenêtre ──────────────────────────────────
{
  const s = generateTotpSecret();
  const now = Date.now();
  const code = computeTotp(s, now);
  assert.ok(verifyTotp(s, code, now), "verify code émis maintenant");
  assert.ok(verifyTotp(s, code, now + 25_000), "verify code émis il y a 25s (même fenêtre)");
  assert.ok(!verifyTotp(s, "000000", now), "code arbitraire refusé");
  assert.ok(!verifyTotp(s, "12345", now), "code trop court refusé");
}

// ── otpauth URI ─────────────────────────────────────────────────────────
{
  const s = "JBSWY3DPEHPK3PXP";
  const uri = otpAuthUri(s, "test@mkapms.fr");
  assert.match(uri, /^otpauth:\/\/totp\//);
  assert.ok(uri.includes("secret=JBSWY3DPEHPK3PXP"));
  assert.ok(uri.includes("issuer=MKA.P-MS"));
  assert.ok(uri.includes("algorithm=SHA1"));
  assert.ok(uri.includes("digits=6"));
  assert.ok(uri.includes("period=30"));
}

// ── Tokens opaques + hash déterministe ──────────────────────────────────
{
  const t1 = generateOpaqueToken();
  const t2 = generateOpaqueToken();
  assert.ok(t1 !== t2, "chaque token doit être unique");
  assert.equal(hashToken(t1), hashToken(t1), "hash déterministe");
  assert.ok(hashToken(t1) !== hashToken(t2), "hashes distincts pour tokens distincts");
  assert.equal(hashToken(t1).length, 64, "hash SHA-256 = 64 hex chars");
}

// ── OTP numérique (6 digits, plage 000000..999999) ──────────────────────
for (let i = 0; i < 100; i++) {
  const o = generateNumericOtp(6);
  assert.match(o, /^\d{6}$/, `OTP doit être 6 chiffres, reçu ${o}`);
}

// ── Backup codes ────────────────────────────────────────────────────────
{
  const codes = generateBackupCodes();
  assert.equal(codes.length, 10);
  for (const c of codes) assert.match(c, /^[0-9A-F]{4}-[0-9A-F]{4}$/);
  const unique = new Set(codes);
  assert.equal(unique.size, 10, "les 10 codes de secours doivent être uniques");
}

// ── Clé agent IA ────────────────────────────────────────────────────────
{
  const { plaintext, hash } = generateAiAgentKey();
  assert.match(plaintext, /^mos_ai_[A-Za-z0-9_-]+$/);
  assert.equal(hash, hashToken(plaintext));
  assert.equal(hash.length, 64);
}

console.log("✅ identity-os/crypto — 100 % OK (TOTP RFC 6238, tokens, OTP, backup codes, agents IA)");
