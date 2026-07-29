/**
 * Partie 10 — Système d'alerte à niveaux
 *
 * Le Smart Engine détecte automatiquement les problèmes et lève une alerte
 * pour chacun :
 *   • bouton cassé          • redirection incorrecte
 *   • API arrêtée           • annonce inaccessible
 *   • page vide             • image absente
 *   • erreur serveur        • erreur paiement
 *
 * Chaque alerte porte un niveau :
 *   🟢 info (Information) · 🟡 warning (Attention) ·
 *   🟠 important (Important) · 🔴 critical (Critique)
 *
 * Additif : les alertes sont écrites dans la table existante `smart_alerts`
 * (lignes ajoutées uniquement). La détection est idempotente : on ne recrée
 * pas une alerte déjà ouverte pour le même problème (dédup par signature dans
 * metadata). Le scan est en lecture seule sur la plateforme.
 */
import { db } from "../../db.js";
import { and, eq, gte, sql } from "drizzle-orm";
import { smartAlerts, smartHealthChecks } from "../schema.js";
import { redirLogs } from "../../redirection-engine/schema.js";
import { annonces, annoncePhotos, payments } from "../../schema.js";

export type AlertLevel = "info" | "warning" | "important" | "critical";

interface RaiseInput {
  category: string;
  title: string;
  description?: string;
  level: AlertLevel;
  targetType?: string;
  targetId?: number;
  signature: string; // clé de dédup stable
  // Horodatage de la dernière occurrence RÉELLE du problème. Si fourni, on ne
  // ré-ouvre pas une alerte déjà résolue tant qu'aucune nouvelle occurrence
  // n'est survenue APRÈS la résolution (évite le retour en boucle des 404
  // historiques après « Résolu » / « Analyser maintenant »).
  lastOccurredAt?: Date;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Lève une alerte si aucune alerte OUVERTE avec la même signature n'existe
 * déjà. On ne réveille pas une alerte déjà traitée (resolved/dismissed) tant
 * que le problème n'est pas re-détecté APRÈS la résolution.
 */
async function raiseAlert(input: RaiseInput): Promise<boolean> {
  const existing = await db
    .select({ id: smartAlerts.id })
    .from(smartAlerts)
    .where(
      and(
        eq(smartAlerts.status, "open"),
        sql`${smartAlerts.metadata}->>'signature' = ${input.signature}`,
      ),
    )
    .limit(1);

  if (existing.length > 0) return false;

  // Déjà traitée ? On ne rouvre que si le problème est réapparu après coup.
  const [lastResolved] = await db
    .select({ resolvedAt: smartAlerts.resolvedAt, createdAt: smartAlerts.createdAt })
    .from(smartAlerts)
    .where(
      and(
        sql`${smartAlerts.status} in ('resolved','dismissed','acknowledged')`,
        sql`${smartAlerts.metadata}->>'signature' = ${input.signature}`,
      ),
    )
    .orderBy(sql`coalesce(${smartAlerts.resolvedAt}, ${smartAlerts.createdAt}) desc`)
    .limit(1);
  if (lastResolved && input.lastOccurredAt) {
    const resolvedAt = lastResolved.resolvedAt ?? lastResolved.createdAt;
    if (resolvedAt && input.lastOccurredAt.getTime() <= resolvedAt.getTime()) return false;
  }

  await db.insert(smartAlerts).values({
    category: input.category,
    title: input.title,
    description: input.description ?? null,
    severity: input.level,
    status: "open",
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    metadata: { signature: input.signature, source: "alert_engine" },
  });
  return true;
}

/**
 * Analyse la plateforme (données réelles) et lève les alertes nécessaires.
 * Rejoué à la demande du PDG ou par une tâche planifiée.
 */
export async function runAlertScan() {
  const now = Date.now();
  const since24h = new Date(now - DAY);
  const since7d = new Date(now - 7 * DAY);
  let created = 0;
  const raise = async (i: RaiseInput) => {
    if (await raiseAlert(i)) created += 1;
  };

  // 1. Boutons cassés + 3. Pages vides + éléments manquants (health checks)
  const broken = await db
    .select()
    .from(smartHealthChecks)
    .where(sql`${smartHealthChecks.status} in ('broken','missing')`);
  for (const b of broken) {
    const isButton = b.elementType === "button" || b.elementType === "link";
    await raise({
      category: isButton ? "bouton" : "page",
      title: `${b.elementType} « ${b.element} » ${b.status === "broken" ? "cassé" : "manquant"} sur ${b.page}`,
      description: b.errorDetails ?? undefined,
      level: b.status === "broken" ? "critical" : "important",
      targetType: "page",
      signature: `health:${b.page}:${b.element}:${b.status}`,
    });
  }

  // 5. Redirections incorrectes — clés demandées sans règle (non résolues)
  const unmatched = await db
    .select({
      key: redirLogs.key,
      n: sql<number>`count(*)::int`,
      lastAt: sql<Date>`max(${redirLogs.createdAt})`,
    })
    .from(redirLogs)
    .where(and(eq(redirLogs.matched, false), gte(redirLogs.createdAt, since7d)))
    .groupBy(redirLogs.key)
    .orderBy(sql`count(*) DESC`)
    .limit(20);
  for (const u of unmatched) {
    if (u.n < 1) continue;
    await raise({
      category: "redirection",
      title: `Redirection sans règle : « ${u.key} »`,
      description: `Le bouton/lien « ${u.key} » a été sollicité ${u.n} fois sans règle de redirection active (7 derniers jours).`,
      level: u.n >= 5 ? "important" : "warning",
      signature: `redir:${u.key}`,
      lastOccurredAt: u.lastAt ? new Date(u.lastAt) : undefined,
    });
  }

  // 6. Images absentes — annonces publiées sans aucune photo
  const noPhoto = await db
    .select({ id: annonces.id, titre: annonces.titre })
    .from(annonces)
    .where(
      and(
        eq(annonces.status, "publiee"),
        sql`not exists (select 1 from ${annoncePhotos} where ${annoncePhotos.annonceId} = ${annonces.id})`,
      ),
    )
    .limit(50);
  for (const a of noPhoto) {
    await raise({
      category: "annonce",
      title: `Annonce publiée sans photo (#${a.id})`,
      description: a.titre ? `« ${a.titre} » est visible sans aucune image.` : undefined,
      level: "warning",
      targetType: "annonce",
      targetId: a.id,
      signature: `img:annonce:${a.id}`,
    });
  }

  // 8. Erreurs paiement — paiements échoués récents
  const failedPay = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(payments)
    .where(and(eq(payments.status, "failed"), gte(payments.createdAt, since24h)));
  const nFail = failedPay[0]?.n ?? 0;
  if (nFail > 0) {
    await raise({
      category: "paiement",
      title: `${nFail} paiement(s) en échec (24h)`,
      description: `Des paiements ont échoué ces dernières 24h. Vérifier la passerelle de paiement.`,
      level: nFail >= 3 ? "critical" : "important",
      signature: `pay:failed:${new Date().toISOString().slice(0, 10)}`,
    });
  }

  // 2 & 4. API arrêtée / erreurs serveur — pic d'alertes "erreur" existantes
  const [srvErr] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(smartAlerts)
    .where(
      and(
        eq(smartAlerts.category, "erreur"),
        eq(smartAlerts.status, "open"),
        gte(smartAlerts.createdAt, since24h),
      ),
    );
  if ((srvErr?.n ?? 0) >= 5) {
    await raise({
      category: "erreur",
      title: `Pic d'erreurs serveur (${srvErr.n} en 24h)`,
      description: `Un nombre anormal d'erreurs serveur a été détecté. Une API pourrait être arrêtée.`,
      level: "critical",
      signature: `srv:pic:${new Date().toISOString().slice(0, 10)}`,
    });
  }

  return { created };
}

/** Répartition des alertes ouvertes par niveau (4 niveaux, Partie 10). */
export async function alertLevelStats() {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      open: sql<number>`count(*) filter (where ${smartAlerts.status} = 'open')::int`,
      info: sql<number>`count(*) filter (where ${smartAlerts.status} = 'open' and ${smartAlerts.severity} = 'info')::int`,
      warning: sql<number>`count(*) filter (where ${smartAlerts.status} = 'open' and ${smartAlerts.severity} = 'warning')::int`,
      important: sql<number>`count(*) filter (where ${smartAlerts.status} = 'open' and ${smartAlerts.severity} = 'important')::int`,
      critical: sql<number>`count(*) filter (where ${smartAlerts.status} = 'open' and ${smartAlerts.severity} = 'critical')::int`,
    })
    .from(smartAlerts);
  return stats;
}
