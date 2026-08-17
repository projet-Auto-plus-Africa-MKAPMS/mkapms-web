/**
 * Points 119-120-121 — calcul de TERMINÉ, rapport obligatoire, Completion
 * Center.
 *
 * Règle tenue de bout en bout : aucun pourcentage n'est saisi ni estimé. Un
 * pourcentage est la part de maillons **prouvés par une observation** sur les
 * maillons attendus. Quand une preuve manque, le motif est écrit ; le domaine
 * ne monte pas d'un point pour autant.
 */
import { desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { engineRegistry } from "../engine-registry/schema.js";
import { activationTestEvidence } from "../activation-audit/schema.js";
import { ctResults, ctRuns } from "../continuous-test/schema.js";
import { rsPipelineRuns } from "../resilience/schema.js";
import { latestActivationAudit, runActivationAudit, type AuditItem } from "../activation-audit/service.js";
import { cpDomainVerdicts, cpSnapshots, cpWorkReports } from "./schema.js";
import {
  DOMAINES,
  MAILLONS,
  MAILLON_LABELS,
  MAILLON_MANQUES,
  type Maillon,
} from "./definition.js";

const JOUR = 86_400_000;

interface Contexte {
  audit: Awaited<ReturnType<typeof latestActivationAudit>>;
  moteurs: Map<string, { state: string; health: string; lastHeartbeat: Date | null }>;
  /** Domaine du contrôle continu → résultats de la dernière campagne. */
  controles: Map<string, { reussis: number; echecs: number; ignores: number; regressions: string[]; motifsIgnores: string[] }>;
  /** Domaine d'audit → date de la dernière preuve de test. */
  preuves: Map<string, Date>;
  rollbacks: Set<string>;
}

async function contexte(): Promise<Contexte> {
  const audit = (await latestActivationAudit()) ?? (await runActivationAudit({ trigger: "completion" }));

  const moteursRows = await db
    .select({
      name: engineRegistry.name,
      state: engineRegistry.state,
      health: engineRegistry.health,
      lastHeartbeat: engineRegistry.lastHeartbeat,
    })
    .from(engineRegistry);
  const moteurs = new Map(moteursRows.map((m) => [m.name, m]));

  const controles = new Map<
    string,
    { reussis: number; echecs: number; ignores: number; regressions: string[]; motifsIgnores: string[] }
  >();
  const [dernierRun] = await db.select().from(ctRuns).orderBy(desc(ctRuns.id)).limit(1);
  if (dernierRun) {
    const res = await db.select().from(ctResults).where(eq(ctResults.runId, dernierRun.id));
    for (const r of res) {
      const e =
        controles.get(r.domaine) ??
        { reussis: 0, echecs: 0, ignores: 0, regressions: [] as string[], motifsIgnores: [] as string[] };
      if (r.statut === "reussi") e.reussis += 1;
      else if (r.statut === "echec") e.echecs += 1;
      else e.ignores += 1;
      if (r.regression) e.regressions.push(`${r.label} — ${r.observe}`);
      if (r.statut === "ignore" && r.observe) e.motifsIgnores.push(r.observe);
      controles.set(r.domaine, e);
    }
  }

  const preuvesRows = await db
    .select({
      domain: activationTestEvidence.domain,
      derniere: sql<string>`max(${activationTestEvidence.recordedAt})`,
    })
    .from(activationTestEvidence)
    .where(eq(activationTestEvidence.success, true))
    .groupBy(activationTestEvidence.domain);
  const preuves = new Map(preuvesRows.map((p) => [p.domain, new Date(p.derniere)]));

  const rollbackRows = await db
    .select({ title: rsPipelineRuns.title, plan: rsPipelineRuns.rollbackPlan })
    .from(rsPipelineRuns)
    .where(gte(rsPipelineRuns.createdAt, new Date(Date.now() - 90 * JOUR)));
  const rollbacks = new Set(
    rollbackRows.filter((r) => (r.plan ?? "").trim().length > 0).map((r) => r.title),
  );

  return { audit, moteurs, controles, preuves, rollbacks };
}

/** Point 119 — les 9 maillons d'un moteur, chacun sur une observation réelle. */
function maillonsMoteur(item: AuditItem, ctx: Contexte): Record<Maillon, boolean> {
  const moteur = ctx.moteurs.get(item.domain);
  const hb = moteur?.lastHeartbeat ? moteur.lastHeartbeat.getTime() : 0;
  const observable = !!moteur && hb > 0 && Date.now() - hb < JOUR && moteur.health !== "down";
  const preuve = ctx.preuves.get(item.domain);

  return {
    construit: item.existe,
    connecte: item.connecte,
    active: item.active && moteur?.state === "active",
    teste: item.teste && !!preuve,
    observable,
    inscrit_registre: !!moteur,
    rapporte_systeme: item.systemeIntelligentConnecte,
    // La non-régression se juge au niveau du domaine (contrôles du domaine),
    // pas moteur par moteur : elle est recalculée dans verdictPourDomaine().
    non_regression: true,
    preuve_resultat: item.utilise,
  };
}

export interface VerdictDomaine {
  domaine: string;
  label: string;
  termine: boolean;
  avancement: number;
  maillons: Record<string, boolean>;
  manquant: string[];
  dependancesManquantes: string[];
  restant: string[];
  motif: string;
  moteursExamines: string[];
  moteursAbsents: string[];
}

export interface CompletionReport {
  snapshotId: number | null;
  checkedAt: string;
  domaines: number;
  termines: number;
  avancement: number;
  verdicts: VerdictDomaine[];
  /** Réponse directe à « qu'est-ce qui reste à faire ? ». */
  resteAFaire: { domaine: string; label: string; tache: string }[];
}

function verdictPourDomaine(
  d: (typeof DOMAINES)[number],
  ctx: Contexte,
): VerdictDomaine {
  const items = (ctx.audit?.items ?? []).filter((i) => d.moteurs.includes(i.domain));
  const moteursAbsents = d.moteurs.filter((m) => !items.some((i) => i.domain === m));

  if (items.length === 0) {
    return {
      domaine: d.cle,
      label: d.label,
      termine: false,
      avancement: 0,
      maillons: Object.fromEntries(MAILLONS.map((m) => [m, false])),
      manquant: [MAILLON_MANQUES.construit],
      dependancesManquantes: [],
      restant: [
        `Aucun moteur de ce domaine n'est relevé par l'audit d'activation (attendus : ${d.moteurs.join(", ")}).`,
      ],
      motif:
        "PAS TERMINÉ — aucun moteur de ce domaine n'est observable : l'avancement ne peut pas être calculé, il n'est donc pas inventé.",
      moteursExamines: [],
      moteursAbsents,
    };
  }

  const parMoteur = items.map((i) => ({ nom: i.domain, m: maillonsMoteur(i, ctx) }));

  // Régressions et prérequis manquants viennent des contrôles du domaine.
  const regressions: string[] = [];
  const motifsIgnores: string[] = [];
  for (const td of d.testDomaines) {
    const c = ctx.controles.get(td);
    if (!c) continue;
    regressions.push(...c.regressions);
    motifsIgnores.push(...c.motifsIgnores);
  }

  const maillons = Object.fromEntries(
    MAILLONS.map((m) => [
      m,
      m === "non_regression"
        ? regressions.length === 0
        : parMoteur.every((p) => p.m[m]),
    ]),
  ) as Record<Maillon, boolean>;

  const prouves = MAILLONS.filter((m) => maillons[m]).length;
  const avancement = Math.round((prouves / MAILLONS.length) * 100);
  const manquant = MAILLONS.filter((m) => !maillons[m]).map((m) => MAILLON_MANQUES[m]);

  const restant: string[] = [];
  for (const m of MAILLONS) {
    if (maillons[m]) continue;
    const coupables = parMoteur.filter((p) => !p.m[m]).map((p) => p.nom);
    restant.push(
      m === "non_regression"
        ? `Refermer ${regressions.length} régression(s) : ${regressions.slice(0, 3).join(" | ")}`
        : `${MAILLON_LABELS[m]} — manquant sur : ${coupables.join(", ") || "ce domaine"}`,
    );
  }
  if (moteursAbsents.length > 0)
    restant.push(`Moteur(s) déclaré(s) mais non relevé(s) : ${moteursAbsents.join(", ")}`);

  const termine = MAILLONS.every((m) => maillons[m]);

  return {
    domaine: d.cle,
    label: d.label,
    termine,
    avancement,
    maillons,
    manquant,
    dependancesManquantes: [...new Set(motifsIgnores)].slice(0, 10),
    restant,
    motif: termine
      ? `TERMINÉ — les 9 maillons sont prouvés sur ${items.length} moteur(s).`
      : `PAS TERMINÉ — ${MAILLONS.length - prouves} maillon(s) sans preuve sur ${items.length} moteur(s) examiné(s).`,
    moteursExamines: items.map((i) => i.domain),
    moteursAbsents,
  };
}

/** Point 121 — calcule et enregistre l'état d'achèvement de la plateforme. */
export async function evaluer(options?: {
  trigger?: string;
  requestedBy?: number;
  persister?: boolean;
}): Promise<CompletionReport> {
  const ctx = await contexte();
  const verdicts = DOMAINES.map((d) => verdictPourDomaine(d, ctx));
  const termines = verdicts.filter((v) => v.termine).length;
  const avancement =
    verdicts.length === 0
      ? 0
      : Math.round(verdicts.reduce((n, v) => n + v.avancement, 0) / verdicts.length);

  const resteAFaire = verdicts.flatMap((v) =>
    v.restant.map((tache) => ({ domaine: v.domaine, label: v.label, tache })),
  );

  let snapshotId: number | null = null;
  if (options?.persister !== false) {
    const [snap] = await db
      .insert(cpSnapshots)
      .values({
        trigger: options?.trigger ?? "manuel",
        requestedBy: options?.requestedBy ?? null,
        domaines: verdicts.length,
        termines,
        avancement,
        detail: { auditRunId: ctx.audit?.runId ?? null, resteAFaire: resteAFaire.length },
      })
      .returning();
    snapshotId = snap.id;
    await db.insert(cpDomainVerdicts).values(
      verdicts.map((v) => ({
        snapshotId: snap.id,
        domaine: v.domaine,
        label: v.label,
        termine: v.termine,
        avancement: v.avancement,
        maillons: v.maillons,
        manquant: v.manquant,
        dependancesManquantes: v.dependancesManquantes,
        restant: v.restant,
        motif: v.motif,
      })),
    );
  }

  return {
    snapshotId,
    checkedAt: new Date().toISOString(),
    domaines: verdicts.length,
    termines,
    avancement,
    verdicts,
    resteAFaire,
  };
}

/** Dernière photographie enregistrée, sans recalcul. */
export async function dernier(): Promise<CompletionReport | null> {
  const [snap] = await db.select().from(cpSnapshots).orderBy(desc(cpSnapshots.id)).limit(1);
  if (!snap) return null;
  const rows = await db
    .select()
    .from(cpDomainVerdicts)
    .where(eq(cpDomainVerdicts.snapshotId, snap.id));
  const verdicts: VerdictDomaine[] = rows.map((r) => ({
    domaine: r.domaine,
    label: r.label,
    termine: r.termine,
    avancement: r.avancement,
    maillons: r.maillons ?? {},
    manquant: r.manquant ?? [],
    dependancesManquantes: r.dependancesManquantes ?? [],
    restant: r.restant ?? [],
    motif: r.motif,
    moteursExamines: [],
    moteursAbsents: [],
  }));
  return {
    snapshotId: snap.id,
    checkedAt: snap.createdAt.toISOString(),
    domaines: snap.domaines,
    termines: snap.termines,
    avancement: snap.avancement,
    verdicts,
    resteAFaire: verdicts.flatMap((v) =>
      v.restant.map((tache) => ({ domaine: v.domaine, label: v.label, tache })),
    ),
  };
}

export const DEFINITION = {
  maillons: MAILLONS,
  labels: MAILLON_LABELS,
  manques: MAILLON_MANQUES,
  regle:
    "TERMINÉ = Construit + Connecté + Activé + Testé + Observable + Inscrit au registre + Rapporté au Système Intelligent + Non-régression vérifiée + Preuve de résultat. Tout le reste est PAS TERMINÉ.",
} as const;

/**
 * Point 120 — dépose le rapport obligatoire de fin de travail. L'auteur
 * décrit ce qu'il a fait ; la plateforme calcule elle-même les tests, les
 * régressions, l'information du Système Intelligent, la disponibilité du
 * retour arrière et le statut final. Un rapport ne peut donc pas se déclarer
 * « terminé » sans preuve.
 */
export async function deposerRapport(input: {
  tache: string;
  domaine?: string | null;
  existant?: string;
  modifie?: string;
  active?: string;
  moteursConnectes?: string[];
  seoConcerne?: string;
  paysConcernes?: string[];
  paiementConcerne?: boolean;
  auteur?: string;
  requestedBy?: number;
}) {
  const ctx = await contexte();
  const d = input.domaine ? DOMAINES.find((x) => x.cle === input.domaine) : undefined;
  const verdict = d ? verdictPourDomaine(d, ctx) : null;

  let testsExecutes = 0;
  let testsReussis = 0;
  const regressions: string[] = [];
  for (const td of d?.testDomaines ?? []) {
    const c = ctx.controles.get(td);
    if (!c) continue;
    testsExecutes += c.reussis + c.echecs + c.ignores;
    testsReussis += c.reussis;
    regressions.push(...c.regressions);
  }

  const moteurs = input.moteursConnectes ?? d?.moteurs ?? [];
  const systemeInformer = moteurs.length > 0 && verdict ? verdict.maillons.rapporte_systeme === true : false;
  const rollbackDisponible = [...ctx.rollbacks].some((t) =>
    t.toLowerCase().includes(input.tache.slice(0, 24).toLowerCase()),
  );

  const statutFinal = verdict?.termine ? "termine" : "pas_termine";
  const motif = verdict
    ? verdict.motif
    : "PAS TERMINÉ — aucun domaine rattaché : impossible de prouver l'achèvement.";

  const [row] = await db
    .insert(cpWorkReports)
    .values({
      tache: input.tache,
      domaine: input.domaine ?? null,
      existant: input.existant ?? "",
      modifie: input.modifie ?? "",
      active: input.active ?? "",
      moteursConnectes: moteurs,
      testsExecutes,
      testsReussis,
      regressions,
      dependancesManquantes: verdict?.dependancesManquantes ?? [],
      seoConcerne: input.seoConcerne ?? "",
      paysConcernes: input.paysConcernes ?? [],
      paiementConcerne: input.paiementConcerne ?? false,
      systemeInformer,
      rollbackDisponible,
      statutFinal,
      motif,
      auteur: input.auteur ?? "agent",
      requestedBy: input.requestedBy ?? null,
    })
    .returning();

  return { ...row, createdAt: row.createdAt.toISOString(), verdict };
}

export async function rapports(limit = 40) {
  const rows = await db
    .select()
    .from(cpWorkReports)
    .orderBy(desc(cpWorkReports.id))
    .limit(limit);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/** Sonde du moteur : sans photographie, le Completion Center ne prouve rien. */
export async function health(): Promise<{ status: "up" | "degraded" | "down"; message: string }> {
  const [snap] = await db.select().from(cpSnapshots).orderBy(desc(cpSnapshots.id)).limit(1);
  if (!snap)
    return {
      status: "degraded",
      message: "Aucune photographie d'achèvement enregistrée : l'état d'avancement n'est pas prouvé.",
    };
  const jours = (Date.now() - snap.createdAt.getTime()) / JOUR;
  if (jours > 7)
    return {
      status: "degraded",
      message: `Dernière photographie il y a ${Math.round(jours)} jours : l'avancement affiché a vieilli.`,
    };
  return {
    status: "up",
    message: `Photographie #${snap.id} : ${snap.termines}/${snap.domaines} domaine(s) terminés, avancement ${snap.avancement} %.`,
  };
}

/** Point 122 — l'ordre d'exécution, avec l'état réellement observé de chaque étape. */
export interface EtapeOrdre {
  rang: number;
  titre: string;
  etat: "fait" | "en_cours" | "a_faire";
  observe: string;
}

export async function ordreExecution(): Promise<{
  checkedAt: string;
  etapes: EtapeOrdre[];
  prochaine: EtapeOrdre | null;
}> {
  const etapes: EtapeOrdre[] = [];
  const ajoute = (rang: number, titre: string, ok: boolean | null, observe: string) =>
    etapes.push({ rang, titre, etat: ok === null ? "en_cours" : ok ? "fait" : "a_faire", observe });

  const compte = async (table: string, condition = "") => {
    try {
      const r = await db.execute(
        sql.raw(`SELECT count(*)::int AS n FROM "${table}" ${condition}`),
      );
      const rows = (r as unknown as { rows?: { n: number }[] }).rows ?? [];
      return rows[0]?.n ?? 0;
    } catch {
      return null;
    }
  };

  const audits = await compte("indexation_audits");
  ajoute(
    1,
    "Audit Google / indexation",
    audits === null ? false : audits > 0,
    audits === null
      ? "Moteur d'indexation non installé."
      : `${audits} audit(s) d'indexation enregistré(s).`,
  );

  const bloquantes = await compte("indexation_url_checks", "WHERE \"indexable\" = false");
  ajoute(
    2,
    "Corriger les causes d'invisibilité",
    bloquantes === null ? false : bloquantes === 0,
    bloquantes === null
      ? "Aucun contrôle d'URL disponible."
      : `${bloquantes} URL(s) encore non indexable(s).`,
  );

  const produits = await compte("product_feed_items");
  ajoute(
    3,
    "Séparer Véhicules et Produits / Pièces",
    produits !== null,
    produits === null
      ? "Catalogue produit non installé."
      : `${produits} fiche(s) produit dans le pipeline dédié.`,
  );

  const flux = await compte("product_feed_runs");
  ajoute(
    4,
    "Configurer les surfaces Google éligibles",
    flux === null ? false : flux > 0,
    flux === null ? "Aucun flux produit." : `${flux} publication(s) de flux.`,
  );

  const smartAudits = await compte("smart_audit_runs");
  ajoute(
    5,
    "Auditer entièrement le Système Intelligent",
    smartAudits === null ? false : smartAudits > 0,
    smartAudits === null ? "Audit du Système Intelligent absent." : `${smartAudits} audit(s) enregistré(s).`,
  );

  const cycles = await compte("smart_cycle_runs");
  ajoute(
    6,
    "Activer les fonctions construites mais inactives",
    cycles === null ? false : cycles > 0,
    cycles === null ? "Cycle non installé." : `${cycles} cycle(s) réellement exécuté(s).`,
  );

  const abonnements = await compte("eb_subscriptions", "WHERE \"active\" = true");
  ajoute(
    7,
    "Connecter tous les moteurs au Système Intelligent",
    abonnements === null ? false : abonnements > 0,
    abonnements === null ? "Bus non installé." : `${abonnements} abonnement(s) actif(s).`,
  );

  const remises = await compte("eb_deliveries", "WHERE \"statut\" = 'remise'");
  const campagnes = await compte("ct_runs");
  ajoute(
    8,
    "Event Bus, Contrôle continu et Registre en fonctionnement réel",
    remises !== null && campagnes !== null && remises > 0 && campagnes > 0,
    `${remises ?? 0} remise(s) effectuée(s), ${campagnes ?? 0} campagne(s) de contrôle.`,
  );

  const relevés = await compte("cg_snapshots");
  ajoute(
    9,
    "Construire le Code Knowledge Graph",
    relevés === null ? false : relevés > 0,
    relevés === null ? "Mémoire technique non installée." : `${relevés} relevé(s) de code ingéré(s).`,
  );

  const observations = await compte("cg_observations");
  ajoute(
    10,
    "Mettre l'agent développeur en observation / apprentissage",
    observations === null ? false : observations > 0,
    observations === null
      ? "Aucune observation possible."
      : `${observations} observation(s) de code enregistrée(s).`,
  );

  const echecs = await compte("ct_results", "WHERE \"statut\" = 'echec'");
  ajoute(
    11,
    "Tester les modifications précédentes",
    echecs === null ? false : echecs === 0,
    echecs === null ? "Aucun résultat de contrôle." : `${echecs} contrôle(s) en échec à traiter.`,
  );

  const photos = await compte("cp_snapshots");
  ajoute(
    12,
    "Générer le Completion Center et la liste exacte des tâches restantes",
    photos === null ? false : photos > 0,
    photos === null ? "Completion Center non installé." : `${photos} photographie(s) d'achèvement.`,
  );

  return {
    checkedAt: new Date().toISOString(),
    etapes,
    prochaine: etapes.find((e) => e.etat !== "fait") ?? null,
  };
}
