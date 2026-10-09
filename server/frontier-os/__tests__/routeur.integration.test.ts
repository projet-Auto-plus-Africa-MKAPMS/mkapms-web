/**
 * Routeur du centre : réservé au PDG (toute procédure sauf « meta »), vues complètes, commandes avec confirmation, mesures honnêtes
 * (« non mesuré » sans source, aucune température), banc d'essai de capacité, journal et secrets (références seulement).
 */
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { eq } from "drizzle-orm";
import { dbFrontier } from "../base/connexion.js";
import { measurements } from "../base/schema.js";
import { oublierDemarragePourTests, demarrerCentre } from "../demarrage-centre.js";
import { baseNeuve, fermer, remiseAZero, urlDeTest } from "./utilitaires.js";
import { MOTEURS_INTERNES } from "../moteurs-internes.js";

let r: typeof import("../index.js");
const appelant = (user: { uid: number; role: string; email: string } | null) => r.frontierOsRouter.createCaller({ req: {} as never, res: {} as never, user });
const pdg = () => appelant({ uid: 1, role: "super_admin", email: "pdg@exemple.test" });

before(async () => {
  process.env.DATABASE_URL = urlDeTest();
  await baseNeuve();
  r = await import("../index.js");
  oublierDemarragePourTests();
  await demarrerCentre();
});
after(async () => {
  await fermer();
  (await import("../../db.js")).pool.end().catch(() => undefined);
});
beforeEach(remiseAZero);

test("réservé au PDG : un administrateur ordinaire et un visiteur sont refusés sur TOUTE procédure (hors « meta »)", async () => {
  const noms = Object.keys(r.frontierOsRouter._def.procedures);
  assert.ok(noms.length >= 40, `${noms.length} procédures`);
  for (const user of [null, { uid: 2, role: "admin", email: "admin@exemple.test" }, { uid: 3, role: "particulier", email: "p@exemple.test" }]) {
    const c = appelant(user) as unknown as Record<string, (i?: unknown) => Promise<unknown>>;
    for (const nom of noms.filter((x) => x !== "meta")) {
      await assert.rejects(c[nom]!({}), /Accès PDG requis|FORBIDDEN|UNAUTHORIZED/, `${nom} (${user?.role ?? "anonyme"})`);
    }
  }
  assert.equal((await appelant(null).meta()).name, "frontier_os");
});

test("accueil : mode simulation, six aiguilles dont une température « non mesurée », comptes exacts", async () => {
  const a = await pdg().accueil();
  assert.equal(a.mode, "simulation");
  assert.equal(a.actionReelle, false);
  assert.equal(a.base.schema, "frontier");
  assert.equal(a.base.prete, true);
  assert.deepEqual(a.jauges.map((j) => j.cle), ["charge", "latence", "debit", "memoire", "erreurs", "temperature"]);
  const temp = a.jauges.find((j) => j.cle === "temperature")!;
  assert.equal(temp.valeur, null);
  assert.equal(temp.niveau, "inconnu");
  assert.match(temp.note, /non mesurée/);
  assert.equal(a.jauges.find((j) => j.cle === "debit")!.valeur, null, "aucun échange livré : le débit n'est pas inventé");
  assert.equal(a.lignes.reelles, 6);
  assert.equal(a.lignes.reserves, 50);
  assert.equal(a.lignes.valides, 3);
  assert.equal(a.lignes.connectees, 0);
  assert.equal(a.moteursInternes.total, MOTEURS_INTERNES.length);
  assert.equal(a.moteursInternes.enMarche, MOTEURS_INTERNES.length);
  assert.equal(a.moteursInventories.shop!.installe! + a.moteursInventories.shop!.teste! + a.moteursInventories.shop!.incomplet! + a.moteursInventories.shop!.prepare!, 83);
  assert.equal(a.moteursInventories.shop!.connecte ?? 0, 0);
  const noms = Object.fromEntries(a.alias.map((x) => [x.name, x.statut]));
  assert.equal(noms["MKH Shop"], "not_found");
  assert.equal(noms["MKPMS Shop"], "not_found");
  assert.equal(noms["boutique principale"], "not_found");
  assert.equal(a.plateformes.find((p) => p.code === "map")!.identityStatus, "to_verify");
});

test("lignes : sept éléments par ligne réelle avec leur paire, trois coupures, passage, réserves vides ; groupes", async () => {
  const lignes = await pdg().lignes({ groupe: "boutique" });
  assert.equal(lignes.length, 36);
  const reelle = lignes.find((l) => l.kind === "real" && l.intermediaire === "shop-documents-only")!;
  assert.equal(reelle.kind, "real");
  if (reelle.kind !== "real") return;
  assert.deepEqual(reelle.chaine.map((c) => c.rang), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(reelle.chaine.filter((c) => [2, 4, 6].includes(c.rang)).map((c) => c.paire?.commande), ["center:cmd.cut.remote", "center:cmd.cut.center", "center:cmd.cut.main"]);
  assert.ok(reelle.chaine.every((c) => c.paire && c.paire.commande !== c.paire.verification));
  assert.equal(reelle.coupures.length, 3);
  assert.equal(reelle.passage.autorise, false);
  assert.equal(reelle.etat, "unknown");
  const reserves = lignes.filter((l) => l.kind === "reserve");
  assert.equal(reserves.length, 30);
  assert.ok(reserves.every((l) => l.label === "À venir" && !l.enabled && l.chaine.length === 0));
  const g = await pdg().groupes();
  assert.deepEqual(g.map((x) => x.code), ["boutique", "map", "ia-alhoudoud", "bijoux", "futures"]);
  assert.equal(g[0]!.reelles, 6);
  assert.equal(g[0]!.reserves, 30);
  assert.equal(g[0]!.valides, 3);
  assert.equal(g[1]!.reserves, 5);
});

test("commandes par le routeur : confirmation obligatoire, résultat observé affiché, journal et commandes traçables", async () => {
  const c = pdg();
  const lignes = await c.lignes({ groupe: "boutique" });
  const l = lignes.find((x) => x.kind === "real" && x.intermediaire === "service-access")!;
  const sans = await c.ligne({ ligneId: l.id, voulu: "activate", confirme: false });
  assert.equal(sans.code, "CONFIRMATION_REQUISE");
  const ok = await c.ligne({ ligneId: l.id, voulu: "activate", confirme: true });
  assert.equal(ok.ok, true, ok.detail);
  const apres = (await c.lignes({ groupe: "boutique" })).find((x) => x.id === l.id)!;
  assert.equal(apres.kind === "real" && apres.etat, "connected");
  assert.equal(apres.kind === "real" && apres.passage.autorise, true);
  const echange = await c.echangeEssai({ ligneId: l.id });
  assert.equal(echange.livre, true);
  const detail = await c.commande({ id: ok.commandeId! });
  assert.ok(detail && detail.recus.length >= 4 && detail.enfants.length === 3);
  const groupe = await c.groupe({ groupe: "boutique", voulu: "deactivate", confirme: true });
  assert.equal(groupe.statut, "confirmed");
  const general = await c.general({ voulu: "activate", confirme: true });
  assert.equal(general.statut, "confirmed");
  assert.equal(general.ecartees!.length, 3);
  assert.equal((await c.general({ voulu: "deactivate", confirme: true })).statut, "confirmed");
  const audit = await c.audit({ limite: 20 });
  assert.ok(audit.some((a) => a.action === "general_deactivate" && a.result === "ok"));
  const cmds = await c.commandes();
  assert.ok(cmds.length >= 4 && cmds.every((x) => x.parentId === null));
});

test("moteurs : filtres par plateforme et état, détail avec versions, liaisons et accusés ; moteur interne avec entrées, sorties, arrêt", async () => {
  const c = pdg();
  const boutique = await c.moteurs({ plateforme: "shop", kind: "real", limite: 1000 });
  assert.equal(boutique.length, 83);
  const declares = await c.moteurs({ plateforme: "shop", kind: "real", declareSeulement: true, limite: 1000 });
  assert.ok(declares.length > 0 && declares.length < 83);
  assert.ok(declares.every((m) => m.preuve === "declare"));
  const inc = await c.moteurs({ plateforme: "shop", etat: "incomplet", limite: 1000 });
  assert.ok(inc.every((m) => m.etat === "incomplet"));
  assert.ok((await c.moteurs({ q: "payment", limite: 50 })).length >= 3);
  const d = await c.moteur({ code: "shop:documents" });
  assert.ok(d);
  assert.equal(d!.moteur.platformCode, "shop");
  assert.ok(d!.versions.length >= 1 && /^[0-9a-f]{40}$/.test(d!.versions[0]!.sourceCommit));
  assert.ok(d!.liaisonsCommeCible.length >= 1);
  assert.ok(d!.definitionEtat);
  const interne = await c.moteur({ code: "center:ver.cut.center" });
  assert.ok(interne!.specInterne && interne!.specInterne.arret.length > 20);
  assert.ok(interne!.liaisonsCommeMoteur.total >= 1);
  assert.equal(await c.moteur({ code: "inconnu:x" }), null);
  const salle = await c.salleBoutique({ plateforme: "shop" });
  assert.equal(salle!.intermediaires.length, 6);
  assert.equal(salle!.audit!.planComplet, false);
  assert.equal(salle!.inventaire!.commit.length, 40);
  const inv = await c.inventaire();
  assert.equal(inv.boutique.total, 83);
  assert.equal(inv.boutique.parEtat.connecte, 0);
  assert.equal(inv.boutique.intermediaires.length, 6);
});

test("mesures : latence mesurée par le bus après des commandes, mémoire et charge échantillonnées, banc d'essai honnête", async () => {
  const c = pdg();
  assert.equal(Number((await dbFrontier().execute(`SELECT count(*)::int n FROM frontier.measurements WHERE metric = 'latency_ms'`)).rows[0]!.n), 0);
  const avant = await c.mesures();
  assert.equal(avant.jauges.find((j) => j.cle === "latence")!.valeur, null, "pas de mesure = non mesurée");
  const lignes = await c.lignes({ groupe: "boutique" });
  await c.ligne({ ligneId: lignes.find((x) => x.kind === "real" && x.intermediaire === "shop-documents-only")!.id, voulu: "activate", confirme: true });
  const b = await c.mesurer();
  assert.ok(b.seul > 0 && b.parallele > 0 && Number.isFinite(b.facteur));
  assert.match(b.note, /ne prouve PAS une redondance/);
  const apres = await c.mesures();
  const lat = apres.jauges.find((j) => j.cle === "latence")!;
  assert.ok(lat.valeur !== null && lat.valeur >= 0);
  assert.equal(lat.source, "messages du bus interne");
  const mem = apres.jauges.find((j) => j.cle === "memoire")!;
  assert.ok(mem.valeur !== null && mem.valeur > 10);
  assert.equal(apres.jauges.find((j) => j.cle === "temperature")!.valeur, null);
  const cap = apres.capacites.filter((x) => x.metric === "capacity_factor");
  assert.ok(cap.length >= 12);
  assert.ok(cap.every((x) => x.declaredValue === null && x.measuredValue !== null && x.method.includes("même processus")), "aucune capacité doublée n'est annoncée");
  const fausses = await dbFrontier().select().from(measurements).where(eq(measurements.metric, "cpu_load"));
  assert.ok(fausses.every((m) => Number.isFinite(m.value)));
});

test("sécurité : secrets en références seulement, moteurs internes avec mécanisme d'arrêt, accès actuels, voies existantes dont une NON gouvernée", async () => {
  const s = await pdg().securite();
  assert.ok(s.secrets.length >= 3);
  for (const x of s.secrets) assert.ok(/^[A-Z][A-Z0-9_]{2,63}$|^vault:|^none$/.test(x.ref), x.ref);
  assert.ok(!JSON.stringify(s).match(/shopsvc_[A-Za-z0-9_-]{30,}|sk_live|sk-[A-Za-z0-9]{20}/), "aucune valeur de secret dans la vitrine");
  assert.equal(s.moteursInternes.length, MOTEURS_INTERNES.length);
  assert.ok(s.moteursInternes.every((m) => m.arret.length > 20 && m.fonction.length > 20 && m.entrees.length > 5 && m.sorties.length > 5));
  assert.deepEqual(s.acces.filter((a) => a.status === "active").map((a) => a.subjectKind), ["pdg"]);
  assert.ok(s.api.every((a) => a.status === "inactive"));
  const nonGouvernees = s.voies.filter((v) => !v.gouvernee);
  assert.equal(nonGouvernees.length, 2);
  assert.ok(s.voies.filter((v) => v.gouvernee).length >= 3);
});

test("arrêt d'un moteur interne : confirmation, effet sur les lignes (invalides), redémarrage et santé mesurée", async () => {
  const c = pdg();
  const sans = await c.moteurArreter({ code: "center:cmd.cut.center", confirme: false });
  assert.equal(sans.ok, false);
  assert.equal((await c.moteurArreter({ code: "shop:documents", confirme: true })).ok, false, "seuls les moteurs internes");
  assert.equal((await c.moteurArreter({ code: "center:cmd.cut.center", confirme: true })).ok, true);
  const apres = await c.groupes();
  assert.equal(apres[0]!.valides, 0, "sans son actionneur central, plus aucune ligne n'est valide");
  const blocage = await c.general({ voulu: "activate", confirme: true });
  assert.equal(blocage.statut, "blocked");
  assert.equal((await c.moteurDemarrer({ code: "center:cmd.cut.center", confirme: true })).ok, true);
  assert.equal((await c.groupes())[0]!.valides, 3);
  const sante = await c.sante();
  assert.ok(sante.every((m) => m.sante === "ok"), JSON.stringify(sante.filter((m) => m.sante !== "ok")));
});

test("atelier, incidents, sessions, mémoire, employés, futures : vues complètes", async () => {
  const c = pdg();
  const a = await c.atelier();
  assert.equal(a.invariants.ok, true);
  const p = await c.protocole({ ligneId: (await c.lignes({ groupe: "boutique" })).find((x) => x.kind === "real" && x.intermediaire === "service-access")!.id, type: "coupures" });
  assert.equal(p.ok, true);
  const s = await c.sessions();
  assert.equal(s[0]!.status, "passed");
  assert.equal(s[0]!.etapes.length, p.etapes.length);
  const m = await c.memoire();
  assert.ok(m.blocs.filter((b) => b.kind === "regle").length >= 9);
  assert.ok(m.historique.some((h) => h.entityId === "mode"));
  const e = await c.employes();
  assert.match(e.note, /seul le PDG/);
  const f = await c.futures();
  assert.deepEqual(f.groupes.map((g) => g.code), ["map", "ia-alhoudoud", "bijoux", "futures"]);
  assert.ok(f.souscriptions.every((x) => ["prepared", "inactive"].includes(x.status)));
  const ajout = await c.ajouterGroupe({ code: "joaillerie-2", nom: "Joaillerie 2", plateforme: null });
  assert.equal(ajout.ok, true);
  assert.equal((await c.ajouterGroupe({ code: "joaillerie-2", nom: "Joaillerie 2", plateforme: null })).ok, false);
  assert.equal((await c.groupes()).find((g) => g.code === "joaillerie-2")!.reserves, 5);
  const salles = await c.salles();
  assert.equal(salles.length, 10);
});

test("base : l'état de la base indépendante est lisible", async () => {
  const b = await pdg().base();
  assert.equal(b.prete, true);
  assert.equal(b.schema, "frontier");
  assert.ok(b.migrations && b.migrations.dejaAppliquees.length + b.migrations.appliquees.length === 2);
});
