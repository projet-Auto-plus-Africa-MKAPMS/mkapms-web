/**
 * Points 108-113 — Continuous Test Engine.
 *
 * Ce moteur ne décrit pas des tests : il les exécute sur la plateforme réelle,
 * puis dépose une preuve datée dans l'audit d'activation. C'est cette preuve —
 * et elle seule — qui autorise un domaine à passer 🟢 (point 91).
 *
 * Deux règles qui font la différence entre un tableau vert et un contrôle utile :
 *  - un scénario qui ne peut pas s'exécuter est « ignoré », jamais « réussi » ;
 *  - un scénario qui réussissait et qui échoue est une **régression** : elle est
 *    nommée, datée et remontée en alerte, au lieu de se fondre dans un total.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db.js";
import { recordTestEvidence } from "../activation-audit/service.js";
import { SCENARIOS, type Scenario, type Statut } from "./catalog.js";
import { ctResults, ctRuns } from "./schema.js";

export interface ResultatScenario {
  scenario: string;
  domaine: string;
  label: string;
  criticite: string;
  statut: Statut;
  observe: string;
  attendu: string;
  dureeMs: number;
  regression: { precedent: string; depuis: string } | null;
}

export interface RunResume {
  runId: number;
  portee: string;
  total: number;
  reussis: number;
  echecs: number;
  ignores: number;
  regressions: number;
  dureeMs: number;
  resultats: ResultatScenario[];
}

/** Dernier statut connu d'un scénario, pour détecter une régression réelle. */
async function statutPrecedent(scenario: string): Promise<{ statut: string; date: Date } | null> {
  const [row] = await db
    .select({ statut: ctResults.statut, date: ctResults.createdAt })
    .from(ctResults)
    .where(eq(ctResults.scenario, scenario))
    .orderBy(desc(ctResults.id))
    .limit(1);
  return row ? { statut: row.statut, date: row.date } : null;
}

async function executer(s: Scenario): Promise<{ statut: Statut; observe: string; dureeMs: number }> {
  const debut = Date.now();
  try {
    const o = await s.run();
    return { statut: o.statut, observe: o.observe, dureeMs: Date.now() - debut };
  } catch (e) {
    // Un scénario qui explose est un échec : l'avaler reviendrait à masquer le
    // défaut que le test devait précisément révéler.
    return {
      statut: "echec",
      observe: `Le contrôle lui-même a échoué : ${(e as Error).message}`,
      dureeMs: Date.now() - debut,
    };
  }
}

export async function runTests(opts?: {
  portee?: string;
  trigger?: string;
  requestedBy?: number;
  /** Point 142 — contrôles désignés par l'impact de la modification. */
  scenarios?: string[];
}): Promise<RunResume> {
  const portee = opts?.portee ?? "complet";
  const cibles = opts?.scenarios?.filter((id) => id.trim().length > 0) ?? [];
  const liste =
    cibles.length > 0
      ? SCENARIOS.filter((s) => cibles.includes(s.id))
      : portee === "complet"
        ? SCENARIOS
        : SCENARIOS.filter((s) => s.domaine === portee);

  const [run] = await db
    .insert(ctRuns)
    .values({
      trigger: opts?.trigger ?? "auto",
      requestedBy: opts?.requestedBy ?? null,
      portee,
      total: liste.length,
    })
    .returning();

  const debut = Date.now();
  const resultats: ResultatScenario[] = [];
  let reussis = 0;
  let echecs = 0;
  let ignores = 0;
  let regressions = 0;

  for (const s of liste) {
    const precedent = await statutPrecedent(s.id);
    const o = await executer(s);
    const regression =
      o.statut === "echec" && precedent?.statut === "reussi"
        ? { precedent: precedent.statut, depuis: precedent.date.toISOString() }
        : null;
    if (regression) regressions += 1;
    if (o.statut === "reussi") reussis += 1;
    else if (o.statut === "echec") echecs += 1;
    else ignores += 1;

    await db.insert(ctResults).values({
      runId: run.id,
      scenario: s.id,
      domaine: s.domaine,
      label: s.label,
      criticite: s.criticite,
      statut: o.statut,
      observe: o.observe,
      attendu: s.attendu,
      dureeMs: o.dureeMs,
      regression,
    });

    resultats.push({
      scenario: s.id,
      domaine: s.domaine,
      label: s.label,
      criticite: s.criticite,
      statut: o.statut,
      observe: o.observe,
      attendu: s.attendu,
      dureeMs: o.dureeMs,
      regression,
    });
  }

  const dureeMs = Date.now() - debut;
  await db
    .update(ctRuns)
    .set({ finishedAt: new Date(), reussis, echecs, ignores, regressions, dureeMs })
    .where(eq(ctRuns.id, run.id));

  await deposerPreuves(resultats);
  await signaler(resultats);

  return {
    runId: run.id,
    portee,
    total: liste.length,
    reussis,
    echecs,
    ignores,
    regressions,
    dureeMs,
    resultats,
  };
}

/**
 * Point 111 — la preuve part vers l'audit d'activation, par domaine. Un domaine
 * dont un seul scénario échoue n'est pas « testé » : la preuve porte alors le
 * compte exact (2/3), et l'audit refusera le 🟢.
 */
async function deposerPreuves(resultats: ResultatScenario[]): Promise<void> {
  const domaines = Array.from(new Set(resultats.map((r) => r.domaine)));
  for (const domaine of domaines) {
    const items = resultats.filter((r) => r.domaine === domaine && r.statut !== "ignore");
    if (items.length === 0) continue;
    const passed = items.filter((r) => r.statut === "reussi").length;
    const echecs = items.filter((r) => r.statut === "echec");
    await recordTestEvidence({
      domain: domaine,
      kind: "integration",
      scenario: items.map((r) => r.scenario).join(", ").slice(0, 250),
      passed,
      total: items.length,
      detail:
        echecs.length === 0
          ? items.map((r) => `${r.scenario} : ${r.observe}`).join(" | ").slice(0, 2000)
          : echecs.map((r) => `${r.scenario} — ${r.observe}`).join(" | ").slice(0, 2000),
      source: "continuous-test-engine",
    });
  }
}

/**
 * Point 112 — un échec ne reste pas dans un tableau : il devient une alerte du
 * Système Intelligent. Une régression est de niveau critique, parce qu'elle
 * signale que quelque chose qui marchait a été cassé.
 */
async function signaler(resultats: ResultatScenario[]): Promise<void> {
  const { raiseAlert } = await import("../smart-engine/services/alert-engine.js");
  for (const r of resultats.filter((x) => x.statut === "echec")) {
    const critique = r.regression !== null || r.criticite === "critique";
    await raiseAlert({
      category: "test",
      title: `Contrôle en échec — ${r.label}`,
      description: [
        `Scénario : ${r.scenario} (${r.domaine}).`,
        `Attendu : ${r.attendu}`,
        `Observé : ${r.observe}`,
        r.regression
          ? `Régression : ce contrôle passait encore le ${new Date(r.regression.depuis).toLocaleString("fr-FR")}.`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      level: critique ? "critical" : "important",
      signature: `continuous-test:${r.scenario}`,
    });
  }
}

export interface TestOverview {
  checkedAt: string;
  dernierRun: {
    id: number;
    date: string;
    portee: string;
    total: number;
    reussis: number;
    echecs: number;
    ignores: number;
    regressions: number;
    dureeMs: number;
  } | null;
  couverture: {
    domaine: string;
    scenarios: number;
    reussis: number;
    echecs: number;
    ignores: number;
    /** true seulement si tous les scénarios exécutables du domaine passent. */
    prouve: boolean;
  }[];
  resultats: ResultatScenario[];
  /** Moteurs du registre qu'aucun scénario ne contrôle : l'angle mort, nommé. */
  nonCouverts: string[];
  /**
   * Point 109 — AVANT / APRÈS. La comparaison brute des deux dernières
   * campagnes : « 127 réussissaient avant, 126 après » suffit à refuser le vert,
   * même quand aucun scénario pris isolément ne paraît alarmant.
   */
  comparaison: {
    avant: { runId: number; date: string; reussis: number; total: number };
    apres: { runId: number; date: string; reussis: number; total: number };
    regression: boolean;
    verdict: string;
  } | null;
}

export async function overview(): Promise<TestOverview> {
  const [run] = await db.select().from(ctRuns).orderBy(desc(ctRuns.id)).limit(1);
  const resultats = run
    ? await db.select().from(ctResults).where(eq(ctResults.runId, run.id)).orderBy(ctResults.id)
    : [];

  const domaines = Array.from(new Set(SCENARIOS.map((s) => s.domaine)));
  const couverture = domaines.map((domaine) => {
    const items = resultats.filter((r) => r.domaine === domaine);
    const reussis = items.filter((r) => r.statut === "reussi").length;
    const echecs = items.filter((r) => r.statut === "echec").length;
    const ignores = items.filter((r) => r.statut === "ignore").length;
    return {
      domaine,
      scenarios: SCENARIOS.filter((s) => s.domaine === domaine).length,
      reussis,
      echecs,
      ignores,
      prouve: echecs === 0 && reussis > 0,
    };
  });

  const { listEngines } = await import("../engine-registry/service.js");
  let nonCouverts: string[] = [];
  try {
    const moteurs = await listEngines();
    nonCouverts = moteurs.map((m) => m.name).filter((n) => !domaines.includes(n));
  } catch {
    nonCouverts = [];
  }

  const deux = await db.select().from(ctRuns).orderBy(desc(ctRuns.id)).limit(2);
  let comparaison: TestOverview["comparaison"] = null;
  if (deux.length === 2) {
    const [apresRun, avantRun] = deux;
    const avant = {
      runId: avantRun.id,
      date: (avantRun.finishedAt ?? avantRun.startedAt).toISOString(),
      reussis: avantRun.reussis,
      total: avantRun.total,
    };
    const apres = {
      runId: apresRun.id,
      date: (apresRun.finishedAt ?? apresRun.startedAt).toISOString(),
      reussis: apresRun.reussis,
      total: apresRun.total,
    };
    const regression = apres.reussis < avant.reussis;
    comparaison = {
      avant,
      apres,
      regression,
      verdict: regression
        ? `${avant.reussis} contrôle(s) réussissaient avant, ${apres.reussis} après — régression détectée, le travail ne peut pas passer au vert.`
        : apres.reussis > avant.reussis
          ? `${avant.reussis} → ${apres.reussis} contrôle(s) réussis : progression.`
          : `${apres.reussis} contrôle(s) réussis, identique à la campagne précédente.`,
    };
  }

  return {
    checkedAt: new Date().toISOString(),
    dernierRun: run
      ? {
          id: run.id,
          date: (run.finishedAt ?? run.startedAt).toISOString(),
          portee: run.portee,
          total: run.total,
          reussis: run.reussis,
          echecs: run.echecs,
          ignores: run.ignores,
          regressions: run.regressions,
          dureeMs: run.dureeMs,
        }
      : null,
    couverture,
    resultats: resultats.map((r) => ({
      scenario: r.scenario,
      domaine: r.domaine,
      label: r.label,
      criticite: r.criticite,
      statut: r.statut as Statut,
      observe: r.observe,
      attendu: r.attendu,
      dureeMs: r.dureeMs,
      regression: r.regression ?? null,
    })),
    nonCouverts,
    comparaison,
  };
}

export interface Comparaison {
  avant: { runId: number; reussis: number; total: number; quand: string } | null;
  apres: { runId: number; reussis: number; total: number; quand: string } | null;
  delta: number | null;
  regression: boolean;
  perdus: { scenario: string; label: string; avant: string; apres: string }[];
  verdict: string;
}

/**
 * Point 143 — aucun déploiement sans comparaison avant / après.
 *
 * 127 contrôles valides avant, 126 après : c'est une régression, même si aucun
 * contrôle critique n'est en échec et même si le contrôle perdu est simplement
 * passé à « ignoré ». Un contrôle qui ne s'exécute plus ne prouve plus rien.
 */
export async function comparaison(): Promise<Comparaison> {
  const runs = await db.select().from(ctRuns).orderBy(desc(ctRuns.id)).limit(2);
  const apres = runs[0] ?? null;
  const avant = runs[1] ?? null;
  if (!apres) {
    return {
      avant: null,
      apres: null,
      delta: null,
      regression: false,
      verdict: "Aucune campagne exécutée : il n'y a rien à comparer, donc rien de prouvé.",
      perdus: [],
    };
  }
  const resume = (r: typeof apres) => ({
    runId: r.id,
    reussis: r.reussis,
    total: r.total,
    quand: (r.finishedAt ?? r.startedAt).toISOString(),
  });
  if (!avant) {
    return {
      avant: null,
      apres: resume(apres),
      delta: null,
      regression: false,
      verdict: `Première campagne (#${apres.id}) : ${apres.reussis} contrôle(s) réussi(s). Aucune référence antérieure, la comparaison viendra à la prochaine.`,
      perdus: [],
    };
  }

  const [rAvant, rApres] = await Promise.all([
    db.select().from(ctResults).where(eq(ctResults.runId, avant.id)),
    db.select().from(ctResults).where(eq(ctResults.runId, apres.id)),
  ]);
  const parScenarioApres = new Map(rApres.map((r) => [r.scenario, r]));
  const perdus: Comparaison["perdus"] = [];
  for (const a of rAvant) {
    if (a.statut !== "reussi") continue;
    const b = parScenarioApres.get(a.scenario);
    if (!b) {
      perdus.push({
        scenario: a.scenario,
        label: a.label,
        avant: "reussi",
        apres: "non exécuté sur la campagne suivante",
      });
    } else if (b.statut !== "reussi") {
      perdus.push({ scenario: a.scenario, label: a.label, avant: "reussi", apres: b.statut });
    }
  }

  const delta = apres.reussis - avant.reussis;
  const regression = perdus.length > 0;
  return {
    avant: resume(avant),
    apres: resume(apres),
    delta,
    regression,
    perdus,
    verdict: regression
      ? `RÉGRESSION : ${perdus.length} contrôle(s) réussissaient sur la campagne #${avant.id} et ne réussissent plus sur #${apres.id} (${avant.reussis} → ${apres.reussis}). Le déploiement ne peut pas être déclaré terminé.`
      : delta < 0
        ? `Baisse du nombre de contrôles réussis (${avant.reussis} → ${apres.reussis}) sans contrôle nommément perdu : la portée des deux campagnes diffère, la comparaison n'est pas concluante.`
        : `Aucun contrôle perdu entre les campagnes #${avant.id} et #${apres.id} (${avant.reussis} → ${apres.reussis}).`,
  };
}

export async function runHistory(limit = 20) {
  return db.select().from(ctRuns).orderBy(desc(ctRuns.id)).limit(limit);
}

/** Historique d'un scénario : sa fiabilité dans le temps, pas seulement son état du jour. */
export async function scenarioHistory(scenario: string, limit = 20) {
  return db
    .select()
    .from(ctResults)
    .where(eq(ctResults.scenario, scenario))
    .orderBy(desc(ctResults.id))
    .limit(limit);
}

/**
 * Point 113 — verrou de déploiement. Un déploiement ne se refuse pas sur une
 * impression : il se refuse sur un contrôle critique en échec, nommé.
 */
export async function deploymentGate(): Promise<{
  autorise: boolean;
  motif: string;
  bloquants: { scenario: string; label: string; observe: string }[];
}> {
  const [run] = await db.select().from(ctRuns).orderBy(desc(ctRuns.id)).limit(1);
  if (!run) {
    return {
      autorise: false,
      motif:
        "Aucune campagne de contrôle n'a encore été exécutée : rien ne prouve que la plateforme fonctionne.",
      bloquants: [],
    };
  }
  const bloquants = await db
    .select()
    .from(ctResults)
    .where(
      and(
        eq(ctResults.runId, run.id),
        eq(ctResults.criticite, "critique"),
        inArray(ctResults.statut, ["echec"]),
      ),
    );
  if (bloquants.length > 0) {
    return {
      autorise: false,
      motif: `${bloquants.length} contrôle(s) critique(s) en échec sur la campagne #${run.id}.`,
      bloquants: bloquants.map((b) => ({
        scenario: b.scenario,
        label: b.label,
        observe: b.observe,
      })),
    };
  }
  // Point 109 — une baisse du nombre de contrôles réussis interdit le vert,
  // même sans contrôle critique en échec.
  if (run.regressions > 0) {
    const regressions = await db
      .select()
      .from(ctResults)
      .where(and(eq(ctResults.runId, run.id), inArray(ctResults.statut, ["echec"])));
    const nommees = regressions.filter((r) => r.regression);
    if (nommees.length > 0) {
      return {
        autorise: false,
        motif: `${nommees.length} régression(s) sur la campagne #${run.id} : ces contrôles passaient avant.`,
        bloquants: nommees.map((b) => ({
          scenario: b.scenario,
          label: b.label,
          observe: b.observe,
        })),
      };
    }
  }

  // Point 143 — la comparaison avant/après refuse aussi un contrôle qui a
  // cessé de s'exécuter : disparaître n'est pas réussir.
  const comp = await comparaison();
  if (comp.regression) {
    return {
      autorise: false,
      motif: comp.verdict,
      bloquants: comp.perdus.map((p) => ({
        scenario: p.scenario,
        label: p.label,
        observe: `Réussi avant, ${p.apres} après.`,
      })),
    };
  }

  const age = Date.now() - (run.finishedAt ?? run.startedAt).getTime();
  if (age > 24 * 3600 * 1000) {
    return {
      autorise: false,
      motif: `La dernière campagne date de plus de 24 h (#${run.id}) : sa validité n'est plus établie.`,
      bloquants: [],
    };
  }
  return {
    autorise: true,
    motif: `Campagne #${run.id} : ${run.reussis} contrôle(s) réussi(s), aucun critique en échec.`,
    bloquants: [],
  };
}
