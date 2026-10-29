/**
 * Mission 2.2 (29/10) — isolation de la mémoire fédérée (in_memoire) entre acteurs/rôles.
 * Base PostgreSQL jetable, fournisseur d'embeddings simulé (jamais d'appel réseau réel), données 100% synthétiques.
 *
 * Complète empreintes.integration.test.ts (qui n'exerce que le PDG) : ici, plusieurs acteurs non-PDG écrivent et
 * lisent, pour prouver que `clauseVisibilite()` tient — y compris quand la recherche par le sens (empreintes)
 * renvoie des candidats qui ne respectent elle-même aucune portée (c'est memoire.rechercher() qui doit filtrer
 * après coup, jamais le module empreintes).
 */
import test from "node:test";
import assert from "node:assert/strict";

const PDG = { id: 1, role: "super_admin" };
const EMPLOYE_A = { id: 2, role: "employe" };
const EMPLOYE_B = { id: 3, role: "employe" };
const COMPTABLE = { id: 4, role: "comptable" };

/** Empreinte simulée : identique pour tout texte, afin que la recherche par le sens renvoie TOUJOURS tous les candidats indexés — c'est le pire cas pour le cloisonnement, puisque rien ne vient naturellement les départager. 1024 dimensions : doit correspondre à DIMENSIONS_EMPREINTES (provider.ts), sinon creerEmpreintes() rejette la réponse simulée comme invalide. */
function vecteurUniforme(): number[] {
  const v = new Array(1024).fill(0);
  v[0] = 1;
  return v;
}

test("isolation in_memoire : mémoire privée par acteur, promotion réservée au PDG, recherche par le sens cloisonnée", async () => {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname), "garde-fou : jamais sur une base autre que localhost");
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  process.env.OPENAI_API_KEY = "sk-test-cle-secrete-isolation";

  const fetchSimule = (async (u: string | URL | Request, init?: RequestInit) => {
    assert.ok(String(u).endsWith("/v1/embeddings"));
    const corps = JSON.parse(String(init?.body)) as { model: string; input: string[] };
    return new Response(JSON.stringify({ data: corps.input.map((_t, index) => ({ index, embedding: vecteurUniforme() })) }));
  }) as typeof fetch;
  const fetchOrigine = globalThis.fetch;
  globalThis.fetch = fetchSimule;

  const { pool } = await import("../../db.js");
  try {
    await pool.query("DROP TABLE IF EXISTS in_empreintes, in_memoire, in_fonctions, in_sondes_openai");
    await pool.query(
      `CREATE TABLE in_memoire(id bigserial PRIMARY KEY,categorie varchar(32) NOT NULL,cycle varchar(16) NOT NULL DEFAULT 'actif',portee varchar(24) NOT NULL DEFAULT 'pdg_prive',cle varchar(200) NOT NULL DEFAULT '',titre varchar(240) NOT NULL DEFAULT '',contenu text NOT NULL DEFAULT '',mots_cles jsonb NOT NULL DEFAULT '[]',liens jsonb NOT NULL DEFAULT '{}',source varchar(64) NOT NULL DEFAULT 'intelligences',country_code varchar(8),poids integer NOT NULL DEFAULT 1,rappels integer NOT NULL DEFAULT 0,actor_id integer,updated_at timestamp NOT NULL DEFAULT now(),created_at timestamp NOT NULL DEFAULT now())`,
    );
    await pool.query(
      `CREATE TABLE in_fonctions(id serial PRIMARY KEY,fonction varchar(48) NOT NULL UNIQUE,active boolean NOT NULL DEFAULT false,motif text NOT NULL DEFAULT '',actor_id integer,updated_at timestamp NOT NULL DEFAULT now())`,
    );
    await pool.query(
      `CREATE TABLE in_empreintes(id serial PRIMARY KEY,source_type varchar(24) NOT NULL,source_id bigint NOT NULL,modele varchar(60) NOT NULL,dimensions integer NOT NULL,hash varchar(64) NOT NULL,vecteur real[] NOT NULL,updated_at timestamptz NOT NULL DEFAULT now())`,
    );
    await pool.query("CREATE UNIQUE INDEX in_empreintes_source_idx ON in_empreintes(source_type, source_id, modele)");
    await pool.query("CREATE TABLE in_sondes_openai(id serial PRIMARY KEY,capacite varchar(48) NOT NULL UNIQUE,etat varchar(40) NOT NULL,modele varchar(80),endpoint varchar(120) NOT NULL DEFAULT '',http_status integer,erreur_type varchar(80) NOT NULL DEFAULT '',erreur_code varchar(80) NOT NULL DEFAULT '',details jsonb NOT NULL DEFAULT '{}',teste_le timestamptz NOT NULL DEFAULT now())");
    await pool.query("INSERT INTO in_fonctions(fonction, active) VALUES('empreintes_semantiques', true)");

    const memoire = await import("../memoire.js");
    const attendre = () => new Promise((r) => setTimeout(r, 150));

    // 1. Promotion en mémoire d'entreprise partagée réservée au PDG : un non-PDG qui la demande est refusé, rien n'est écrit en entreprise_partagee.
    const refusEmploye = await memoire.ecrire({
      categorie: "entreprise",
      titre: "Tentative de promotion par un employé",
      contenu: "Un employé tente de rendre son souvenir visible par toute l'entreprise.",
      portee: "entreprise_partagee",
      appelant: EMPLOYE_A,
    });
    assert.equal(refusEmploye.ok, false, "promotion refusée à un non-PDG");
    const promusParErreur = await pool.query("select count(*)::int n from in_memoire where portee='entreprise_partagee'");
    assert.equal(promusParErreur.rows[0].n, 0, "aucune ligne entreprise_partagee créée par la tentative refusée");

    // 2. Quatre souvenirs, un par acteur : trois restent pdg_prive (par défaut), un est promu par le PDG lui-même.
    const dossierA = await memoire.ecrire({ categorie: "entreprise", titre: "Dossier confidentiel A", contenu: "Contenu privé de l'employé A, jamais vu par B.", appelant: EMPLOYE_A });
    const dossierB = await memoire.ecrire({ categorie: "entreprise", titre: "Dossier confidentiel B", contenu: "Contenu privé de l'employé B, jamais vu par A.", appelant: EMPLOYE_B });
    const dossierPdg = await memoire.ecrire({ categorie: "entreprise", titre: "Dossier confidentiel PDG", contenu: "Contenu privé du PDG, jamais vu par un rôle non-PDG.", appelant: PDG });
    const dossierPartage = await memoire.ecrire({ categorie: "entreprise", titre: "Dossier partagé entreprise", contenu: "Contenu promu par le PDG, visible par tous les rôles.", portee: "entreprise_partagee", appelant: PDG });
    assert.ok(dossierA.ok && dossierB.ok && dossierPdg.ok && dossierPartage.ok);
    await attendre(); // laisse l'indexation en arrière-plan (empreintes) se terminer avant la recherche par le sens.

    // 3. Lecture directe (lister) : chaque acteur ne voit que le sien + le partagé ; jamais celui d'un autre.
    const listeA = await memoire.lister("entreprise", EMPLOYE_A);
    const titresA = listeA.map((l) => l.titre);
    assert.ok(titresA.includes("Dossier confidentiel A"));
    assert.ok(titresA.includes("Dossier partagé entreprise"));
    assert.ok(!titresA.includes("Dossier confidentiel B"), "A ne doit jamais voir le dossier privé de B");
    assert.ok(!titresA.includes("Dossier confidentiel PDG"), "A ne doit jamais voir le dossier privé du PDG");

    const listeB = await memoire.lister("entreprise", EMPLOYE_B);
    const titresB = listeB.map((l) => l.titre);
    assert.ok(titresB.includes("Dossier confidentiel B"));
    assert.ok(titresB.includes("Dossier partagé entreprise"));
    assert.ok(!titresB.includes("Dossier confidentiel A"), "B ne doit jamais voir le dossier privé de A");
    assert.ok(!titresB.includes("Dossier confidentiel PDG"), "B ne doit jamais voir le dossier privé du PDG");

    const listeComptable = await memoire.lister("entreprise", COMPTABLE);
    const titresComptable = listeComptable.map((l) => l.titre);
    assert.ok(titresComptable.includes("Dossier partagé entreprise"), "le comptable voit le partagé");
    assert.ok(
      !titresComptable.includes("Dossier confidentiel A") && !titresComptable.includes("Dossier confidentiel B") && !titresComptable.includes("Dossier confidentiel PDG"),
      "le comptable ne voit aucun dossier privé d'un autre acteur",
    );

    // 4. Le PDG voit tout, y compris les dossiers privés des autres (conception actuelle : aucun filtre pour super_admin) —
    //    point à documenter pour la Direction : la mémoire d'entreprise n'est pas une conversation privée brute, mais
    //    cette visibilité totale, non journalisée, reste une décision à valider explicitement (cf. rapport).
    const listePdg = await memoire.lister("entreprise", PDG);
    const titresPdg = listePdg.map((l) => l.titre);
    for (const t of ["Dossier confidentiel A", "Dossier confidentiel B", "Dossier confidentiel PDG", "Dossier partagé entreprise"]) {
      assert.ok(titresPdg.includes(t), `le PDG doit voir ${t}`);
    }

    // 5. Recherche par le sens : même avec un terme absent du texte (recherche textuelle vide) et une empreinte
    //    identique pour toutes les sources (pire cas), le filtre de portée doit s'appliquer au résultat sémantique
    //    exactement comme au résultat textuel — jamais de contournement par le canal "sens".
    const termeAbsentDuTexte = "zzz-terme-totalement-absent-de-tous-les-titres-et-contenus-zzz";
    const sensA = await memoire.rechercher(termeAbsentDuTexte, EMPLOYE_A);
    const sensTitresA = sensA.trouvailles.map((t) => t.titre);
    assert.ok(sensTitresA.includes("Dossier confidentiel A"), "la recherche par le sens doit retrouver le dossier de A");
    assert.ok(sensTitresA.includes("Dossier partagé entreprise"));
    assert.ok(!sensTitresA.includes("Dossier confidentiel B"), "la recherche par le sens ne doit jamais exposer le dossier de B à A");
    assert.ok(!sensTitresA.includes("Dossier confidentiel PDG"), "la recherche par le sens ne doit jamais exposer le dossier du PDG à A");

    const sensComptable = await memoire.rechercher(termeAbsentDuTexte, COMPTABLE);
    const sensTitresComptable = sensComptable.trouvailles.map((t) => t.titre);
    assert.ok(sensTitresComptable.includes("Dossier partagé entreprise"));
    assert.ok(
      !sensTitresComptable.includes("Dossier confidentiel A") && !sensTitresComptable.includes("Dossier confidentiel B") && !sensTitresComptable.includes("Dossier confidentiel PDG"),
      "la recherche par le sens ne doit jamais exposer un dossier privé d'un autre acteur au comptable",
    );

    const sensPdg = await memoire.rechercher(termeAbsentDuTexte, PDG);
    const sensTitresPdg = sensPdg.trouvailles.map((t) => t.titre);
    for (const t of ["Dossier confidentiel A", "Dossier confidentiel B", "Dossier confidentiel PDG", "Dossier partagé entreprise"]) {
      assert.ok(sensTitresPdg.includes(t), `la recherche par le sens du PDG doit retrouver ${t}`);
    }

    // 6. Non-régression PDG : les fonctions centrales restent utilisables normalement pour le PDG après l'isolation
    //    (écriture, relecture par clé identique → déclassement en historique, jamais de blocage).
    const miseAJourPdg = await memoire.ecrire({ categorie: "entreprise", titre: "Dossier confidentiel PDG", contenu: "Version mise à jour du dossier PDG.", appelant: PDG });
    assert.equal(miseAJourPdg.ok, true);
    assert.notEqual(miseAJourPdg.id, dossierPdg.id, "nouvelle ligne active, l'ancienne passe en historique");
    const historiquePdg = await pool.query("select cycle from in_memoire where id=$1", [dossierPdg.id]);
    assert.equal(historiquePdg.rows[0].cycle, "historique");

    // 7. Pas de contournement par "échange d'identifiant" côté service : avec l'identité (synthétique) de A, jamais
    //    la ligne de B ne remonte, quelle que soit la casse — la vraie garantie contre un id fabriqué par le client
    //    est que ctx.user (serveur) seul fournit l'`Appelant`, jamais une valeur d'entrée (vérifié par lecture du
    //    routeur : server/intelligences/index.ts ne lit jamais input.userId/input.actorId pour cet appelant).
    const rechercheCibleeSurB = await memoire.rechercher("Dossier confidentiel B", EMPLOYE_A);
    assert.ok(!rechercheCibleeSurB.trouvailles.some((t) => t.titre === "Dossier confidentiel B"), "A ne retrouve jamais le dossier de B même en nommant son titre exact");
  } finally {
    globalThis.fetch = fetchOrigine;
    await pool.end();
  }
});
