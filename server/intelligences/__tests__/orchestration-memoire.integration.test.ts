/**
 * Mémoire de l'agent développeur : pas de doublons sur les essais répétés, pertinence de la recherche, relevé des leçons sans
 * gonflement du compteur, missions reprises. Base PostgreSQL jetable (core_ai_test), tables créées ici.
 */
import test from "node:test";
import assert from "node:assert/strict";

async function base() {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  const { pool } = await import("../../db.js");
  await pool.query("DROP TABLE IF EXISTS in_experiences, cg_lessons, agent_change_log, in_missions, in_mission_etapes");
  await pool.query(`CREATE TABLE in_experiences(id bigserial PRIMARY KEY, signature varchar(160) NOT NULL, domaine varchar(48) NOT NULL DEFAULT 'inconnu', probleme text NOT NULL DEFAULT '', diagnostic text NOT NULL DEFAULT '', solution text NOT NULL DEFAULT '', resultat varchar(32) NOT NULL DEFAULT 'inconnu', blocage text NOT NULL DEFAULT '', mission_id integer, test_run_id integer, dev_request_id integer, occurrences integer NOT NULL DEFAULT 1, tentatives integer NOT NULL DEFAULT 1, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE cg_lessons(id bigserial PRIMARY KEY, classe varchar(120) NOT NULL, source varchar(20) NOT NULL, source_ref varchar(200), probleme text NOT NULL, proposition text, correctif text, tests text, validation varchar(16) NOT NULL DEFAULT 'en_attente', resultat text, moteurs jsonb NOT NULL DEFAULT '[]', occurrences integer NOT NULL DEFAULT 1, releves integer NOT NULL DEFAULT 1, last_seen_at timestamp NOT NULL DEFAULT now(), created_at timestamp NOT NULL DEFAULT now(), CONSTRAINT cg_lessons_classe_unique UNIQUE(classe, source, source_ref))`);
  await pool.query(`CREATE TABLE agent_change_log(id serial PRIMARY KEY, agent text, kind text, title text, detail text, engine_name text, status text, rollback_plan text)`);
  await pool.query(`CREATE TABLE in_missions(id serial PRIMARY KEY, objectif text NOT NULL, domaine varchar(48) NOT NULL DEFAULT 'inconnu', cote varchar(16) NOT NULL DEFAULT 'direction', statut varchar(32) NOT NULL DEFAULT 'en_cours', arret_sur varchar(48) NOT NULL DEFAULT '', motif text NOT NULL DEFAULT '', rapport text NOT NULL DEFAULT '', niveau_requis integer NOT NULL DEFAULT 1, niveau_accorde integer NOT NULL DEFAULT 0, dev_request_id integer, pipeline_run_id integer, test_run_id integer, actor_id integer, duree_ms integer NOT NULL DEFAULT 0, reprise_de integer, created_at timestamp NOT NULL DEFAULT now())`);
  await pool.query(`CREATE TABLE in_mission_etapes(id bigserial PRIMARY KEY, mission_id integer NOT NULL, rang integer NOT NULL, etape varchar(48) NOT NULL, libelle varchar(160) NOT NULL DEFAULT '', statut varchar(32) NOT NULL DEFAULT 'non_execute', capacite varchar(32), permission varchar(24), niveau_requis integer NOT NULL DEFAULT 1, observe text NOT NULL DEFAULT '', duree_ms integer NOT NULL DEFAULT 0, created_at timestamp NOT NULL DEFAULT now())`);
  return pool;
}

const q = async (pool: { query: (s: string) => Promise<{ rows: Record<string, unknown>[] }> }, sql: string) => (await pool.query(sql)).rows;

test("expériences : un essai répété sans rien de nouveau n'ajoute ni ligne ni occurrence, et n'est jamais une correction acquise", async () => {
  const pool = await base();
  const { retenir, dejaVu, experiencesProches } = await import("../memoire.js");
  const essai = { domaine: "paiement", probleme: "Répare le paiement de la page abonnement", diagnostic: "", solution: "", resultat: "blocage_autorisation", blocage: "dossier — niveau 3 requis" };

  const a = await retenir(essai);
  const b = await retenir(essai);
  const c = await retenir(essai);
  assert.deepEqual([a.nouvelEpisode, b.nouvelEpisode, c.nouvelEpisode], [true, false, false]);
  assert.equal(a.id, b.id);
  let lignes = await q(pool, "select occurrences, tentatives, resultat from in_experiences");
  assert.equal(lignes.length, 1, "une seule ligne");
  assert.equal(lignes[0]!.occurrences, 1, "un seul épisode");
  assert.equal(lignes[0]!.tentatives, 3, "trois essais tracés");

  // Ce que la mémoire répond : un blocage répété, pas une correction acquise.
  const vu = await dejaVu("paiement", "Répare le paiement de la page abonnement");
  assert.equal(vu.connu, true);
  assert.equal(vu.corrigeVerifie, false);
  assert.match(vu.verdict, /aucune correction vérifiée/);
  assert.match(vu.verdict, /blocage d'autorisation \(1 épisode\(s\), 3 tentative\(s\)\)/);
  assert.doesNotMatch(vu.verdict, /corrig(é|ée) avec succès|déjà corrigé/i);

  // Un résultat DIFFÉRENT est un nouvel épisode (même ligne, occurrences + 1).
  const d = await retenir({ ...essai, resultat: "echec_technique", blocage: "analyse — Fournisseur indisponible." });
  assert.equal(d.nouvelEpisode, true);
  lignes = await q(pool, "select occurrences, tentatives, resultat from in_experiences");
  assert.equal(lignes.length, 1);
  assert.equal(lignes[0]!.occurrences, 2);
  assert.equal(lignes[0]!.tentatives, 4);
  assert.equal(lignes[0]!.resultat, "echec_technique");

  // Pertinence : une expérience sans rapport, même très répétée, ne remonte pas ; la correction vérifiée passe avant le reste.
  await retenir({ domaine: "seo", probleme: "Revoir le sitemap des annonces", diagnostic: "", solution: "", resultat: "blocage_autorisation", blocage: "x" });
  for (let i = 0; i < 20; i++) await retenir({ domaine: "seo", probleme: "Revoir le sitemap des annonces", diagnostic: "", solution: "", resultat: "blocage_autorisation", blocage: "x" });
  await retenir({ domaine: "paiement", probleme: "Corriger le paiement abonnement mensuel", diagnostic: "d", solution: "Modifier server/payment-engine/checkout.ts", resultat: "correction_verifiee" });
  const proches = await experiencesProches("paiement abonnement", 5);
  assert.ok(proches.length >= 2);
  assert.ok(proches.every((x) => x.domaine === "paiement"), "aucune expérience sans mot commun");
  assert.equal(proches[0]!.resultat, "correction_verifiee", "la correction vérifiée d'abord");
  const vu2 = await dejaVu("paiement", "paiement abonnement");
  assert.equal(vu2.corrigeVerifie, true);
});

test("leçons : relire les mêmes événements sources ne gonfle plus les occurrences", async () => {
  const pool = await base();
  const { apprendre, reconnaitre, auditerLecons } = await import("../../code-graph/service.js");
  await pool.query(`INSERT INTO agent_change_log(agent, kind, title, detail, engine_name, status, rollback_plan) VALUES
    ('a1','correctif','Bouton mort sur la page annonces','corrigé','annonces','en_attente','git revert'),
    ('a2','correctif','Redirection 404 de la fiche','corrigé','annonces','en_attente',NULL),
    ('a3','autre','Titre libre sans rapport','x',NULL,'rejetee',NULL)`);

  const premier = await apprendre();
  assert.equal(premier.nouvelles, 3);
  for (let i = 0; i < 4; i++) await apprendre(); // relectures répétées des mêmes événements
  const lignes = await q(pool, "select classe, occurrences, releves, validation from cg_lessons order by id");
  assert.equal(lignes.length, 3, "aucun doublon");
  for (const l of lignes) {
    assert.equal(l.occurrences, 1, `occurrences inchangées (${l.classe})`);
    assert.equal(l.releves, 5, "les relectures sont tracées à part");
  }

  // Un VRAI changement (validation humaine) est un épisode de plus.
  await pool.query("UPDATE agent_change_log SET status='validee' WHERE title like 'Bouton%'");
  const apres = await apprendre();
  assert.equal(apres.renforcees, 1);
  const bouton = (await q(pool, "select occurrences, releves, validation from cg_lessons where probleme like 'Bouton%'"))[0]!;
  assert.deepEqual([bouton.occurrences, bouton.releves, bouton.validation], [2, 6, "validee"]);

  // Non classée : jamais « connue », aucune leçon rappelée.
  const nc = await reconnaitre("Titre libre sans rapport");
  assert.equal(nc.classe, "anomalie_non_classee");
  assert.equal(nc.connue, false);
  assert.equal(nc.lecons.length, 0);
  assert.match(nc.verdict, /aucune correction acquise/);
  // Classée avec une correction validée : connue, et elle est nommée « validée ».
  const rc = await reconnaitre("bouton mort sur la page");
  assert.equal(rc.classe, "parcours_casse");
  assert.equal(rc.connue, true);
  assert.equal(rc.verifiees, 1);
  assert.equal(rc.lecons[0]!.validation, "validee", "la leçon validée passe en premier");
  // Classée sans validation : observation, rien d'acquis.
  // Même classe, mais la correction validée porte sur un autre problème (bouton) : rien n'est acquis pour une redirection.
  const rn = await reconnaitre("redirection cassée 404");
  assert.equal(rn.classe, "parcours_casse");
  assert.equal(rn.connue, false);
  assert.match(rn.verdict, /aucune ne porte sur ce cas précis — rien n'est acquis pour lui/);

  // Audit en lecture seule : ne modifie rien.
  const avant = await q(pool, "select count(*)::int n, sum(occurrences)::int o, sum(releves)::int r from cg_lessons");
  const audit = await auditerLecons();
  const apresAudit = await q(pool, "select count(*)::int n, sum(occurrences)::int o, sum(releves)::int r from cg_lessons");
  assert.deepEqual(avant, apresAudit);
  assert.equal(audit.lignes, 3);
  assert.equal(audit.nonClassee.lignes, 1);
  assert.equal(audit.relues, 3);
  assert.ok(audit.relevesTotal > audit.occurrencesTotal);
});

test("migration 0155 : l'ancien compteur n'est pas perdu, il devient « relevés » / « tentatives »", async () => {
  const pool = await base();
  // État AVANT la migration : colonnes absentes, compteur gonflé.
  await pool.query("ALTER TABLE cg_lessons DROP COLUMN releves");
  await pool.query("ALTER TABLE in_experiences DROP COLUMN tentatives");
  await pool.query("ALTER TABLE in_missions DROP COLUMN reprise_de");
  await pool.query("INSERT INTO cg_lessons(classe, source, source_ref, probleme, occurrences) VALUES('anomalie_non_classee','agent_change','change:1','x',1546), ('parcours_casse','agent_change','change:2','y',1)");
  await pool.query("INSERT INTO in_experiences(signature, probleme, occurrences) VALUES('a:b','p',7), ('c:d','q',1)");
  const { readFileSync } = await import("node:fs");
  const sql = readFileSync(new URL("../../../drizzle/0155_missions_memoire_dedoublonnage.sql", import.meta.url), "utf8");
  for (const instruction of sql.split("--> statement-breakpoint")) await pool.query(instruction);
  const lecons = await q(pool, "select classe, occurrences, releves from cg_lessons order by id");
  assert.deepEqual(lecons.map((l) => [l.occurrences, l.releves]), [[1, 1546], [1, 1]]);
  const exps = await q(pool, "select occurrences, tentatives from in_experiences order by id");
  assert.deepEqual(exps.map((e) => [e.occurrences, e.tentatives]), [[7, 7], [1, 1]]);
  // Rejouer la migration ne change rien (idempotente).
  for (const instruction of sql.split("--> statement-breakpoint")) await pool.query(instruction);
  const encore = await q(pool, "select occurrences, releves from cg_lessons order by id");
  assert.deepEqual(encore.map((l) => [l.occurrences, l.releves]), [[1, 1546], [1, 1]]);
});

test("missions : une mission déjà reprise n'est plus « inachevée » ; une mission terminée non plus", async () => {
  const pool = await base();
  const { STORE_REEL } = await import("../mission-store.js");
  const a = await STORE_REEL.creer({ objectif: "Répare le paiement", domaine: "paiement", actorId: 1 });
  await STORE_REEL.maj(a, { statut: "arretee", arretSur: "dossier" });
  assert.deepEqual((await STORE_REEL.inachevees(1, new Date(Date.now() - 86400000))).map((m) => m.id), [a]);
  const b = await STORE_REEL.creer({ objectif: "Répare le paiement", domaine: "paiement", actorId: 1, repriseDe: a });
  await STORE_REEL.maj(b, { statut: "arretee", arretSur: "tests" });
  assert.deepEqual((await STORE_REEL.inachevees(1, new Date(Date.now() - 86400000))).map((m) => m.id), [b], "seule la reprise porte la suite");
  await STORE_REEL.maj(b, { statut: "accomplie" });
  assert.deepEqual(await STORE_REEL.inachevees(1, new Date(Date.now() - 86400000)), []);
  // Une autre personne ne voit pas ces missions.
  const c = await STORE_REEL.creer({ objectif: "Autre chose", domaine: "seo", actorId: 2 });
  await STORE_REEL.maj(c, { statut: "arretee" });
  assert.deepEqual(await STORE_REEL.inachevees(1, new Date(Date.now() - 86400000)), []);
  await STORE_REEL.ajouterEtapes(c, [{ etape: "comprendre", libelle: "x", statut: "fait", observe: "ok", capacite: null, permission: "READ", niveauRequis: 1, dureeMs: 1 }]);
  assert.equal((await STORE_REEL.etapesDe(c)).length, 1);
});
