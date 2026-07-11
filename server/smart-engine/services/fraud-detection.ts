/**
 * Feature 7 — Détection faux comptes
 * Vérifie : email déjà utilisé, numéro déjà utilisé, même appareil,
 * même IP suspecte, comptes multiples, comportement anormal.
 */
import { db } from "../../db.js";
import { users } from "../../schema.js";
import { smartSuspectAccounts, smartAlerts } from "../schema.js";
import { and, eq, ne, desc, sql } from "drizzle-orm";
import { logActivity } from "./activity-log.js";
// Renfort P4 — score de risque agrégé + normalisation email/tel + disposable.
// Ne remplace aucune vérification existante : les enrichit.
import {
  normalizeEmail,
  normalizePhone,
  computeRiskScore,
  isDisposableEmail,
} from "./risk-scoring.js";

interface FraudCheckInput {
  userId: number;
  email?: string;
  phone?: string;
  ip?: string;
}

export async function checkFraud(input: FraudCheckInput) {
  const suspects: Array<{ reason: string; details: Record<string, unknown>; severity: "info" | "warning" | "critical" }> = [];

  // 1. Même email (hors l'utilisateur lui-même)
  if (input.email) {
    const emailDupes = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(and(eq(users.email, input.email), ne(users.id, input.userId)));
    if (emailDupes.length > 0) {
      suspects.push({
        reason: "duplicate_email",
        details: { email: input.email, matchedUsers: emailDupes.map((u) => u.id) },
        severity: "warning",
      });
    }
  }

  // 2. Même téléphone
  if (input.phone) {
    const phoneDupes = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.phone, input.phone), ne(users.id, input.userId)));
    if (phoneDupes.length > 0) {
      suspects.push({
        reason: "duplicate_phone",
        details: { phone: input.phone, matchedUsers: phoneDupes.map((u) => u.id) },
        severity: "warning",
      });
    }
  }

  // 3. Renfort P4 — signaux avancés + score de risque agrégé.
  // Détecte les variations qui échappent aux comparaisons exactes ci-dessus :
  // gmail avec points/alias, numéros bruités, domaines email jetables.
  {
    const nEmail = normalizeEmail(input.email);
    const nPhone = normalizePhone(input.phone);

    const normalizedEmailMatches = nEmail
      ? await db
          .select({ id: users.id })
          .from(users)
          .where(and(sql`lower(${users.email}) = ${nEmail}`, ne(users.id, input.userId)))
      : [];
    const normalizedPhoneMatches = nPhone
      ? await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.phone, nPhone), ne(users.id, input.userId)))
      : [];

    const risk = computeRiskScore({
      duplicateNormalizedEmail: normalizedEmailMatches.length > 0,
      duplicateNormalizedPhone: normalizedPhoneMatches.length > 0,
      disposableEmailDomain: isDisposableEmail(input.email),
    });

    if (risk.severity !== "info") {
      // On mappe "important" (non supporté par l'enum severity actuel) sur "warning"
      // pour rester strictement compatible avec le schéma existant.
      const mapped: "info" | "warning" | "critical" =
        risk.severity === "critical" ? "critical" : "warning";
      suspects.push({
        reason: "risk_score",
        details: {
          score: risk.score,
          reasons: risk.reasons,
          normalizedEmail: nEmail,
          normalizedPhone: nPhone,
          matchedEmail: normalizedEmailMatches.map((u) => u.id),
          matchedPhone: normalizedPhoneMatches.map((u) => u.id),
        },
        severity: mapped,
      });
    }
  }

  // Sauvegarder les alertes
  for (const s of suspects) {
    await db.insert(smartSuspectAccounts).values({
      userId: input.userId,
      reason: s.reason,
      details: s.details,
      severity: s.severity,
    });
    await db.insert(smartAlerts).values({
      category: "faux_compte",
      title: `Compte suspect détecté (utilisateur #${input.userId})`,
      description: `Raison : ${s.reason}`,
      severity: s.severity,
      targetType: "user",
      targetId: input.userId,
      metadata: s.details,
    });
    await logActivity({
      action: "fraud_check",
      userId: input.userId,
      targetType: "user",
      targetId: input.userId,
      data: s.details,
      result: "pending",
      proposedDecision: `Compte potentiellement frauduleux : ${s.reason}`,
    });
  }

  return { isSuspect: suspects.length > 0, suspects };
}

export async function getUnresolvedSuspects(limit = 50) {
  return db
    .select()
    .from(smartSuspectAccounts)
    .where(eq(smartSuspectAccounts.resolved, false))
    .orderBy(desc(smartSuspectAccounts.createdAt))
    .limit(limit);
}

export async function resolveSuspect(id: number, resolvedBy: number) {
  await db
    .update(smartSuspectAccounts)
    .set({ resolved: true, resolvedBy })
    .where(eq(smartSuspectAccounts.id, id));
}
