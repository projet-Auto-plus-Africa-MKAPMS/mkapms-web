/**
 * Outils GitHub en lecture seule (github.ts + outils/familles/github.ts).
 *
 * Partie 1 — sans base, avec un faux « fetch » : hôte et dépôt fixes, GET
 * seulement, aucune redirection, jeton jamais renvoyé, erreurs lisibles.
 *
 * Partie 2 — base Postgres LOCALE uniquement (PGHOST=localhost, schéma migré,
 * DATABASE_URL vide) : le jeton déposé dans le vrai coffre est lu par l'outil
 * passé par l'exécuteur, l'usage est journalisé, et ce que voit le modèle ne
 * contient jamais le jeton. Jamais contre une base partagée ou de production.
 *
 * Toutes les valeurs sont des fixtures manifestement fictives.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { DEPOT_GITHUB, NOM_SECRET_JETON_GITHUB, listerExecutionsAndroid, verifierConnexion } from "../github.js";

const JETON = "github_pat_FIXTURE_FICTIF_0123456789";

interface Appel { url: string; methode: string; auth: string | null; redirect: string | undefined }

function fauxFetch(reponses: Record<string, { statut: number; corps: unknown }>, appels: Appel[]): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    const u = String(url);
    appels.push({ url: u, methode: String(init?.method), auth: new Headers(init?.headers).get("authorization"), redirect: init?.redirect });
    const cle = Object.keys(reponses).find((k) => u.includes(k));
    const r = cle ? reponses[cle]! : { statut: 404, corps: { message: "Not Found" } };
    return new Response(JSON.stringify(r.corps), { status: r.statut, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
}

test("vérifier la connexion : dépôt fixe, GET, sans redirection, droits lus, jeton jamais renvoyé", async () => {
  const appels: Appel[] = [];
  const f = fauxFetch({ [`/repos/${DEPOT_GITHUB}`]: { statut: 200, corps: { full_name: DEPOT_GITHUB, private: true, default_branch: "main", permissions: { pull: true, push: true, admin: false } } } }, appels);
  const r = await verifierConnexion(JETON, f);
  assert.equal(r.ok, true);
  assert.deepEqual(r.droits, { lecture: true, ecriture: true, administration: false });
  assert.equal(r.brancheParDefaut, "main");
  assert.equal(appels.length, 1);
  assert.equal(appels[0]!.url, `https://api.github.com/repos/${DEPOT_GITHUB}`);
  assert.equal(appels[0]!.methode, "GET");
  assert.equal(appels[0]!.redirect, "error");
  assert.equal(appels[0]!.auth, `Bearer ${JETON}`);
  assert.ok(!JSON.stringify(r).includes(JETON));

  const lecture = await verifierConnexion(JETON, fauxFetch({ "/repos/": { statut: 200, corps: { full_name: DEPOT_GITHUB, permissions: { pull: true, push: false } } } }, []));
  assert.equal(lecture.ok, true);
  assert.match(lecture.detail, /lecture seule/);
});

test("vérifier la connexion : jeton refusé, accès refusé, limite, panne réseau → messages lisibles, jamais ok", async () => {
  const cas: [number, unknown, RegExp][] = [
    [401, { message: "Bad credentials" }, /refuse le jeton/],
    [403, { message: "Resource not accessible by personal access token" }, /permission/],
    [403, { message: "API rate limit exceeded" }, /limite/],
    [404, { message: "Not Found" }, /introuvable/],
    [500, {}, /erreur \(500\)/],
  ];
  for (const [statut, corps, motif] of cas) {
    const r = await verifierConnexion(JETON, fauxFetch({ "/repos/": { statut, corps } }, []));
    assert.equal(r.ok, false, String(statut));
    assert.match(r.detail, motif);
    assert.ok(!JSON.stringify(r).includes(JETON));
  }
  const panne = await verifierConnexion(JETON, (async () => { throw new Error(`connexion refusée avec ${JETON}`); }) as unknown as typeof fetch);
  assert.equal(panne.ok, false);
  assert.match(panne.detail, /n'a pas répondu/);
  assert.ok(!JSON.stringify(panne).includes(JETON), "l'erreur brute (qui pourrait citer le jeton) n'est jamais renvoyée");
});

test("exécutions Android : 5 dernières, artefacts de la dernière réussie, workflow et dépôt fixes", async () => {
  const appels: Appel[] = [];
  const f = fauxFetch({
    "/actions/workflows/android-aab.yml/runs": { statut: 200, corps: { workflow_runs: [
      { id: 12, status: "completed", conclusion: "failure", head_branch: "main", head_sha: "abcdef1234567", event: "workflow_dispatch", created_at: "2026-10-01T10:00:00Z", html_url: "https://github.com/x/y/actions/runs/12" },
      { id: 11, status: "completed", conclusion: "success", head_branch: "main", head_sha: "1234567abcdef", event: "workflow_dispatch", created_at: "2026-09-30T10:00:00Z", html_url: "https://github.com/x/y/actions/runs/11" },
    ] } },
    "/actions/runs/11/artifacts": { statut: 200, corps: { artifacts: [{ name: "com.mkapms.app.aab", size_in_bytes: 1234567, expired: false }] } },
  }, appels);
  const r = await listerExecutionsAndroid(JETON, f);
  assert.equal(r.ok, true);
  assert.equal(r.executions.length, 2);
  assert.equal(r.executions[0]!.commit, "abcdef1");
  assert.equal(r.executions[0]!.conclusion, "failure");
  assert.equal(r.dernierSucces?.executionId, 11);
  assert.deepEqual(r.dernierSucces?.artefacts, [{ nom: "com.mkapms.app.aab", tailleOctets: 1234567, expire: false }]);
  assert.ok(appels.every((a) => a.methode === "GET" && a.url.startsWith(`https://api.github.com/repos/${DEPOT_GITHUB}/`)));
  assert.ok(!JSON.stringify(r).includes(JETON));

  const aucune = await listerExecutionsAndroid(JETON, fauxFetch({ "/runs": { statut: 200, corps: { workflow_runs: [] } } }, []));
  assert.equal(aucune.ok, true);
  assert.equal(aucune.dernierSucces, null);
  assert.match(aucune.detail, /Aucune exécution/);
  const refuse = await listerExecutionsAndroid(JETON, fauxFetch({ "/runs": { statut: 401, corps: {} } }, []));
  assert.equal(refuse.ok, false);
});

const hoteLocal = ["localhost", "127.0.0.1"].includes(process.env.PGHOST ?? "") && !process.env.DATABASE_URL;

test(
  "base locale : le jeton du coffre est lu par l'outil, usage journalisé, jamais visible du modèle",
  { skip: !hoteLocal && "aucune base locale explicite (PGHOST=localhost requis) — jamais de test contre une base partagée" },
  async () => {
    const { pool } = await import("../../db.js");
    const coffre = await import("../coffre.js");
    const { executer } = await import("../outils/executeur.js");
    const { OUTILS } = await import("../outils/registre.js");
    const ancienne = process.env.COFFRE_CLE_MAITRE;
    const ancienFetch = globalThis.fetch;
    const proprietaire = 9301;
    const nettoyer = async () => {
      await pool.query("DELETE FROM in_coffre_acces WHERE acteur_id = $1", [proprietaire]);
      await pool.query("DELETE FROM in_coffre_secrets WHERE owner_id = $1", [proprietaire]);
    };
    try {
      process.env.COFFRE_CLE_MAITRE = randomBytes(32).toString("hex");
      await nettoyer();
      const verif = OUTILS.find((o) => o.toolId === "developpement.githubVerifierConnexion")!;
      const exec = OUTILS.find((o) => o.toolId === "developpement.githubExecutionsAndroid")!;
      for (const o of [verif, exec]) {
        assert.ok(o && o.enabled && o.implementationStatus === "IMPLEMENTED" && o.riskLevel === "READ_ONLY" && o.allowedRoles.join() === "super_admin", o?.toolId);
        assert.equal(o.requiresHumanApproval, false);
      }
      const ctx = { role: "super_admin", moteur: "intelligences", actorId: proprietaire };

      // Aucun jeton déposé : réponse claire qui dit où le déposer, aucun appel réseau.
      let appelsReseau = 0;
      globalThis.fetch = (async () => { appelsReseau += 1; return new Response("{}"); }) as typeof fetch;
      const sans = await executer(verif, "{}", ctx);
      assert.equal(sans.statut, "execute", sans.motif);
      assert.equal((sans.resultat as { ok: boolean }).ok, false);
      assert.match(JSON.stringify(sans.resultat), /Connecter les outils/);
      assert.equal(appelsReseau, 0);

      // Mauvais type de secret : refusé.
      await coffre.ajouterSecret({ ownerId: proprietaire, nom: NOM_SECRET_JETON_GITHUB, contenu: { type: "identifiants", identifiant: "x@example.invalid", motDePasse: "fixture-mdp-fictif-1" } });
      const mauvaisType = await executer(verif, "{}", ctx);
      assert.match(JSON.stringify(mauvaisType.resultat), /Clé ou jeton/);
      await pool.query("DELETE FROM in_coffre_secrets WHERE owner_id = $1", [proprietaire]);

      // Jeton déposé : l'outil l'utilise (en-tête Authorization), le modèle n'en voit rien.
      const vus: string[] = [];
      globalThis.fetch = (async (url: string, init?: RequestInit) => {
        vus.push(`${new Headers(init?.headers).get("authorization")} ${url}`);
        return new Response(JSON.stringify({ full_name: DEPOT_GITHUB, private: true, default_branch: "main", permissions: { pull: true, push: false } }), { status: 200 });
      }) as typeof fetch;
      const depot = await coffre.ajouterSecret({ ownerId: proprietaire, nom: NOM_SECRET_JETON_GITHUB, service: "GitHub", contenu: { type: "cle_api", valeur: JETON } });
      assert.equal(depot.ok, true, depot.detail);
      const r = await executer(verif, "{}", ctx);
      assert.equal(r.statut, "execute", r.motif);
      assert.equal((r.resultat as { ok: boolean }).ok, true);
      assert.deepEqual(vus, [`Bearer ${JETON} https://api.github.com/repos/${DEPOT_GITHUB}`]);
      assert.ok(!JSON.stringify(r).includes(JETON), "le modèle ne voit jamais le jeton");

      const journal = await coffre.journalCoffre(proprietaire);
      const usage = journal.find((j) => j.action === "utiliser" && j.ok);
      assert.equal(usage?.outil, "developpement.githubVerifierConnexion");
      assert.ok((usage?.motif ?? "").length >= 3);
      assert.ok(!JSON.stringify(journal).includes(JETON));

      // Un autre compte ne peut pas se servir de ce jeton.
      const autre = await executer(verif, "{}", { ...ctx, actorId: proprietaire + 1 });
      assert.equal((autre.resultat as { ok: boolean }).ok, false);
      await pool.query("DELETE FROM in_coffre_acces WHERE acteur_id = $1", [proprietaire + 1]);
    } finally {
      globalThis.fetch = ancienFetch;
      if (ancienne === undefined) delete process.env.COFFRE_CLE_MAITRE; else process.env.COFFRE_CLE_MAITRE = ancienne;
      await nettoyer();
      await pool.end();
    }
  },
);
