/**
 * Atelier de réparation : diagnostic, proposition, test dans l'environnement isolé (transaction annulée), application sur confirmation,
 * retour arrière exact, droits d'intervention, invariants.
 */
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { and, count, eq } from "drizzle-orm";
import { dbFrontier } from "../base/connexion.js";
import { accessGrants, cuts, engines, gates, incidents, lines, repairs } from "../base/schema.js";
import { appliquerReparation, annulerReparation, droitAccorde, lancerDiagnostic, proposerReparation, testerReparation, verifierInvariants } from "../atelier.js";
import { PDG, baseNeuve, fermer, ligneDe, remiseAZero } from "./utilitaires.js";

before(baseNeuve);
after(fermer);
beforeEach(async () => {
  await remiseAZero();
  await dbFrontier().delete(accessGrants).where(eq(accessGrants.scope, "repair:platform:shop"));
});

const incidentDe = (a: Awaited<ReturnType<typeof lancerDiagnostic>>, kind: string) => a.anomalies.find((x) => x.kind === kind)!;

test("diagnostic au repos : aucune anomalie réparable, trois lignes non validées signalées à l'humain, invariants respectés", async () => {
  const d = await lancerDiagnostic(PDG);
  assert.equal(d.invariants.ok, true, d.invariants.violations.join(" ; "));
  assert.deepEqual([...new Set(d.anomalies.map((a) => a.kind))], ["ligne_invalide"]);
  assert.equal(d.anomalies.length, 3);
  assert.ok(d.anomalies.every((a) => a.operation === null && a.incidentId === null), "aucune réparation automatique ni incident pour une ligne non validée");
});

test("moteur arrêté : proposé → testé en environnement isolé (RIEN n'est modifié) → refusé sans confirmation → appliqué → retour arrière exact", async () => {
  await dbFrontier().update(engines).set({ running: false, health: "stopped" }).where(eq(engines.code, "center:ver.cut.main"));
  const d = await lancerDiagnostic(PDG);
  const a = incidentDe(d, "moteur_arrete");
  assert.deepEqual(a.operation, { op: "restart_engine", code: "center:ver.cut.main" });
  const p = await proposerReparation(a.incidentId!, PDG);
  assert.equal(p.ok, true, p.detail);
  const rep = p.reparation!;
  assert.equal(rep.status, "proposed");
  assert.deepEqual(rep.versionBefore, { moteur: { code: "center:ver.cut.main", running: false, health: "stopped" } });

  const refusee = await appliquerReparation(rep.id, PDG, true);
  assert.equal(refusee.ok, false, "pas d'application sans test");
  assert.match(refusee.detail, /testée/);

  const t = await testerReparation(rep.id, PDG);
  assert.equal(t.ok, true, t.detail);
  assert.equal(t.reparation!.status, "tested");
  assert.equal((t.reparation!.testResult as { environnement: string }).environnement, "isolé (transaction annulée)");
  const [m] = await dbFrontier().select().from(engines).where(eq(engines.code, "center:ver.cut.main"));
  assert.equal(m!.running, false, "le test isolé n'a rien modifié");

  const sans = await appliquerReparation(rep.id, PDG, false);
  assert.equal(sans.ok, false);
  assert.match(sans.detail, /confirmation/);
  const ok = await appliquerReparation(rep.id, PDG, true);
  assert.equal(ok.ok, true, ok.detail);
  assert.equal(ok.reparation!.status, "applied");
  assert.equal((await dbFrontier().select().from(engines).where(eq(engines.code, "center:ver.cut.main")))[0]!.running, true);
  assert.ok(ok.reparation!.rollback);

  const dejaFait = await annulerReparation(rep.id, PDG, false);
  assert.equal(dejaFait.ok, false);
  const rb = await annulerReparation(rep.id, PDG, true);
  assert.equal(rb.ok, true, rb.detail);
  assert.equal(rb.reparation!.status, "rolled_back");
  const [apres] = await dbFrontier().select().from(engines).where(eq(engines.code, "center:ver.cut.main"));
  assert.deepEqual([apres!.running, apres!.health], [false, "stopped"], "version avant l'intervention restaurée");
  assert.equal((await annulerReparation(rep.id, PDG, true)).ok, false, "un retour arrière ne se joue qu'une fois");
});

test("coupure en erreur avec porte restée ouverte : la réparation referme la porte, ne rouvre jamais rien, et le retour arrière non plus", async () => {
  const id = await ligneDe("service-access");
  const [c] = await dbFrontier().select().from(cuts).where(and(eq(cuts.lineId, id), eq(cuts.side, "center")));
  await dbFrontier().update(cuts).set({ requested: "deactivate", observed: "connected", progress: "failed", error: "contact bloqué" }).where(eq(cuts.id, c!.id));
  await dbFrontier().update(gates).set({ open: true }).where(eq(gates.cutId, c!.id));
  const inv0 = await verifierInvariants();
  assert.equal(inv0.ok, false, "une porte ouverte derrière une demande de coupure en échec est un invariant violé");
  const d = await lancerDiagnostic(PDG);
  const a = incidentDe(d, "coupure_en_erreur");
  assert.equal(a.coupureId, c!.id);
  const p = (await proposerReparation(a.incidentId!, PDG)).reparation!;
  const t = await testerReparation(p.id, PDG);
  assert.equal(t.ok, true, t.detail);
  assert.ok(((t.reparation!.testResult as { corrigees: string[] }).corrigees).length >= 1, "le test montre l'anomalie qui disparaîtrait");
  assert.equal((await dbFrontier().select().from(gates).where(eq(gates.cutId, c!.id)))[0]!.open, true, "le test isolé n'a pas touché la porte");
  assert.equal((await appliquerReparation(p.id, PDG, true)).ok, true);
  assert.equal((await dbFrontier().select().from(gates).where(eq(gates.cutId, c!.id)))[0]!.open, false);
  assert.equal((await verifierInvariants()).ok, true);
  assert.equal((await annulerReparation(p.id, PDG, true)).ok, true);
  assert.equal((await dbFrontier().select().from(gates).where(eq(gates.cutId, c!.id)))[0]!.open, false, "le retour arrière ne rouvre pas la porte");
});

test("réserve entamée : complétée par la réparation, retour arrière = suppression des seules lignes ajoutées", async () => {
  await dbFrontier().delete(lines).where(and(eq(lines.groupCode, "futures"), eq(lines.kind, "reserve"), eq(lines.position, 4)));
  await dbFrontier().delete(lines).where(and(eq(lines.groupCode, "futures"), eq(lines.kind, "reserve"), eq(lines.position, 5)));
  const d = await lancerDiagnostic(PDG);
  const a = incidentDe(d, "reserve_entamee");
  assert.deepEqual(a.operation, { op: "complete_reserves" });
  const p = (await proposerReparation(a.incidentId!, PDG)).reparation!;
  assert.equal((await testerReparation(p.id, PDG)).ok, true);
  const n = async () => Number((await dbFrontier().select({ n: count() }).from(lines).where(and(eq(lines.groupCode, "futures"), eq(lines.kind, "reserve"))))[0]!.n);
  assert.equal(await n(), 3, "le test isolé n'a rien ajouté");
  assert.equal((await appliquerReparation(p.id, PDG, true)).ok, true);
  assert.equal(await n(), 5);
  assert.equal((await verifierInvariants()).ok, true);
  assert.equal((await annulerReparation(p.id, PDG, true)).ok, true);
  assert.equal(await n(), 3, "retour arrière exact");
  const reelles = Number((await dbFrontier().select({ n: count() }).from(lines).where(eq(lines.kind, "real")))[0]!.n);
  assert.equal(reelles, 6, "aucune ligne réelle n'a été touchée");
});

test("liaison manquante : recréée par la réparation (jamais une paire existante modifiée)", async () => {
  await dbFrontier().execute(`DELETE FROM frontier.engine_bindings WHERE target_kind = 'group' AND target_code = 'group:map'`);
  await dbFrontier().execute(`DELETE FROM frontier.engine_bindings WHERE target_kind = 'general'`);
  const avant = Number((await dbFrontier().execute(`SELECT count(*)::int n FROM frontier.engine_bindings`)).rows[0]!.n);
  const d = await lancerDiagnostic(PDG);
  const a = incidentDe(d, "liaison_manquante");
  assert.deepEqual(a.operation, { op: "rebuild_bindings" });
  const inc = { id: a.incidentId! };
  const p = (await proposerReparation(inc!.id, PDG)).reparation!;
  assert.equal((await testerReparation(p.id, PDG)).ok, true);
  assert.equal(Number((await dbFrontier().execute(`SELECT count(*)::int n FROM frontier.engine_bindings`)).rows[0]!.n), avant, "test isolé : rien recréé");
  assert.equal((await appliquerReparation(p.id, PDG, true)).ok, true);
  assert.equal(Number((await dbFrontier().execute(`SELECT count(*)::int n FROM frontier.engine_bindings`)).rows[0]!.n), avant + 2);
  assert.equal((await annulerReparation(p.id, PDG, true)).ok, true);
  assert.equal(Number((await dbFrontier().execute(`SELECT count(*)::int n FROM frontier.engine_bindings`)).rows[0]!.n), avant);
  await dbFrontier().execute(`INSERT INTO frontier.engine_bindings (target_kind, target_code, command_engine, verification_engine) VALUES ('group', 'group:map', 'center:cmd.group', 'center:ver.group'), ('general', 'general', 'center:cmd.general', 'center:ver.general')`);
});

test("droits : le centre répare ses données ; une plateforme réelle exige un droit actif accordé, sinon refus motivé", async () => {
  assert.equal((await droitAccorde("center", "center")).ok, true);
  const refus = await droitAccorde("platform", "shop");
  assert.equal(refus.ok, false);
  assert.match(refus.note, /Aucun droit actif/);
  const [inc] = await dbFrontier().insert(incidents).values({ severity: "warning", kind: "anomalie:reserve_entamee", summary: "chez la Boutique", ownerKind: "platform", ownerCode: "shop", detail: { operation: { op: "complete_reserves" } } }).returning();
  const p = await proposerReparation(inc!.id, PDG);
  assert.equal(p.ok, false);
  assert.match(p.detail, /Aucun droit actif/);
  await dbFrontier().insert(accessGrants).values({ subjectKind: "engine", subjectRef: "center:cmd.workshop", scope: "repair:platform:shop", level: 3, status: "active", grantedBy: "essai" });
  const ok = await proposerReparation(inc!.id, PDG);
  assert.equal(ok.ok, true, ok.detail);
  await dbFrontier().delete(accessGrants).where(eq(accessGrants.scope, "repair:platform:shop"));
});

test("incident sans réparation automatique : refus clair ; une réparation non testée ne s'applique pas ; échec du test = pas d'application", async () => {
  const [inc] = await dbFrontier().insert(incidents).values({ severity: "info", kind: "anomalie:ligne_invalide", summary: "x", detail: { operation: null } }).returning();
  const r = await proposerReparation(inc!.id, PDG);
  assert.equal(r.ok, false);
  assert.match(r.detail, /intervention humaine/);
  assert.equal((await proposerReparation(99999, PDG)).ok, false);
  // Une opération sur un moteur inconnu ne casse rien et reste « testée » sans effet ; une opération impossible échoue au test.
  const [inc2] = await dbFrontier().insert(incidents).values({ severity: "warning", kind: "anomalie:essai", summary: "x", detail: { operation: { op: "reset_cut", coupureId: 999999 } } }).returning();
  const p = (await proposerReparation(inc2!.id, PDG)).reparation!;
  const t = await testerReparation(p.id, PDG);
  assert.equal(t.ok, false);
  assert.equal(t.reparation!.status, "failed");
  assert.equal((await appliquerReparation(p.id, PDG, true)).ok, false);
  const [verif] = await dbFrontier().select({ n: count() }).from(repairs).where(eq(repairs.status, "applied"));
  assert.equal(Number(verif!.n), 0);
});
