/** Règles pures du centre : validité d'une ligne, admissibilité, décision de passage, état d'une ligne, règle des échanges en vol, jauges. */
import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTION_REELLE_ACTIVEE, CLE_ELEMENT_DE_COTE, ELEMENTS_CHAINE, MODE, ORDRE_ACTIVATION, ORDRE_DESACTIVATION, RESERVE_DE_DEPART, RESERVE_PAR_LIGNE_REELLE,
  combinerAvecCable, decisionPassage, etatContactGroupe, etatLigne, ligneAdmissible, niveauJauge, regleEnVol, reservesAAjouter, validerLigne,
  type Chaine, type CoupureLite, type LigneLite, type MoteurLite,
} from "../regles.js";

const chaineComplete: Chaine = { remoteRealEngine: "r1", remoteSwitch: "s1", remoteIntermediary: "i1", centerContact: "c", mainIntermediary: "i2", mainSwitch: "s2", mainRealEngine: "r2" };
const mot = (code: string, p: Partial<MoteurLite> = {}): MoteurLite => ({ code, kind: "real", running: true, health: "ok", inventoryState: "installe", ...p });
const tous = (p: Partial<Record<string, Partial<MoteurLite>>> = {}) => new Map(Object.values(chaineComplete).map((c) => [c!, mot(c!, p[c!])]));
const toutesLiaisons = new Set(Object.values(chaineComplete) as string[]);

test("constantes : simulation seulement, cinq réserves par ligne réelle", () => {
  assert.equal(MODE, "simulation");
  assert.equal(ACTION_REELLE_ACTIVEE, false);
  assert.equal(RESERVE_PAR_LIGNE_REELLE, 5);
  assert.equal(RESERVE_DE_DEPART, 5);
});

test("la chaîne a sept éléments ordonnés ; les trois coupures sont distinctes ; ordre d'activation et de coupure", () => {
  assert.deepEqual(ELEMENTS_CHAINE.map((e) => e.rang), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(ELEMENTS_CHAINE.filter((e) => [2, 4, 6].includes(e.rang)).map((e) => e.cote), ["remote", "center", "main"]);
  assert.deepEqual(Object.values(CLE_ELEMENT_DE_COTE), ["remoteSwitch", "centerContact", "mainSwitch"]);
  assert.deepEqual(ORDRE_ACTIVATION, ["remote", "main", "center"]);
  assert.deepEqual(ORDRE_DESACTIVATION, ["center", "remote", "main"]);
});

test("validité : sept éléments présents, moteurs réels non « incomplet », éléments du centre en marche, paires valides", () => {
  assert.deepEqual(validerLigne({ kind: "real", elements: chaineComplete, moteurs: tous(), liaisonsValides: toutesLiaisons }), { valide: true, raisons: [] });
  const sans = validerLigne({ kind: "real", elements: { ...chaineComplete, mainIntermediary: null }, moteurs: tous(), liaisonsValides: toutesLiaisons });
  assert.equal(sans.valide, false);
  assert.match(sans.raisons[0]!, /Élément 5 absent/);
  const incomplet = validerLigne({ kind: "real", elements: chaineComplete, moteurs: tous({ i1: { inventoryState: "incomplet" } }), liaisonsValides: toutesLiaisons });
  assert.match(incomplet.raisons[0]!, /Élément 3.*incomplet/);
  const averifier = validerLigne({ kind: "real", elements: chaineComplete, moteurs: tous({ r1: { inventoryState: "a_verifier" } }), liaisonsValides: toutesLiaisons });
  assert.match(averifier.raisons[0]!, /à vérifier/);
  const arrete = validerLigne({ kind: "real", elements: chaineComplete, moteurs: tous({ c: { running: false } }), liaisonsValides: toutesLiaisons });
  assert.match(arrete.raisons[0]!, /Élément 4.*arrêté/);
  const sansPaire = validerLigne({ kind: "real", elements: chaineComplete, moteurs: tous(), liaisonsValides: new Set(["r1", "i1", "c", "i2", "s2", "r2"]) });
  assert.match(sansPaire.raisons[0]!, /Élément 2 sans paire/);
  const inconnu = validerLigne({ kind: "real", elements: chaineComplete, moteurs: new Map(), liaisonsValides: toutesLiaisons });
  assert.equal(inconnu.raisons.length >= 7, true);
  // « préparé » suffit (simulation) ; une réserve n'est jamais valide.
  assert.equal(validerLigne({ kind: "real", elements: chaineComplete, moteurs: tous({ i1: { inventoryState: "prepare" } }), liaisonsValides: toutesLiaisons }).valide, true);
  assert.equal(validerLigne({ kind: "reserve", elements: chaineComplete, moteurs: tous(), liaisonsValides: toutesLiaisons }).valide, false);
});

const ligne = (p: Partial<LigneLite> = {}): LigneLite => ({ kind: "real", enabled: true, locked: false, validity: "valid", ...p });
const cp = (side: CoupureLite["side"], p: Partial<CoupureLite> = {}): CoupureLite => ({ side, requested: "activate", observed: "connected", progress: "confirmed", mode: "simulation", porteOuverte: true, ...p });
const trois = (p: Partial<CoupureLite> = {}) => (["remote", "center", "main"] as const).map((s) => cp(s, p));

test("admissibilité : vide, désactivée, verrouillée, non validée, en erreur, en cours — dans cet ordre", () => {
  assert.equal(ligneAdmissible(ligne(), trois()).ok, true);
  assert.equal(ligneAdmissible(ligne({ kind: "reserve" }), []).raison, "VIDE");
  assert.equal(ligneAdmissible(ligne({ enabled: false }), trois()).raison, "DESACTIVEE");
  assert.equal(ligneAdmissible(ligne({ locked: true }), trois()).raison, "VERROUILLEE");
  assert.equal(ligneAdmissible(ligne({ validity: "invalid" }), trois()).raison, "NON_VALIDEE");
  assert.equal(ligneAdmissible(ligne(), [cp("remote", { progress: "failed" }), cp("center"), cp("main")]).raison, "EN_ERREUR");
  assert.equal(ligneAdmissible(ligne(), [cp("remote", { progress: "in_progress" }), cp("center"), cp("main")]).raison, "EN_COURS");
});

test("passage : exige continuité ET permission confirmée sur les TROIS coupures", () => {
  assert.deepEqual(decisionPassage(ligne(), trois()), { autorise: true });
  for (const side of ["remote", "center", "main"] as const) {
    const sans = (p: Partial<CoupureLite>) => decisionPassage(ligne(), (["remote", "center", "main"] as const).map((s) => cp(s, s === side ? p : {})));
    assert.equal(sans({ porteOuverte: false }).raison, "CONTACT_OUVERT");
    assert.equal(sans({ requested: "deactivate" }).raison, "COUPURE_NON_DEMANDEE");
    assert.equal(sans({ requested: "none" }).raison, "COUPURE_NON_DEMANDEE");
    assert.equal(sans({ progress: "in_progress", observed: "disconnected" }).raison, "COUPURE_NON_CONFIRMEE", "un contact qui approche ne laisse rien passer");
    assert.equal(sans({ progress: "pending" }).raison, "COUPURE_NON_CONFIRMEE");
    assert.equal(sans({ observed: "unknown" }).raison, "COUPURE_NON_CONFIRMEE");
    assert.equal(sans({ progress: "failed" }).raison, "COUPURE_NON_CONFIRMEE");
    assert.equal(sans({ requested: "deactivate" }).coupure, side, "la coupure qui refuse est nommée");
  }
  assert.equal(decisionPassage(ligne({ locked: true }), trois()).raison, "LIGNE_VERROUILLEE");
  assert.equal(decisionPassage(ligne({ enabled: false }), trois()).raison, "LIGNE_DESACTIVEE");
  assert.equal(decisionPassage(ligne({ validity: "invalid" }), trois()).raison, "LIGNE_NON_VALIDEE");
  assert.equal(decisionPassage(ligne({ kind: "reserve" }), []).raison, "LIGNE_VIDE");
  assert.equal(decisionPassage(ligne(), trois().slice(0, 2)).raison, "COUPURES_INCOMPLETES");
  assert.equal(decisionPassage(ligne(), trois({ mode: "real" })).raison, "MODE_REEL_NON_ACTIVE");
});

test("état d'une ligne : jamais « connectée » sur la foi d'une demande", () => {
  assert.equal(etatLigne(trois()), "connected");
  assert.equal(etatLigne(trois({ requested: "activate", observed: "unknown", progress: "pending" })), "transition");
  assert.equal(etatLigne([cp("remote", { progress: "failed" }), cp("center"), cp("main")]), "failed");
  assert.equal(etatLigne(trois({ requested: "deactivate", observed: "disconnected" })), "disconnected");
  assert.equal(etatLigne([cp("remote"), cp("center", { requested: "deactivate", observed: "disconnected" }), cp("main")]), "partial");
  assert.equal(etatLigne(trois({ requested: "none", observed: "unknown", progress: "idle" })), "unknown");
  assert.equal(etatLigne([cp("remote", { observed: "disconnected", requested: "deactivate" }), cp("center", { requested: "none", observed: "unknown", progress: "idle" }), cp("main", { requested: "none", observed: "unknown", progress: "idle" })]), "disconnected");
  assert.equal(etatLigne([]), "unknown");
  assert.equal(etatLigne(trois({ requested: "deactivate" })), "partial", "demande de coupure non confirmée par la sonde : pas « connectée »");
});

test("grand contact du groupe : résumé des contacts centraux", () => {
  assert.equal(etatContactGroupe([]), "unknown");
  assert.equal(etatContactGroupe([cp("center"), cp("center")]), "connected");
  assert.equal(etatContactGroupe([cp("center", { observed: "disconnected" }), cp("center", { observed: "disconnected" })]), "disconnected");
  assert.equal(etatContactGroupe([cp("center"), cp("center", { observed: "disconnected" })]), "partial");
  assert.equal(etatContactGroupe([cp("center", { observed: "unknown", progress: "idle" })]), "unknown");
});

test("réserves : cinq par ligne réelle, cinq au départ sans ligne réelle, jamais négatif", () => {
  assert.equal(reservesAAjouter(6, 30), 0);
  assert.equal(reservesAAjouter(6, 25), 5);
  assert.equal(reservesAAjouter(6, 0), 30);
  assert.equal(reservesAAjouter(0, 0), 5);
  assert.equal(reservesAAjouter(0, 3), 2);
  assert.equal(reservesAAjouter(1, 99), 0);
});

test("règle des échanges en vol : attente suspendue, message annulé, paiement transmis SUIVI (jamais annulé)", () => {
  assert.equal(regleEnVol("task", "queued"), "suspended");
  assert.equal(regleEnVol("payment_external", "queued"), "suspended");
  assert.equal(regleEnVol("message", "in_flight"), "cancelled");
  assert.equal(regleEnVol("task", "in_flight"), "cancelled");
  assert.equal(regleEnVol("probe", "in_flight"), "cancelled");
  assert.equal(regleEnVol("payment_external", "in_flight"), "tracked");
  for (const k of ["message", "task", "payment_external", "probe"] as const) for (const e of ["delivered", "refused", "cancelled", "tracked", "suspended", "failed"] as const) assert.equal(regleEnVol(k, e), e, "un échange terminé ne change pas");
});

test("jauges : vert seulement si une vérification a réussi ; absence de mesure = inconnu", () => {
  assert.equal(niveauJauge(null, true), "inconnu");
  assert.equal(niveauJauge(3, null), "inconnu");
  assert.equal(niveauJauge(3, false), "alerte");
  assert.equal(niveauJauge(3, true), "ok");
  assert.equal(niveauJauge(900, true, 500), "alerte");
});

test("gouvernance : le centre ne peut que RESTREINDRE le câble réel", () => {
  assert.equal(combinerAvecCable(true, "non_arme"), true);
  assert.equal(combinerAvecCable(true, true), true);
  assert.equal(combinerAvecCable(true, false), false);
  assert.equal(combinerAvecCable(false, true), false, "jamais ouvrir ce que le câble refuse");
  assert.equal(combinerAvecCable(false, "non_arme"), false);
});
