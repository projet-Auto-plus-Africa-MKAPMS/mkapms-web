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
import { BOUTONS_SANS_ACTION } from "../../data/boutons-sans-action.js";

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

/**
 * Connecte l'inventaire statique des boutons sans action (server/data/boutons-sans-action.ts,
 * généré par gen-boutons-sans-action.mjs) au moteur de surveillance en direct.
 * Sans cet appel, un bouton mort n'était visible qu'en CI (`check:boutons`) —
 * jamais côté direction, jamais alertable, jamais rejoué par le scan.
 *
 * N'insère jamais directement dans smart_alerts (ce serait dupliquer la
 * déduplication déjà faite par alert-engine.ts::runAlertScan) : seule la
 * table smart_health_checks est écrite ici, avec un élément préfixé
 * "static_L<ligne>" pour ne jamais toucher les lignes seedées par
 * registerCriticalElements(). Idempotent : un bouton toujours mort n'est pas
 * réécrit ; un bouton corrigé (disparu de l'inventaire) repasse à "ok".
 */
/** Deux boutons morts peuvent partager la même ligne (JSX compact) : un compteur par fichier+ligne les distingue sans dépendre de l'ordre du tableau. */
function elementsUniques(): { fichier: string; ligne: number; libelle: string; element: string }[] {
  const compteur = new Map<string, number>();
  return BOUTONS_SANS_ACTION.map((b) => {
    const cle = `${b.fichier}::${b.ligne}`;
    const occurrence = compteur.get(cle) ?? 0;
    compteur.set(cle, occurrence + 1);
    const element = occurrence === 0 ? `static_L${b.ligne}` : `static_L${b.ligne}_${occurrence}`;
    return { fichier: b.fichier, ligne: b.ligne, libelle: b.libelle, element };
  });
}

/**
 * Vrai si (page, élément) désigne un bouton fantôme TOUJOURS présent dans
 * l'inventaire statique en direct (server/data/boutons-sans-action.ts).
 *
 * Sert à empêcher un mensonge d'état (point 91) : marquer un contrôle de
 * santé « ok » alors que le code n'a pas changé ne fait que déclencher, au
 * prochain scan, une remise à « broken » avec un nouveau lastCheckedAt — donc
 * une réouverture immédiate de l'alerte (le PDG se plaignait : « je clique
 * Résolu, je rafraîchis, ça revient direct »). resolveAlertWithLearning
 * (alert-engine.ts) appelle cette fonction avant de faire cette promesse.
 */
export function isKnownGhostButton(page: string, element: string): boolean {
  return elementsUniques().some((b) => b.fichier === page && b.element === element);
}

export async function syncBoutonsSansAction(): Promise<{ synced: number; resolved: number }> {
  const boutons = elementsUniques();
  const actuels = new Set(boutons.map((b) => `${b.fichier}::${b.element}`));
  let synced = 0;

  for (const b of boutons) {
    const element = b.element;
    const errorDetails = `Bouton « ${b.libelle || "(sans texte)"} » sans gestionnaire de clic, sans type submit, hors formulaire soumis (détection statique gen-boutons-sans-action.mjs).`;

    const [existing] = await db
      .select({ id: smartHealthChecks.id, status: smartHealthChecks.status })
      .from(smartHealthChecks)
      .where(and(eq(smartHealthChecks.page, b.fichier), eq(smartHealthChecks.element, element)))
      .limit(1);

    if (existing) {
      if (existing.status !== "broken") {
        await db
          .update(smartHealthChecks)
          .set({ status: "broken", lastCheckedAt: new Date(), errorDetails })
          .where(eq(smartHealthChecks.id, existing.id));
        synced += 1;
      }
    } else {
      await db.insert(smartHealthChecks).values({
        page: b.fichier,
        element,
        elementType: "button",
        status: "broken",
        errorDetails,
      });
      synced += 1;
    }
  }

  const suivis = await db
    .select({ id: smartHealthChecks.id, page: smartHealthChecks.page, element: smartHealthChecks.element })
    .from(smartHealthChecks)
    .where(and(sql`${smartHealthChecks.element} LIKE 'static_L%'`, sql`${smartHealthChecks.status} <> 'ok'`));

  let resolved = 0;
  for (const s of suivis) {
    if (!actuels.has(`${s.page}::${s.element}`)) {
      await db.update(smartHealthChecks).set({ status: "ok", lastCheckedAt: new Date() }).where(eq(smartHealthChecks.id, s.id));
      resolved += 1;
    }
  }

  return { synced, resolved };
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
