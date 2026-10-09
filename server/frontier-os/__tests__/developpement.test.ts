/**
 * Lacunes de développement : déclaration idempotente, résolution par preuve observée (automatique) ou par décision du PDG (note
 * exigée), ré-ouverture honnête, le balayage ne relève que ce qui est réellement vérifiable (aucune liste fabriquée).
 */
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { eq } from "drizzle-orm";
import { dbFrontier } from "../base/connexion.js";
import { capabilityGaps, remoteReports } from "../base/schema.js";
import { balayerLacunes, declarerLacune, lacunesVue, resoudreLacune, resoudreLacuneConstatee } from "../developpement.js";
import { PDG, baseNeuve, fermer, ligneDe, remiseAZero } from "./utilitaires.js";

before(baseNeuve);
after(fermer);
beforeEach(remiseAZero);

test("déclarer : nouvelle lacune, puis redéclarer met seulement le texte à jour (idempotent, pas de doublon)", async () => {
  await declarerLacune({ code: "essai-un", titre: "Titre un", detail: "Détail un", developpementRequis: "Dev un" });
  const v1 = await lacunesVue();
  assert.equal(v1.lacunes.filter((l) => l.code === "essai-un").length, 1);
  assert.equal(v1.declarees, 1);
  await declarerLacune({ code: "essai-un", titre: "Titre deux", detail: "Détail deux", developpementRequis: "Dev deux" });
  const v2 = await lacunesVue();
  assert.equal(v2.lacunes.filter((l) => l.code === "essai-un").length, 1, "pas de doublon");
  assert.equal(v2.lacunes.find((l) => l.code === "essai-un")!.title, "Titre deux");
});

test("résoudre par constat (automatique) : exige une preuve, journalisé, le statut passe à résolue", async () => {
  await declarerLacune({ code: "essai-deux", titre: "Titre", detail: "Détail", developpementRequis: "Dev" });
  await resoudreLacuneConstatee("essai-deux", "Preuve observée le 2026-10-09.");
  const v = await lacunesVue();
  const l = v.lacunes.find((x) => x.code === "essai-deux")!;
  assert.equal(l.status, "resolved");
  assert.equal(l.resolvedBy, "system:constate");
  assert.match(l.resolvedNote!, /Preuve observée/);
  assert.ok(l.resolvedAt);
});

test("résoudre par le PDG : confirmation requise, note non vide requise, journalisé", async () => {
  await declarerLacune({ code: "essai-trois", titre: "Titre", detail: "Détail", developpementRequis: "Dev" });
  const sans = await resoudreLacune("essai-trois", PDG, "fait", false);
  assert.equal(sans.ok, false);
  const videe = await resoudreLacune("essai-trois", PDG, "a", true);
  assert.equal(videe.ok, false, "note trop courte");
  const ok = await resoudreLacune("essai-trois", PDG, "Développé dans la session du 9 octobre.", true);
  assert.equal(ok.ok, true, ok.detail);
  const l = (await lacunesVue()).lacunes.find((x) => x.code === "essai-trois")!;
  assert.equal(l.status, "resolved");
  assert.equal(l.resolvedBy, `pdg:${PDG.id}`);
  const encore = await resoudreLacune("essai-trois", PDG, "deuxième tentative", true);
  assert.equal(encore.ok, false, "déjà résolue");
});

test("rouvrir : une lacune résolue, redéclarée (la cause reparaît), reprend son statut déclarée et perd sa résolution", async () => {
  await declarerLacune({ code: "essai-quatre", titre: "Titre", detail: "Détail", developpementRequis: "Dev" });
  await resoudreLacuneConstatee("essai-quatre", "preuve");
  assert.equal((await lacunesVue()).lacunes.find((l) => l.code === "essai-quatre")!.status, "resolved");
  await declarerLacune({ code: "essai-quatre", titre: "Titre 2", detail: "Détail 2", developpementRequis: "Dev 2" });
  const l = (await lacunesVue()).lacunes.find((x) => x.code === "essai-quatre")!;
  assert.equal(l.status, "declared");
  assert.equal(l.resolvedAt, null);
  assert.equal(l.resolvedNote, null);
});

test("balayage honnête : aucun rapport de la Boutique jamais reçu → une lacune vérifiable est déclarée, jamais une liste fabriquée", async () => {
  await balayerLacunes();
  const v = await lacunesVue();
  const l = v.lacunes.find((x) => x.code === "boutique-emetteur-commutation");
  assert.ok(l, "la lacune de l'émetteur Boutique doit être relevée");
  assert.equal(l!.status, "declared");
  assert.match(l!.developmentNeeded, /boutique-emetteur-reference/);
});

test("balayage honnête : un rapport signé reçu résout automatiquement la lacune, avec la preuve exacte", async () => {
  await balayerLacunes();
  assert.equal((await lacunesVue()).lacunes.find((l) => l.code === "boutique-emetteur-commutation")!.status, "declared");
  const id = await ligneDe("shop-documents-only");
  await dbFrontier().insert(remoteReports).values({ lineId: id, state: "disconnected", observedAt: new Date(), keyId: 7 });
  await balayerLacunes();
  const l = (await lacunesVue()).lacunes.find((x) => x.code === "boutique-emetteur-commutation")!;
  assert.equal(l.status, "resolved");
  assert.equal(l.resolvedBy, "system:constate");
  assert.match(l.resolvedNote!, /clé n°7/);
  await dbFrontier().delete(remoteReports).where(eq(remoteReports.lineId, id));
});
