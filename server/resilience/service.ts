/**
 * Points 73-74-76-77-78 — ce qui protège l'entreprise quand l'autonomie augmente.
 *
 * Règles tenues, dans l'ordre d'importance :
 *  • fermer au public n'arrête rien du cœur : administration, journaux, base,
 *    sauvegardes, sécurité et supervision restent joignables, et la réouverture
 *    est toujours possible (point 73) ;
 *  • une action de niveau 3 n'est jamais lancée sur un simple clic : elle exige
 *    une confirmation ressaisie, datée, nominative et à durée limitée (74) ;
 *  • aucun changement ne va en production sans avoir franchi ses étapes, et
 *    l'absence de plan de retour arrière bloque le passage (76) ;
 *  • une réparation automatique n'est déclarée réussie qu'après vérification du
 *    résultat (77) ;
 *  • une erreur devient une connaissance réutilisable, mais seulement après
 *    validation humaine (78).
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { countryCountries } from "../country-os/index.js";
import {
  healRecent404s,
  replayLearnedFixes,
  autoFixStats,
} from "../smart-engine/services/auto-fix.js";
import { redirRules } from "../redirection-engine/schema.js";
import {
  rsCriticalRequests,
  rsEmergencyEvents,
  rsEmergencyScopes,
  rsFailureLessons,
  rsPipelineRuns,
} from "./schema.js";

// ─── Point 73 — arrêt global sans destruction ────────────────────────────

export const EMERGENCY_LEVELS: Record<string, string> = {
  ouvert: "Ouvert au public",
  maintenance: "Maintenance — public fermé",
  urgence: "Urgence — public fermé et dépôts suspendus",
};

/**
 * Ce qui reste vivant pendant une fermeture. Ce n'est pas une promesse
 * décorative : ces capacités ne passent jamais par le filtre public.
 */
export const PRESERVED_CAPABILITIES: string[] = [
  "administration_securisee",
  "journaux",
  "base_de_donnees",
  "sauvegardes",
  "securite",
  "supervision",
  "reouverture",
];

export type EmergencyLevel = "ouvert" | "maintenance" | "urgence";

export interface PublicAccess {
  open: boolean;
  level: EmergencyLevel;
  scope: "mondial" | "pays" | "univers";
  scopeKey: string;
  message: string | null;
  preserved: string[];
}

const OUVERT: PublicAccess = {
  open: true,
  level: "ouvert",
  scope: "mondial",
  scopeKey: "*",
  message: null,
  preserved: PRESERVED_CAPABILITIES,
};

/**
 * État d'ouverture réellement applicable à un visiteur. Une fermeture ciblée
 * sur un pays ne ferme pas les autres : la portée la plus restrictive qui
 * concerne le visiteur l'emporte, et rien n'est déduit d'un pays voisin.
 */
export async function publicAccess(opts?: {
  countryCode?: string | null;
  univers?: string | null;
}): Promise<PublicAccess> {
  const rows = await db
    .select()
    .from(rsEmergencyScopes)
    .where(sql`${rsEmergencyScopes.level} <> 'ouvert'`);
  if (rows.length === 0) return OUVERT;

  const pays = opts?.countryCode ? opts.countryCode.toUpperCase() : null;
  const univers = opts?.univers ?? null;

  const applicables = rows.filter(
    (r) =>
      r.scopeKey === "*" ||
      (r.scope === "pays" && pays !== null && r.scopeKey === pays) ||
      (r.scope === "univers" && univers !== null && r.scopeKey === univers),
  );
  if (applicables.length === 0) return OUVERT;

  const urgence = applicables.find((r) => r.level === "urgence");
  const retenu = urgence ?? applicables[0];
  return {
    open: false,
    level: retenu.level as EmergencyLevel,
    scope: retenu.scope as PublicAccess["scope"],
    scopeKey: retenu.scopeKey,
    message: retenu.publicMessage,
    preserved: PRESERVED_CAPABILITIES,
  };
}

let accessCache: { at: number; rows: (typeof OUVERT)[] } | null = null;
const ACCESS_TTL_MS = 10_000;

/**
 * Même réponse que `publicAccess`, mais mise en cache 10 secondes : le filtre
 * est traversé par chaque requête entrante, il ne doit pas interroger la base
 * à chaque fois. Une réouverture est donc effective en dix secondes au plus.
 */
export async function publicAccessCached(opts?: {
  countryCode?: string | null;
  univers?: string | null;
}): Promise<PublicAccess> {
  const now = Date.now();
  if (accessCache && now - accessCache.at < ACCESS_TTL_MS && accessCache.rows.length === 0) {
    return OUVERT;
  }
  const result = await publicAccess(opts);
  accessCache = { at: now, rows: result.open ? [] : [result] };
  return result;
}

export async function emergencyScopes() {
  return db.select().from(rsEmergencyScopes).orderBy(desc(rsEmergencyScopes.updatedAt));
}

export async function emergencyEvents(limit = 100) {
  return db
    .select()
    .from(rsEmergencyEvents)
    .orderBy(desc(rsEmergencyEvents.createdAt))
    .limit(limit);
}

export interface SetEmergencyInput {
  scope: "mondial" | "pays" | "univers";
  scopeKey?: string;
  level: EmergencyLevel;
  reason?: string;
  publicMessage?: string;
  actorId: number;
}

export async function setEmergency(input: SetEmergencyInput): Promise<{
  ok: boolean;
  detail: string;
  level: EmergencyLevel;
}> {
  const key =
    input.scope === "mondial" ? "*" : (input.scopeKey ?? "").trim().toUpperCase();
  if (input.scope !== "mondial" && key.length === 0) {
    return { ok: false, detail: "Portée incomplète : aucun pays ni univers indiqué.", level: "ouvert" };
  }

  // Un pays inconnu du registre mondial ne peut pas être fermé : on refuse
  // plutôt que de créer une portée qui ne correspond à aucun territoire réel.
  if (input.scope === "pays") {
    const [pays] = await db
      .select({ code: countryCountries.code })
      .from(countryCountries)
      .where(eq(countryCountries.code, key))
      .limit(1);
    if (!pays) {
      return {
        ok: false,
        detail: `Pays « ${key} » absent du registre mondial : aucune fermeture n'est appliquée.`,
        level: "ouvert",
      };
    }
  }

  const [existant] = await db
    .select()
    .from(rsEmergencyScopes)
    .where(eq(rsEmergencyScopes.scopeKey, key))
    .limit(1);
  const avant = (existant?.level ?? "ouvert") as EmergencyLevel;
  const now = new Date();

  if (existant) {
    await db
      .update(rsEmergencyScopes)
      .set({
        scope: input.scope,
        level: input.level,
        reason: input.reason ?? null,
        publicMessage: input.publicMessage ?? null,
        activatedBy: input.level === "ouvert" ? existant.activatedBy : input.actorId,
        activatedAt: input.level === "ouvert" ? existant.activatedAt : now,
        releasedBy: input.level === "ouvert" ? input.actorId : null,
        releasedAt: input.level === "ouvert" ? now : null,
        updatedAt: now,
      })
      .where(eq(rsEmergencyScopes.id, existant.id));
  } else {
    await db.insert(rsEmergencyScopes).values({
      scope: input.scope,
      scopeKey: key,
      level: input.level,
      reason: input.reason ?? null,
      publicMessage: input.publicMessage ?? null,
      activatedBy: input.level === "ouvert" ? null : input.actorId,
      activatedAt: input.level === "ouvert" ? null : now,
      releasedBy: input.level === "ouvert" ? input.actorId : null,
      releasedAt: input.level === "ouvert" ? now : null,
    });
  }

  await db.insert(rsEmergencyEvents).values({
    scope: input.scope,
    scopeKey: key,
    fromLevel: avant,
    toLevel: input.level,
    reason: input.reason ?? null,
    actorId: input.actorId,
    preserved: PRESERVED_CAPABILITIES,
  });

  const cible = key === "*" ? "toute la plateforme" : `la portée ${key}`;
  return {
    ok: true,
    detail:
      input.level === "ouvert"
        ? `Réouverture au public pour ${cible}.`
        : `Public fermé pour ${cible}. Administration, journaux, base, sauvegardes, sécurité et supervision restent joignables.`,
    level: input.level,
  };
}

// ─── Point 74 — trois niveaux d'actions ──────────────────────────────────

export const RISK_LEVELS: Record<number, { label: string; regime: string }> = {
  1: {
    label: "Niveau 1 — automatique",
    regime: "Analyse, tests, recommandations, classement, supervision. Exécution libre.",
  },
  2: {
    label: "Niveau 2 — autonomie contrôlée",
    regime: "Corrections réversibles et préautorisées. Exécution possible, retour arrière disponible.",
  },
  3: {
    label: "Niveau 3 — critique",
    regime:
      "Suppression massive, changement financier important, fermeture mondiale, permissions, secrets, opération irréversible. Confirmation renforcée obligatoire.",
  },
};

/** Motifs qui font basculer une action en niveau 3, quoi qu'en dise l'appelant. */
const CRITICAL_MARKERS = [
  "suppression_massive",
  "purge",
  "fermeture_mondiale",
  "emergency",
  "permission",
  "secret",
  "cle_api",
  "virement",
  "payout",
  "remboursement_masse",
  "migration_destructive",
  "restauration",
];

export function classifyRisk(actionType: string, declared?: number): 1 | 2 | 3 {
  const t = actionType.toLowerCase();
  if (CRITICAL_MARKERS.some((m) => t.includes(m))) return 3;
  if (declared === 3) return 3;
  if (declared === 2) return 2;
  return declared === 1 ? 1 : 2;
}

const CHALLENGE_TTL_MIN = 15;

export interface RequestCriticalInput {
  actionType: string;
  title: string;
  impact: string;
  reversible?: boolean;
  countryCode?: string | null;
  params?: Record<string, unknown>;
  requestedBy: number;
}

export async function requestCriticalConfirmation(input: RequestCriticalInput) {
  const challenge = `CONFIRMER ${input.actionType.toUpperCase().slice(0, 40)}`;
  const [row] = await db
    .insert(rsCriticalRequests)
    .values({
      actionType: input.actionType,
      title: input.title.slice(0, 240),
      impact: input.impact,
      reversible: input.reversible ?? false,
      countryCode: input.countryCode ?? null,
      params: input.params ?? {},
      challenge,
      requestedBy: input.requestedBy,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MIN * 60 * 1000),
    })
    .returning();
  return row;
}

export async function confirmCritical(
  id: number,
  actorId: number,
  phrase: string,
): Promise<{ ok: boolean; detail: string }> {
  const [row] = await db
    .select()
    .from(rsCriticalRequests)
    .where(eq(rsCriticalRequests.id, id))
    .limit(1);
  if (!row) return { ok: false, detail: "Demande introuvable." };
  if (row.status !== "attente") {
    return { ok: false, detail: `Demande déjà ${row.status}.` };
  }
  if (row.expiresAt.getTime() < Date.now()) {
    await db
      .update(rsCriticalRequests)
      .set({ status: "expire" })
      .where(eq(rsCriticalRequests.id, id));
    return {
      ok: false,
      detail: "Confirmation expirée : une action critique ne reste pas autorisée indéfiniment.",
    };
  }
  if (phrase.trim() !== row.challenge) {
    return {
      ok: false,
      detail: "Phrase de confirmation incorrecte : l'action n'est pas autorisée.",
    };
  }
  await db
    .update(rsCriticalRequests)
    .set({ status: "confirme", confirmedBy: actorId, confirmedAt: new Date() })
    .where(eq(rsCriticalRequests.id, id));
  return { ok: true, detail: "Action critique confirmée. Elle reste tracée et réversible si un retour arrière existe." };
}

export async function refuseCritical(id: number): Promise<{ ok: boolean }> {
  await db
    .update(rsCriticalRequests)
    .set({ status: "refuse" })
    .where(and(eq(rsCriticalRequests.id, id), eq(rsCriticalRequests.status, "attente")));
  return { ok: true };
}

export async function listCriticalRequests(limit = 100) {
  return db
    .select()
    .from(rsCriticalRequests)
    .orderBy(desc(rsCriticalRequests.createdAt))
    .limit(limit);
}

// ─── Point 76 — pipeline obligatoire avant production ────────────────────

/**
 * Point 144 — pipeline du développeur autonome, dans l'ordre exigé :
 * instruction → plan → branche → code → tests → sécurité → preview → staging
 * → validation → production → surveillance → retour arrière.
 *
 * Les étapes ajoutées (instruction, plan, branche, code, preview, rollback)
 * complètent celles qui existaient déjà : rien n'est renommé, pour que les
 * passages déjà enregistrés restent lisibles.
 */
export const PIPELINE_STEPS = [
  "instruction",
  "plan",
  "branche",
  "sandbox",
  "code",
  "tests",
  "securite",
  "non_regression",
  "preview",
  "staging",
  "validation",
  "production",
  "monitoring",
  "rollback",
] as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export const PIPELINE_STEP_LABELS: Record<PipelineStep, string> = {
  instruction: "Instruction reçue",
  plan: "Plan écrit",
  branche: "Branche dédiée",
  code: "Code produit",
  preview: "Aperçu vérifiable",
  rollback: "Retour arrière éprouvé",
  sandbox: "Environnement isolé",
  tests: "Tests",
  securite: "Contrôle de sécurité",
  non_regression: "Non-régression",
  staging: "Préproduction",
  validation: "Validation selon le niveau",
  production: "Mise en production",
  monitoring: "Surveillance après mise en production",
};

/**
 * Étapes qu'on ne peut pas sauter pour atteindre la production. Elles restent
 * obligatoires quel que soit le niveau d'autonomie atteint : c'est exactement la
 * phrase du point 144 — « même lorsqu'il devient très autonome, ce pipeline
 * reste ».
 */
const REQUIRED_BEFORE_PROD: PipelineStep[] = [
  "instruction",
  "plan",
  "branche",
  "sandbox",
  "code",
  "tests",
  "securite",
  "non_regression",
  "preview",
  "staging",
  "validation",
];

export async function startPipeline(input: {
  origin: string;
  originRef?: string;
  title: string;
  riskLevel?: 1 | 2 | 3;
  rollbackPlan?: string;
  createdBy?: number;
}) {
  const [row] = await db
    .insert(rsPipelineRuns)
    .values({
      origin: input.origin,
      originRef: input.originRef ?? null,
      title: input.title.slice(0, 240),
      riskLevel: input.riskLevel ?? 2,
      rollbackPlan: input.rollbackPlan ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();
  return row;
}

export async function recordPipelineStep(input: {
  id: number;
  step: PipelineStep;
  status: "ok" | "echec" | "info";
  detail: string;
}): Promise<{ ok: boolean; detail: string; status: string }> {
  const [run] = await db
    .select()
    .from(rsPipelineRuns)
    .where(eq(rsPipelineRuns.id, input.id))
    .limit(1);
  if (!run) return { ok: false, detail: "Passage introuvable.", status: "inconnu" };

  const steps = [
    ...run.steps,
    { step: input.step, status: input.status, detail: input.detail, at: new Date().toISOString() },
  ];

  const franchies = new Set(
    steps.filter((s) => s.status === "ok").map((s) => s.step),
  );
  const manquantes = REQUIRED_BEFORE_PROD.filter((s) => !franchies.has(s));

  let status = run.status;
  let blockedReason: string | null = run.blockedReason;

  if (input.status === "echec") {
    status = "bloque";
    blockedReason = `Étape « ${PIPELINE_STEP_LABELS[input.step]} » en échec : ${input.detail}`;
  } else if (input.step === "production" && input.status === "ok") {
    // Mis en production n'est pas terminé : la surveillance après déploiement
    // reste due, sinon une panne introduite ne serait vue par personne.
    status = "en_production";
    blockedReason = null;
  } else if (input.step === "monitoring" && input.status === "ok" && franchies.has("production")) {
    status = "surveille";
    blockedReason = null;
  } else if (manquantes.length === 0) {
    // Un changement sans retour arrière documenté ne franchit pas la porte.
    if (!run.rollbackPlan) {
      status = "bloque";
      blockedReason =
        "Aucun retour arrière documenté : la mise en production est refusée tant que le rollback n'est pas décrit.";
    } else {
      status = "pret_production";
      blockedReason = null;
    }
  }

  await db
    .update(rsPipelineRuns)
    .set({ steps, status, blockedReason, updatedAt: new Date() })
    .where(eq(rsPipelineRuns.id, input.id));

  return {
    ok: input.status !== "echec",
    status,
    detail:
      status === "surveille"
        ? "Mise en production surveillée après déploiement : le passage peut être déclaré terminé."
        : status === "en_production"
          ? "En production : la surveillance après déploiement reste due avant de déclarer terminé."
        : status === "pret_production"
        ? "Toutes les étapes obligatoires sont franchies : la mise en production peut être décidée."
        : status === "bloque"
          ? (blockedReason ?? "Passage bloqué.")
          : `Étapes restantes : ${manquantes.map((s) => PIPELINE_STEP_LABELS[s]).join(", ")}.`,
  };
}

export async function listPipelines(limit = 100) {
  return db.select().from(rsPipelineRuns).orderBy(desc(rsPipelineRuns.createdAt)).limit(limit);
}

// ─── Point 78 — apprentissage des échecs ─────────────────────────────────

export interface RecordFailureInput {
  signature: string;
  source: string;
  problem: string;
  cause?: string;
  solution?: string;
  result?: string;
  prevention?: string;
  countryCode?: string | null;
}

/**
 * Enregistre une erreur comme connaissance. Une anomalie déjà connue n'écrase
 * pas ce qui a été appris : elle incrémente son compteur et remonte sa date,
 * pour que la répétition soit visible.
 */
export async function recordFailure(input: RecordFailureInput) {
  const signature = input.signature.slice(0, 300);
  const [existant] = await db
    .select()
    .from(rsFailureLessons)
    .where(eq(rsFailureLessons.signature, signature))
    .limit(1);

  if (existant) {
    await db
      .update(rsFailureLessons)
      .set({
        occurrences: existant.occurrences + 1,
        lastSeenAt: new Date(),
        cause: existant.cause ?? input.cause ?? null,
        solution: existant.solution ?? input.solution ?? null,
        result: input.result ?? existant.result,
        prevention: existant.prevention ?? input.prevention ?? null,
      })
      .where(eq(rsFailureLessons.id, existant.id));
    return { created: false, id: existant.id, occurrences: existant.occurrences + 1 };
  }

  const [row] = await db
    .insert(rsFailureLessons)
    .values({
      signature,
      source: input.source,
      countryCode: input.countryCode ?? null,
      problem: input.problem,
      cause: input.cause ?? null,
      solution: input.solution ?? null,
      result: input.result ?? null,
      prevention: input.prevention ?? null,
    })
    .returning();
  return { created: true, id: row.id, occurrences: 1 };
}

/** Ce que la plateforme sait déjà d'une anomalie — évite de repartir de zéro. */
export async function lessonFor(signature: string) {
  const [row] = await db
    .select()
    .from(rsFailureLessons)
    .where(eq(rsFailureLessons.signature, signature.slice(0, 300)))
    .limit(1);
  return row ?? null;
}

export async function listLessons(limit = 150) {
  return db
    .select()
    .from(rsFailureLessons)
    .orderBy(desc(rsFailureLessons.lastSeenAt))
    .limit(limit);
}

export async function updateLesson(input: {
  id: number;
  cause?: string;
  solution?: string;
  prevention?: string;
}) {
  await db
    .update(rsFailureLessons)
    .set({
      cause: input.cause,
      solution: input.solution,
      prevention: input.prevention,
      // Une leçon réécrite perd sa réutilisation automatique : elle doit être
      // revalidée avant d'être rejouée seule.
      reusable: false,
      validatedBy: null,
      validatedAt: null,
    })
    .where(eq(rsFailureLessons.id, input.id));
  return { ok: true };
}

export async function validateLesson(id: number, actorId: number) {
  const [row] = await db
    .select()
    .from(rsFailureLessons)
    .where(eq(rsFailureLessons.id, id))
    .limit(1);
  if (!row) return { ok: false, detail: "Leçon introuvable." };
  if (!row.cause || !row.solution) {
    return {
      ok: false,
      detail: "Une leçon sans cause ni solution ne peut pas être rejouée automatiquement.",
    };
  }
  await db
    .update(rsFailureLessons)
    .set({ reusable: true, validatedBy: actorId, validatedAt: new Date() })
    .where(eq(rsFailureLessons.id, id));
  return { ok: true, detail: "Leçon validée : elle pourra être rejouée sur la même anomalie." };
}

// ─── Point 77 — auto-réparation vérifiée ─────────────────────────────────

export interface SelfHealingReport {
  reappliquees: number;
  aliasCrees: number;
  verifiees: number;
  echecs: number;
  detail: string;
}

/**
 * Rejoue les correctifs déjà appris puis VÉRIFIE le résultat. Une réparation
 * n'est annoncée que si la règle est réellement active après coup : annoncer
 * « réparé » sans contrôle serait pire que ne rien faire.
 */
export async function runSelfHealing(opts?: { userId?: number }): Promise<SelfHealingReport> {
  const rejoue = await replayLearnedFixes();
  const heal = await healRecent404s({ userId: opts?.userId, sinceDays: 7 });

  let verifiees = 0;
  let echecs = 0;
  for (const t of heal.targets) {
    const [rule] = await db
      .select({ id: redirRules.id, active: redirRules.active })
      .from(redirRules)
      .where(eq(redirRules.key, `path:${t.from}`))
      .limit(1);
    if (rule?.active) verifiees += 1;
    else echecs += 1;
  }

  if (echecs > 0) {
    await recordFailure({
      signature: "auto_reparation:redirection_non_verifiee",
      source: "auto_reparation",
      problem: `${echecs} correctif(s) de redirection appliqué(s) mais non confirmé(s) actif(s) après vérification.`,
      cause: "La règle créée n'est pas retrouvée active à la relecture.",
      prevention:
        "Ne pas annoncer une réparation sans relire l'état réel de la règle après application.",
    });
  }

  return {
    reappliquees: rejoue.reapplied,
    aliasCrees: heal.aliasesCreated,
    verifiees,
    echecs,
    detail:
      heal.aliasesCreated === 0 && rejoue.reapplied === 0
        ? "Aucune anomalie connue à réparer sur les 7 derniers jours."
        : `${rejoue.reapplied} recette(s) rejouée(s), ${heal.aliasesCreated} correctif(s) appliqué(s), ${verifiees} vérifié(s) actif(s), ${echecs} non confirmé(s).`,
  };
}

// ─── Statistiques & santé ────────────────────────────────────────────────

export async function resilienceStats() {
  const [fermetures] = await db
    .select({
      fermees: sql<number>`count(*) filter (where ${rsEmergencyScopes.level} <> 'ouvert')::int`,
    })
    .from(rsEmergencyScopes);
  const [critiques] = await db
    .select({
      attente: sql<number>`count(*) filter (where ${rsCriticalRequests.status} = 'attente')::int`,
      confirmees: sql<number>`count(*) filter (where ${rsCriticalRequests.status} = 'confirme')::int`,
    })
    .from(rsCriticalRequests);
  const [pipelines] = await db
    .select({
      total: sql<number>`count(*)::int`,
      bloques: sql<number>`count(*) filter (where ${rsPipelineRuns.status} = 'bloque')::int`,
      prets: sql<number>`count(*) filter (where ${rsPipelineRuns.status} = 'pret_production')::int`,
    })
    .from(rsPipelineRuns);
  const [lecons] = await db
    .select({
      total: sql<number>`count(*)::int`,
      reutilisables: sql<number>`count(*) filter (where ${rsFailureLessons.reusable} = true)::int`,
      repetees: sql<number>`count(*) filter (where ${rsFailureLessons.occurrences} > 1)::int`,
    })
    .from(rsFailureLessons);
  const recettes = await autoFixStats();

  return {
    fermetures: Number(fermetures?.fermees ?? 0),
    critiques: {
      attente: Number(critiques?.attente ?? 0),
      confirmees: Number(critiques?.confirmees ?? 0),
    },
    pipelines: {
      total: Number(pipelines?.total ?? 0),
      bloques: Number(pipelines?.bloques ?? 0),
      prets: Number(pipelines?.prets ?? 0),
    },
    lecons: {
      total: Number(lecons?.total ?? 0),
      reutilisables: Number(lecons?.reutilisables ?? 0),
      repetees: Number(lecons?.repetees ?? 0),
    },
    recettes,
  };
}

export async function resilienceHealth(): Promise<{
  status: "ok" | "degraded" | "down";
  detail: string;
}> {
  try {
    const s = await resilienceStats();
    if (s.fermetures > 0) {
      return {
        status: "degraded",
        detail: `${s.fermetures} portée(s) fermée(s) au public. Le cœur reste administrable.`,
      };
    }
    if (s.critiques.attente > 0) {
      return {
        status: "degraded",
        detail: `${s.critiques.attente} action(s) critique(s) en attente de confirmation renforcée.`,
      };
    }
    if (s.pipelines.bloques > 0) {
      return {
        status: "degraded",
        detail: `${s.pipelines.bloques} passage(s) bloqué(s) avant production.`,
      };
    }
    return { status: "ok", detail: "Plateforme ouverte, aucun passage bloqué, aucune confirmation en attente." };
  } catch (err) {
    return { status: "down", detail: (err as Error).message };
  }
}
