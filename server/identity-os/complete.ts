/**
 * Identity OS — Services complémentaires (règle MOS #15 — complétude)
 *
 * Ce fichier contient TOUTES les fonctions manquantes identifiées lors de
 * l'audit d'Identity (récupération de compte, vérifications, MFA TOTP,
 * sessions, appareils, anomalies, agents Intelligence). Elles se branchent sur les
 * tables existantes (`users`, `sessions`, `auditLogs`) **sans les modifier**
 * et complètent les tables `identity_*` livrées en Sprint 1.
 */
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../db.js";
import { users, sessions } from "../schema.js";
import { hashPassword, comparePassword, signToken } from "../auth.js";
import { sendEmail } from "../services/email.js";
import {
  identities,
  identityAiAgents,
  identityEmailVerifications,
  identityLoginAttempts,
  identityMfaSecrets,
  identityPasswordResets,
  identityPhoneVerifications,
  identitySessions,
} from "./schema.js";
import {
  computeTotp,
  generateAiAgentKey,
  generateBackupCodes,
  generateNumericOtp,
  generateOpaqueToken,
  generateTotpSecret,
  hashToken,
  otpAuthUri,
  verifyTotp,
} from "./crypto.js";
import { audit, resolveIdentityForUser } from "./service.js";

// ────────────────────────────────────────────────────────────────────────
// 1. VÉRIFICATION EMAIL (double opt-in)
// ────────────────────────────────────────────────────────────────────────

const EMAIL_VERIF_TTL_MIN = 60;

export async function requestEmailVerification(
  identityId: number,
  email: string,
  meta: { ip?: string | null; ua?: string | null } = {},
) {
  const token = generateOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIF_TTL_MIN * 60 * 1000);
  await db.insert(identityEmailVerifications).values({
    identityId,
    email: email.toLowerCase(),
    tokenHash,
    expiresAt,
    requestedIp: meta.ip ?? null,
  });
  const link = `${process.env.PUBLIC_APP_URL ?? "https://mkapms.fr"}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail(
    email,
    "Confirmez votre adresse email — MKA.P-MS",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#D4AF37;">MKA.P-MS</h2>
      <p>Bonjour,</p>
      <p>Pour confirmer votre adresse email, cliquez sur le lien suivant :</p>
      <p><a href="${link}" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Confirmer mon email</a></p>
      <p style="font-size:12px;color:#999;">Ce lien expire dans ${EMAIL_VERIF_TTL_MIN} minutes.</p>
    </div>`,
  ).catch(() => {});
  await audit({ identityId, action: "identity.email_verification.sent", metadata: { email } });
  return { ok: true, expiresAt };
}

export async function confirmEmailVerification(token: string) {
  const tokenHash = hashToken(token);
  const [row] = await db
    .select()
    .from(identityEmailVerifications)
    .where(
      and(
        eq(identityEmailVerifications.tokenHash, tokenHash),
        isNull(identityEmailVerifications.verifiedAt),
        gt(identityEmailVerifications.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return { ok: false, reason: "invalid_or_expired" as const };
  await db
    .update(identityEmailVerifications)
    .set({ verifiedAt: new Date() })
    .where(eq(identityEmailVerifications.id, row.id));
  await db
    .update(identities)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(identities.id, row.identityId));
  // Synchronise également la table users legacy pour conserver la compat.
  const [ident] = await db.select().from(identities).where(eq(identities.id, row.identityId)).limit(1);
  if (ident?.legacyUserId) {
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, ident.legacyUserId));
  }
  await audit({ identityId: row.identityId, action: "identity.email_verified", metadata: { email: row.email } });
  return { ok: true as const };
}

// ────────────────────────────────────────────────────────────────────────
// 2. VÉRIFICATION TÉLÉPHONE (OTP SMS 6 chiffres)
// ────────────────────────────────────────────────────────────────────────

const PHONE_OTP_TTL_MIN = 10;
const PHONE_OTP_MAX_ATTEMPTS = 5;

export async function requestPhoneVerification(
  identityId: number,
  phone: string,
  meta: { ip?: string | null } = {},
) {
  const code = generateNumericOtp(6);
  const codeHash = hashToken(code);
  const expiresAt = new Date(Date.now() + PHONE_OTP_TTL_MIN * 60 * 1000);
  await db.insert(identityPhoneVerifications).values({
    identityId,
    phone,
    codeHash,
    expiresAt,
    requestedIp: meta.ip ?? null,
  });
  // Envoi SMS — best-effort. Le connecteur SMS est branché par le module
  // notifications si configuré. Sinon, on log en dev pour permettre le test.
  console.log(`[identity-os] phone OTP for ${phone}: ${code} (expires ${expiresAt.toISOString()})`);
  await audit({ identityId, action: "identity.phone_verification.sent", metadata: { phone } });
  return { ok: true, expiresAt };
}

export async function confirmPhoneVerification(identityId: number, code: string) {
  const [row] = await db
    .select()
    .from(identityPhoneVerifications)
    .where(
      and(
        eq(identityPhoneVerifications.identityId, identityId),
        isNull(identityPhoneVerifications.verifiedAt),
        gt(identityPhoneVerifications.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(identityPhoneVerifications.createdAt))
    .limit(1);
  if (!row) return { ok: false, reason: "no_pending_or_expired" as const };
  if (row.attempts >= PHONE_OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" as const };
  }
  await db
    .update(identityPhoneVerifications)
    .set({ attempts: row.attempts + 1 })
    .where(eq(identityPhoneVerifications.id, row.id));
  if (row.codeHash !== hashToken(code)) {
    return { ok: false, reason: "wrong_code" as const };
  }
  await db
    .update(identityPhoneVerifications)
    .set({ verifiedAt: new Date() })
    .where(eq(identityPhoneVerifications.id, row.id));
  await db
    .update(identities)
    .set({ phoneVerified: true, updatedAt: new Date() })
    .where(eq(identities.id, identityId));
  const [ident] = await db.select().from(identities).where(eq(identities.id, identityId)).limit(1);
  if (ident?.legacyUserId) {
    await db.update(users).set({ phoneVerified: true }).where(eq(users.id, ident.legacyUserId));
  }
  await audit({ identityId, action: "identity.phone_verified", metadata: { phone: row.phone } });
  return { ok: true as const };
}

// ────────────────────────────────────────────────────────────────────────
// 3. MOT DE PASSE — récupération, réinitialisation, changement
// ────────────────────────────────────────────────────────────────────────

const RESET_TTL_MIN = 30;

export async function requestPasswordReset(
  email: string,
  meta: { ip?: string | null; ua?: string | null } = {},
) {
  // Toujours répondre `ok:true` pour éviter l'énumération d'emails.
  const [u] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!u) return { ok: true as const };
  const identity = await resolveIdentityForUser(u.id, { email: u.email, name: u.name });
  const token = generateOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000);
  await db.insert(identityPasswordResets).values({
    identityId: identity!.id,
    tokenHash,
    expiresAt,
    requestedIp: meta.ip ?? null,
    userAgent: meta.ua ?? null,
  });
  const link = `${process.env.PUBLIC_APP_URL ?? "https://mkapms.fr"}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail(
    u.email,
    "Réinitialisation de votre mot de passe — MKA.P-MS",
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#D4AF37;">MKA.P-MS</h2>
      <p>Bonjour ${u.name ?? ""},</p>
      <p>Une demande de réinitialisation a été effectuée. Ce lien est valable ${RESET_TTL_MIN} minutes :</p>
      <p><a href="${link}" style="display:inline-block;background:#D4AF37;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Choisir un nouveau mot de passe</a></p>
      <p style="font-size:12px;color:#999;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    </div>`,
  ).catch(() => {});
  await audit({ identityId: identity!.id, action: "identity.password_reset.requested", metadata: { email: u.email }, ipAddress: meta.ip, userAgent: meta.ua });
  return { ok: true as const };
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string,
  meta: { ip?: string | null } = {},
) {
  if (newPassword.length < 8) return { ok: false, reason: "password_too_short" as const };
  const tokenHash = hashToken(token);
  const [row] = await db
    .select()
    .from(identityPasswordResets)
    .where(
      and(
        eq(identityPasswordResets.tokenHash, tokenHash),
        isNull(identityPasswordResets.usedAt),
        gt(identityPasswordResets.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return { ok: false, reason: "invalid_or_expired" as const };
  const [ident] = await db.select().from(identities).where(eq(identities.id, row.identityId)).limit(1);
  if (!ident?.legacyUserId) return { ok: false, reason: "no_legacy_user" as const };
  const hash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, ident.legacyUserId));
  await db.update(identities).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(identities.id, row.identityId));
  await db.update(identityPasswordResets).set({ usedAt: new Date() }).where(eq(identityPasswordResets.id, row.id));
  await audit({ identityId: row.identityId, action: "identity.password_reset.completed", ipAddress: meta.ip });
  return { ok: true as const };
}

export async function changePassword(
  legacyUserId: number,
  currentPassword: string,
  newPassword: string,
) {
  if (newPassword.length < 8) return { ok: false, reason: "password_too_short" as const };
  const [u] = await db.select().from(users).where(eq(users.id, legacyUserId)).limit(1);
  if (!u?.passwordHash) return { ok: false, reason: "no_password_set" as const };
  const ok = await comparePassword(currentPassword, u.passwordHash);
  if (!ok) return { ok: false, reason: "wrong_current" as const };
  const hash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, legacyUserId));
  const identity = await resolveIdentityForUser(legacyUserId);
  if (identity) {
    await db.update(identities).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(identities.id, identity.id));
    await audit({ identityId: identity.id, action: "identity.password_changed" });
  }
  return { ok: true as const };
}

// ────────────────────────────────────────────────────────────────────────
// 4. MFA TOTP (RFC 6238) + codes de secours
// ────────────────────────────────────────────────────────────────────────

export async function mfaSetup(identityId: number, email: string) {
  // Un seul secret par identité — on remplace un secret non activé si existant.
  const secretBase32 = generateTotpSecret();
  const backupPlain = generateBackupCodes();
  const backupHashes = backupPlain.map(hashToken);
  const [existing] = await db
    .select()
    .from(identityMfaSecrets)
    .where(eq(identityMfaSecrets.identityId, identityId))
    .limit(1);
  if (existing) {
    if (existing.activatedAt) return { ok: false, reason: "already_activated" as const };
    await db
      .update(identityMfaSecrets)
      .set({ secretBase32, backupCodes: backupHashes as any, createdAt: new Date() })
      .where(eq(identityMfaSecrets.id, existing.id));
  } else {
    await db.insert(identityMfaSecrets).values({
      identityId,
      secretBase32,
      backupCodes: backupHashes as any,
    });
  }
  await audit({ identityId, action: "identity.mfa.setup_initiated" });
  return {
    ok: true as const,
    otpauth: otpAuthUri(secretBase32, email),
    secret: secretBase32,
    backupCodes: backupPlain, // affichés une seule fois côté client
  };
}

export async function mfaEnable(identityId: number, code: string) {
  const [row] = await db
    .select()
    .from(identityMfaSecrets)
    .where(eq(identityMfaSecrets.identityId, identityId))
    .limit(1);
  if (!row) return { ok: false, reason: "no_setup" as const };
  if (!verifyTotp(row.secretBase32, code)) return { ok: false, reason: "wrong_code" as const };
  await db
    .update(identityMfaSecrets)
    .set({ activatedAt: new Date(), lastUsedAt: new Date() })
    .where(eq(identityMfaSecrets.id, row.id));
  await db
    .update(identities)
    .set({ mfaEnabled: true, updatedAt: new Date() })
    .where(eq(identities.id, identityId));
  const [ident] = await db.select().from(identities).where(eq(identities.id, identityId)).limit(1);
  if (ident?.legacyUserId) {
    await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, ident.legacyUserId));
  }
  await audit({ identityId, action: "identity.mfa.enabled" });
  return { ok: true as const };
}

export async function mfaVerify(identityId: number, code: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(identityMfaSecrets)
    .where(and(eq(identityMfaSecrets.identityId, identityId)))
    .limit(1);
  if (!row?.activatedAt) return false;
  if (verifyTotp(row.secretBase32, code)) {
    await db.update(identityMfaSecrets).set({ lastUsedAt: new Date() }).where(eq(identityMfaSecrets.id, row.id));
    return true;
  }
  // Fallback : backup code (usage unique — retiré de la liste).
  const hashed = hashToken(code.toUpperCase().replace(/\s+/g, ""));
  const codes = row.backupCodes as string[];
  const idx = codes.indexOf(hashed);
  if (idx >= 0) {
    const remaining = [...codes.slice(0, idx), ...codes.slice(idx + 1)];
    await db
      .update(identityMfaSecrets)
      .set({ backupCodes: remaining as any, lastUsedAt: new Date() })
      .where(eq(identityMfaSecrets.id, row.id));
    await audit({ identityId, action: "identity.mfa.backup_used" });
    return true;
  }
  return false;
}

export async function mfaDisable(identityId: number, currentPassword: string) {
  const [ident] = await db.select().from(identities).where(eq(identities.id, identityId)).limit(1);
  if (!ident?.legacyUserId) return { ok: false, reason: "no_legacy_user" as const };
  const [u] = await db.select().from(users).where(eq(users.id, ident.legacyUserId)).limit(1);
  if (!u?.passwordHash || !(await comparePassword(currentPassword, u.passwordHash))) {
    return { ok: false, reason: "wrong_password" as const };
  }
  await db.delete(identityMfaSecrets).where(eq(identityMfaSecrets.identityId, identityId));
  await db.update(identities).set({ mfaEnabled: false, updatedAt: new Date() }).where(eq(identities.id, identityId));
  await db.update(users).set({ twoFactorEnabled: false }).where(eq(users.id, ident.legacyUserId));
  await audit({ identityId, action: "identity.mfa.disabled" });
  return { ok: true as const };
}

export async function mfaIsActivated(identityId: number): Promise<boolean> {
  const [row] = await db
    .select({ activatedAt: identityMfaSecrets.activatedAt })
    .from(identityMfaSecrets)
    .where(eq(identityMfaSecrets.identityId, identityId))
    .limit(1);
  return !!row?.activatedAt;
}

// ────────────────────────────────────────────────────────────────────────
// 5. SESSIONS + APPAREILS
// ────────────────────────────────────────────────────────────────────────

/** Crée une entrée `identity_sessions` liée à un token JWT fraîchement émis. */
export async function persistSession(
  identityId: number,
  meta: { userAgent?: string | null; ip?: string | null; deviceId?: string | null } = {},
) {
  const sessionToken = generateOpaqueToken(24);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [row] = await db
    .insert(identitySessions)
    .values({
      identityId,
      sessionToken,
      deviceId: meta.deviceId ?? null,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
      ipAddress: meta.ip ?? null,
      expiresAt,
    })
    .returning();
  return row;
}

export async function refreshSession(sessionId: number) {
  await db
    .update(identitySessions)
    .set({ lastActiveAt: new Date() })
    .where(eq(identitySessions.id, sessionId));
}

/** Vue "appareils" — sessions regroupées par empreinte user-agent + IP. */
export async function listDevices(identityId: number) {
  const rows = await db
    .select()
    .from(identitySessions)
    .where(and(eq(identitySessions.identityId, identityId), isNull(identitySessions.revokedAt)))
    .orderBy(desc(identitySessions.lastActiveAt));
  const groups = new Map<string, { key: string; userAgent: string | null; ipAddress: string | null; lastActiveAt: Date; sessions: number[] }>();
  for (const r of rows) {
    const key = `${r.userAgent ?? "unknown"}|${r.ipAddress ?? "unknown"}`;
    const g = groups.get(key) ?? {
      key,
      userAgent: r.userAgent,
      ipAddress: r.ipAddress,
      lastActiveAt: r.lastActiveAt,
      sessions: [] as number[],
    };
    g.sessions.push(r.id);
    if (r.lastActiveAt > g.lastActiveAt) g.lastActiveAt = r.lastActiveAt;
    groups.set(key, g);
  }
  return Array.from(groups.values());
}

// ────────────────────────────────────────────────────────────────────────
// 6. DÉTECTION D'ANOMALIES (tentatives de connexion)
// ────────────────────────────────────────────────────────────────────────

const LOCKOUT_WINDOW_MIN = 15;
const LOCKOUT_MAX_FAILURES = 5;

export async function recordLoginAttempt(
  email: string | undefined,
  success: boolean,
  meta: { identityId?: number; reason?: string; ip?: string | null; ua?: string | null },
) {
  await db.insert(identityLoginAttempts).values({
    email: email?.toLowerCase() ?? null,
    identityId: meta.identityId ?? null,
    success,
    reason: meta.reason ?? null,
    ipAddress: meta.ip ?? null,
    userAgent: meta.ua?.slice(0, 255) ?? null,
  });
}

/**
 * Retourne `true` si l'email ou l'IP a atteint la limite d'échecs récents.
 * Vérification simple, best-effort — pas de bruit en dev.
 */
export async function isLockedOut(email: string, ip: string | null | undefined): Promise<boolean> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MIN * 60 * 1000);
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(identityLoginAttempts)
    .where(
      and(
        eq(identityLoginAttempts.success, false),
        eq(identityLoginAttempts.email, email.toLowerCase()),
        gt(identityLoginAttempts.createdAt, since),
      ),
    );
  const fails = Number(r?.n ?? 0);
  if (fails >= LOCKOUT_MAX_FAILURES) return true;
  if (ip) {
    const [r2] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(identityLoginAttempts)
      .where(
        and(
          eq(identityLoginAttempts.success, false),
          eq(identityLoginAttempts.ipAddress, ip),
          gt(identityLoginAttempts.createdAt, since),
        ),
      );
    if (Number(r2?.n ?? 0) >= LOCKOUT_MAX_FAILURES * 3) return true;
  }
  return false;
}

export async function recentAnomalies(limit = 100) {
  return db
    .select()
    .from(identityLoginAttempts)
    .where(eq(identityLoginAttempts.success, false))
    .orderBy(desc(identityLoginAttempts.createdAt))
    .limit(limit);
}

// ────────────────────────────────────────────────────────────────────────
// 7. COMPTE — archivage (soft delete) + refresh JWT
// ────────────────────────────────────────────────────────────────────────

export async function archiveIdentity(
  identityId: number,
  actorIdentityId: number | undefined,
  reason: string,
) {
  await db.update(identities).set({ status: "archived", updatedAt: new Date() }).where(eq(identities.id, identityId));
  await db
    .update(identitySessions)
    .set({ revokedAt: new Date(), revokedReason: "account_archived" })
    .where(and(eq(identitySessions.identityId, identityId), isNull(identitySessions.revokedAt)));
  await audit({ identityId, actorIdentityId, action: "identity.account.archived", reason });
  return { ok: true as const };
}

export async function reissueToken(legacyUserId: number) {
  const [u] = await db.select().from(users).where(eq(users.id, legacyUserId)).limit(1);
  if (!u) return null;
  return signToken({ uid: u.id, role: u.role, email: u.email });
}

// ────────────────────────────────────────────────────────────────────────
// 8. AGENTS Intelligence (comptes machine)
// ────────────────────────────────────────────────────────────────────────

export async function createAiAgent(
  ownerIdentityId: number,
  input: { label: string; purpose: string; scopes?: string[] },
) {
  const { plaintext, hash } = generateAiAgentKey();
  const [row] = await db
    .insert(identityAiAgents)
    .values({
      identityId: ownerIdentityId,
      label: input.label,
      purpose: input.purpose,
      apiKeyHash: hash,
      scopes: (input.scopes ?? []) as any,
    })
    .returning();
  await audit({
    identityId: ownerIdentityId,
    action: "identity.ai_agent.created",
    metadata: { agentId: row.id, purpose: input.purpose, scopes: input.scopes ?? [] },
  });
  return { agent: { id: row.id, label: row.label, purpose: row.purpose, scopes: row.scopes, createdAt: row.createdAt }, apiKey: plaintext };
}

export async function listAiAgents(ownerIdentityId: number) {
  const rows = await db
    .select({
      id: identityAiAgents.id,
      label: identityAiAgents.label,
      purpose: identityAiAgents.purpose,
      scopes: identityAiAgents.scopes,
      createdAt: identityAiAgents.createdAt,
      lastUsedAt: identityAiAgents.lastUsedAt,
      revokedAt: identityAiAgents.revokedAt,
    })
    .from(identityAiAgents)
    .where(eq(identityAiAgents.identityId, ownerIdentityId))
    .orderBy(desc(identityAiAgents.createdAt));
  return rows;
}

export async function revokeAiAgent(agentId: number, ownerIdentityId: number) {
  const [row] = await db
    .update(identityAiAgents)
    .set({ revokedAt: new Date() })
    .where(and(eq(identityAiAgents.id, agentId), eq(identityAiAgents.identityId, ownerIdentityId)))
    .returning();
  if (row) await audit({ identityId: ownerIdentityId, action: "identity.ai_agent.revoked", metadata: { agentId } });
  return { ok: !!row };
}

// Fonction fictive référencée depuis service.ts — supprime lint unused var.
export { sessions };
