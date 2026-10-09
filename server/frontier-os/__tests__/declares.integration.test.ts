/**
 * Vues des moteurs déclarés (migration 0005) : alarme standard calculée sur l'état réel, contrôle centrale, surveillance observable
 * seulement, connecteurs (A, B, MKAPMS Shop) avec progression honnête, identité interne du centre.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import { dbFrontier } from "../base/connexion.js";
import { engines } from "../base/schema.js";
import { alarmeDeclaree, connecteurVue, controleCentraleVue, definirIdentiteCentre, identiteVue, moteursDeclaresListe, salleDeclareeVue, surveillanceVue } from "../declares.js";
import { SYSTEME } from "../journal.js";
import {
  CONNECTEUR_A, CONNECTEUR_B, SALLE_CONTROLE_CENTRALE, SALLE_MOTEURS_COMPLETS, SALLE_SURVEILLANCE, SALLE_TRAVAIL, seedMoteursDeclares, SHOP_AUTRES, SHOP_IA_BOUTIQUE, SHOP_PAIEMENT, SHOP_TRANSPORTEURS, SHOP_WOOCOMMERCE,
} from "../moteurs-declares.js";
import { baseNeuve, fermer } from "./utilitaires.js";

before(async () => {
  await baseNeuve();
  await seedMoteursDeclares(dbFrontier());
});
after(fermer);

test("moteursDeclaresListe : filtre par salle et par ensemble de connecteur", async () => {
  const salle1 = await moteursDeclaresListe({ roomCode: SALLE_TRAVAIL });
  assert.equal(salle1.length, 31);
  const connecteurA = await moteursDeclaresListe({ connectorSet: CONNECTEUR_A });
  assert.equal(connecteurA.length, 40);
});

test("alarme : gris par défaut (rien d'actif, rien en erreur), rouge si un moteur est en erreur", async () => {
  const avant = await alarmeDeclaree({ roomCode: SALLE_MOTEURS_COMPLETS });
  assert.equal(avant.niveau, "gris");
  const db = dbFrontier();
  const [m] = await db.select({ code: engines.code }).from(engines).where(eq(engines.roomCode, SALLE_MOTEURS_COMPLETS)).limit(1);
  await db.update(engines).set({ inventoryState: "erreur" }).where(eq(engines.code, m!.code));
  const apres = await alarmeDeclaree({ roomCode: SALLE_MOTEURS_COMPLETS });
  assert.equal(apres.niveau, "rouge");
  await db.update(engines).set({ inventoryState: "vide" }).where(eq(engines.code, m!.code));
});

test("salleDeclareeVue : compteurs honnêtes, bleu réservé à la surveillance", async () => {
  const s = await salleDeclareeVue(SALLE_SURVEILLANCE);
  assert.equal(s.compteurs.total, 8);
  assert.equal(s.alarme.niveau, "bleu");
  const autre = await salleDeclareeVue(SALLE_CONTROLE_CENTRALE);
  assert.equal(autre.alarme.niveau, "gris");
});

test("controleCentraleVue : vue globale mesurée, zéro moteur actif par défaut, sept ensembles de connecteurs comptés", async () => {
  const c = await controleCentraleVue();
  assert.equal(c.moteursActifs, 0);
  assert.equal(c.moteursArretes, 210);
  assert.equal(c.erreurs, 0);
  assert.equal(c.etatGeneral, "normal");
  assert.equal(c.nbSalles, 17);
  assert.equal(c.connecteurs.length, 7);
  assert.equal(c.connecteurs.find((x) => x.set === CONNECTEUR_A)!.total, 40);
  assert.ok(c.connecteurs.every((x) => x.alarme.niveau === "gris"));
});

test("surveillanceVue : honnête à zéro, jamais une anomalie inventée", async () => {
  const s = await surveillanceVue();
  assert.equal(s.accesObserves, 0);
  assert.equal(s.scansDetectes, 0);
  assert.equal(s.anomalies, 0);
  assert.equal(s.moteurs.length, 8);
});

test("connecteurVue : 0 % honnête pour les sept ensembles, manques tous visibles", async () => {
  for (const [set, total] of [[CONNECTEUR_A, 40], [CONNECTEUR_B, 40], [SHOP_WOOCOMMERCE, 6], [SHOP_TRANSPORTEURS, 6], [SHOP_PAIEMENT, 6], [SHOP_IA_BOUTIQUE, 6], [SHOP_AUTRES, 6]] as const) {
    const v = await connecteurVue(set);
    assert.equal(v.total, total, set);
    assert.equal(v.pourcentage, 0, set);
    assert.equal(v.avecPreuve, 0, set);
    assert.equal(v.manquants.length, total, set);
  }
});

test("identité du centre : jamais de nom par défaut, le PDG seul peut en enregistrer un", async () => {
  const d = await identiteVue();
  assert.equal(d.nomInterne, null);
  assert.match(d.localisationDeclarative, /Guinée, Kankan/);
  const apres = await definirIdentiteCentre("Nom interne d'essai", { ...SYSTEME });
  assert.equal(apres.nomInterne, "Nom interne d'essai");
  assert.ok(apres.definieLe);
  const relu = await identiteVue();
  assert.equal(relu.nomInterne, "Nom interne d'essai");
});
