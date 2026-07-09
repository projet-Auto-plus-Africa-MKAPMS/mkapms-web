/**
 * Partie 9 — Tableau de santé de la plateforme (temps réel)
 *
 * Fournit au PDG l'état complet de MKA.P-MS en quelques secondes :
 * boutons, APIs, paiements, notifications, messages, redirections, images,
 * SEO, temps de réponse, erreurs détectées, modules en maintenance.
 *
 * 100% lecture seule : le module ne fait qu'agréger des données réelles déjà
 * présentes dans la plateforme. Aucune donnée n'est modifiée. Additif, isolé.
 */
import { db } from "../../db.js";
import { and, eq, gte, sql } from "drizzle-orm";
import { smartAlerts, smartHealthChecks } from "../schema.js";
import { redirLogs, redirRules } from "../../redirection-engine/schema.js";
import { annonces, annoncePhotos, payments, messages } from "../../schema.js";
import { modules, notifications } from "../../modules/core.js";
import { seoIndexingLog } from "../../modules/seo.js";

export type HealthLevel = "green" | "yellow" | "red";

export interface HealthCategory {
  key: string;
  label: string;
  level: HealthLevel;
  headline: string; // valeur principale affichée (ex: "98%", "3 cassés")
  detail: string; // explication courte
}

export interface PlatformHealth {
  generatedAt: string;
  overall: HealthLevel;
  categories: HealthCategory[];
}

const DAY = 24 * 60 * 60 * 1000;

function pct(part: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((part / total) * 100);
}

/** Agrège un instantané temps réel de l'état de la plateforme. */
export async function getPlatformHealth(): Promise<PlatformHealth> {
  const now = Date.now();
  const since24h = new Date(now - DAY);
  const since30d = new Date(now - 30 * DAY);
  const categories: HealthCategory[] = [];

  // Mesure réelle du temps de réponse de la base (une requête triviale).
  const tStart = Date.now();
  await db.execute(sql`select 1`);
  const dbMs = Date.now() - tStart;

  // 1. Boutons fonctionnels (surveillance health-checks, type bouton/lien)
  const [btn] = await db
    .select({
      total: sql<number>`count(*)::int`,
      ok: sql<number>`count(*) filter (where ${smartHealthChecks.status} = 'ok')::int`,
      broken: sql<number>`count(*) filter (where ${smartHealthChecks.status} in ('broken','missing'))::int`,
    })
    .from(smartHealthChecks)
    .where(sql`${smartHealthChecks.elementType} in ('button','link')`);
  {
    const total = btn?.total ?? 0;
    const broken = btn?.broken ?? 0;
    categories.push({
      key: "boutons",
      label: "Boutons & liens",
      level: broken > 0 ? (broken > 2 ? "red" : "yellow") : "green",
      headline: total === 0 ? "—" : `${pct(btn.ok, total)}% OK`,
      detail: total === 0 ? "Aucun élément surveillé" : `${btn.ok}/${total} fonctionnels · ${broken} à corriger`,
    });
  }

  // 2. APIs connectées — l'API répond (cette requête aboutit) ; on remonte les
  // erreurs serveur/API récentes.
  const [apiErr] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(smartAlerts)
    .where(and(eq(smartAlerts.category, "erreur"), gte(smartAlerts.createdAt, since24h)));
  {
    const n = apiErr?.n ?? 0;
    categories.push({
      key: "apis",
      label: "APIs connectées",
      level: n > 5 ? "red" : n > 0 ? "yellow" : "green",
      headline: n === 0 ? "En ligne" : `${n} erreur(s)`,
      detail: n === 0 ? "API principale opérationnelle" : `${n} erreur(s) serveur/API sur 24h`,
    });
  }

  // 3. Paiements — échecs récents
  const [pay] = await db
    .select({
      total: sql<number>`count(*)::int`,
      paid: sql<number>`count(*) filter (where ${payments.status} = 'paid')::int`,
      failed: sql<number>`count(*) filter (where ${payments.status} = 'failed')::int`,
    })
    .from(payments)
    .where(gte(payments.createdAt, since30d));
  {
    const total = pay?.total ?? 0;
    const failed = pay?.failed ?? 0;
    const failRate = total > 0 ? failed / total : 0;
    categories.push({
      key: "paiements",
      label: "Paiements",
      level: failRate >= 0.2 ? "red" : failRate > 0 ? "yellow" : "green",
      headline: total === 0 ? "Aucun" : `${pct(pay.paid, total)}% réussis`,
      detail: total === 0 ? "Aucun paiement sur 30j" : `${pay.paid} réussis · ${failed} échoués (30j)`,
    });
  }

  // 4. Notifications — activité 24h
  const [notif] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(gte(notifications.createdAt, since24h));
  {
    const n = notif?.n ?? 0;
    categories.push({
      key: "notifications",
      label: "Notifications",
      level: "green",
      headline: `${n} / 24h`,
      detail: `${n} notification(s) envoyée(s) ces dernières 24h`,
    });
  }

  // 5. Messages — activité 24h
  const [msg] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(gte(messages.createdAt, since24h));
  {
    const n = msg?.n ?? 0;
    categories.push({
      key: "messages",
      label: "Messages",
      level: "green",
      headline: `${n} / 24h`,
      detail: `${n} message(s) échangé(s) ces dernières 24h`,
    });
  }

  // 6. Redirections — taux de résolution (clés sans règle = problème)
  const [redir] = await db
    .select({
      total: sql<number>`count(*)::int`,
      matched: sql<number>`count(*) filter (where ${redirLogs.matched} = true)::int`,
    })
    .from(redirLogs)
    .where(gte(redirLogs.createdAt, since30d));
  const [activeRules] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(redirRules)
    .where(eq(redirRules.active, true));
  {
    const total = redir?.total ?? 0;
    const matched = redir?.matched ?? 0;
    const rate = total > 0 ? matched / total : 1;
    categories.push({
      key: "redirections",
      label: "Redirections",
      level: rate < 0.8 ? "red" : rate < 0.95 ? "yellow" : "green",
      headline: total === 0 ? `${activeRules?.n ?? 0} règles` : `${pct(matched, total)}% résolues`,
      detail:
        total === 0
          ? `${activeRules?.n ?? 0} règle(s) active(s), aucune résolution récente`
          : `${matched}/${total} résolues · ${activeRules?.n ?? 0} règles actives`,
    });
  }

  // 7. Images — annonces publiées sans photo
  const [imgTotal] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(annonces)
    .where(eq(annonces.status, "publiee"));
  const [imgWithout] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(annonces)
    .where(
      and(
        eq(annonces.status, "publiee"),
        sql`not exists (select 1 from ${annoncePhotos} where ${annoncePhotos.annonceId} = ${annonces.id})`,
      ),
    );
  {
    const total = imgTotal?.n ?? 0;
    const without = imgWithout?.n ?? 0;
    categories.push({
      key: "images",
      label: "Images",
      level: without > 0 ? (without > 5 ? "red" : "yellow") : "green",
      headline: total === 0 ? "—" : `${pct(total - without, total)}% avec photo`,
      detail: total === 0 ? "Aucune annonce publiée" : `${without} annonce(s) publiée(s) sans photo`,
    });
  }

  // 8. SEO — succès d'indexation récents
  const [seo] = await db
    .select({
      total: sql<number>`count(*)::int`,
      ok: sql<number>`count(*) filter (where ${seoIndexingLog.success} = true)::int`,
    })
    .from(seoIndexingLog)
    .where(gte(seoIndexingLog.createdAt, since30d));
  {
    const total = seo?.total ?? 0;
    const ok = seo?.ok ?? 0;
    const rate = total > 0 ? ok / total : 1;
    categories.push({
      key: "seo",
      label: "SEO",
      level: total === 0 ? "green" : rate < 0.7 ? "red" : rate < 0.9 ? "yellow" : "green",
      headline: total === 0 ? "—" : `${pct(ok, total)}% indexé`,
      detail: total === 0 ? "Aucune indexation récente" : `${ok}/${total} indexations réussies (30j)`,
    });
  }

  // 9. Temps de réponse (mesure réelle de la base)
  categories.push({
    key: "temps_reponse",
    label: "Temps de réponse",
    level: dbMs > 800 ? "red" : dbMs > 300 ? "yellow" : "green",
    headline: `${dbMs} ms`,
    detail: `Latence base de données mesurée à l'instant`,
  });

  // 10. Erreurs détectées — alertes ouvertes / critiques
  const [alerts] = await db
    .select({
      open: sql<number>`count(*) filter (where ${smartAlerts.status} = 'open')::int`,
      critical: sql<number>`count(*) filter (where ${smartAlerts.status} = 'open' and ${smartAlerts.severity} = 'critical')::int`,
    })
    .from(smartAlerts);
  {
    const open = alerts?.open ?? 0;
    const critical = alerts?.critical ?? 0;
    categories.push({
      key: "erreurs",
      label: "Erreurs détectées",
      level: critical > 0 ? "red" : open > 0 ? "yellow" : "green",
      headline: open === 0 ? "0" : `${open} ouverte(s)`,
      detail: critical > 0 ? `${critical} critique(s) · ${open} ouverte(s)` : `${open} alerte(s) ouverte(s)`,
    });
  }

  // 11. Modules en maintenance
  const [mods] = await db
    .select({
      total: sql<number>`count(*)::int`,
      maintenance: sql<number>`count(*) filter (where ${modules.status} = 'maintenance')::int`,
      desactive: sql<number>`count(*) filter (where ${modules.status} = 'desactive')::int`,
    })
    .from(modules);
  {
    const maintenance = mods?.maintenance ?? 0;
    const desactive = mods?.desactive ?? 0;
    categories.push({
      key: "modules",
      label: "Modules",
      level: maintenance > 0 ? "yellow" : "green",
      headline: maintenance === 0 ? "Tous actifs" : `${maintenance} maintenance`,
      detail: `${mods?.total ?? 0} module(s) · ${maintenance} en maintenance · ${desactive} désactivé(s)`,
    });
  }

  // État global = le pire des états individuels.
  const overall: HealthLevel = categories.some((c) => c.level === "red")
    ? "red"
    : categories.some((c) => c.level === "yellow")
    ? "yellow"
    : "green";

  return { generatedAt: new Date().toISOString(), overall, categories };
}
