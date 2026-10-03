/**
 * Lecture du jeton et de l'adresse de la boutique dans le coffre : nom retrouvé malgré un tiret ou des espaces différents,
 * cloisonnement par compte, raison du refus au journal. Base PostgreSQL jetable (core_ai_test), migration 0150 appliquée.
 * Toutes les valeurs sont des fixtures manifestement fictives.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const JETON = `shopsvc_${"B".repeat(43)}`;

test("accesBoutique : noms équivalents retrouvés, comptes cloisonnés, raison du refus journalisée", async () => {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  const ancienne = process.env.COFFRE_CLE_MAITRE;
  process.env.COFFRE_CLE_MAITRE = randomBytes(32).toString("hex");
  const { pool } = await import("../../db.js");
  try {
    await pool.query("DROP TABLE IF EXISTS in_coffre_acces, in_coffre_secrets CASCADE");
    for (const instruction of readFileSync("drizzle/0150_coffre_secrets.sql", "utf8").split("--> statement-breakpoint")) {
      if (instruction.trim()) await pool.query(instruction);
    }
    const coffre = await import("../coffre.js");
    const { accesBoutique } = await import("../boutique.js");

    // Le PDG a saisi des tirets ordinaires et un espace en trop, pas les tirets longs du catalogue.
    assert.equal((await coffre.ajouterSecret({ ownerId: 7, nom: "Boutique - jeton de service ", contenu: { type: "cle_api", valeur: JETON } })).ok, true);
    assert.equal((await coffre.ajouterSecret({ ownerId: 7, nom: "boutique – adresse", contenu: { type: "cle_api", valeur: "https://boutique.exemple.com" } })).ok, true);

    const ok = await accesBoutique(7, "boutique.capacites", "Connaître les portées du jeton");
    assert.equal(ok.ok, true, ok.ok ? "" : ok.detail);
    if (ok.ok) {
      assert.equal(ok.origine, "https://boutique.exemple.com");
      assert.equal(ok.jeton, JETON);
    }

    // Autre compte : rien ne fuit, et la raison dit que le coffre est propre à chaque compte.
    const autre = await accesBoutique(8, "boutique.capacites", "Essai croisé");
    assert.equal(autre.ok, false);
    if (!autre.ok) {
      assert.match(autre.detail, /propre à chaque compte/);
      assert.ok(!autre.detail.includes(JETON));
    }

    // Jeton absent mais d'autres secrets présents : les NOMS (jamais les valeurs) sont rendus pour corriger.
    await pool.query("DELETE FROM in_coffre_secrets WHERE nom LIKE 'Boutique - jeton%'");
    const sans = await accesBoutique(7, "boutique.listerProduits", "Lister les fiches");
    assert.equal(sans.ok, false);
    if (!sans.ok) {
      assert.match(sans.detail, /Aucun secret nommé « Boutique — jeton de service »/);
      assert.match(sans.detail, /Noms enregistrés pour ce compte : « boutique – adresse »/);
      assert.ok(!sans.detail.includes(JETON));
    }

    // Deux noms équivalents : jamais départagés au hasard.
    await coffre.ajouterSecret({ ownerId: 7, nom: "Boutique - jeton de service", contenu: { type: "cle_api", valeur: JETON } });
    await coffre.ajouterSecret({ ownerId: 7, nom: "Boutique – jeton de service", contenu: { type: "cle_api", valeur: `shopsvc_${"C".repeat(43)}` } });
    const ambigu = await accesBoutique(7, "boutique.capacites", "Essai");
    assert.equal(ambigu.ok, false);
    if (!ambigu.ok) assert.match(ambigu.detail, /Plusieurs secrets portent un nom équivalent/);
    // Un nom EXACT garde la priorité sur ses équivalents.
    await coffre.ajouterSecret({ ownerId: 7, nom: "Boutique — jeton de service", contenu: { type: "cle_api", valeur: JETON } });
    const exact = await accesBoutique(7, "boutique.capacites", "Essai exact");
    assert.equal(exact.ok, true);
    if (exact.ok) assert.equal(exact.jeton, JETON);

    // Cas réel : nom saisi avec un POINT FINAL (« … service. ») — retrouvé quand même.
    assert.equal((await coffre.ajouterSecret({ ownerId: 9, nom: "Boutique — jeton de service.", contenu: { type: "cle_api", valeur: JETON } })).ok, true);
    assert.equal((await coffre.ajouterSecret({ ownerId: 9, nom: "Boutique — adresse", contenu: { type: "cle_api", valeur: "https://boutique.exemple.com" } })).ok, true);
    const pointFinal = await accesBoutique(9, "boutique.capacites", "Nom avec point final");
    assert.equal(pointFinal.ok, true, pointFinal.ok ? "" : pointFinal.detail);

    // Modifier : renomme (nom et service seulement), valeur intacte, comptes cloisonnés, doublon refusé, journal sans valeur.
    const [cible] = (await pool.query("select id from in_coffre_secrets where owner_id = 9 and nom like '%service.'")).rows as { id: number }[];
    assert.equal((await coffre.modifierSecret({ ownerId: 8, id: cible.id, nom: "Pris par un autre compte" })).ok, false, "un autre compte ne modifie pas");
    assert.equal((await coffre.modifierSecret({ ownerId: 9, id: cible.id, nom: "Boutique — adresse" })).ok, false, "doublon refusé");
    assert.equal((await coffre.modifierSecret({ ownerId: 9, id: cible.id, nom: "x" })).ok, false, "nom trop court");
    const renomme = await coffre.modifierSecret({ ownerId: 9, id: cible.id, nom: "Boutique — jeton de service", service: "Boutique MKA.P-MS (SHOP)" });
    assert.equal(renomme.ok, true, renomme.detail);
    const apres = await accesBoutique(9, "boutique.listerProduits", "Après renommage");
    assert.equal(apres.ok, true, apres.ok ? "" : apres.detail);
    if (apres.ok) assert.equal(apres.jeton, JETON, "la valeur n'a pas bougé");
    const modifs = (await pool.query("select motif, ok from in_coffre_acces where action = 'modifier'")).rows as { motif: string; ok: boolean }[];
    assert.equal(modifs.length, 1);
    assert.match(modifs[0].motif, /renommé/);
    assert.ok(!modifs[0].motif.includes("shopsvc_"));

    // Journal : chaque refus porte sa RAISON ; aucune valeur n'y figure.
    const lignes = (await pool.query("select ok, outil, motif from in_coffre_acces where action = 'utiliser' order by id")).rows as { ok: boolean; outil: string; motif: string }[];
    const refus = lignes.filter((l) => !l.ok);
    assert.equal(refus.length, 3, "compte étranger, jeton absent, noms équivalents");
    assert.ok(refus.every((l) => /— refus : /.test(l.motif)), "chaque refus dit pourquoi");
    assert.ok(refus.some((l) => /propre à chaque compte/.test(l.motif)));
    assert.ok(lignes.some((l) => l.ok && l.outil === "boutique.capacites"));
    for (const l of lignes) assert.ok(!l.motif.includes("shopsvc_"), "aucune valeur dans le journal");
  } finally {
    if (ancienne === undefined) delete process.env.COFFRE_CLE_MAITRE;
    else process.env.COFFRE_CLE_MAITRE = ancienne;
  }
});
