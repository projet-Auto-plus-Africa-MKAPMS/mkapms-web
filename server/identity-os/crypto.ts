/**
 * Identity OS — Crypto helpers (RFC 6238 TOTP + tokens opaques)
 *
 * Implémentation 100 % `node:crypto` — aucune dépendance externe.
 * - TOTP RFC 6238 (HMAC-SHA1, période 30 s, digits 6, ±1 fenêtre)
 * - Génération de tokens opaques + hash SHA-256
 * - Codes numériques OTP (SMS / email 2FA)
 * - Backup codes (10 codes 8 caractères)
 */
import { createHash, createHmac, randomBytes } from "node:crypto";

// ── Base32 encoding (RFC 4648, sans padding) — utilisé pour otpauth:// ──
const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(str: string): Buffer {
  const clean = str.replace(/=+$/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

// ── TOTP RFC 6238 ───────────────────────────────────────────────────────
export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

/**
 * Calcule le code TOTP à un instant donné.
 * Digits fixé à 6, période fixée à 30 s (compatible Google Authenticator).
 */
export function computeTotp(secretBase32: string, atMs = Date.now()): string {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(atMs / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const code = (bin % 1_000_000).toString().padStart(6, "0");
  return code;
}

/**
 * Vérifie un code TOTP avec tolérance de ±1 fenêtre (~60 s de dérive).
 */
export function verifyTotp(secretBase32: string, code: string, atMs = Date.now()): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  for (const shift of [0, -1, 1]) {
    const cand = computeTotp(secretBase32, atMs + shift * 30_000);
    if (timingSafeEqualStr(cand, code)) return true;
  }
  return false;
}

export function otpAuthUri(secretBase32: string, label: string, issuer = "MKA.P-MS"): string {
  const enc = encodeURIComponent;
  return `otpauth://totp/${enc(issuer)}:${enc(label)}?secret=${secretBase32}&issuer=${enc(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ── Tokens opaques + hash SHA-256 ───────────────────────────────────────
/** Token URL-safe pour vérification email / reset password. */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ── OTP numérique (SMS / téléphone) ─────────────────────────────────────
export function generateNumericOtp(digits = 6): string {
  const max = 10 ** digits;
  const n = randomBytes(4).readUInt32BE(0) % max;
  return n.toString().padStart(digits, "0");
}

// ── Codes de secours MFA ────────────────────────────────────────────────
/**
 * 10 codes de secours de 8 caractères alphanumériques (majuscules).
 * Format lisible : XXXX-XXXX. Stockés hashés en DB.
 */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const buf = randomBytes(4);
    const raw = buf.toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return codes;
}

// ── Comparaison à temps constant sur string ─────────────────────────────
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── Génération clé API agent Intelligence (préfixe + entropie + hash) ─────────────
/**
 * Format : `mos_ai_<random 32 bytes base64url>`.
 * La chaîne complète est retournée UNE seule fois ; on ne stocke que le hash.
 */
export function generateAiAgentKey(): { plaintext: string; hash: string } {
  const plaintext = `mos_ai_${randomBytes(32).toString("base64url")}`;
  return { plaintext, hash: hashToken(plaintext) };
}
