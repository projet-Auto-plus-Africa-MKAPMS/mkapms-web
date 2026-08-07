/**
 * Auto-réparation du Système Intelligent (Smart Engine).
 *
 * Objectif (demande PDG) : « Résolu » ne doit pas seulement fermer la
 * notification — il doit CORRIGER la cause réelle quand c'est sûr, APPRENDRE la
 * recette, et rejouer SEUL les mêmes corrections à l'avenir.
 *
 * Ici on traite principalement les alertes « Redirection sans règle » : un
 * bouton/lien est sollicité des dizaines de fois mais aucune règle de
 * redirection ne pointe vers une page → on déduit une destination SÛRE (page
 * client réellement existante) et on crée la règle. La recette est mémorisée
 * dans `smart_auto_fixes` pour que le prochain scan l'applique automatiquement.
 *
 * Principe de sûreté : on n'auto-corrige QUE vers une route client existante
 * (voir server/data/client-routes.ts). Sinon on laisse le PDG décider — jamais
 * de correction hasardeuse.
 */
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../../db.js";
import { smartAutoFixes } from "../schema.js";
import { redirRules, redirLogs } from "../../redirection-engine/schema.js";
import { createRule } from "../../redirection-engine/service.js";
import { isKnownRoute } from "../../data/client-routes.js";
import { logActivity } from "./activity-log.js";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Cas particuliers : clés de bouton/menu dont la destination ne se déduit pas
 * simplement du nom (ex: « portefeuille » → /wallet). Le reste est déduit par
 * heuristique + validation contre les routes réelles.
 */
const KNOWN_KEY_TARGETS: Record<string, string> = {
  bouton_portefeuille: "/wallet",
  bouton_wallet: "/wallet",
  portefeuille: "/wallet",
  wallet: "/wallet",
  bouton_favoris: "/favoris",
  favoris: "/favoris",
  bouton_messages: "/messagerie",
  bouton_messagerie: "/messagerie",
  messages: "/messagerie",
  bouton_notifications: "/notifications",
  notifications: "/notifications",
  bouton_compte: "/compte",
  mon_compte: "/compte",
  compte: "/compte",
  bouton_connexion: "/connexion",
  connexion: "/connexion",
  bouton_deposer_annonce: "/vendre",
  deposer_annonce: "/vendre",
  deposer: "/vendre",
  bouton_deposer: "/vendre",
  bouton_aide: "/aide",
  aide: "/aide",
  bouton_abonnements: "/abonnements",
  abonnements: "/abonnements",
  bouton_publicite: "/demande-publicite",
  publicite: "/demande-publicite",
  bouton_univers: "/univers",
  univers: "/univers",
};

const KEY_PREFIXES = [
  "bouton_",
  "btn_",
  "nav_",
  "menu_",
  "lien_",
  "link_",
  "cta_",
  "univers_",
  "service_",
];

/**
 * Déduit une destination SÛRE pour une clé de redirection non résolue.
 * Retourne le chemin (ex: "/favoris") ou null si rien de sûr n'est trouvé.
 */
export function inferRedirectionTarget(rawKey: string): string | null {
  const key = rawKey.trim().toLowerCase();
  if (!key || key === "route_404") return null;

  // 1) Cas particuliers curés.
  if (KNOWN_KEY_TARGETS[key]) return KNOWN_KEY_TARGETS[key];

  // 2) Retirer un préfixe connu puis tester la route dérivée.
  let rest = key;
  for (const p of KEY_PREFIXES) {
    if (key.startsWith(p)) {
      rest = key.slice(p.length);
      break;
    }
  }
  if (KNOWN_KEY_TARGETS[rest]) return KNOWN_KEY_TARGETS[rest];

  // 3) Heuristique : "/rest" avec underscores → tirets.
  const candidate = "/" + rest.replace(/_+/g, "-").replace(/^\/+/, "");
  if (isKnownRoute(candidate)) return candidate;

  // 4) Variante sans tirets (ex: "espacepro" → /espace-pro peu probable) — on
  // reste conservateur : rien d'autre n'est considéré comme sûr.
  return null;
}

/** Enregistre/actualise une recette d'auto-réparation apprise (idempotent). */
async function learnFix(input: {
  problemType: string;
  matchKey: string;
  action: string;
  params: Record<string, unknown>;
  learnedFrom?: number;
  createdBy?: number;
}): Promise<void> {
  await db
    .insert(smartAutoFixes)
    .values({
      problemType: input.problemType,
      matchKey: input.matchKey,
      action: input.action,
      params: input.params,
      learnedFrom: input.learnedFrom ?? null,
      createdBy: input.createdBy ?? null,
      timesApplied: 1,
      lastAppliedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [smartAutoFixes.problemType, smartAutoFixes.matchKey],
      set: {
        action: input.action,
        params: input.params,
        timesApplied: sql`${smartAutoFixes.timesApplied} + 1`,
        lastAppliedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

export interface RedirectionFixResult {
  fixed: boolean;
  alreadyOk: boolean;
  target: string | null;
  key: string;
}

/**
 * Corrige RÉELLEMENT une clé de redirection sans règle : crée la règle vers une
 * destination sûre et mémorise la recette. Idempotent : si une règle active
 * existe déjà, ne recrée rien (alreadyOk).
 */
export async function applyRedirectionFix(
  rawKey: string,
  opts?: { alertId?: number; userId?: number },
): Promise<RedirectionFixResult> {
  const key = rawKey.trim();
  const lower = key.toLowerCase();
  if (!key || lower === "route_404") {
    return { fixed: false, alreadyOk: false, target: null, key };
  }

  // Une règle active existe déjà ? Le défaut est déjà réglé.
  const [existing] = await db
    .select({ id: redirRules.id })
    .from(redirRules)
    .where(and(eq(redirRules.key, key), eq(redirRules.active, true)))
    .limit(1);
  if (existing) {
    return { fixed: false, alreadyOk: true, target: null, key };
  }

  const target = inferRedirectionTarget(key);
  if (!target) {
    return { fixed: false, alreadyOk: false, target: null, key };
  }

  // Créer la règle (createRule gère le conflit de clé unique via insert ; on a
  // vérifié qu'aucune règle active n'existe. Si une règle inactive existe, on
  // la réactive plutôt que d'échouer sur la contrainte unique).
  const [inactive] = await db
    .select({ id: redirRules.id })
    .from(redirRules)
    .where(eq(redirRules.key, key))
    .limit(1);

  if (inactive) {
    await db
      .update(redirRules)
      .set({ target, active: true, updatedBy: opts?.userId ?? null, updatedAt: new Date() })
      .where(eq(redirRules.id, inactive.id));
  } else {
    await createRule(
      {
        key,
        label: `Auto — ${key}`,
        kind: lower.startsWith("nav_") || lower.startsWith("univers_") ? "route" : "button",
        target,
        active: true,
        priority: 50,
        description:
          "Règle créée automatiquement par le Système Intelligent (auto-réparation d'une redirection sans règle). Modifiable par le PDG.",
      },
      opts?.userId ?? 0,
    );
  }

  await learnFix({
    problemType: "redirection",
    matchKey: key,
    action: "create_redirect_rule",
    params: { target },
    learnedFrom: opts?.alertId,
    createdBy: opts?.userId,
  });

  try {
    await logActivity({
      action: "smart.auto_fix.redirection",
      userId: opts?.userId,
      targetType: "redirection",
      data: { key, target },
      result: "success",
      proposedDecision: `Redirection « ${key} » réparée automatiquement → ${target}`,
    });
  } catch {
    /* journal best-effort */
  }

  return { fixed: true, alreadyOk: false, target, key };
}

/**
 * Auto-résolution des pages introuvables agrégées (clé « route_404 ») : pour
 * chaque chemin 404 récent, si une route client existe pour une variante
 * évidente (pluriel/singulier, accents retirés), on crée un alias de chemin
 * « path:<from> » → route. On ne crée un alias que vers une page réelle.
 * Retourne le nombre d'alias créés.
 */
export async function healRecent404s(opts?: {
  userId?: number;
  sinceDays?: number;
}): Promise<{ aliasesCreated: number; targets: Array<{ from: string; to: string }> }> {
  const since = new Date(Date.now() - (opts?.sinceDays ?? 7) * DAY);
  const rows = await db
    .select({ source: redirLogs.source, n: sql<number>`count(*)::int` })
    .from(redirLogs)
    .where(
      and(
        eq(redirLogs.key, "route_404"),
        eq(redirLogs.outcome, "not_found"),
        gte(redirLogs.createdAt, since),
      ),
    )
    .groupBy(redirLogs.source)
    .orderBy(desc(sql`count(*)`))
    .limit(50);

  const targets: Array<{ from: string; to: string }> = [];
  for (const r of rows) {
    const from = (r.source ?? "").trim();
    if (!from || !from.startsWith("/")) continue;
    if (isKnownRoute(from)) continue; // la page existe déjà — rien à réparer

    const to = inferPathTarget(from);
    if (!to || to === from) continue;

    const aliasKey = `path:${from}`.slice(0, 128);
    const [exists] = await db
      .select({ id: redirRules.id })
      .from(redirRules)
      .where(eq(redirRules.key, aliasKey))
      .limit(1);
    if (exists) continue;

    await createRule(
      {
        key: aliasKey,
        label: `Auto — chemin ${from} → ${to}`,
        kind: "route",
        target: to,
        active: true,
        priority: 150,
        description:
          "Alias de chemin créé automatiquement par le Système Intelligent (auto-résolution d'une page introuvable). Modifiable par le PDG.",
      },
      opts?.userId ?? 0,
    );
    await learnFix({
      problemType: "path_alias",
      matchKey: aliasKey,
      action: "create_path_alias",
      params: { from, to },
      createdBy: opts?.userId,
    });
    targets.push({ from, to });
  }

  return { aliasesCreated: targets.length, targets };
}

/** Déduit une page existante pour un chemin 404 (variantes sûres uniquement). */
function inferPathTarget(from: string): string | null {
  const p = from.replace(/\/+$/, "");
  const variants = new Set<string>();
  // pluriel/singulier du dernier segment
  if (p.endsWith("s")) variants.add(p.slice(0, -1));
  else variants.add(p + "s");
  // remonter au parent
  const parent = p.slice(0, p.lastIndexOf("/")) || "/";
  if (parent !== "/") variants.add(parent);
  for (const v of variants) {
    if (v !== p && isKnownRoute(v)) return v;
  }
  return null;
}

/**
 * Rejoue toutes les recettes apprises (auto_apply) pour s'assurer que les
 * corrections restent en place (ex: une règle supprimée par erreur est
 * recréée). Appelé au début de chaque scan d'alertes.
 */
export async function replayLearnedFixes(): Promise<{ reapplied: number }> {
  const recipes = await db
    .select()
    .from(smartAutoFixes)
    .where(eq(smartAutoFixes.autoApply, true));

  let reapplied = 0;
  for (const r of recipes) {
    if (r.action === "create_redirect_rule" || r.action === "create_path_alias") {
      const params = (r.params ?? {}) as Record<string, unknown>;
      const target =
        typeof params.target === "string"
          ? params.target
          : typeof params.to === "string"
            ? params.to
            : null;
      if (!target) continue;

      const [rule] = await db
        .select({ id: redirRules.id, active: redirRules.active })
        .from(redirRules)
        .where(eq(redirRules.key, r.matchKey))
        .limit(1);

      if (!rule) {
        await createRule(
          {
            key: r.matchKey,
            label: `Auto — ${r.matchKey}`,
            kind: r.matchKey.startsWith("path:") ? "route" : "button",
            target,
            active: true,
            priority: r.matchKey.startsWith("path:") ? 150 : 50,
            description:
              "Règle recréée automatiquement par le Système Intelligent (recette d'auto-réparation apprise).",
          },
          0,
        );
        reapplied += 1;
      } else if (!rule.active) {
        await db
          .update(redirRules)
          .set({ active: true, updatedAt: new Date() })
          .where(eq(redirRules.id, rule.id));
        reapplied += 1;
      }
    }
  }
  return { reapplied };
}

/** Statistiques des recettes d'auto-réparation (pour l'UI PDG). */
export async function autoFixStats() {
  const rows = await db
    .select({
      total: sql<number>`count(*)::int`,
      auto: sql<number>`count(*) filter (where ${smartAutoFixes.autoApply} = true)::int`,
      applied: sql<number>`coalesce(sum(${smartAutoFixes.timesApplied}), 0)::int`,
    })
    .from(smartAutoFixes);
  return rows[0] ?? { total: 0, auto: 0, applied: 0 };
}
