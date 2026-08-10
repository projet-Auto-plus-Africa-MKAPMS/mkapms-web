/**
 * Points 69-70 — cycle de vie réel des actions du PDG.
 *
 * Défaut corrigé : « je valide mais rien ne se passe ». Une proposition validée
 * ne faisait que changer de statut ; aucune tâche n'était créée, aucun résultat
 * mesuré, et la proposition disparaissait de l'écran.
 *
 * Désormais : une validation crée une TÂCHE qui traverse ses états
 *   propose → valide → planifie → en_cours → test → deploye → verifie → termine
 * chaque étape est horodatée avec sa preuve, et un échec conserve la raison
 * exacte au lieu de faire disparaître la demande.
 *
 * Deux règles tenues :
 *   • une action sans exécuteur ne prétend jamais s'être exécutée : elle passe
 *     `manuel_requis` et reste visible jusqu'à ce qu'un humain la termine ;
 *   • une action de niveau 3 (point 74) n'est jamais lancée par ce service —
 *     elle attend une confirmation explicite du PDG.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db.js";
import { smartActionSteps, smartActionTasks } from "../schema.js";
import { seoKeywords } from "../../modules/seo.js";
import { countryCountries } from "../../country-os/index.js";
import { applyRedirectionFix, healRecent404s, replayLearnedFixes } from "./auto-fix.js";
import { runQualityAudit } from "./quality-engine.js";
import { runAlertScan } from "./alert-engine.js";
import { logActivity } from "./activity-log.js";

/** Étapes du cycle de vie, dans l'ordre. */
export const TASK_STEPS = [
  "propose",
  "valide",
  "planifie",
  "en_cours",
  "test",
  "deploye",
  "verifie",
  "termine",
] as const;

export type TaskStatus =
  | (typeof TASK_STEPS)[number]
  | "echec"
  | "manuel_requis"
  | "rejete";

export interface ExecutionOutcome {
  ok: boolean;
  /** Ce qui a réellement été fait, en clair. */
  detail: string;
  /** Chiffres constatés, pour que le résultat soit vérifiable. */
  evidence: Record<string, unknown>;
}

interface ExecutorContext {
  params: Record<string, unknown>;
  countryCode: string | null;
  userId?: number;
}

type Executor = (ctx: ExecutorContext) => Promise<ExecutionOutcome>;

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

/** Pays réellement activés — aucune action n'est réservée à un seul pays. */
async function activeCountries(): Promise<{ code: string; language: string }[]> {
  const rows = await db
    .select({ code: countryCountries.code, language: countryCountries.defaultLanguage })
    .from(countryCountries)
    .where(eq(countryCountries.active, true));
  return rows.map((r) => ({ code: r.code, language: r.language }));
}

/**
 * Ajoute un mot-clé de recherche manquant. Le mot-clé est créé pour TOUS les
 * pays activés (avec la langue par défaut de chacun) sauf si un pays précis est
 * demandé : une recherche sans résultat en France l'est en général ailleurs
 * aussi, et le catalogue de mots-clés est par pays.
 */
const executeSeoKeyword: Executor = async ({ params, countryCode }) => {
  const keyword = str(params.keyword);
  const univers = str(params.univers) ?? "auto";
  if (!keyword) {
    return { ok: false, detail: "Aucun mot-clé fourni.", evidence: {} };
  }
  const cibles = countryCode
    ? [{ code: countryCode, language: str(params.language) ?? "fr" }]
    : await activeCountries();
  if (cibles.length === 0) {
    return {
      ok: false,
      detail: "Aucun pays activé : impossible de rattacher le mot-clé à un catalogue pays.",
      evidence: {},
    };
  }
  let inseres = 0;
  for (const c of cibles) {
    const before = await db
      .select({ id: seoKeywords.id })
      .from(seoKeywords)
      .where(
        and(
          eq(seoKeywords.univers, univers),
          eq(seoKeywords.keyword, keyword),
          eq(seoKeywords.language, c.language),
          eq(seoKeywords.country, c.code),
        ),
      )
      .limit(1);
    if (before.length > 0) continue;
    await db
      .insert(seoKeywords)
      .values({
        univers,
        keyword,
        language: c.language,
        country: c.code,
        targetPath: str(params.targetPath),
      })
      .onConflictDoNothing();
    inseres += 1;
  }
  return {
    ok: true,
    detail: `Mot-clé « ${keyword} » ajouté au catalogue de ${inseres} pays (déjà présent dans ${cibles.length - inseres}).`,
    evidence: { keyword, univers, paysTraites: cibles.length, paysAjoutes: inseres },
  };
};

const executeRedirection: Executor = async ({ params, userId }) => {
  const key = str(params.key);
  if (!key) return { ok: false, detail: "Aucune clé de redirection fournie.", evidence: {} };
  const r = await applyRedirectionFix(key, { userId });
  if (r.alreadyOk) {
    return {
      ok: true,
      detail: `Une règle active existait déjà pour « ${key} » : rien à recréer.`,
      evidence: { key, dejaCorrige: true },
    };
  }
  if (!r.fixed) {
    return {
      ok: false,
      detail: `Aucune destination sûre n'a pu être déduite pour « ${key} » : la correction demande une décision humaine.`,
      evidence: { key },
    };
  }
  return {
    ok: true,
    detail: `Règle de redirection créée : « ${key} » → ${r.target}.`,
    evidence: { key, cible: r.target ?? "" },
  };
};

const executeHeal404: Executor = async ({ userId }) => {
  const r = await healRecent404s({ userId });
  return {
    ok: true,
    detail: `${r.aliasesCreated} redirection(s) créée(s) à partir des pages introuvables récentes.`,
    evidence: { aliasesCreated: r.aliasesCreated, cibles: r.targets.length },
  };
};

const executeReplayFixes: Executor = async () => {
  const r = await replayLearnedFixes();
  return {
    ok: true,
    detail: `${r.reapplied} correctif(s) déjà appris rejoué(s).`,
    evidence: { rejoues: r.reapplied },
  };
};

const executeQualityAudit: Executor = async () => {
  const r = await runQualityAudit();
  return {
    ok: true,
    detail: `Audit qualité exécuté : score global ${r.globalScore}/100 (${r.globalStatus}).`,
    evidence: { scoreGlobal: r.globalScore, domaines: r.results.length },
  };
};

const executeAlertScan: Executor = async () => {
  const r = await runAlertScan();
  return {
    ok: true,
    detail: `Analyse d'alertes exécutée : ${r.created} alerte(s) nouvelle(s), ${r.autoFixed} réparation(s) automatique(s).`,
    evidence: { creees: r.created, reparees: r.autoFixed },
  };
};

/**
 * Actions réellement exécutables par le système. Tout ce qui n'est pas ici
 * n'est pas automatisable aujourd'hui : la tâche passera `manuel_requis` avec
 * la raison, plutôt que de se déclarer terminée sans rien faire.
 */
export const ACTION_EXECUTORS: Record<string, Executor> = {
  seo_keyword_add: executeSeoKeyword,
  redirection_rule_create: executeRedirection,
  heal_404: executeHeal404,
  replay_learned_fixes: executeReplayFixes,
  quality_audit: executeQualityAudit,
  alert_scan: executeAlertScan,
};

async function addStep(input: {
  taskId: number;
  step: string;
  status: "ok" | "echec" | "info";
  detail?: string;
  evidence?: Record<string, unknown>;
  actorId?: number;
}): Promise<void> {
  await db.insert(smartActionSteps).values({
    taskId: input.taskId,
    step: input.step,
    status: input.status,
    detail: input.detail ?? null,
    evidence: input.evidence ?? null,
    actorId: input.actorId ?? null,
  });
  // Le journal du Système Intelligent garde la trace de chaque étape : aucune
  // étape d'une action validée n'est silencieuse (points 67 et 90).
  await logActivity({
    action: `action_tache_${input.step}`,
    userId: input.actorId,
    targetType: "smart_action_task",
    targetId: input.taskId,
    data: input.evidence ?? undefined,
    result: input.status,
    proposedDecision: input.detail ?? undefined,
  });
}

export interface CreateTaskInput {
  source: string;
  sourceId?: number;
  actionType: string;
  title: string;
  description?: string;
  params?: Record<string, unknown>;
  riskLevel?: 1 | 2 | 3;
  countryCode?: string | null;
  requestedBy?: number;
}

/**
 * Crée la tâche correspondant à une demande. Idempotent par signature : une
 * même proposition validée deux fois ne produit pas deux tâches concurrentes.
 */
export async function createActionTask(input: CreateTaskInput) {
  const signature = [input.source, input.sourceId ?? 0, input.actionType, input.countryCode ?? "*"]
    .join("|")
    .slice(0, 400);
  const [existing] = await db
    .select()
    .from(smartActionTasks)
    .where(eq(smartActionTasks.signature, signature))
    .limit(1);
  if (existing) return existing;

  const [row] = await db
    .insert(smartActionTasks)
    .values({
      source: input.source,
      sourceId: input.sourceId ?? null,
      actionType: input.actionType,
      title: input.title,
      description: input.description ?? null,
      params: input.params ?? {},
      riskLevel: input.riskLevel ?? 1,
      countryCode: input.countryCode ?? null,
      requestedBy: input.requestedBy ?? null,
      signature,
    })
    .returning();
  await addStep({
    taskId: row.id,
    step: "propose",
    status: "info",
    detail: input.description ?? input.title,
    actorId: input.requestedBy,
  });
  return row;
}

/**
 * Le PDG valide : la tâche est planifiée puis exécutée. C'est ici que la
 * validation cesse d'être décorative.
 */
export async function validateActionTask(
  id: number,
  validatedBy: number,
): Promise<{ status: TaskStatus; detail: string }> {
  const [task] = await db
    .select()
    .from(smartActionTasks)
    .where(eq(smartActionTasks.id, id))
    .limit(1);
  if (!task) return { status: "echec", detail: "Tâche introuvable." };
  if (task.status !== "propose" && task.status !== "echec") {
    return { status: task.status as TaskStatus, detail: "Tâche déjà engagée." };
  }

  const now = new Date();
  await db
    .update(smartActionTasks)
    .set({ status: "valide", validatedBy, validatedAt: now, failureReason: null, updatedAt: now })
    .where(eq(smartActionTasks.id, id));
  await addStep({ taskId: id, step: "valide", status: "ok", detail: "Validation PDG.", actorId: validatedBy });

  return runActionTask(id, validatedBy);
}

/**
 * Exécute une tâche déjà validée. Séparé de la validation pour qu'un échec
 * puisse être relancé sans redemander une décision humaine.
 */
export async function runActionTask(
  id: number,
  actorId?: number,
): Promise<{ status: TaskStatus; detail: string }> {
  const [task] = await db
    .select()
    .from(smartActionTasks)
    .where(eq(smartActionTasks.id, id))
    .limit(1);
  if (!task) return { status: "echec", detail: "Tâche introuvable." };

  const executor = ACTION_EXECUTORS[task.actionType];
  const setStatus = async (status: TaskStatus, patch: Record<string, unknown> = {}) => {
    await db
      .update(smartActionTasks)
      .set({ status, updatedAt: new Date(), ...patch })
      .where(eq(smartActionTasks.id, id));
  };

  if (!executor) {
    const raison =
      `Aucun exécuteur automatique pour « ${task.actionType} » : cette action doit être réalisée par un humain. ` +
      `La tâche reste ouverte et ne sera pas marquée terminée sans intervention.`;
    await setStatus("manuel_requis", { failureReason: raison });
    await addStep({ taskId: id, step: "planifie", status: "info", detail: raison, actorId });
    return { status: "manuel_requis", detail: raison };
  }

  if (task.riskLevel >= 3) {
    const raison =
      "Action de niveau critique (point 74) : elle exige une confirmation renforcée et n'est jamais lancée automatiquement.";
    await setStatus("manuel_requis", { failureReason: raison });
    await addStep({ taskId: id, step: "planifie", status: "info", detail: raison, actorId });
    return { status: "manuel_requis", detail: raison };
  }

  await setStatus("planifie");
  await addStep({ taskId: id, step: "planifie", status: "ok", detail: "Exécuteur disponible.", actorId });
  await setStatus("en_cours", { startedAt: new Date() });

  let outcome: ExecutionOutcome;
  try {
    outcome = await executor({
      params: task.params ?? {},
      countryCode: task.countryCode,
      userId: actorId,
    });
  } catch (err) {
    const raison = (err as Error).message || "Erreur inconnue pendant l'exécution.";
    await setStatus("echec", { failureReason: raison, finishedAt: new Date() });
    await addStep({ taskId: id, step: "en_cours", status: "echec", detail: raison, actorId });
    return { status: "echec", detail: raison };
  }

  if (!outcome.ok) {
    await setStatus("echec", {
      failureReason: outcome.detail,
      result: outcome.evidence,
      finishedAt: new Date(),
    });
    await addStep({
      taskId: id,
      step: "en_cours",
      status: "echec",
      detail: outcome.detail,
      evidence: outcome.evidence,
      actorId,
    });
    return { status: "echec", detail: outcome.detail };
  }

  await addStep({
    taskId: id,
    step: "test",
    status: "ok",
    detail: outcome.detail,
    evidence: outcome.evidence,
    actorId,
  });
  await setStatus("deploye", { result: outcome.evidence });
  await addStep({ taskId: id, step: "deploye", status: "ok", detail: outcome.detail, actorId });

  const verified = await verifyOutcome(task.actionType, task.params ?? {}, task.countryCode);
  if (!verified.ok) {
    await setStatus("echec", {
      failureReason: `Exécution effectuée mais vérification échouée : ${verified.detail}`,
      finishedAt: new Date(),
    });
    await addStep({ taskId: id, step: "verifie", status: "echec", detail: verified.detail, actorId });
    return { status: "echec", detail: verified.detail };
  }

  const now = new Date();
  await setStatus("termine", { verifiedAt: now, finishedAt: now });
  await addStep({
    taskId: id,
    step: "verifie",
    status: "ok",
    detail: verified.detail,
    evidence: verified.evidence,
    actorId,
  });
  return { status: "termine", detail: `${outcome.detail} ${verified.detail}` };
}

/**
 * Contrôle après coup que l'effet attendu est bien présent en base. Sans cette
 * étape, « déployé » ne serait qu'une déclaration.
 */
async function verifyOutcome(
  actionType: string,
  params: Record<string, unknown>,
  countryCode: string | null,
): Promise<ExecutionOutcome> {
  if (actionType === "seo_keyword_add") {
    const keyword = str(params.keyword);
    if (!keyword) return { ok: false, detail: "Mot-clé absent à la vérification.", evidence: {} };
    const conditions = [eq(seoKeywords.keyword, keyword)];
    if (countryCode) conditions.push(eq(seoKeywords.country, countryCode));
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(seoKeywords)
      .where(and(...conditions));
    const n = row?.n ?? 0;
    return n > 0
      ? { ok: true, detail: `Vérifié : présent dans ${n} catalogue(s) pays.`, evidence: { catalogues: n } }
      : { ok: false, detail: "Le mot-clé est absent en base après exécution.", evidence: {} };
  }
  return { ok: true, detail: "Vérifié : exécution retournée sans erreur.", evidence: {} };
}

/** Un humain termine une tâche non automatisable, ou l'écarte. */
export async function closeActionTask(
  id: number,
  decision: "termine" | "rejete",
  actorId: number,
  note?: string,
) {
  const now = new Date();
  await db
    .update(smartActionTasks)
    .set({ status: decision, finishedAt: now, updatedAt: now, verifiedAt: decision === "termine" ? now : null })
    .where(eq(smartActionTasks.id, id));
  await addStep({
    taskId: id,
    step: decision === "termine" ? "termine" : "propose",
    status: "info",
    detail: note ?? (decision === "termine" ? "Terminée manuellement." : "Écartée par le PDG."),
    actorId,
  });
  return { ok: true };
}

/**
 * Traduit une proposition d'optimisation en action exécutable. Une catégorie
 * sans traduction connue donne `manuel:<catégorie>` : la tâche existera quand
 * même, en attente d'un humain, au lieu d'être perdue.
 */
export function actionTypeForOptimization(
  category: string,
  evidence: Record<string, unknown> | null,
): { actionType: string; params: Record<string, unknown> } {
  const query = evidence ? str(evidence.query) : null;
  if (category === "mots_cles" && query) {
    return { actionType: "seo_keyword_add", params: { keyword: query, univers: "auto" } };
  }
  if (category === "qualite_resultats") {
    return { actionType: "quality_audit", params: {} };
  }
  return { actionType: `manuel:${category}`, params: evidence ?? {} };
}

export interface TaskFilter {
  /** Regroupements du Centre d'Actions (point 70). */
  bucket?: "a_valider" | "en_cours" | "termine" | "echecs" | "tous";
  limit?: number;
}

const BUCKETS: Record<string, TaskStatus[]> = {
  a_valider: ["propose"],
  en_cours: ["valide", "planifie", "en_cours", "test", "deploye", "verifie", "manuel_requis"],
  termine: ["termine"],
  echecs: ["echec", "rejete"],
};

export async function listActionTasks(filter: TaskFilter = {}) {
  const statuses = filter.bucket && filter.bucket !== "tous" ? BUCKETS[filter.bucket] : undefined;
  const rows = await db
    .select()
    .from(smartActionTasks)
    .where(statuses ? inArray(smartActionTasks.status, statuses) : undefined)
    .orderBy(desc(smartActionTasks.updatedAt))
    .limit(filter.limit ?? 100);
  return rows;
}

export async function actionTaskDetail(id: number) {
  const [task] = await db
    .select()
    .from(smartActionTasks)
    .where(eq(smartActionTasks.id, id))
    .limit(1);
  if (!task) return null;
  const steps = await db
    .select()
    .from(smartActionSteps)
    .where(eq(smartActionSteps.taskId, id))
    .orderBy(smartActionSteps.createdAt);
  return { task, steps };
}

export async function actionTaskStats() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      aValider: sql<number>`count(*) filter (where ${smartActionTasks.status} = 'propose')::int`,
      enCours: sql<number>`count(*) filter (where ${smartActionTasks.status} in ('valide','planifie','en_cours','test','deploye','verifie'))::int`,
      manuel: sql<number>`count(*) filter (where ${smartActionTasks.status} = 'manuel_requis')::int`,
      termine: sql<number>`count(*) filter (where ${smartActionTasks.status} = 'termine')::int`,
      echec: sql<number>`count(*) filter (where ${smartActionTasks.status} = 'echec')::int`,
    })
    .from(smartActionTasks);
  return (
    row ?? { total: 0, aValider: 0, enCours: 0, manuel: 0, termine: 0, echec: 0 }
  );
}
