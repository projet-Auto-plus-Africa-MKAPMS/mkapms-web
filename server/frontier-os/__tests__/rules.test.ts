/**
 * Centre Cyber-Électrique — règles pures et inventaire de la Boutique (aucune base, aucun réseau).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { ENGINE_CATALOG } from "../../engine-registry/catalog.js";
import { CANAUX, CANAUX_IDS } from "../../shop-link/contrats.js";
import { INTERMEDIAIRES_BOUTIQUE, RESERVE_DE_DEPART, RESERVE_PAR_LIGNE_REELLE, SHOP_ENGINES, SHOP_SNAPSHOT } from "../shop-inventory.js";
import {
  ACTION_REELLE_ACTIVEE, MODE, etatCourantLigne, etatDepuisCable, etatDepuisRegistre, etatLigne, etatReelDepuisCable, interrupteurValide, jauges, moteurInterneUtilisable, reserveCible, validerLigne, validerPaire,
  type Comptes, type EngineLite, type EngineStatus,
} from "../rules.js";

let n = 0;
const moteur = (platformCode: string, status: EngineStatus = "active", extra: Partial<EngineLite> = {}): EngineLite => ({ id: ++n, platformCode, isRealEngine: true, isFuturePlaceholder: false, status, name: `m${n}`, ...extra });
const index = (...ms: EngineLite[]) => new Map(ms.map((m) => [m.id, m]));

test("sécurité : le centre est en simulation et aucune action réelle n'est activée", () => {
  assert.equal(MODE, "simulation");
  assert.equal(ACTION_REELLE_ACTIVEE, false);
});

test("inventaire Boutique : 83 moteurs sans doublon, six intermédiaires préparés, preuves et vis-à-vis cohérents", () => {
  assert.equal(SHOP_ENGINES.length, 83);
  assert.equal(new Set(SHOP_ENGINES.map((e) => e[0])).size, 83);
  assert.ok(SHOP_ENGINES.every(([id, libelle, domaine, niveau]) => id && libelle && domaine && ["required", "external", "internal"].includes(niveau)));
  assert.match(SHOP_SNAPSHOT.commit, /^[a-f0-9]{40}$/);
  assert.equal(INTERMEDIAIRES_BOUTIQUE.length, 6);
  assert.equal(new Set(INTERMEDIAIRES_BOUTIQUE.map((i) => i.id)).size, 6);
  const noms = new Set(ENGINE_CATALOG.map((e) => e.name));
  const registreBoutique = new Set(SHOP_ENGINES.map((e) => e[0]));
  for (const i of INTERMEDIAIRES_BOUTIQUE) {
    assert.ok(noms.has(i.moteurPlateforme), `moteur de la plateforme « ${i.moteurPlateforme} » existe au catalogue central`);
    assert.equal(registreBoutique.has(i.moteurBoutique), i.dansRegistreBoutique, `${i.id} : présence au registre de la Boutique correctement déclarée`);
    assert.ok(i.preuve.length > 5);
    if (i.canalPlateforme) assert.ok((CANAUX_IDS as readonly string[]).includes(i.canalPlateforme));
  }
  // Les deux moteurs nommés par un contrat mais absents du registre de la Boutique sont signalés, pas cachés.
  assert.deepEqual(INTERMEDIAIRES_BOUTIQUE.filter((i) => !i.dansRegistreBoutique).map((i) => i.moteurBoutique).sort(), ["access.entry", "seo.campaign"]);
  // Un canal de la plateforme n'a pas de vis-à-vis préparé côté Boutique ; une entrée de la Boutique n'a pas de canal côté plateforme.
  const couverts = new Set(INTERMEDIAIRES_BOUTIQUE.map((i) => i.canalPlateforme));
  assert.deepEqual(CANAUX_IDS.filter((c) => !couverts.has(c)), ["ia-memoire"]);
  assert.deepEqual(INTERMEDIAIRES_BOUTIQUE.filter((i) => !i.canalPlateforme).map((i) => i.id), ["main-to-shop-entry"]);
  // La règle du PDG : une ligne réelle + cinq lignes futures par intermédiaire = 6 + 30 = 36.
  assert.equal(INTERMEDIAIRES_BOUTIQUE.length * (1 + RESERVE_PAR_LIGNE_REELLE), 36);
  assert.equal(reserveCible(INTERMEDIAIRES_BOUTIQUE.length, RESERVE_PAR_LIGNE_REELLE, RESERVE_DE_DEPART), 30);
});

test("réserve : cinq lignes futures par ligne réelle, réserve de départ sans ligne réelle", () => {
  assert.equal(reserveCible(6, 5, 5), 30);
  assert.equal(reserveCible(7, 5, 5), 35);
  assert.equal(reserveCible(1, 5, 5), 5);
  assert.equal(reserveCible(0, 5, 5), 5);
});

test("moteur de contrôle : interne, réel, non réservé, sans erreur ni verrou", () => {
  assert.equal(moteurInterneUtilisable(moteur("main")), true);
  assert.equal(moteurInterneUtilisable(moteur("main", "inactive")), true, "éteint n'est pas défaillant");
  assert.equal(moteurInterneUtilisable(moteur("main", "maintenance")), true);
  for (const s of ["error", "locked", "future"] as const) assert.equal(moteurInterneUtilisable(moteur("main", s)), false, s);
  assert.equal(moteurInterneUtilisable(moteur("shop")), false, "un moteur externe ne contrôle pas");
  assert.equal(moteurInterneUtilisable(moteur("main", "active", { isFuturePlaceholder: true })), false);
  assert.equal(moteurInterneUtilisable(moteur("main", "active", { isRealEngine: false })), false);
  assert.equal(moteurInterneUtilisable(undefined), false);
});

test("paire : valide seulement avec DEUX moteurs internes distincts et utilisables", () => {
  const a = moteur("main");
  const b = moteur("main");
  const c = moteur("main", "error");
  const ext = moteur("shop");
  const m = index(a, b, c, ext);
  assert.equal(validerPaire(undefined, m).valide, false);
  assert.match(validerPaire(undefined, m).raison!, /deux moteurs internes/);
  assert.equal(validerPaire({ externalEngineId: ext.id, primaryId: a.id, secondaryId: a.id }, m).valide, false, "le même moteur deux fois");
  assert.equal(validerPaire({ externalEngineId: ext.id, primaryId: a.id, secondaryId: c.id }, m).valide, false, "secondaire en erreur");
  assert.equal(validerPaire({ externalEngineId: ext.id, primaryId: c.id, secondaryId: a.id }, m).valide, false, "principal en erreur");
  assert.equal(validerPaire({ externalEngineId: ext.id, primaryId: a.id, secondaryId: ext.id }, m).valide, false, "un moteur externe ne peut pas être un moteur de contrôle");
  assert.equal(validerPaire({ externalEngineId: ext.id, primaryId: a.id, secondaryId: 99999 }, m).valide, false, "moteur absent");
  assert.deepEqual(validerPaire({ externalEngineId: ext.id, primaryId: a.id, secondaryId: b.id }, m), { valide: true });
});

function ligneComplete() {
  const ctrl1 = moteur("main");
  const ctrl2 = moteur("main");
  const gReel = moteur("shop");
  const gInter = moteur("shop");
  const dInter = moteur("main", "inactive");
  const dReel = moteur("main");
  const paires = new Map([
    [gReel.id, { externalEngineId: gReel.id, primaryId: dInter.id, secondaryId: ctrl1.id }],
    [gInter.id, { externalEngineId: gInter.id, primaryId: dInter.id, secondaryId: ctrl1.id }],
  ]);
  const sw = { status: "OFF" as const, isFuturePlaceholder: false, primaryEngineId: ctrl1.id, secondaryEngineId: ctrl2.id };
  const ligne = { isFuture: false, gauche: { reel: gReel, intermediaire: gInter, interrupteur: sw }, droite: { reel: dReel, intermediaire: dInter, interrupteur: sw }, pointage: { status: "separated" as const } };
  return { ligne, paires, moteurs: index(ctrl1, ctrl2, gReel, gInter, dInter, dReel), gReel, gInter, dInter, ctrl1, ctrl2 };
}

test("ligne : valide quand tout est en place ; chaque manque est nommé", () => {
  const { ligne, paires, moteurs } = ligneComplete();
  assert.deepEqual(validerLigne(ligne, moteurs, paires), { valide: true, raisons: [] });
  assert.equal(validerLigne({ ...ligne, isFuture: true }, moteurs, paires).valide, false, "une ligne future n'est jamais valide");
  const sans = (cle: "gauche" | "droite", maillon: "reel" | "intermediaire") => validerLigne({ ...ligne, [cle]: { ...ligne[cle], [maillon]: undefined } }, moteurs, paires);
  assert.match(sans("droite", "intermediaire").raisons[0], /Moteur intermédiaire de droite : absent/);
  assert.match(sans("gauche", "reel").raisons[0], /Moteur réel de gauche : absent/);
  assert.match(sans("droite", "reel").raisons[0], /Moteur réel de droite : absent/);
  assert.match(sans("gauche", "intermediaire").raisons[0], /Moteur intermédiaire de gauche : absent/);
  assert.equal(validerLigne({ ...ligne, pointage: undefined }, moteurs, paires).valide, false);
  assert.equal(validerLigne({ ...ligne, pointage: { status: "error" } }, moteurs, paires).valide, false);
});

test("ligne : sans paire valide pour un moteur externe, ou avec un moteur verrouillé, elle n'est pas valide", () => {
  const { ligne, paires, moteurs, gReel, gInter, dInter } = ligneComplete();
  const sansPaire = new Map(paires);
  sansPaire.delete(gReel.id);
  const v = validerLigne(ligne, moteurs, sansPaire);
  assert.equal(v.valide, false);
  assert.match(v.raisons.join(" "), /Aucune paire de contrôle/);
  // Un moteur de contrôle en attente externe (verrouillé) invalide les paires qui en dépendent, donc la ligne.
  const verrouille = new Map(moteurs);
  verrouille.set(dInter.id, { ...dInter, status: "locked" });
  const w = validerLigne({ ...ligne, droite: { ...ligne.droite, intermediaire: { ...dInter, status: "locked" } } }, verrouille, paires);
  assert.equal(w.valide, false);
  assert.match(w.raisons.join(" "), /verrouillé ou en attente/);
  assert.ok(w.raisons.some((r) => r.startsWith("Moteur réel de gauche")) && w.raisons.some((r) => r.startsWith("Moteur intermédiaire de gauche")), "les deux moteurs externes qui en dépendent sont signalés");
  void gInter;
  // Interrupteurs : deux moteurs distincts obligatoires.
  const un = { ...ligne.gauche.interrupteur, secondaryEngineId: ligne.gauche.interrupteur.primaryEngineId };
  assert.equal(interrupteurValide(un, moteurs), false);
  assert.equal(interrupteurValide({ ...un, secondaryEngineId: null }, moteurs), false);
  assert.equal(interrupteurValide({ ...ligne.gauche.interrupteur, isFuturePlaceholder: true }, moteurs), false);
  assert.equal(validerLigne({ ...ligne, gauche: { ...ligne.gauche, interrupteur: un } }, moteurs, paires).valide, false);
});

test("état d'une ligne : allumée seulement si les deux interrupteurs sont sur ON ET le pointage connecté", () => {
  const base = { isFuture: false, gauche: "ON", droite: "ON", pointage: "connected" } as const;
  assert.equal(etatLigne(base), "on");
  assert.equal(etatLigne({ ...base, droite: "OFF" }), "off");
  assert.equal(etatLigne({ ...base, pointage: "separated" }), "off");
  assert.equal(etatLigne({ ...base, gauche: "locked" }), "locked");
  assert.equal(etatLigne({ ...base, pointage: "error" }), "error");
  assert.equal(etatLigne({ ...base, gauche: "locked", pointage: "error" }), "error", "l'erreur l'emporte");
  assert.equal(etatLigne({ ...base, isFuture: true }), "future");
  assert.deepEqual(["on", "off", "locked", "error", "future"].map((s) => etatCourantLigne(s as never)), ["simulated_on", "off", "locked", "error", "future"]);
});

test("miroirs : le registre central et le câble sont traduits sans rien inventer", () => {
  assert.equal(etatDepuisRegistre("active", "ok"), "active");
  assert.equal(etatDepuisRegistre("active", "unknown"), "active");
  assert.equal(etatDepuisRegistre("active", "degraded"), "maintenance");
  assert.equal(etatDepuisRegistre("active", "down"), "error");
  assert.equal(etatDepuisRegistre("disabled", "ok"), "inactive");
  assert.equal(etatDepuisRegistre("staging", null), "inactive");
  assert.equal(etatDepuisRegistre("read_only", null), "locked");
  assert.equal(etatDepuisRegistre("maintenance", null), "maintenance");
  assert.equal(etatDepuisCable(true, undefined), "active");
  assert.equal(etatDepuisCable(false, "CANAL_COUPE"), "inactive");
  assert.equal(etatDepuisCable(false, "MAITRE_COUPE"), "inactive");
  assert.equal(etatDepuisCable(false, "ATTENTE_EXTERNE"), "locked");
  assert.equal(etatReelDepuisCable(null, false, undefined), "sans_canal");
  assert.equal(etatReelDepuisCable("etat", true, undefined), "connecte");
  assert.equal(etatReelDepuisCable("etat", false, "CANAL_COUPE"), "coupe");
  assert.equal(etatReelDepuisCable("paiement", false, "ATTENTE_EXTERNE"), "attente_externe");
  assert.ok(Object.keys(CANAUX).length === 6);
});

test("jauges : neuf mesures calculées, jamais de division par zéro ni de valeur inventée", () => {
  const c: Comptes = {
    lignesReelles: 6, lignesAllumees: 3, lignesValides: 3, pairesRequises: 90, pairesValides: 86,
    moteurs: { total: 200, observes: 120, actifs: 100, inactifs: 90, erreur: 2, verrouilles: 8, maintenance: 4 },
    canaux: { declares: 6, connectes: 1 }, alertes: { reparationsOuvertes: 5, tentativesRefusees24h: 2 }, memoire: 12, reparation: { ouvertes: 1, resolues: 3 },
  };
  const j = Object.fromEntries(jauges(c).map((x) => [x.cle, x]));
  assert.equal(Object.keys(j).length, 9);
  assert.equal(j.puissance.valeur, 50);
  assert.equal(j.securite.valeur, 96);
  assert.equal(j.temperature.valeur, 5, "(2 en erreur + 4 en maintenance) sur 120 observés");
  assert.equal(j.connexions.valeur, 17);
  assert.equal(j.coupes.valeur, 49, "(90 + 8) sur 200");
  assert.equal(j.reparation.valeur, 75);
  assert.equal(j.erreurs.valeur, null);
  assert.match(j.alertes.detail, /5 réparation\(s\) ouverte\(s\), 2 tentative\(s\)/);
  const vide = Object.fromEntries(jauges({ ...c, lignesReelles: 0, pairesRequises: 0, moteurs: { total: 0, observes: 0, actifs: 0, inactifs: 0, erreur: 0, verrouilles: 0, maintenance: 0 }, canaux: { declares: 0, connectes: 0 }, reparation: { ouvertes: 0, resolues: 0 } }).map((x) => [x.cle, x]));
  for (const k of ["puissance", "securite", "temperature", "connexions", "coupes", "reparation"]) assert.equal(vide[k].valeur, null, `${k} sans base de calcul`);
});
