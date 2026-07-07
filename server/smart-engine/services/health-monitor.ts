/**
 * Feature 13 — Surveillance boutons et redirections
 * Surveille : boutons cassés, liens cassés, mauvaises redirections,
 * formulaires bloqués, pages qui ne chargent pas, images absentes.
 * Si un problème est détecté : alerte + page concernée + bouton/redirection + correction suggérée.
 */
import { db } from "../../db.js";
import { smartHealthChecks, smartAlerts } from "../schema.js";
import { eq, desc, sql, and } from "drizzle-orm";
import { logActivity } from "./activity-log.js";

interface HealthCheckInput {
  page: string;
  element: string;
  elementType: string;
  status: "ok" | "broken" | "slow" | "missing";
  errorDetails?: string;
  suggestedFix?: string;
}

export async function reportHealthCheck(input: HealthCheckInput) {
  // Upsert : mise à jour si même page+element existe déjà
  const [existing] = await db
    .select()
    .from(smartHealthChecks)
    .where(and(eq(smartHealthChecks.page, input.page), eq(smartHealthChecks.element, input.element)))
    .limit(1);

  if (existing) {
    await db
      .update(smartHealthChecks)
      .set({
        status: input.status,
        lastCheckedAt: new Date(),
        errorDetails: input.errorDetails ?? null,
        suggestedFix: input.suggestedFix ?? null,
      })
      .where(eq(smartHealthChecks.id, existing.id));
  } else {
    await db.insert(smartHealthChecks).values({
      page: input.page,
      element: input.element,
      elementType: input.elementType,
      status: input.status,
      errorDetails: input.errorDetails ?? null,
      suggestedFix: input.suggestedFix ?? null,
    });
  }

  // Si cassé → alerte
  if (input.status === "broken" || input.status === "missing") {
    await db.insert(smartAlerts).values({
      category: "erreur",
      title: `${input.elementType} "${input.element}" ${input.status === "broken" ? "cassé" : "manquant"} sur ${input.page}`,
      description: input.errorDetails ?? "",
      severity: "critical",
      targetType: "page",
      metadata: { page: input.page, element: input.element, suggestedFix: input.suggestedFix },
    });
    await logActivity({
      action: "health_check_failed",
      data: { page: input.page, element: input.element, status: input.status },
      result: "failure",
      proposedDecision: input.suggestedFix ?? "Vérification manuelle requise",
    });
  }
}

export async function getHealthStatus() {
  const all = await db.select().from(smartHealthChecks).orderBy(desc(smartHealthChecks.lastCheckedAt));
  const broken = all.filter((h) => h.status === "broken" || h.status === "missing");
  const slow = all.filter((h) => h.status === "slow");
  const ok = all.filter((h) => h.status === "ok");
  return { total: all.length, broken: broken.length, slow: slow.length, ok: ok.length, items: all };
}

export async function getBrokenElements(limit = 50) {
  return db
    .select()
    .from(smartHealthChecks)
    .where(sql`${smartHealthChecks.status} IN ('broken', 'missing')`)
    .orderBy(desc(smartHealthChecks.lastCheckedAt))
    .limit(limit);
}

// Enregistrement initial des éléments critiques à surveiller
export async function registerCriticalElements() {
  const elements: HealthCheckInput[] = [
    // Pages produit officiel
    { page: "/acheter/mkapms-officiel/vehicule/:id", element: "bouton_modifier", elementType: "button", status: "ok" },
    { page: "/acheter/mkapms-officiel/vehicule/:id", element: "bouton_prolonger", elementType: "button", status: "ok" },
    { page: "/acheter/mkapms-officiel/vehicule/:id", element: "bouton_reserver", elementType: "button", status: "ok" },
    { page: "/acheter/mkapms-officiel/vehicule/:id", element: "lien_voir_annonces", elementType: "link", status: "ok" },
    { page: "/acheter/mkapms-officiel/vehicule/:id", element: "photos_categorie", elementType: "button", status: "ok" },
    { page: "/acheter/mkapms-officiel/vehicule/:id", element: "signaler_annonce", elementType: "button", status: "ok" },
    // Pages produit pro
    { page: "/acheter/professionnel/vehicule/:id", element: "bouton_modifier", elementType: "button", status: "ok" },
    { page: "/acheter/professionnel/vehicule/:id", element: "bouton_prolonger", elementType: "button", status: "ok" },
    { page: "/acheter/professionnel/vehicule/:id", element: "bouton_appel", elementType: "button", status: "ok" },
    { page: "/acheter/professionnel/vehicule/:id", element: "bouton_message", elementType: "button", status: "ok" },
    { page: "/acheter/professionnel/vehicule/:id", element: "lien_voir_annonces", elementType: "link", status: "ok" },
    // Pages produit particulier
    { page: "/acheter/particulier/vehicule/:id", element: "bouton_modifier", elementType: "button", status: "ok" },
    { page: "/acheter/particulier/vehicule/:id", element: "bouton_prolonger", elementType: "button", status: "ok" },
    { page: "/acheter/particulier/vehicule/:id", element: "bouton_appel", elementType: "button", status: "ok" },
    { page: "/acheter/particulier/vehicule/:id", element: "bouton_message", elementType: "button", status: "ok" },
    { page: "/acheter/particulier/vehicule/:id", element: "lien_voir_annonces", elementType: "link", status: "ok" },
    // Listing pages
    { page: "/acheter/mkapms-officiel", element: "barre_recherche", elementType: "form", status: "ok" },
    { page: "/acheter/professionnel", element: "barre_recherche", elementType: "form", status: "ok" },
    { page: "/acheter/particulier", element: "barre_recherche", elementType: "form", status: "ok" },
    // Dépôt annonce
    { page: "/vendre", element: "formulaire_depot", elementType: "form", status: "ok" },
    { page: "/vendre", element: "upload_photos", elementType: "form", status: "ok" },
  ];

  for (const el of elements) {
    await reportHealthCheck(el);
  }

  return elements.length;
}
