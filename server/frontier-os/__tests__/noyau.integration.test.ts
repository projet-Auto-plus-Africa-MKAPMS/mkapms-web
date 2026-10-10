/**
 * Noyau central du Centre : moteur interne réel qui bat un signal de vie daté par le bus interne, démarrage visuel honnête
 * (chaque étape recalculée depuis l'état réellement écrit en base), aucun connecteur, aucun accès externe.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import { dbFrontier } from "../base/connexion.js";
import { engines } from "../base/schema.js";
import { demarrerCentre, oublierDemarragePourTests } from "../demarrage-centre.js";
import { seedMoteursDeclares } from "../moteurs-declares.js";
import { CODE_NOYAU, etapesDemarrage, etatNoyau, oublierNoyauPourTests, pulserNoyau } from "../noyau.js";
import { arreterMoteur, demarrerMoteur, verifierSanteMoteurs } from "../sante.js";
import { SYSTEME } from "../journal.js";
import { baseNeuve, fermer } from "./utilitaires.js";

before(async () => {
  await baseNeuve();
  await seedMoteursDeclares(dbFrontier());
});
after(fermer);

test("le noyau central est un moteur interne réel, en marche par défaut, santé inconnue avant tout battement", async () => {
  const db = dbFrontier();
  const [m] = await db.select().from(engines).where(eq(engines.code, CODE_NOYAU)).limit(1);
  assert.ok(m, "le noyau doit exister dans le registre des moteurs internes");
  assert.equal(m!.kind, "monitor");
  assert.equal(m!.platformCode, "frontier");
  assert.equal(m!.running, true);
  assert.equal(m!.roomCode, null, "aucune salle propriétaire imposée : même convention que les autres moteurs internes");
  assert.equal(m!.connectorSet, null, "aucun lien avec un ensemble de connecteur : jamais un connecteur");
});

test("pulserNoyau : un battement réel passe par le bus, met à jour la santé et incrémente le compteur propre au processus", async () => {
  oublierNoyauPourTests();
  const avant = await etatNoyau();
  assert.equal(avant.battements, 0);
  assert.equal(avant.demarreLe, null);

  const r1 = await pulserNoyau();
  assert.equal(r1.ok, true);
  assert.equal(r1.battements, 1);
  const apres1 = await etatNoyau();
  assert.equal(apres1.sante, "ok");
  assert.equal(apres1.enMarche, true);
  assert.ok(apres1.derniereBattementLe);
  assert.ok(apres1.demarreLe);

  const r2 = await pulserNoyau();
  assert.equal(r2.battements, 2);
});

test("étapes de démarrage : recalculées en direct depuis l'état réel, toutes vraies une fois tout posé et le noyau battant", async () => {
  await verifierSanteMoteurs();
  await pulserNoyau();
  const etapes = await etapesDemarrage();
  assert.deepEqual(etapes.map((e) => e.cle), ["base", "fondation", "declares", "internes", "noyau"]);
  for (const e of etapes) assert.equal(e.ok, true, `${e.cle} : ${e.detail}`);
});

test("un noyau arrêté ne bat plus (jamais un battement fictif) ; sa santé devient « stopped », l'étape « noyau » redevient fausse", async () => {
  await arreterMoteur(CODE_NOYAU, SYSTEME, true);
  const r = await pulserNoyau();
  assert.equal(r.ok, false);
  const etat = await etatNoyau();
  assert.equal(etat.sante, "stopped");
  assert.equal(etat.enMarche, false);
  const etapes = await etapesDemarrage();
  assert.equal(etapes.find((e) => e.cle === "noyau")!.ok, false);

  // Redémarré par le PDG (action explicite, jamais automatique) : recommence à battre.
  await demarrerMoteur(CODE_NOYAU, SYSTEME, true);
  const relance = await pulserNoyau();
  assert.equal(relance.ok, true);
});

test("démarrage réel du Centre (demarrerCentre) : le noyau bat au moins une fois, sans connecteur ni moteur de cyberdéfense/cyberattaque activé", async () => {
  oublierDemarragePourTests();
  oublierNoyauPourTests();
  await demarrerCentre();
  const etat = await etatNoyau();
  assert.ok(etat.battements >= 1, "le vrai démarrage du Centre doit faire battre le noyau au moins une fois");
  assert.equal(etat.sante, "ok");

  const db = dbFrontier();
  const declares = await db.select({ code: engines.code, running: engines.running, connectorSet: engines.connectorSet }).from(engines).where(eq(engines.kind, "declared"));
  assert.equal(declares.length, 210);
  assert.ok(declares.every((d) => !d.running), "aucun moteur déclaré n'est en marche après un démarrage réel : aucun connecteur activé automatiquement");
  const cyber = declares.filter((d) => d.code.startsWith("centre:declare.cyberdefense.") || d.code.startsWith("centre:declare.cyberattaques."));
  assert.equal(cyber.length, 16);
  assert.ok(cyber.every((d) => !d.running));
});
