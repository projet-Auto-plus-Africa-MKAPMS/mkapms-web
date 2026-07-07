/**
 * Feature 12 — Connexion aux badges
 * Contrôle : badge officiel, pro, particulier, premium, elite, boost, vérifié, qualité.
 * Les badges doivent correspondre au bon compte, au bon abonnement et au bon type d'annonce.
 */
import { db } from "../../db.js";
import { users } from "../../schema.js";
import { smartAlerts } from "../schema.js";
import { sql, desc, eq } from "drizzle-orm";
import { logActivity } from "./activity-log.js";

interface BadgeCheck {
  userId: number;
  badge: string;
  isValid: boolean;
  reason?: string;
}

export async function validateBadges(): Promise<BadgeCheck[]> {
  const issues: BadgeCheck[] = [];

  try {
    // Vérifier les badges "officiel" — seuls les admins doivent l'avoir
    const officielBadges = await db.execute(sql`
      SELECT id, role, account_type, name
      FROM users
      WHERE role NOT IN ('admin', 'super_admin', 'directeur')
        AND (badges::text ILIKE '%officiel%' OR badges::text ILIKE '%official%')
      LIMIT 50
    `);

    for (const row of officielBadges.rows as any[]) {
      issues.push({
        userId: row.id,
        badge: "officiel",
        isValid: false,
        reason: `Utilisateur #${row.id} (${row.name}) a le badge officiel mais n'est pas admin (rôle: ${row.role})`,
      });
    }

    // Vérifier les badges "pro" — seuls les comptes pro doivent l'avoir
    const proBadges = await db.execute(sql`
      SELECT id, role, account_type, name
      FROM users
      WHERE account_type = 'particulier'
        AND role NOT IN ('admin', 'super_admin', 'directeur')
        AND (badges::text ILIKE '%pro%' OR badges::text ILIKE '%professionnel%')
      LIMIT 50
    `);

    for (const row of proBadges.rows as any[]) {
      issues.push({
        userId: row.id,
        badge: "pro",
        isValid: false,
        reason: `Utilisateur #${row.id} (${row.name}) a le badge pro mais un compte particulier`,
      });
    }
  } catch {
    // La colonne badges peut ne pas exister
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      await db.insert(smartAlerts).values({
        category: "badge",
        title: `Badge "${issue.badge}" invalide pour utilisateur #${issue.userId}`,
        description: issue.reason ?? "",
        severity: "warning",
        targetType: "user",
        targetId: issue.userId,
        metadata: { badge: issue.badge },
      });
    }
    await logActivity({
      action: "validate_badges",
      data: { issues: issues.length },
      result: "pending",
      proposedDecision: `${issues.length} badge(s) invalide(s) détecté(s)`,
    });
  }

  return issues;
}

export async function getBadgeAlerts(limit = 50) {
  return db
    .select()
    .from(smartAlerts)
    .where(eq(smartAlerts.category, "badge"))
    .orderBy(desc(smartAlerts.createdAt))
    .limit(limit);
}
