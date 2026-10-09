/**
 * Centre Cyber-Électrique / Frontier OS et règles permanentes de l'engagement (souvenirs-centre-cyber-electrique.ts),
 * sur une base LOCALE jetable (SHOP_KNOWLEDGE_TEST_DB, base « core_ai_test ») — jamais une base partagée.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("souvenirs du Centre Cyber-Électrique : clés uniques, catégories propres seulement, pose idempotente, aucun secret, faits vérifiables", async () => {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  const { pool } = await import("../../db.js");
  try {
    await pool.query(readFileSync(new URL("../../../drizzle/0094_intelligences_memoire.sql", import.meta.url), "utf8"));
    await pool.query("DELETE FROM in_memoire WHERE source = 'souvenirs-centre-cyber-electrique'");

    const { seedSouvenirsCentreCyberElectrique, SOUVENIRS_CENTRE } = await import("../souvenirs-centre-cyber-electrique.js");
    const { CATEGORIES } = await import("../memoire.js");

    // Clés uniques, catégories toutes « propres » (jamais une mémoire fédérée ailleurs), aucun secret apparent.
    assert.equal(new Set(SOUVENIRS_CENTRE.map((s) => `${s.categorie}:${s.cle}`)).size, SOUVENIRS_CENTRE.length);
    for (const s of SOUVENIRS_CENTRE) {
      const cat = CATEGORIES.find((c) => c.code === s.categorie);
      assert.ok(cat && cat.detenteur === "intelligences", s.categorie);
      assert.ok(!/(?:\bsk-[A-Za-z0-9]|shopsvc_[A-Za-z0-9_-]{20}|-----BEGIN|password\s*[:=]|mot de passe\s*[:=])/i.test(s.contenu), `secret apparent dans « ${s.titre} »`);
    }

    // Pose : une fois par clé, jamais réécrite une deuxième fois identique (idempotent).
    const premiere = await seedSouvenirsCentreCyberElectrique();
    assert.equal(premiere.nouveaux, SOUVENIRS_CENTRE.length);
    assert.equal((await seedSouvenirsCentreCyberElectrique()).nouveaux, 0);

    const parCat = (await pool.query("SELECT categorie, count(*)::int n FROM in_memoire WHERE source = 'souvenirs-centre-cyber-electrique' AND cycle = 'actif' GROUP BY categorie ORDER BY categorie")).rows;
    assert.deepEqual(parCat.map((r) => r.categorie), ["apprentissage", "decisions", "projets"]);

    // Les faits cités restent vérifiables (PR réellement ouvertes/fusionnées cette session, jamais inventées).
    const { contenu } = (await pool.query("SELECT contenu FROM in_memoire WHERE source = 'souvenirs-centre-cyber-electrique' AND categorie = 'projets'")).rows[0];
    for (const pr of ["594", "595", "596", "288"]) assert.ok(contenu.includes(pr), pr);
  } finally {
    await pool.end();
  }
});
