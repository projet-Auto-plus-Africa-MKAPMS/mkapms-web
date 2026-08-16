/**
 * Points 102-103 — audit puis activation réelle du Système Intelligent.
 *
 * Point 102 : dire ce que le Système Intelligent sait *réellement* faire.
 * Le critère n'est pas l'existence du code — c'est la trace d'usage. Une
 * capacité dont la table est vide est « partielle », jamais « active ».
 *
 * Point 103 : activer le cycle pour de vrai. `runCycle()` exécute la chaîne
 * complète sur les données réelles et enregistre, étape par étape, ce qui a
 * fonctionné et ce qui a échoué. Ce qui ne peut pas encore être fait est écrit
 * (génération de code sans fournisseur, déploiement réservé à l'humain) au lieu
 * d'être présenté comme acquis.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { runAlertScan } from "../smart-engine/services/alert-engine.js";
import { getPlatformHealth } from "../smart-engine/services/platform-health.js";
import { generateOptimizations } from "../smart-engine/services/auto-optimization.js";
import { generateEvolutionProposals } from "../smart-engine/services/autonomous-evolution.js";
import { listEngines } from "../engine-registry/service.js";
import { scanDevelopments } from "../smart-engine/services/dev-learning.js";
import { healRecent404s, replayLearnedFixes } from "../smart-engine/services/auto-fix.js";
import { buildDailyReport } from "../smart-engine/services/daily-report.js";
import { logActivity } from "../smart-engine/services/activity-log.js";
import { providerStates } from "../ai-fabric/service.js";
import { CAPACITES, ETAT_LABELS, type CapaciteEtat, type CapaciteSpec } from "./capabilities.js";
import { smartAuditItems, smartAuditRuns, smartCycleRuns } from "./schema.js";

const ROOT = process.cwd();

interface TableStat {
  existe: boolean;
  lignes: number;
  dernier: Date | null;
}

async function statTable(table: string): Promise<TableStat> {
  if (!/^[a-z0-9_]+$/.test(table)) return { existe: false, lignes: 0, dernier: null };
  try {
    const reg = await db.execute(sql`SELECT to_regclass(${`public.${table}`}) IS NOT NULL AS ok`);
    const okRows = (reg as unknown as { rows?: { ok?: boolean }[] }).rows ?? [];
    if (!okRows[0]?.ok) return { existe: false, lignes: 0, dernier: null };

    const count = await db.execute(sql.raw(`SELECT count(*)::int AS n FROM "${table}"`));
    const n = Number(
      ((count as unknown as { rows?: { n?: number }[] }).rows ?? [])[0]?.n ?? 0,
    );

    let dernier: Date | null = null;
    try {
      const d = await db.execute(
        sql.raw(`SELECT max(created_at) AS d FROM "${table}"`),
      );
      const v = ((d as unknown as { rows?: { d?: string | null }[] }).rows ?? [])[0]?.d ?? null;
      dernier = v ? new Date(v) : null;
    } catch {
      /* toutes les tables n'ont pas de colonne created_at */
    }
    return { existe: true, lignes: n, dernier };
  } catch {
    return { existe: false, lignes: 0, dernier: null };
  }
}

/**
 * Capacité de génération de code : elle dépend d'un fournisseur de modèle
 * réellement branché (AI Fabric). Sans cela, l'agent développeur s'arrête au
 * plan — et le dit.
 */
export async function codeGenerationState(): Promise<{
  disponible: boolean;
  detail: string;
  fournisseurs: string[];
}> {
  try {
    const etats = await providerStates();
    const texte = etats.filter((e) => e.capability === "ia_texte");
    const prets = texte.filter((e) => e.status === "actif" || e.status === "configure");
    if (prets.length === 0) {
      const manquants = texte.flatMap((e) => e.missingEnv);
      return {
        disponible: false,
        detail:
          manquants.length > 0
            ? `Aucun fournisseur de modèle n'est branché — accès manquant : ${[...new Set(manquants)].join(", ")}. L'agent développeur produit une analyse et un plan, pas du code.`
            : "Aucun fournisseur de modèle n'est branché. L'agent développeur produit une analyse et un plan, pas du code.",
        fournisseurs: [],
      };
    }
    return {
      disponible: true,
      detail: `Fournisseur(s) de modèle disponible(s) : ${prets.map((p) => p.label).join(", ")}. La génération de correctifs peut être demandée, et passe obligatoirement par le pipeline avant production.`,
      fournisseurs: prets.map((p) => p.code),
    };
  } catch {
    return {
      disponible: false,
      detail: "État des fournisseurs de modèles illisible : la génération de code reste refusée par prudence.",
      fournisseurs: [],
    };
  }
}

export interface CapaciteReport {
  code: string;
  ordre: number;
  label: string;
  attendu: string;
  etat: CapaciteEtat;
  etatLabel: string;
  codePresent: boolean;
  branche: boolean;
  usageReel: boolean;
  lignes: number;
  dernierUsage: string | null;
  autonomie: string;
  motif: string;
  manquant: string[];
  limite: string;
}

export interface SmartAuditReport {
  runId: number;
  checkedAt: string;
  total: number;
  parEtat: Record<string, number>;
  autonomie: string;
  autonomieMotif: string;
  generationCode: { disponible: boolean; detail: string; fournisseurs: string[] };
  capacites: CapaciteReport[];
}

async function evaluerCapacite(spec: CapaciteSpec, genCode: boolean): Promise<CapaciteReport> {
  const codePresent = existsSync(path.join(ROOT, spec.module));
  const manquant: string[] = [];
  if (!codePresent) manquant.push(`module absent : ${spec.module}`);

  let lignes = 0;
  let dernier: Date | null = null;
  let brancheCount = 0;
  for (const t of spec.tables) {
    const s = await statTable(t);
    if (!s.existe) {
      manquant.push(`table absente : ${t}`);
      continue;
    }
    brancheCount += 1;
    lignes += s.lignes;
    if (s.dernier && (!dernier || s.dernier > dernier)) dernier = s.dernier;
  }
  const branche = brancheCount > 0;
  const usageReel = lignes > 0;

  let etat: CapaciteEtat;
  let motif: string;

  if (spec.code === "generer_code" && !genCode) {
    etat = "non_disponible";
    motif = spec.limite;
    manquant.push("fournisseur de modèle IA");
  } else if (!codePresent) {
    etat = "inactive";
    motif = "Aucun module ne porte cette capacité : elle n'existe pas dans le code.";
  } else if (!branche) {
    etat = "inactive";
    motif =
      "Le code existe mais aucune table de cette capacité n'est présente en base : rien n'est réellement branché.";
  } else if (!usageReel) {
    etat = "partielle";
    motif =
      "Branchée, mais aucune trace d'usage : tant que rien n'a été observé, appris ou exécuté, la capacité n'est pas attestée.";
  } else {
    etat = "active";
    motif = `Usage réel constaté : ${lignes} enregistrement(s)${dernier ? `, dernier le ${dernier.toLocaleDateString("fr-FR")}` : ""}.`;
  }

  if (spec.limite && etat !== "non_disponible") {
    motif = `${motif} ${spec.limite}`.trim();
  }

  return {
    code: spec.code,
    ordre: spec.ordre,
    label: spec.label,
    attendu: spec.attendu,
    etat,
    etatLabel: ETAT_LABELS[etat],
    codePresent,
    branche,
    usageReel,
    lignes,
    dernierUsage: dernier ? dernier.toISOString() : null,
    autonomie: spec.autonomie,
    motif,
    manquant,
    limite: spec.limite,
  };
}

/**
 * Niveau d'autonomie réellement atteint. Il ne se décrète pas : il est déduit
 * des capacités effectivement actives, du maillon le plus faible vers le plus
 * exigeant.
 */
function niveauAutonomie(caps: CapaciteReport[]): { niveau: string; motif: string } {
  const actif = (code: string) => caps.find((c) => c.code === code)?.etat === "active";

  const observe = ["observer", "lire_moteurs", "detecter_anomalies", "creer_alertes"].every(actif);
  const propose = observe && ["apprendre", "memoriser", "proposer"].every(actif);
  const executeValide =
    propose && ["validation_pdg", "transformer_en_tache", "executer"].every(actif);
  const autonome = executeValide && actif("corriger") && actif("generer_code");

  if (autonome) {
    return {
      niveau: "autonome_encadre",
      motif:
        "Le système observe, apprend, propose, exécute après validation et corrige seul certaines causes. Le déploiement reste déclenché par un humain.",
    };
  }
  if (executeValide) {
    return {
      niveau: "execution_validee",
      motif:
        "Le système exécute réellement les actions validées par la direction. Il ne produit pas encore de code, et ne déploie jamais seul.",
    };
  }
  if (propose) {
    return {
      niveau: "proposition",
      motif:
        "Le système observe, apprend et propose. L'exécution attend soit une validation, soit une capacité manquante nommée ci-dessous.",
    };
  }
  if (observe) {
    return {
      niveau: "observation",
      motif: "Le système observe et alerte. Il ne propose pas encore de manière attestée.",
    };
  }
  return {
    niveau: "partiel",
    motif:
      "Le socle d'observation n'est pas complet : tant qu'il manque un maillon, aucun étage supérieur ne peut être considéré comme réel.",
  };
}

export async function runSmartAudit(options?: {
  trigger?: string;
  requestedBy?: number;
}): Promise<SmartAuditReport> {
  const gen = await codeGenerationState();
  const run = await db
    .insert(smartAuditRuns)
    .values({ trigger: options?.trigger ?? "manuel", requestedBy: options?.requestedBy })
    .returning({ id: smartAuditRuns.id });
  const runId = run[0]?.id ?? 0;

  const capacites: CapaciteReport[] = [];
  for (const spec of CAPACITES) {
    capacites.push(await evaluerCapacite(spec, gen.disponible));
  }
  capacites.sort((a, b) => a.ordre - b.ordre);

  const parEtat: Record<string, number> = {};
  for (const c of capacites) parEtat[c.etat] = (parEtat[c.etat] ?? 0) + 1;
  const { niveau, motif } = niveauAutonomie(capacites);

  for (const c of capacites) {
    await db.insert(smartAuditItems).values({
      runId,
      capacite: c.code,
      ordre: c.ordre,
      label: c.label,
      etat: c.etat,
      codePresent: c.codePresent,
      branche: c.branche,
      usageReel: c.usageReel,
      lignes: c.lignes,
      dernierUsage: c.dernierUsage ? new Date(c.dernierUsage) : null,
      autonomie: c.autonomie,
      motif: c.motif,
      manquant: c.manquant,
    });
  }

  await db
    .update(smartAuditRuns)
    .set({
      finishedAt: new Date(),
      total: capacites.length,
      parEtat,
      autonomie: niveau,
      autonomieMotif: motif,
    })
    .where(eq(smartAuditRuns.id, runId));

  return {
    runId,
    checkedAt: new Date().toISOString(),
    total: capacites.length,
    parEtat,
    autonomie: niveau,
    autonomieMotif: motif,
    generationCode: gen,
    capacites,
  };
}

export async function latestSmartAudit(): Promise<SmartAuditReport | null> {
  const runs = await db.select().from(smartAuditRuns).orderBy(desc(smartAuditRuns.id)).limit(1);
  const run = runs[0];
  if (!run) return null;
  const items = await db
    .select()
    .from(smartAuditItems)
    .where(eq(smartAuditItems.runId, run.id))
    .orderBy(smartAuditItems.ordre);

  const specs = new Map(CAPACITES.map((c) => [c.code, c]));
  return {
    runId: run.id,
    checkedAt: (run.finishedAt ?? run.startedAt).toISOString(),
    total: run.total,
    parEtat: (run.parEtat ?? {}) as Record<string, number>,
    autonomie: run.autonomie,
    autonomieMotif: run.autonomieMotif,
    generationCode: await codeGenerationState(),
    capacites: items.map((i) => ({
      code: i.capacite,
      ordre: i.ordre,
      label: i.label,
      attendu: specs.get(i.capacite)?.attendu ?? "",
      etat: i.etat as CapaciteEtat,
      etatLabel: ETAT_LABELS[i.etat as CapaciteEtat] ?? i.etat,
      codePresent: i.codePresent,
      branche: i.branche,
      usageReel: i.usageReel,
      lignes: i.lignes,
      dernierUsage: i.dernierUsage ? i.dernierUsage.toISOString() : null,
      autonomie: i.autonomie,
      motif: i.motif,
      manquant: (i.manquant ?? []) as string[],
      limite: specs.get(i.capacite)?.limite ?? "",
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Point 103 — le cycle réellement exécuté
// ─────────────────────────────────────────────────────────────────────────────

export interface CycleReport {
  runId: number;
  startedAt: string;
  finishedAt: string | null;
  etapes: { etape: string; resultat: string; detail: string }[];
  alertesCreees: number;
  propositionsCreees: number;
  correctionsAppliquees: number;
  echecs: number;
}

/**
 * Exécute une fois la chaîne complète sur les données réelles.
 * Chaque étape est enregistrée avec son résultat — y compris les échecs, qui
 * ne sont ni masqués ni transformés en succès.
 */
export async function runCycle(options?: {
  trigger?: string;
  requestedBy?: number;
}): Promise<CycleReport> {
  const run = await db
    .insert(smartCycleRuns)
    .values({ trigger: options?.trigger ?? "manuel", requestedBy: options?.requestedBy })
    .returning({ id: smartCycleRuns.id });
  const runId = run[0]?.id ?? 0;

  const etapes: { etape: string; resultat: string; detail: string }[] = [];
  let alertes = 0;
  let propositions = 0;
  let corrections = 0;
  let echecs = 0;

  const etape = async (
    nom: string,
    action: () => Promise<string>,
  ): Promise<void> => {
    try {
      const detail = await action();
      etapes.push({ etape: nom, resultat: "ok", detail });
    } catch (e) {
      echecs += 1;
      etapes.push({
        etape: nom,
        resultat: "echec",
        detail: e instanceof Error ? e.message : "Échec sans message.",
      });
    }
  };

  await etape("observer", async () => {
    const h = await getPlatformHealth();
    const faibles = h.categories.filter((c) => c.level !== "ok").length;
    return `Santé plateforme relevée : ${h.categories.length} domaine(s) mesuré(s), ${faibles} hors état normal (état global : ${h.overall}).`;
  });

  await etape("lire_moteurs", async () => {
    const moteurs = await listEngines();
    const horsEtat = moteurs.filter((m) => m.state !== "active").length;
    return `${moteurs.length} moteur(s) lus dans le registre, dont ${horsEtat} hors état actif.`;
  });

  await etape("detecter_et_alerter", async () => {
    const r = await runAlertScan();
    alertes += r.created;
    corrections += r.autoFixed;
    return `${r.created} alerte(s) levée(s), ${r.autoFixed} cause(s) corrigée(s) automatiquement.`;
  });

  await etape("apprendre", async () => {
    const r = await scanDevelopments();
    return `Registre des développements mis à jour : ${r.created} nouveau(x), ${r.updated} actualisé(s).`;
  });

  await etape("proposer", async () => {
    const o = await generateOptimizations();
    const e = await generateEvolutionProposals();
    const nEvolutions = typeof e === "object" && e && "created" in e ? Number(e.created) : 0;
    propositions += o.created + nEvolutions;
    return `${o.created} optimisation(s) et ${nEvolutions} évolution(s) proposées — en attente de validation humaine.`;
  });

  await etape("corriger", async () => {
    await replayLearnedFixes();
    const soigne = await healRecent404s({ sinceDays: 7 });
    corrections += soigne.aliasesCreated;
    return `${soigne.aliasesCreated} redirection(s) rétablie(s) à partir des causes réelles.`;
  });

  await etape("memoriser", async () => {
    const rapport = await buildDailyReport();
    return `Rapport du jour construit (${rapport.summary.anomalies} anomalie(s), ${rapport.summary.suggestions} suggestion(s)).`;
  });

  await etape("generer_code", async () => {
    const gen = await codeGenerationState();
    if (!gen.disponible) throw new Error(gen.detail);
    return gen.detail;
  });

  await etape("deployer", async () => {
    return "Aucun déploiement déclenché : la mise en production reste une décision humaine, après passage complet du pipeline.";
  });

  await db
    .update(smartCycleRuns)
    .set({
      finishedAt: new Date(),
      etapes,
      alertesCreees: alertes,
      propositionsCreees: propositions,
      correctionsAppliquees: corrections,
      echecs,
    })
    .where(eq(smartCycleRuns.id, runId));

  try {
    await logActivity({
      action: "smart.cycle",
      targetType: "systeme_intelligent",
      targetId: runId,
      data: { alertes, propositions, corrections, echecs },
      result: echecs > 0 ? "partial" : "success",
    });
  } catch {
    /* le journal ne bloque jamais le cycle */
  }

  return {
    runId,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    etapes,
    alertesCreees: alertes,
    propositionsCreees: propositions,
    correctionsAppliquees: corrections,
    echecs,
  };
}

export async function cycleHistory(limit = 20) {
  const rows = await db
    .select()
    .from(smartCycleRuns)
    .orderBy(desc(smartCycleRuns.id))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null,
    trigger: r.trigger,
    etapes: (r.etapes ?? []) as { etape: string; resultat: string; detail: string }[],
    alertesCreees: r.alertesCreees,
    propositionsCreees: r.propositionsCreees,
    correctionsAppliquees: r.correctionsAppliquees,
    echecs: r.echecs,
  }));
}

export async function auditHistory(limit = 20) {
  const rows = await db.select().from(smartAuditRuns).orderBy(desc(smartAuditRuns.id)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    date: (r.finishedAt ?? r.startedAt).toISOString(),
    total: r.total,
    parEtat: (r.parEtat ?? {}) as Record<string, number>,
    autonomie: r.autonomie,
  }));
}
