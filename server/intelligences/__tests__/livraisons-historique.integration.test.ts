/**
 * Écriture du journal historique dans la mémoire : base PostgreSQL jetable, idempotente, bonnes catégories, expériences
 * distinctes (un même type de livraison ne recouvre pas le souvenir d'une autre).
 */
import test from "node:test";
import assert from "node:assert/strict";

test("seedLivraisons écrit l'existant et le journal historique, une seule fois, dans les bonnes mémoires", async () => {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  const { pool } = await import("../../db.js");
  await pool.query("DROP TABLE IF EXISTS in_memoire, in_experiences, in_fonctions, in_empreintes");
  await pool.query(`CREATE TABLE in_memoire(id bigserial PRIMARY KEY,categorie varchar(32) NOT NULL,cycle varchar(16) NOT NULL DEFAULT 'actif',cle varchar(200) NOT NULL DEFAULT '',titre varchar(240) NOT NULL DEFAULT '',contenu text NOT NULL DEFAULT '',mots_cles jsonb NOT NULL DEFAULT '[]',liens jsonb NOT NULL DEFAULT '{}',source varchar(64) NOT NULL DEFAULT 'intelligences',country_code varchar(8),poids integer NOT NULL DEFAULT 1,rappels integer NOT NULL DEFAULT 0,actor_id integer,updated_at timestamp NOT NULL DEFAULT now(),created_at timestamp NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE in_experiences(id bigserial PRIMARY KEY, signature varchar(160) NOT NULL, domaine varchar(48) NOT NULL DEFAULT 'inconnu', probleme text NOT NULL DEFAULT '', diagnostic text NOT NULL DEFAULT '', solution text NOT NULL DEFAULT '', resultat varchar(32) NOT NULL DEFAULT 'inconnu', blocage text NOT NULL DEFAULT '', mission_id integer, test_run_id integer, dev_request_id integer, occurrences integer NOT NULL DEFAULT 1, tentatives integer NOT NULL DEFAULT 1, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE in_fonctions(id serial PRIMARY KEY,fonction varchar(48) NOT NULL UNIQUE,active boolean NOT NULL DEFAULT false,motif text NOT NULL DEFAULT '',actor_id integer,updated_at timestamp NOT NULL DEFAULT now())`);

  const { seedLivraisons, TOUTES_LES_LIVRAISONS } = await import("../livraisons.js");
  const premiere = await seedLivraisons();
  assert.equal(premiere.total, TOUTES_LES_LIVRAISONS.length);
  assert.equal(premiere.nouvelles, TOUTES_LES_LIVRAISONS.length, "tout est nouveau au premier passage");
  const seconde = await seedLivraisons();
  assert.equal(seconde.nouvelles, 0, "idempotent : rien n'est réécrit");

  const lignes = (await pool.query("select categorie, count(*)::int n from in_memoire where cycle = 'actif' group by categorie order by categorie")).rows as { categorie: string; n: number }[];
  const par = Object.fromEntries(lignes.map((l) => [l.categorie, l.n]));
  const recits = TOUTES_LES_LIVRAISONS.filter((l) => l.cle.startsWith("recit-"));
  for (const c of ["projets", "decisions", "apprentissage"]) assert.equal(par[c], recits.filter((r) => r.categorie === c).length, c);
  assert.equal(par.technique, TOUTES_LES_LIVRAISONS.length - recits.length);

  // Aucune version « historique » créée par le second passage.
  assert.equal((await pool.query("select count(*)::int n from in_memoire where cycle <> 'actif'")).rows[0].n, 0);
  // Le récit des retours en arrière est lisible en entier dans la mémoire.
  const retour = (await pool.query("select contenu from in_memoire where cle = 'livraison:recit-retours-arriere-et-capacite-manquante'")).rows[0] as { contenu: string };
  assert.match(retour.contenu, /PR 246 annule/);
  assert.match(retour.contenu, /cette capacité n'existe pas/);
  // Les expériences : une par signature, le journal historique n'écrase pas les livraisons existantes l'une sur l'autre.
  const exps = (await pool.query("select count(*)::int n, sum(tentatives)::int t from in_experiences")).rows[0] as { n: number; t: number };
  assert.ok(exps.n >= TOUTES_LES_LIVRAISONS.length * 0.9, `expériences distinctes : ${exps.n}/${TOUTES_LES_LIVRAISONS.length}`);
});
