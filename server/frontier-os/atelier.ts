/**
 * Centre Cyber-Électrique — ATELIER DE RÉPARATION : enregistrer un incident, diagnostiquer, proposer une réparation, la TESTER dans un
 * environnement isolé (une transaction qui est toujours annulée), préparer le retour arrière, puis l'appliquer sur confirmation.
 * Pour chaque réparation sont conservés : la version avant l'intervention, la modification proposée, les tests, le résultat, le retour arrière.
 *
 * Premier lot : circuit complet en SIMULATION, sur les données du centre seulement. Une intervention sur une plateforme réelle exigerait
 * un droit accordé à ce moteur et à cette entreprise (table access_grants) : sans droit actif, la réparation est refusée.
 * Les opérations sont des opérations sûres et réversibles, en nombre fini ; rien d'autre ne se « répare » en silence.
 */
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { dbFrontier, type BaseFrontier, type TxFrontier } from "./base/connexion.js";
import { accessGrants, cuts, engineBindings, engines, gates, groups, incidents, lines, repairs, type Repair } from "./base/schema.js";
import { enregistrer, envoyer as envoyerBus, RefusMoteur } from "./bus.js";
import { journaliser, ouvrirIncident, type Acteur } from "./journal.js";
import { PAIRE_ATELIER, PAIRE_GENERAL, PAIRE_GROUPE, PAIRE_LIGNE, PAIRE_PAR_COTE } from "./moteurs-internes.js";
import { ETIQUETTE_RESERVE, RESERVE_DE_DEPART, RESERVE_PAR_LIGNE_REELLE, reservesAAjouter } from "./regles.js";
import { revaliderLignes } from "./fondation.js";

// ───────────────────────── Opérations sûres ─────────────────────────
export type OperationReparation =
  | { op: "restart_engine"; code: string }
  | { op: "reset_cut"; coupureId: number }
  | { op: "complete_reserves" }
  | { op: "rebuild_bindings" };

interface EtatAvant {
  [cle: string]: unknown;
}

const ENGINE_DE_COTE = { remote: PAIRE_PAR_COTE("remote"), center: PAIRE_PAR_COTE("center"), main: PAIRE_PAR_COTE("main") } as const;

/** Photographie des lignes concernées AVANT l'opération : c'est la « version avant l'intervention » et la base du retour arrière. */
async function etatAvant(tx: BaseFrontier, op: OperationReparation): Promise<EtatAvant> {
  if (op.op === "restart_engine") {
    const [m] = await tx.select({ code: engines.code, running: engines.running, health: engines.health }).from(engines).where(eq(engines.code, op.code)).limit(1);
    return { moteur: m ?? null };
  }
  if (op.op === "reset_cut") {
    const [c] = await tx.select().from(cuts).where(eq(cuts.id, op.coupureId)).limit(1);
    const [g] = await tx.select().from(gates).where(eq(gates.cutId, op.coupureId)).limit(1);
    return { coupure: c ? { id: c.id, requested: c.requested, observed: c.observed, progress: c.progress, error: c.error } : null, porte: g ? { open: g.open } : null };
  }
  if (op.op === "complete_reserves") {
    const [n] = await tx.select({ n: count() }).from(lines).where(eq(lines.kind, "reserve"));
    return { reservesAvant: Number(n?.n ?? 0) };
  }
  const [n] = await tx.select({ n: count() }).from(engineBindings);
  return { liaisonsAvant: Number(n?.n ?? 0) };
}

async function appliquer(tx: TxFrontier, op: OperationReparation): Promise<{ cree: Record<string, unknown> }> {
  if (op.op === "restart_engine") {
    await tx.update(engines).set({ running: true, health: "unknown", updatedAt: new Date() }).where(eq(engines.code, op.code));
    return { cree: {} };
  }
  if (op.op === "reset_cut") {
    const [c] = await tx.select().from(cuts).where(eq(cuts.id, op.coupureId)).limit(1);
    if (!c) throw new RefusMoteur("COUPURE_INCONNUE", "Coupure inconnue.");
    // Une coupure en erreur est ramenée à l'état « coupée, non observée » ; sa porte est refermée. Jamais l'inverse.
    await tx.update(gates).set({ open: false, changedAt: new Date() }).where(eq(gates.cutId, op.coupureId));
    await tx.update(cuts).set({ requested: "deactivate", observed: "unknown", progress: "idle", error: null, updatedAt: new Date() }).where(eq(cuts.id, op.coupureId));
    return { cree: {} };
  }
  if (op.op === "complete_reserves") {
    const crees: number[] = [];
    for (const g of await tx.select().from(groups)) {
      const [r] = await tx.select({ n: count() }).from(lines).where(and(eq(lines.groupCode, g.code), eq(lines.kind, "real")));
      const [s] = await tx.select({ n: count() }).from(lines).where(and(eq(lines.groupCode, g.code), eq(lines.kind, "reserve")));
      const [m] = await tx.select({ max: sql<number>`coalesce(max(${lines.position}), 0)::int` }).from(lines).where(eq(lines.groupCode, g.code));
      const a = reservesAAjouter(Number(r?.n ?? 0), Number(s?.n ?? 0));
      for (let i = 0; i < a; i++) {
        const [l] = await tx.insert(lines).values({ groupCode: g.code, position: (m?.max ?? 0) + i + 1, kind: "reserve", label: ETIQUETTE_RESERVE, enabled: false, ownerKind: g.ownerKind, ownerCode: g.ownerCode }).returning({ id: lines.id });
        crees.push(l!.id);
      }
    }
    return { cree: { lignes: crees } };
  }
  // rebuild_bindings : recrée les paires manquantes des interrupteurs, lignes, groupes et du général (jamais une paire existante).
  const creees: number[] = [];
  const ajouter = async (kind: "switch" | "line" | "group" | "general", code: string, p: { commande: string; verification: string }) => {
    const [x] = await tx.insert(engineBindings).values({ targetKind: kind, targetCode: code, commandEngine: p.commande, verificationEngine: p.verification, ownerKind: "center", ownerCode: "center" }).onConflictDoNothing().returning({ id: engineBindings.id });
    if (x) creees.push(x.id);
  };
  for (const l of await tx.select().from(lines).where(eq(lines.kind, "real"))) {
    if (l.remoteSwitch) await ajouter("switch", l.remoteSwitch, ENGINE_DE_COTE.remote);
    if (l.centerContact) await ajouter("switch", l.centerContact, ENGINE_DE_COTE.center);
    if (l.mainSwitch) await ajouter("switch", l.mainSwitch, ENGINE_DE_COTE.main);
    await ajouter("line", `line:${l.id}`, PAIRE_LIGNE);
  }
  for (const g of await tx.select({ code: groups.code }).from(groups)) await ajouter("group", `group:${g.code}`, PAIRE_GROUPE);
  await ajouter("general", "general", PAIRE_GENERAL);
  return { cree: { liaisons: creees } };
}

async function annuler(tx: TxFrontier, op: OperationReparation, avant: EtatAvant, cree: Record<string, unknown>): Promise<void> {
  if (op.op === "restart_engine") {
    const m = avant.moteur as { running: boolean; health: string } | null;
    if (m) await tx.update(engines).set({ running: m.running, health: m.health as never, updatedAt: new Date() }).where(eq(engines.code, op.code));
  } else if (op.op === "reset_cut") {
    const c = avant.coupure as { requested: never; observed: never; progress: never; error: string | null } | null;
    const g = avant.porte as { open: boolean } | null;
    // Le retour arrière restaure le constat, JAMAIS une porte ouverte : annuler une réparation ne rebranche rien (la porte reste fermée).
    if (c) await tx.update(cuts).set({ requested: c.requested, observed: c.observed, progress: c.progress, error: c.error, updatedAt: new Date() }).where(eq(cuts.id, op.coupureId));
    void g;
  } else if (op.op === "complete_reserves") {
    const ids = (cree.lignes as number[] | undefined) ?? [];
    // On ne supprime que des réserves restées vides et désactivées : jamais une ligne devenue réelle entre-temps.
    if (ids.length) await tx.delete(lines).where(and(inArray(lines.id, ids), eq(lines.kind, "reserve"), eq(lines.enabled, false)));
  } else {
    const ids = (cree.liaisons as number[] | undefined) ?? [];
    if (ids.length) await tx.delete(engineBindings).where(inArray(engineBindings.id, ids));
  }
}

/** Invariants du centre contrôlés avant et après toute intervention : une réparation qui en casse un est annulée. */
export async function verifierInvariants(base: BaseFrontier = dbFrontier()): Promise<{ ok: boolean; violations: string[] }> {
  const v: string[] = [];
  const reserves = await base.select().from(lines).where(eq(lines.kind, "reserve"));
  for (const r of reserves) {
    if (r.enabled || r.label !== ETIQUETTE_RESERVE || r.validity !== "invalid") v.push(`réserve ${r.id} non conforme (activée, renommée ou validée)`);
  }
  const ouvertes = await base
    .select({ coupure: cuts.id, ligne: cuts.lineId, requested: cuts.requested, observed: cuts.observed, progress: cuts.progress })
    .from(cuts)
    .innerJoin(gates, eq(gates.cutId, cuts.id))
    .where(and(eq(gates.open, true), sql`(${cuts.requested} <> 'activate' OR ${cuts.progress} = 'failed')`));
  for (const o of ouvertes) if (o.progress !== "in_progress" && o.progress !== "pending") v.push(`porte ouverte sans demande d'activation confirmée (coupure ${o.coupure})`);
  const liaisons = await base.select().from(engineBindings);
  for (const l of liaisons) if (l.commandEngine === l.verificationEngine) v.push(`liaison ${l.targetKind}/${l.targetCode} : mêmes moteurs de commande et de vérification`);
  const reelles = await base.select({ id: lines.id, groupe: lines.groupCode }).from(lines).where(eq(lines.kind, "real"));
  const parGroupe = new Map<string, number>();
  for (const r of reelles) parGroupe.set(r.groupe, (parGroupe.get(r.groupe) ?? 0) + 1);
  for (const [g, n] of parGroupe) {
    const s = reserves.filter((x) => x.groupCode === g).length;
    if (s < n * RESERVE_PAR_LIGNE_REELLE) v.push(`groupe ${g} : ${s} réserve(s) pour ${n} ligne(s) réelle(s) (minimum ${n * RESERVE_PAR_LIGNE_REELLE})`);
  }
  for (const g of await base.select({ code: groups.code }).from(groups)) {
    if (!parGroupe.has(g.code) && reserves.filter((x) => x.groupCode === g.code).length < RESERVE_DE_DEPART) v.push(`groupe ${g.code} : moins de ${RESERVE_DE_DEPART} réserves de départ`);
  }
  return { ok: v.length === 0, violations: v };
}

/** Droit d'intervention : le centre répare ses propres données ; toute autre propriété exige un droit actif accordé (aucun n'existe aujourd'hui). */
export async function droitAccorde(proprietaireKind: string, proprietaireCode: string, base: BaseFrontier = dbFrontier()): Promise<{ ok: boolean; note: string }> {
  if (proprietaireKind === "center") return { ok: true, note: "Données du centre : droit d'intervention intrinsèque." };
  const [g] = await base.select().from(accessGrants).where(and(eq(accessGrants.status, "active"), eq(accessGrants.scope, `repair:${proprietaireKind}:${proprietaireCode}`))).limit(1);
  return g ? { ok: true, note: `Droit accordé (${g.grantedBy}).` } : { ok: false, note: `Aucun droit actif d'intervention sur ${proprietaireKind} « ${proprietaireCode} » : réparation refusée. Une plateforme réelle exige un droit accordé à ce moteur et à cette entreprise.` };
}

// ───────────────────────── Diagnostic ─────────────────────────
export interface Anomalie {
  kind: string;
  severite: "info" | "warning" | "critical";
  resume: string;
  operation: OperationReparation | null;
  ligneId?: number;
  coupureId?: number;
  moteur?: string;
}

export async function detecterAnomalies(base: BaseFrontier = dbFrontier()): Promise<Anomalie[]> {
  const a: Anomalie[] = [];
  for (const m of await base.select().from(engines).where(and(eq(engines.platformCode, "frontier"), inArray(engines.kind, ["command", "verification", "transport", "monitor"])))) {
    if (!m.running) a.push({ kind: "moteur_arrete", severite: "warning", resume: `Le moteur interne ${m.code} est arrêté : les commandes qui en dépendent sont bloquées.`, operation: { op: "restart_engine", code: m.code }, moteur: m.code });
    else if (m.health === "down") a.push({ kind: "moteur_en_panne", severite: "warning", resume: `Le moteur interne ${m.code} ne répond pas.`, operation: { op: "restart_engine", code: m.code }, moteur: m.code });
  }
  for (const c of await base.select().from(cuts).where(sql`${cuts.progress} = 'failed' OR (${cuts.progress} IN ('pending', 'in_progress') AND ${cuts.updatedAt} < now() - interval '60 seconds')`)) {
    a.push({ kind: c.progress === "failed" ? "coupure_en_erreur" : "commande_bloquee", severite: "warning", resume: c.progress === "failed" ? `Coupure ${c.side} de la ligne ${c.lineId} en erreur : ${c.error ?? "non précisé"}` : `Coupure ${c.side} de la ligne ${c.lineId} bloquée en cours depuis plus d'une minute.`, operation: { op: "reset_cut", coupureId: c.id }, ligneId: c.lineId, coupureId: c.id });
  }
  const inv = await verifierInvariants(base);
  const reservesOk = !inv.violations.some((x) => x.includes("réserve"));
  if (!reservesOk) a.push({ kind: "reserve_entamee", severite: "warning", resume: inv.violations.filter((x) => x.includes("réserve")).join(" ; "), operation: { op: "complete_reserves" } });
  const manquantes = await base.execute(sql`
    SELECT (
      (SELECT count(*) FROM frontier.lines l WHERE l.kind = 'real' AND (
        NOT EXISTS (SELECT 1 FROM frontier.engine_bindings b WHERE b.target_kind = 'line' AND b.target_code = 'line:' || l.id)
        OR NOT EXISTS (SELECT 1 FROM frontier.engine_bindings b WHERE b.target_kind = 'switch' AND b.target_code = l.center_contact)
        OR NOT EXISTS (SELECT 1 FROM frontier.engine_bindings b WHERE b.target_kind = 'switch' AND b.target_code = l.remote_switch)
        OR NOT EXISTS (SELECT 1 FROM frontier.engine_bindings b WHERE b.target_kind = 'switch' AND b.target_code = l.main_switch)))
      + (SELECT count(*) FROM frontier.groups g WHERE NOT EXISTS (SELECT 1 FROM frontier.engine_bindings b WHERE b.target_kind = 'group' AND b.target_code = 'group:' || g.code))
      + (SELECT CASE WHEN EXISTS (SELECT 1 FROM frontier.engine_bindings b WHERE b.target_kind = 'general') THEN 0 ELSE 1 END)
    )::int AS n`);
  if (Number((manquantes.rows[0] as { n: number }).n) > 0) a.push({ kind: "liaison_manquante", severite: "warning", resume: `${(manquantes.rows[0] as { n: number }).n} cible(s) commandable(s) sans paire commande / vérification (ligne, interrupteur, groupe ou interrupteur général).`, operation: { op: "rebuild_bindings" } });
  for (const l of await base.select().from(lines).where(and(eq(lines.kind, "real"), eq(lines.validity, "invalid")))) {
    a.push({ kind: "ligne_invalide", severite: "info", resume: `Ligne « ${l.label} » non validée : ${l.invalidReasons[0] ?? "chaîne incomplète"} — intervention humaine requise (aucune réparation automatique).`, operation: null, ligneId: l.id });
  }
  for (const v of inv.violations.filter((x) => x.startsWith("porte ouverte"))) a.push({ kind: "porte_incoherente", severite: "critical", resume: v, operation: null });
  return a;
}

export async function lancerDiagnostic(acteur: Acteur, base: BaseFrontier = dbFrontier()): Promise<{ anomalies: (Anomalie & { incidentId: number | null })[]; invariants: { ok: boolean; violations: string[] } }> {
  const anomalies = await detecterAnomalies(base);
  const out: (Anomalie & { incidentId: number | null })[] = [];
  for (const x of anomalies) {
    const incidentId = x.severite === "info" ? null : await ouvrirIncident({ severite: x.severite, kind: `anomalie:${x.kind}`, resume: x.resume, ligneId: x.ligneId ?? null, coupureId: x.coupureId ?? null, moteur: x.moteur ?? null, detail: { operation: x.operation } }, base);
    if (incidentId) await base.update(incidents).set({ status: "diagnosed" }).where(and(eq(incidents.id, incidentId), eq(incidents.status, "open")));
    out.push({ ...x, incidentId });
  }
  const invariants = await verifierInvariants(base);
  await journaliser({ acteur, action: "workshop_diagnostic", cible: "center", resultat: anomalies.length ? "error" : "ok", detail: { anomalies: anomalies.length, invariants: invariants.violations.length } }, base);
  return { anomalies: out, invariants };
}

// ───────────────────────── Moteurs de l'atelier (bus) ─────────────────────────
interface ResultatTest {
  ok: boolean;
  /** Violations NOUVELLES introduites par la réparation (celles qui existaient déjà ne lui sont pas imputées). */
  invariants: string[];
  /** Violations qui existaient avant et que la réparation fait disparaître. */
  corrigees: string[];
  avant: EtatAvant;
}
class AnnulationTest extends Error {
  constructor(public readonly resultat: ResultatTest) {
    super("annulation du test isolé");
  }
}

/** Environnement isolé : la réparation est appliquée dans une transaction, les invariants sont contrôlés, puis la transaction est TOUJOURS annulée. */
async function testerDansTransaction(op: OperationReparation): Promise<ResultatTest> {
  try {
    await dbFrontier().transaction(async (tx) => {
      const avant = await etatAvant(tx, op);
      const inv0 = await verifierInvariants(tx);
      await appliquer(tx, op);
      const inv1 = await verifierInvariants(tx);
      const nouvelles = inv1.violations.filter((x) => !inv0.violations.includes(x));
      throw new AnnulationTest({ ok: nouvelles.length === 0, invariants: nouvelles, corrigees: inv0.violations.filter((x) => !inv1.violations.includes(x)), avant });
    });
  } catch (e) {
    if (e instanceof AnnulationTest) return e.resultat;
    throw e;
  }
  throw new Error("transaction de test non annulée");
}

enregistrer(PAIRE_ATELIER.verification, "verification.conditions", async (m) => {
  const { reparationId } = m.contenu as { reparationId: number };
  const [r] = await dbFrontier().select().from(repairs).where(eq(repairs.id, reparationId)).limit(1);
  if (!r) throw new RefusMoteur("REPARATION_INCONNUE", "Réparation inconnue.");
  return { ok: true, statut: r.status };
});
enregistrer(PAIRE_ATELIER.verification, "verification.sonder", async (m) => {
  const { op } = m.contenu as { op: OperationReparation };
  return testerDansTransaction(op);
});
enregistrer(PAIRE_ATELIER.verification, "sante.verifier", async () => ({ ok: true }));
enregistrer(PAIRE_ATELIER.commande, "commande.preparer", async (m) => {
  const { op } = m.contenu as { op: OperationReparation };
  return { avant: await etatAvant(dbFrontier(), op) };
});
enregistrer(PAIRE_ATELIER.commande, "commande.appliquer", async (m) => {
  const { op } = m.contenu as { op: OperationReparation };
  return dbFrontier().transaction(async (tx) => {
    const avant = await etatAvant(tx, op);
    const inv0 = await verifierInvariants(tx);
    const { cree } = await appliquer(tx, op);
    const inv1 = await verifierInvariants(tx);
    // Un invariant NOUVELLEMENT cassé par la réparation annule TOUT (la transaction n'est pas validée).
    const nouvelles = inv1.violations.filter((x) => !inv0.violations.includes(x));
    if (nouvelles.length) throw new RefusMoteur("INVARIANT_CASSE", nouvelles.join(" ; "));
    return { avant, cree };
  });
});
enregistrer(PAIRE_ATELIER.commande, "sante.verifier", async () => ({ ok: true }));

// ───────────────────────── Cycle de vie d'une réparation ─────────────────────────
export interface ResultatReparation {
  ok: boolean;
  detail: string;
  reparation?: Repair;
}

/** Propose une réparation pour un incident diagnostiqué. Rien n'est appliqué. */
export async function proposerReparation(incidentId: number, acteur: Acteur): Promise<ResultatReparation> {
  const db = dbFrontier();
  const [inc] = await db.select().from(incidents).where(eq(incidents.id, incidentId)).limit(1);
  if (!inc) return { ok: false, detail: "Incident inconnu." };
  const op = (inc.detail as { operation?: OperationReparation | null }).operation ?? null;
  if (!op) {
    await journaliser({ acteur, action: "repair_propose", cible: "incident", cibleId: incidentId, resultat: "refused", erreur: "AUCUNE_REPARATION_AUTOMATIQUE" });
    return { ok: false, detail: "Cet incident n'a pas de réparation automatique sûre : il demande une intervention humaine." };
  }
  const droit = await droitAccorde(inc.ownerKind, inc.ownerCode);
  if (!droit.ok) {
    await journaliser({ acteur, action: "repair_propose", cible: "incident", cibleId: incidentId, resultat: "refused", erreur: "DROIT_NON_ACCORDE", detail: { note: droit.note } });
    return { ok: false, detail: droit.note };
  }
  const avant = await etatAvant(db, op);
  const [r] = await db.insert(repairs).values({ incidentId, status: "proposed", versionBefore: avant, proposedChange: op as unknown as Record<string, unknown>, rightsNote: droit.note, actor: `${acteur.type}${acteur.id !== undefined ? `:${acteur.id}` : ""}`, ownerKind: inc.ownerKind, ownerCode: inc.ownerCode }).returning();
  await journaliser({ acteur, action: "repair_propose", cible: "repair", cibleId: r!.id, resultat: "ok", detail: { incident: incidentId, op: op.op } });
  return { ok: true, detail: "Réparation proposée : testez-la dans l'environnement isolé avant toute application.", reparation: r };
}

/** Teste la réparation dans l'environnement isolé : appliquée dans une transaction toujours annulée. Aucune donnée réelle n'est modifiée. */
export async function testerReparation(reparationId: number, acteur: Acteur): Promise<ResultatReparation> {
  const db = dbFrontier();
  const [r] = await db.select().from(repairs).where(eq(repairs.id, reparationId)).limit(1);
  if (!r) return { ok: false, detail: "Réparation inconnue." };
  if (!["proposed", "tested", "failed"].includes(r.status)) return { ok: false, detail: `Réparation déjà ${r.status} : plus de test possible.`, reparation: r };
  const cond = await envoyerBus({ de: "center:pipeline", vers: PAIRE_ATELIER.verification, type: "verification.conditions", contenu: { reparationId } });
  if (!cond.ok) return { ok: false, detail: `Moteur de vérification de l'atelier indisponible (${cond.issue}) : test impossible.`, reparation: r };
  const op = r.proposedChange as unknown as OperationReparation;
  const test = await envoyerBus<ResultatTest>({ de: "center:pipeline", vers: PAIRE_ATELIER.verification, type: "verification.sonder", contenu: { op } }, { delaiMs: 5000 });
  const resultat = test.ok
    ? { ok: test.contenu!.ok, invariants: test.contenu!.invariants, corrigees: test.contenu!.corrigees, environnement: "isolé (transaction annulée)", dureeMs: test.dureeMs }
    : { ok: false, invariants: [test.erreur ?? test.issue], corrigees: [] as string[], environnement: "isolé (transaction annulée)", dureeMs: test.dureeMs };
  const [maj] = await db.update(repairs).set({ status: resultat.ok ? "tested" : "failed", testResult: resultat }).where(eq(repairs.id, reparationId)).returning();
  await journaliser({ acteur, action: "repair_test", cible: "repair", cibleId: reparationId, resultat: resultat.ok ? "ok" : "error", erreur: resultat.ok ? undefined : resultat.invariants[0], detail: { ...resultat } });
  return { ok: resultat.ok, detail: resultat.ok ? `Test isolé réussi : aucun invariant n'est cassé par la réparation${resultat.corrigees.length ? ` et ${resultat.corrigees.length} anomalie(s) disparaîtraient` : ""} (rien n'a été modifié).` : `Test isolé échoué : ${resultat.invariants.join(" ; ")}`, reparation: maj };
}

/** Applique une réparation testée, sur confirmation. Un invariant cassé annule tout. Le retour arrière reste possible. */
export async function appliquerReparation(reparationId: number, acteur: Acteur, confirme: boolean): Promise<ResultatReparation> {
  const db = dbFrontier();
  const [r] = await db.select().from(repairs).where(eq(repairs.id, reparationId)).limit(1);
  if (!r) return { ok: false, detail: "Réparation inconnue." };
  if (r.status !== "tested") {
    await journaliser({ acteur, action: "repair_apply", cible: "repair", cibleId: reparationId, resultat: "refused", erreur: "NON_TESTEE" });
    return { ok: false, detail: "Seule une réparation testée avec succès dans l'environnement isolé peut être appliquée.", reparation: r };
  }
  if (!confirme) {
    await journaliser({ acteur, action: "repair_apply", cible: "repair", cibleId: reparationId, resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
    return { ok: false, detail: "Appliquer une réparation est une action critique : confirmation requise.", reparation: r };
  }
  const droit = await droitAccorde(r.ownerKind, r.ownerCode);
  if (!droit.ok) return { ok: false, detail: droit.note, reparation: r };
  const op = r.proposedChange as unknown as OperationReparation;
  const prep = await envoyerBus({ de: "center:pipeline", vers: PAIRE_ATELIER.commande, type: "commande.preparer", contenu: { op } });
  if (!prep.ok) return { ok: false, detail: `Moteur de commande de l'atelier indisponible (${prep.issue}) : réparation non appliquée.`, reparation: r };
  const app = await envoyerBus<{ avant: EtatAvant; cree: Record<string, unknown> }>({ de: "center:pipeline", vers: PAIRE_ATELIER.commande, type: "commande.appliquer", contenu: { op } }, { delaiMs: 5000 });
  if (!app.ok) {
    const [maj] = await db.update(repairs).set({ status: "failed", testResult: { ...(r.testResult ?? {}), applicationEchouee: app.erreur ?? app.issue } }).where(eq(repairs.id, reparationId)).returning();
    await journaliser({ acteur, action: "repair_apply", cible: "repair", cibleId: reparationId, resultat: "error", erreur: app.erreur ?? app.issue });
    return { ok: false, detail: `Application annulée (rien n'a été modifié) : ${app.erreur ?? app.issue}`, reparation: maj };
  }
  const [maj] = await db.update(repairs).set({ status: "applied", appliedAt: new Date(), rollback: { op, avant: app.contenu!.avant, cree: app.contenu!.cree } }).where(eq(repairs.id, reparationId)).returning();
  await db.update(incidents).set({ status: "repairing" }).where(and(eq(incidents.id, r.incidentId), inArray(incidents.status, ["open", "diagnosed"])));
  await revaliderLignes();
  await journaliser({ acteur, action: "repair_apply", cible: "repair", cibleId: reparationId, resultat: "ok", detail: { op: op.op } });
  return { ok: true, detail: "Réparation appliquée. Le retour arrière est préparé ; relancez le diagnostic pour constater que l'anomalie a disparu.", reparation: maj };
}

/** Retour arrière exact : restaure la version avant l'intervention. */
export async function annulerReparation(reparationId: number, acteur: Acteur, confirme: boolean): Promise<ResultatReparation> {
  const db = dbFrontier();
  const [r] = await db.select().from(repairs).where(eq(repairs.id, reparationId)).limit(1);
  if (!r) return { ok: false, detail: "Réparation inconnue." };
  if (r.status !== "applied" || !r.rollback) {
    await journaliser({ acteur, action: "repair_rollback", cible: "repair", cibleId: reparationId, resultat: "refused", erreur: "NON_APPLIQUEE" });
    return { ok: false, detail: "Seule une réparation appliquée peut être annulée.", reparation: r };
  }
  if (!confirme) {
    await journaliser({ acteur, action: "repair_rollback", cible: "repair", cibleId: reparationId, resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
    return { ok: false, detail: "Le retour arrière est une action critique : confirmation requise.", reparation: r };
  }
  const rb = r.rollback as { op: OperationReparation; avant: EtatAvant; cree: Record<string, unknown> };
  await db.transaction(async (tx) => annuler(tx, rb.op, rb.avant, rb.cree));
  const [maj] = await db.update(repairs).set({ status: "rolled_back", rolledBackAt: new Date() }).where(eq(repairs.id, reparationId)).returning();
  await db.update(incidents).set({ status: "diagnosed" }).where(and(eq(incidents.id, r.incidentId), eq(incidents.status, "repairing")));
  await revaliderLignes();
  await journaliser({ acteur, action: "repair_rollback", cible: "repair", cibleId: reparationId, resultat: "ok", detail: { op: rb.op.op } });
  return { ok: true, detail: "Retour arrière effectué : la version avant l'intervention est restaurée.", reparation: maj };
}

/** Clôt un incident dont l'anomalie a disparu (constat du diagnostic), ou à la main avec une raison. */
export async function cloreIncident(incidentId: number, acteur: Acteur, raison: string): Promise<{ ok: boolean; detail: string }> {
  const [m] = await dbFrontier().update(incidents).set({ status: "closed", closedAt: new Date() }).where(and(eq(incidents.id, incidentId), inArray(incidents.status, ["open", "diagnosed", "repairing", "resolved"]))).returning({ id: incidents.id });
  if (!m) return { ok: false, detail: "Incident inconnu ou déjà clos." };
  await journaliser({ acteur, action: "incident_close", cible: "incident", cibleId: incidentId, resultat: "ok", detail: { raison: raison.slice(0, 200) } });
  return { ok: true, detail: "Incident clos." };
}

export async function incidentsOuverts(limite = 100, base: BaseFrontier = dbFrontier()) {
  return base.select().from(incidents).where(inArray(incidents.status, ["open", "diagnosed", "repairing"])).orderBy(sql`${incidents.openedAt} desc`).limit(limite);
}
