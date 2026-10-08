/**
 * Les trois coupures d'une ligne, le grand contact du groupe et l'interrupteur général : ordre demandé séparé du résultat observé,
 * deux moteurs distincts par commande, jamais de contournement d'une ligne verrouillée, en erreur, vide ou non validée.
 */
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { and, count, eq } from "drizzle-orm";
import { dbFrontier } from "../base/connexion.js";
import { commandReceipts, commands, cuts, exchanges, gates, incidents, lines } from "../base/schema.js";
import { chargerLigne } from "../chaine.js";
import { commanderCoupure, commanderGeneral, commanderGroupe, commanderLigne, definirLigneActivee, deverrouillerLigne, verrouillerLigne } from "../commandes.js";
import { etatLigne } from "../regles.js";
import { coupuresLite } from "../chaine.js";
import { envoyer } from "../transport.js";
import { PDG, baseNeuve, fermer, ligneDe, remiseAZero } from "./utilitaires.js";

const o = { acteur: PDG, confirme: true } as const;
const OK = ["shop-documents-only", "shop-intelligence-isolated", "service-access"] as const;
const NON_VALIDES = ["main-to-shop-entry", "shared-stripe-account", "shared-google-owner"] as const;

before(baseNeuve);
after(fermer);
// Chaque test repart d'un état neuf : toutes les coupures coupées, plus d'incident ni d'échange, aucune ligne verrouillée.
beforeEach(remiseAZero);

const cote = async (ligneId: number, side: "remote" | "center" | "main") => (await dbFrontier().select().from(cuts).where(and(eq(cuts.lineId, ligneId), eq(cuts.side, side))).limit(1))[0]!;
const etat = async (ligneId: number) => etatLigne(coupuresLite((await chargerLigne(ligneId))!.coupures));

test("une coupure : l'ordre est confirmé par la vérification, par DEUX moteurs distincts, avec un accusé à chaque phase", async () => {
  const id = await ligneDe("shop-documents-only");
  const c = await cote(id, "remote");
  const r = await commanderCoupure(c.id, "activate", o);
  assert.equal(r.ok, true, r.detail);
  assert.equal(r.statut, "confirmed");
  assert.equal(r.observe, "connected");
  const apres = await cote(id, "remote");
  assert.deepEqual([apres.requested, apres.observed, apres.progress, apres.mode], ["activate", "connected", "confirmed", "simulation"]);
  assert.ok(apres.lastCheckedAt && apres.lastProof);
  const [cmd] = await dbFrontier().select().from(commands).where(eq(commands.id, r.commandeId!));
  assert.notEqual(cmd!.commandEngine, cmd!.verificationEngine);
  assert.equal(cmd!.commandEngine, "center:cmd.cut.remote");
  assert.equal(cmd!.verificationEngine, "center:ver.cut.remote");
  const recus = await dbFrontier().select().from(commandReceipts).where(eq(commandReceipts.commandId, r.commandeId!)).orderBy(commandReceipts.id);
  assert.deepEqual(recus.map((x) => `${x.phase}/${x.role}/${x.engineCode}/${x.outcome}`), [
    "precheck/command/center:cmd.cut.remote/ok", "precheck/verification/center:ver.cut.remote/ok", "execute/command/center:cmd.cut.remote/ok", "postcheck/verification/center:ver.cut.remote/ok",
  ]);
  // Un seul côté connecté : rien ne passe encore (le contact central et l'autre côté sont coupés).
  const e = await envoyer({ ligneId: id, direction: "remote_to_main", kind: "message", payloadRef: "essai" });
  assert.equal(e.livre, false);
  assert.equal(e.refus?.raison, "COUPURE_NON_DEMANDEE");
  assert.equal(await etat(id), "partial");
});

test("une activation exige une confirmation ; sans elle rien n'est demandé ni changé", async () => {
  const id = await ligneDe("service-access");
  const c = await cote(id, "center");
  const r = await commanderCoupure(c.id, "activate", { acteur: PDG });
  assert.equal(r.ok, false);
  assert.equal(r.code, "CONFIRMATION_REQUISE");
  assert.equal(r.commandeId, null);
  assert.equal((await cote(id, "center")).requested, "none");
  // Couper ne demande pas de confirmation : c'est le sens sûr.
  const coupe = await commanderCoupure(c.id, "deactivate", { acteur: PDG });
  assert.equal(coupe.ok, true);
});

test("la ligne complète : trois coupures confirmées, la sonde de bout en bout traverse ; couper la ferme", async () => {
  const id = await ligneDe("shop-documents-only");
  const r = await commanderLigne(id, "activate", o);
  assert.equal(r.ok, true, r.detail);
  assert.equal(r.enfants?.length, 3);
  assert.deepEqual(r.enfants!.map((e) => e.demande), ["activate", "activate", "activate"]);
  // Ordre d'activation : les deux côtés locaux d'abord, le contact central en dernier.
  const ordre = (await dbFrontier().select({ id: commands.id, cible: commands.targetId }).from(commands).where(eq(commands.parentId, r.commandeId!)).orderBy(commands.id)).map((x) => Number(x.cible));
  const cotes = await Promise.all(ordre.map(async (cid) => (await dbFrontier().select().from(cuts).where(eq(cuts.id, cid)))[0]!.side));
  assert.deepEqual(cotes, ["remote", "main", "center"]);
  assert.equal(await etat(id), "connected");
  const e = await envoyer({ ligneId: id, direction: "remote_to_main", kind: "message", payloadRef: "doc:essai" });
  assert.equal(e.livre, true);
  assert.equal(e.echange.state, "delivered");

  const coupe = await commanderLigne(id, "deactivate", { acteur: PDG });
  assert.equal(coupe.ok, true, coupe.detail);
  const cotes2 = await Promise.all((await dbFrontier().select({ cible: commands.targetId }).from(commands).where(eq(commands.parentId, coupe.commandeId!)).orderBy(commands.id)).map(async (x) => (await dbFrontier().select().from(cuts).where(eq(cuts.id, Number(x.cible))))[0]!.side));
  assert.deepEqual(cotes2, ["center", "remote", "main"], "ordre de coupure : le centre d'abord");
  assert.equal(await etat(id), "disconnected");
  const refus = await envoyer({ ligneId: id, direction: "remote_to_main", kind: "message", payloadRef: "doc:essai-2" });
  assert.equal(refus.livre, false);
  assert.equal(refus.echange.state, "refused");
});

test("trois coupures indépendantes : couper une seule suffit à tout arrêter, et les deux autres restent connectées", async () => {
  const id = await ligneDe("shop-intelligence-isolated");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  for (const side of ["remote", "center", "main"] as const) {
    const c = await cote(id, side);
    assert.equal((await commanderCoupure(c.id, "deactivate", { acteur: PDG })).ok, true, side);
    const refuse = await envoyer({ ligneId: id, direction: "main_to_remote", kind: "message", payloadRef: `sans-${side}` });
    assert.equal(refuse.livre, false, `sans ${side} rien ne passe`);
    assert.equal(refuse.refus?.coupure, side);
    for (const autre of (["remote", "center", "main"] as const).filter((s) => s !== side)) assert.equal((await cote(id, autre)).observed, "connected", `${autre} reste connectée`);
    assert.equal((await commanderCoupure(c.id, "activate", o)).ok, true);
    assert.equal((await envoyer({ ligneId: id, direction: "main_to_remote", kind: "message", payloadRef: `avec-${side}` })).livre, true);
  }
});

test("une ligne non validée, ou désactivée, ne s'active pas : refus motivé, aucun état changé", async () => {
  for (const cle of NON_VALIDES) {
    const id = await ligneDe(cle);
    const r = await commanderLigne(id, "activate", o);
    assert.equal(r.ok, false, cle);
    assert.equal(r.statut, "blocked");
    assert.equal(r.code, "CONDITION_REFUSEE");
    assert.match(r.detail, /NON_VALIDEE|non validée/);
    assert.equal(await etat(id), "unknown");
    const c = await cote(id, "center");
    const rc = await commanderCoupure(c.id, "activate", o);
    assert.equal(rc.ok, false);
    assert.match(rc.detail, /non validée|NON_VALIDEE/);
  }
  const id = await ligneDe("service-access");
  assert.equal((await definirLigneActivee(id, false, o)).ok, true);
  const r = await commanderLigne(id, "activate", o);
  assert.equal(r.ok, false);
  assert.match(r.detail, /désactivée|DESACTIVEE/);
});

test("verrou : la ligne est COUPÉE puis verrouillée ; le verrou refuse l'activation et le passage, jamais une coupure ; le déverrouillage ne rebranche rien", async () => {
  const id = await ligneDe("shop-documents-only");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  const v = await verrouillerLigne(id, o);
  assert.equal(v.ok, true);
  assert.equal(await etat(id), "disconnected");
  assert.equal((await chargerLigne(id))!.ligne.locked, true);
  const a = await commanderLigne(id, "activate", o);
  assert.equal(a.ok, false);
  assert.match(a.detail, /verrouill/i);
  const e = await envoyer({ ligneId: id, direction: "remote_to_main", kind: "message", payloadRef: "x" });
  assert.equal(e.refus?.raison, "LIGNE_VERROUILLEE");
  assert.equal((await commanderCoupure((await cote(id, "center")).id, "deactivate", { acteur: PDG })).ok, true, "couper reste permis sur une ligne verrouillée");
  assert.equal((await deverrouillerLigne(id, o)).ok, true);
  assert.equal(await etat(id), "disconnected", "déverrouiller ne rebranche rien");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
});

test("le grand contact du groupe commande les contacts CENTRAUX seulement ; les petits interrupteurs restent à part", async () => {
  const ids = await Promise.all(OK.map(ligneDe));
  const r = await commanderGroupe("boutique", "activate", o);
  assert.equal(r.ok, true, r.detail);
  assert.equal(r.enfants?.length, 3, "les trois lignes admissibles");
  assert.equal(r.ecartees?.length, 3, "les trois lignes non validées sont écartées avec leur raison");
  assert.ok(r.ecartees!.every((e) => e.raison === "NON_VALIDEE"));
  for (const id of ids) {
    assert.equal((await cote(id, "center")).observed, "connected");
    assert.equal((await cote(id, "remote")).observed, "unknown", "le petit interrupteur distant n'est pas touché");
    assert.equal((await cote(id, "main")).observed, "unknown");
    assert.equal(await etat(id), "partial");
    assert.equal((await envoyer({ ligneId: id, direction: "remote_to_main", kind: "message", payloadRef: "g" })).livre, false, "les côtés locaux sont coupés : rien ne passe");
  }
  const sans = await commanderGroupe("boutique", "activate", { acteur: PDG });
  assert.equal(sans.code, "CONFIRMATION_REQUISE");
  const coupe = await commanderGroupe("boutique", "deactivate", o);
  assert.equal(coupe.ok, true, coupe.detail);
  for (const id of ids) assert.equal((await cote(id, "center")).observed, "disconnected");
  // Un groupe sans ligne réelle : rien à commander, dit clairement.
  const vide = await commanderGroupe("map", "activate", o);
  assert.equal(vide.statut, "blocked");
  assert.equal(vide.code, "AUCUNE_LIGNE_ADMISSIBLE");
});

test("l'interrupteur général active toutes les lignes ADMISSIBLES et jamais une ligne verrouillée, en erreur, vide ou non validée", async () => {
  const [docs, etatId, service] = await Promise.all(OK.map(ligneDe));
  assert.equal((await verrouillerLigne(docs!, o)).ok, true);
  // Une ligne en erreur : une coupure en échec.
  await dbFrontier().update(cuts).set({ progress: "failed", error: "essai" }).where(eq(cuts.id, (await cote(service!, "main")).id));
  const r = await commanderGeneral("activate", o);
  assert.equal(r.statut, "confirmed", r.detail);
  assert.equal(r.enfants?.length, 1, "une seule ligne admissible : l'état technique");
  assert.equal(await etat(etatId!), "connected");
  assert.equal(await etat(docs!), "disconnected", "verrouillée : jamais contournée");
  assert.notEqual(await etat(service!), "connected", "en erreur : jamais contournée");
  const raisons = Object.fromEntries(r.ecartees!.map((e) => [e.ligneId, e.raison]));
  assert.equal(raisons[docs!], "VERROUILLEE");
  assert.equal(raisons[service!], "EN_ERREUR");
  for (const cle of NON_VALIDES) assert.equal(raisons[await ligneDe(cle)], "NON_VALIDEE");
  assert.equal(Object.keys(raisons).length, 5, "chaque ligne écartée est nommée avec sa raison");
});

test("l'interrupteur général : activation puis coupure de tout, résultat par ligne, confirmation obligatoire", async () => {
  const sans = await commanderGeneral("activate", { acteur: PDG });
  assert.equal(sans.code, "CONFIRMATION_REQUISE");
  const r = await commanderGeneral("activate", o);
  assert.equal(r.ok, true, r.detail);
  assert.equal(r.enfants?.length, 3);
  assert.ok(r.enfants!.every((e) => e.statut === "confirmed" && e.enfants?.length === 3));
  for (const cle of OK) assert.equal(await etat(await ligneDe(cle)), "connected");
  const coupe = await commanderGeneral("deactivate", o);
  assert.equal(coupe.ok, true, coupe.detail);
  assert.equal(coupe.enfants?.length, 6, "toute ligne réelle est coupée, validée ou non");
  for (const cle of OK) assert.equal(await etat(await ligneDe(cle)), "disconnected");
});

test("réserve : « À venir », jamais commandable ni activable, jamais comptée comme moteur installé", async () => {
  const [reserve] = await dbFrontier().select().from(lines).where(eq(lines.kind, "reserve")).limit(1);
  const r = await commanderLigne(reserve!.id, "activate", o);
  assert.equal(r.ok, false);
  assert.equal(r.code, "LIGNE_INCONNUE");
  const act = await definirLigneActivee(reserve!.id, true, o);
  assert.equal(act.ok, false);
  assert.match(act.detail, /réserve|vide/i);
  await assert.rejects(dbFrontier().update(lines).set({ enabled: true }).where(eq(lines.id, reserve!.id)), /check/i, "la base elle-même refuse d'activer une réserve");
  const [n] = await dbFrontier().select({ n: count() }).from(lines).where(and(eq(lines.kind, "reserve"), eq(lines.enabled, true)));
  assert.equal(Number(n!.n), 0);
});

test("mode réel : refusé partout, rien n'est écrit", async () => {
  const id = await ligneDe("shop-documents-only");
  const c = await cote(id, "center");
  for (const r of [await commanderCoupure(c.id, "activate", { ...o, mode: "real" }), await commanderLigne(id, "activate", { ...o, mode: "real" }), await commanderGroupe("boutique", "activate", { ...o, mode: "real" }), await commanderGeneral("activate", { ...o, mode: "real" })]) {
    assert.equal(r.ok, false);
    assert.equal(r.code, "MODE_REEL_NON_ACTIVE");
    assert.equal(r.commandeId, null);
  }
  assert.equal((await cote(id, "center")).requested, "none");
  assert.equal(Number((await dbFrontier().select({ n: count() }).from(gates).where(eq(gates.open, true)))[0]!.n), 0);
  assert.equal(Number((await dbFrontier().select({ n: count() }).from(exchanges))[0]!.n), 0);
  assert.equal(Number((await dbFrontier().select({ n: count() }).from(incidents))[0]!.n), 0);
});
