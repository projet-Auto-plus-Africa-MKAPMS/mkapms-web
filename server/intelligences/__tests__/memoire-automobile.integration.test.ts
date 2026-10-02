/**
 * Mémoire automobile (référentiel de départ + synchronisation NHTSA + outil de recherche) et souvenirs des travaux,
 * sur une base LOCALE jetable (SHOP_KNOWLEDGE_TEST_DB, base « core_ai_test ») — jamais une base partagée.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("mémoire automobile : pose idempotente sans fausse confirmation, synchronisation NHTSA bornée, outil de recherche, souvenirs des travaux", async () => {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  const { pool } = await import("../../db.js");
  try {
    await pool.query("DROP TABLE IF EXISTS ake_discoveries, ake_edges, ake_nodes, ake_provenance, ake_sources CASCADE");
    await pool.query(readFileSync(new URL("../../../drizzle/0078_automotive_knowledge_engine.sql", import.meta.url), "utf8"));
    await pool.query(readFileSync(new URL("../../../drizzle/0094_intelligences_memoire.sql", import.meta.url), "utf8"));
    await pool.query("DELETE FROM in_memoire WHERE source = 'fondations-travaux'");

    const { seedReferentielAutomobile } = await import("../../knowledge-engine/referentiel-seed.js");
    const { MARQUES_REFERENTIEL } = await import("../../knowledge-engine/referentiel-automobile.js");

    // 1. Pose du référentiel : créée une fois, rejouée sans rien changer ni confirmer.
    const premiere = await seedReferentielAutomobile();
    assert.equal(premiere.refusee, null);
    assert.ok(premiere.nouvelles > MARQUES_REFERENTIEL.length + 100, "marques + catégories + pièces");
    assert.ok(premiere.liens > MARQUES_REFERENTIEL.length, "liens marque→catégorie et pièce→système");
    const compte = async () => Number((await pool.query("SELECT count(*)::int n FROM ake_nodes")).rows[0].n);
    const avant = await compte();
    const seconde = await seedReferentielAutomobile();
    assert.equal(seconde.nouvelles, 0);
    assert.equal(seconde.liens, 0);
    assert.equal(await compte(), avant);
    const faibles = (await pool.query("SELECT count(*)::int n FROM ake_nodes WHERE observations <> 1 OR status <> 'propose'")).rows[0].n;
    assert.equal(faibles, 0, "un fait posé de mémoire reste une proposition, rejouer ne le « confirme » jamais");
    const prov = (await pool.query("SELECT count(*)::int n, count(DISTINCT source_code)::int s FROM ake_provenance")).rows[0];
    assert.equal(prov.n, avant);
    assert.equal(prov.s, 1);
    const renault = (await pool.query("SELECT summary, attributes FROM ake_nodes WHERE signature = 'constructeur|marque|renault'")).rows[0];
    assert.match(renault.summary, /France/);
    assert.equal(renault.attributes.verifie, false);
    const lien = (await pool.query("SELECT count(*)::int n FROM ake_edges e JOIN ake_nodes a ON a.id = e.from_node_id JOIN ake_nodes b ON b.id = e.to_node_id WHERE a.label = 'Renault' AND b.label = 'Voiture particulière' AND e.relation = 'appartient_a'")).rows[0].n;
    assert.equal(lien, 1);

    // 2. Synchronisation NHTSA (réponse simulée) : une marque déjà connue gagne UNE observation, les autres sont créées.
    const { synchroniserMarquesNhtsa, synchroniserNhtsaSiNecessaire, URL_NHTSA_MARQUES } = await import("../../knowledge-engine/nhtsa.js");
    const faux = Array.from({ length: 1200 }, (_, i) => ({ Make_ID: 10_000 + i, Make_Name: `MARQUE TEST ${i}` }));
    faux.push({ Make_ID: 1, Make_Name: "  RENAULT " }, { Make_ID: 2, Make_Name: "12345" }, { Make_ID: 3, Make_Name: "" });
    const appels: string[] = [];
    const reponse = (corps: unknown, status = 200) => (async (u: string | URL | Request, init?: RequestInit) => {
      appels.push(`${init?.method} ${String(u)} redirect=${init?.redirect}`);
      return new Response(JSON.stringify(corps), { status });
    }) as typeof fetch;
    const r1 = await synchroniserMarquesNhtsa(reponse({ Results: faux }));
    assert.equal(r1.ok, true);
    assert.equal(r1.crees, 1200);
    assert.equal(r1.confirmes, 1);
    assert.deepEqual(appels, [`GET ${URL_NHTSA_MARQUES} redirect=error`]);
    const rn = (await pool.query("SELECT observations, status FROM ake_nodes WHERE signature = 'constructeur|marque|renault'")).rows[0];
    assert.equal(rn.observations, 2);
    assert.equal(rn.status, "propose", "deux observations ne suffisent pas à confirmer");
    const rejeu = await synchroniserMarquesNhtsa(reponse({ Results: faux }));
    assert.deepEqual([rejeu.crees, rejeu.confirmes, rejeu.inchanges], [0, 0, 1201]);
    assert.equal((await pool.query("SELECT observations FROM ake_nodes WHERE signature = 'constructeur|marque|renault'")).rows[0].observations, 2, "rejouer ne double pas l'observation");
    const src = (await pool.query("SELECT status, ever_synced, last_sync_detail FROM ake_sources WHERE code = 'nhtsa_vpic'")).rows[0];
    assert.equal(src.status, "actif");
    assert.equal(src.ever_synced, true);

    // 3. Réponses refusées : rien n'écrit, la source passe en erreur (jamais « synchronisée » sans preuve).
    const total = await compte();
    for (const mauvais of [reponse({ Results: faux.slice(0, 50) }), reponse({ pas: "de liste" }), reponse({}, 500), (async () => { throw new TypeError("fetch failed"); }) as typeof fetch]) {
      const r = await synchroniserMarquesNhtsa(mauvais);
      assert.equal(r.ok, false);
      assert.equal(await compte(), total);
    }
    assert.equal((await pool.query("SELECT status FROM ake_sources WHERE code = 'nhtsa_vpic'")).rows[0].status, "erreur");

    // 4. Fréquence : après un succès récent, pas de nouvel appel ; après un mois, oui.
    await synchroniserMarquesNhtsa(reponse({ Results: faux }));
    const nAppels = appels.length;
    assert.equal(await synchroniserNhtsaSiNecessaire(reponse({ Results: faux })), null);
    assert.equal(appels.length, nAppels);
    const apres = await synchroniserNhtsaSiNecessaire(reponse({ Results: faux }), Date.now() + 31 * 24 * 3600 * 1000);
    assert.equal(apres?.ok, true);

    // 5. Outil de recherche : résultats avec statut, état sans recherche, pas de devinette.
    const { IMPLEMENTATIONS } = await import("../outils/implementations.js");
    const outil = IMPLEMENTATIONS["automobile.rechercherMemoire"]!;
    const trouves = (await outil({ recherche: "renault" })) as { resultats: { libelle: string; statut: string; verifie: boolean }[] };
    assert.ok(trouves.resultats.some((x) => x.libelle === "Renault" && x.statut === "propose" && x.verifie === false));
    const etat = (await outil({})) as { etat: { noeuds: { domain: string; kind: string; n: number }[]; sources: { code: string }[] } };
    assert.ok(etat.etat.noeuds.some((x) => x.domain === "constructeur" && x.kind === "marque" && x.n > 1500));
    assert.ok(etat.etat.sources.some((x) => x.code === "nhtsa_vpic") && etat.etat.sources.some((x) => x.code === "connaissance_generale_ia"));
    const rien = (await outil({ recherche: "zzz-marque-inexistante-zzz" })) as { resultats: unknown[]; note?: string };
    assert.equal(rien.resultats.length, 0);
    assert.match(rien.note ?? "", /ne pas deviner/);
    const pieces = (await outil({ recherche: "plaquettes", domaine: "piece" })) as { resultats: { libelle: string }[] };
    assert.ok(pieces.resultats.some((x) => /Plaquettes de frein/.test(x.libelle)));

    // 6. Souvenirs des travaux : posés une fois, dans les mémoires qui étaient vides.
    const { seedSouvenirsTravaux, SOUVENIRS_TRAVAUX } = await import("../fondations-travaux.js");
    assert.equal(new Set(SOUVENIRS_TRAVAUX.map((s) => `${s.categorie}:${s.cle}`)).size, SOUVENIRS_TRAVAUX.length);
    const s1 = await seedSouvenirsTravaux();
    assert.equal(s1.nouveaux, SOUVENIRS_TRAVAUX.length);
    assert.equal((await seedSouvenirsTravaux()).nouveaux, 0);
    const parCat = (await pool.query("SELECT categorie, count(*)::int n FROM in_memoire WHERE source = 'fondations-travaux' AND cycle = 'actif' GROUP BY categorie ORDER BY categorie")).rows;
    assert.deepEqual(parCat.map((r) => r.categorie), ["apprentissage", "decisions", "projets", "recherche"]);
  } finally {
    await pool.end();
  }
});
