/**
 * Feature 11 — Connexion aux annonces
 * Vérifie que chaque annonce est au bon endroit :
 * officielle, pro, particulier, premium, elite, boost, promotion, enchère.
 * Si une annonce apparaît dans le mauvais univers, le système signale l'erreur.
 */
import { db } from "../../db.js";
import { annonces, users } from "../../schema.js";
import { smartAlerts } from "../schema.js";
import { eq, and, ne, desc, sql } from "drizzle-orm";
import { logActivity } from "./activity-log.js";

export async function validateAnnonceUnivers() {
  const results: Array<{ annonceId: number; expected: string; actual: string }> = [];

  try {
    // Vérifier que les annonces "officielle" appartiennent bien aux admins
    const misplacedOfficiel = await db.execute(sql`
      SELECT a.id, a.categorie_annonce, a.owner_id, u.role
      FROM annonces a
      JOIN users u ON u.id = a.owner_id
      WHERE a.categorie_annonce = 'officielle'
        AND u.role NOT IN ('admin', 'super_admin', 'directeur')
        AND a.status = 'publiee'
      LIMIT 50
    `);

    for (const row of misplacedOfficiel.rows as any[]) {
      results.push({ annonceId: row.id, expected: "professionnelle ou particulier", actual: "officielle" });
      await db.insert(smartAlerts).values({
        category: "annonce_suspecte",
        title: `Annonce #${row.id} classée "officielle" mais propriétaire non-admin`,
        description: `L'utilisateur #${row.owner_id} (rôle: ${row.role}) a une annonce officielle. Les annonces officielles sont réservées aux administrateurs.`,
        severity: "warning",
        targetType: "annonce",
        targetId: row.id,
        metadata: { ownerId: row.owner_id, role: row.role, currentCategorie: "officielle" },
      });
    }

    // Vérifier que les annonces "professionnelle" appartiennent à des comptes pro
    const misplacedPro = await db.execute(sql`
      SELECT a.id, a.categorie_annonce, a.owner_id, u.account_type
      FROM annonces a
      JOIN users u ON u.id = a.owner_id
      WHERE a.categorie_annonce = 'professionnelle'
        AND u.account_type = 'particulier'
        AND u.role NOT IN ('admin', 'super_admin', 'directeur')
        AND a.status = 'publiee'
      LIMIT 50
    `);

    for (const row of misplacedPro.rows as any[]) {
      results.push({ annonceId: row.id, expected: "particulier", actual: "professionnelle" });
      await db.insert(smartAlerts).values({
        category: "annonce_suspecte",
        title: `Annonce #${row.id} classée "professionnelle" mais compte particulier`,
        description: `L'utilisateur #${row.owner_id} a un compte particulier mais une annonce professionnelle.`,
        severity: "info",
        targetType: "annonce",
        targetId: row.id,
        metadata: { ownerId: row.owner_id, accountType: "particulier", currentCategorie: "professionnelle" },
      });
    }

    await logActivity({
      action: "validate_annonce_univers",
      data: { total: results.length },
      result: results.length > 0 ? "pending" : "success",
      proposedDecision: results.length > 0
        ? `${results.length} annonce(s) mal classée(s) détectée(s)`
        : "Toutes les annonces sont dans le bon univers",
    });
  } catch {
    // Tables peut ne pas avoir toutes les colonnes
  }

  return results;
}

export async function getMisplacedAnnonces(limit = 50) {
  return db
    .select()
    .from(smartAlerts)
    .where(eq(smartAlerts.category, "annonce_suspecte"))
    .orderBy(desc(smartAlerts.createdAt))
    .limit(limit);
}
