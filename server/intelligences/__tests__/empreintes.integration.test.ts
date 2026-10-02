/**
 * Mémoire par le sens : base PostgreSQL jetable, fournisseur d'embeddings simulé (jamais d'appel réseau réel).
 * Les « embeddings » simulés sont déterministes : un axe par thème, pour vérifier le classement par similarité.
 */
import test from "node:test";
import assert from "node:assert/strict";

const THEMES = ["voiture", "paiement", "chat"];
function vecteur(texte: string): number[] {
  const t = texte.toLowerCase();
  const v = new Array(1024).fill(0);
  if (/voiture|citadine|auto|véhicule/.test(t)) v[0] = 1;
  if (/paiement|payer|facture/.test(t)) v[1] = 1;
  if (/chat|félin/.test(t)) v[2] = 1;
  if (!v.some((x: number) => x !== 0)) v[3] = 1;
  return v;
}

test("mémoire par le sens : éteinte par défaut, indexation, recherche, visibilité, repli sur échec", async () => {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  process.env.OPENAI_API_KEY = "sk-test-cle-secrete-embeddings";
  const appels: { modele: string; n: number }[] = [];
  let panne: number | null = null;
  let refus: string[] = [];
  const fetchSimule = (async (u: string | URL | Request, init?: RequestInit) => {
    assert.ok(String(u).endsWith("/v1/embeddings"));
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer sk-test-cle-secrete-embeddings");
    const corps = JSON.parse(String(init?.body)) as { model: string; input: string[]; dimensions: number };
    appels.push({ modele: corps.model, n: corps.input.length });
    assert.equal(corps.dimensions, 1024);
    if (refus.includes(corps.model)) return new Response(JSON.stringify({ error: { type: "invalid_request_error", code: "model_not_found", message: "x" } }), { status: 404 });
    if (panne) return new Response(JSON.stringify({ error: { type: "invalid_request_error", code: "model_not_found", message: "sk-test-cle-secrete-embeddings" } }), { status: panne });
    return new Response(JSON.stringify({ data: corps.input.map((t, index) => ({ index, embedding: vecteur(t) })) }));
  }) as typeof fetch;
  const fetchOrigine = globalThis.fetch;
  globalThis.fetch = fetchSimule;

  const { pool } = await import("../../db.js");
  try {
    await pool.query("DROP TABLE IF EXISTS in_empreintes, in_memoire, in_connaissance, in_fonctions, in_retrieval_audit");
    await pool.query(`CREATE TABLE in_memoire(id bigserial PRIMARY KEY,categorie varchar(32) NOT NULL,cycle varchar(16) NOT NULL DEFAULT 'actif',cle varchar(200) NOT NULL DEFAULT '',titre varchar(240) NOT NULL DEFAULT '',contenu text NOT NULL DEFAULT '',mots_cles jsonb NOT NULL DEFAULT '[]',liens jsonb NOT NULL DEFAULT '{}',source varchar(64) NOT NULL DEFAULT 'intelligences',country_code varchar(8),poids integer NOT NULL DEFAULT 1,rappels integer NOT NULL DEFAULT 0,actor_id integer,updated_at timestamp NOT NULL DEFAULT now(),created_at timestamp NOT NULL DEFAULT now())`);
    await pool.query(`CREATE TABLE in_connaissance(id serial PRIMARY KEY,categorie varchar(48) NOT NULL,titre varchar(220) NOT NULL,contenu text NOT NULL DEFAULT '',source text NOT NULL DEFAULT '',version varchar(24) NOT NULL DEFAULT '1',auteur varchar(120) NOT NULL DEFAULT '',statut varchar(24) NOT NULL DEFAULT 'propose',visibilite varchar(24) NOT NULL DEFAULT 'interne',validite varchar(24) NOT NULL DEFAULT 'permanente',actor_id integer,created_at timestamp NOT NULL DEFAULT now(),updated_at timestamp NOT NULL DEFAULT now())`);
    await pool.query(`CREATE TABLE in_fonctions(id serial PRIMARY KEY,fonction varchar(48) NOT NULL UNIQUE,active boolean NOT NULL DEFAULT false,motif text NOT NULL DEFAULT '',actor_id integer,updated_at timestamp NOT NULL DEFAULT now())`);
    await pool.query(`CREATE TABLE in_empreintes(id serial PRIMARY KEY,source_type varchar(24) NOT NULL,source_id bigint NOT NULL,modele varchar(60) NOT NULL,dimensions integer NOT NULL,hash varchar(64) NOT NULL,vecteur real[] NOT NULL,updated_at timestamptz NOT NULL DEFAULT now())`);
    await pool.query("CREATE UNIQUE INDEX in_empreintes_source_idx ON in_empreintes(source_type, source_id, modele)");
    await pool.query("CREATE TABLE in_retrieval_audit(id bigserial PRIMARY KEY,user_id integer,projet_id integer,session_id integer,source varchar(24) NOT NULL,requete text NOT NULL DEFAULT '',result_ids jsonb NOT NULL DEFAULT '[]',scores jsonb NOT NULL DEFAULT '[]',permissions_appliquees text NOT NULL DEFAULT '',duree_ms integer NOT NULL DEFAULT 0,trace_id varchar(40) NOT NULL DEFAULT '',created_at timestamp NOT NULL DEFAULT now())");
    await pool.query("DROP TABLE IF EXISTS in_sondes_openai");
    await pool.query("CREATE TABLE IF NOT EXISTS in_sondes_openai(id serial PRIMARY KEY,capacite varchar(48) NOT NULL UNIQUE,etat varchar(40) NOT NULL,modele varchar(80),endpoint varchar(120) NOT NULL DEFAULT '',http_status integer,erreur_type varchar(80) NOT NULL DEFAULT '',erreur_code varchar(80) NOT NULL DEFAULT '',details jsonb NOT NULL DEFAULT '{}',teste_le timestamptz NOT NULL DEFAULT now())");

    const memoire = await import("../memoire.js");
    const connaissance = await import("../connaissance.js");
    const emp = await import("../empreintes.js");
    const attendre = () => new Promise((r) => setTimeout(r, 150));

    // 1. Éteinte : rien n'est calculé, aucun appel au fournisseur.
    await memoire.ecrire({ categorie: "entreprise", titre: "Citadine préférée", contenu: "Le PDG préfère une petite voiture économique." });
    await attendre();
    assert.equal(appels.length, 0, "fonctionnalité éteinte : aucun appel d'empreintes");
    assert.equal((await pool.query("select count(*)::int n from in_empreintes")).rows[0].n, 0);
    assert.equal(await emp.rechercherParLeSens("memoire", "voiture économique"), null);

    // 2. Activée : reprise de l'existant par lot, puis indexation au fil de l'eau.
    await pool.query("INSERT INTO in_fonctions(fonction, active) VALUES('empreintes_semantiques', true)");
    const lot = await emp.reindexerUnLot(50);
    assert.equal(lot.indexees, 1);
    assert.equal(lot.restantes, 0);
    assert.equal(lot.echec, null);
    await memoire.ecrire({ categorie: "entreprise", titre: "Moyens de règlement", contenu: "Les clients peuvent payer par carte ou par virement." });
    await memoire.ecrire({ categorie: "entreprise", titre: "Mascotte", contenu: "Le chat de l'atelier s'appelle Moka." });
    await attendre();
    assert.equal((await pool.query("select count(*)::int n from in_empreintes")).rows[0].n, 3);

    // 3. Recherche par le sens : « voiture » trouve la citadine sans que le mot « citadine » figure dans la question.
    const proches = await emp.rechercherParLeSens("memoire", "quelle auto veut-il ?");
    assert.ok(proches && proches.length === 1, "seul le souvenir sur les voitures dépasse le seuil");
    const r = await memoire.rechercher("quelle auto veut-il");
    const vue = r.trouvailles.find((t) => t.titre === "Citadine préférée");
    assert.ok(vue, "trouvé par le sens alors que la recherche textuelle ne le trouve pas");
    assert.equal(vue.methode, "semantique");
    assert.ok(!r.trouvailles.some((t) => t.titre === "Mascotte"), "un souvenir sans rapport n'est pas remonté");

    // 4. Texte inchangé : pas de recalcul (hash).
    const avant = appels.length;
    const idMemoire = Number((await pool.query("select id from in_memoire where titre='Mascotte'")).rows[0].id);
    const idem = await emp.indexer([{ type: "memoire", id: idMemoire, texte: emp.texteSouvenir("Mascotte", "Le chat de l'atelier s'appelle Moka.") }]);
    assert.equal(idem.inchangees, 1);
    assert.equal(appels.length, avant, "aucun appel pour un texte inchangé");

    // 5. Connaissances : la visibilité est revérifiée, une empreinte n'ouvre jamais une source interdite.
    await connaissance.ecrire({ categorie: "procedures", titre: "Procédure véhicule secret", contenu: "Comment préparer une voiture pour la vente.", statut: "confirme" });
    const secret = await pool.query("select id from in_connaissance limit 1");
    await pool.query("update in_connaissance set visibilite='pdg_uniquement' where id=$1", [secret.rows[0].id]);
    await emp.indexer([{ type: "connaissance", id: Number(secret.rows[0].id), texte: "Procédure véhicule secret\nComment préparer une voiture pour la vente." }], { forcer: true });
    const pourInterne = await connaissance.rechercher("quelle auto", ["interne"]);
    assert.ok(!pourInterne.some((x) => x.titre.includes("secret")), "visibilité pdg_uniquement jamais ouverte par le sens");
    const pourPdg = await connaissance.rechercher("quelle auto", ["interne", "pdg_uniquement"]);
    assert.ok(pourPdg.some((x) => x.titre.includes("secret") && x.methode === "semantique"));

    // 6. Échec du fournisseur : la recherche par le sens se retire, la recherche textuelle reste, aucune fuite de clé.
    panne = 404;
    assert.equal(await emp.rechercherParLeSens("memoire", "quelle auto veut-il ?"), null);
    const texte = await memoire.rechercher("Citadine");
    assert.ok(texte.trouvailles.some((t) => t.titre === "Citadine préférée" && !t.methode), "recherche textuelle intacte");
    const echec = await emp.indexer([{ type: "memoire", id: 999, texte: "nouveau texte" }]);
    assert.match(echec.echec ?? "", /^EMBEDDINGS_PROVIDER_404_text-embedding-3-large_model_not_found$/);
    assert.ok(!JSON.stringify(echec).includes("sk-test"), "jamais la clé");

    // 6 bis. Un souvenir remplacé : l'ancienne version (historique) ne remonte plus par le sens.
    panne = null;
    await memoire.ecrire({ categorie: "entreprise", titre: "Citadine préférée", contenu: "Le PDG préfère maintenant une voiture électrique." });
    await attendre();
    const vues = (await memoire.rechercher("quelle auto veut-il")).trouvailles.filter((t) => t.titre === "Citadine préférée");
    assert.equal(vues.length, 1, "une seule version remonte");
    assert.ok(vues[0].extrait.includes("électrique"), "la version active, pas l'ancienne");
    assert.equal((await pool.query("select count(*)::int n from in_empreintes e join in_memoire m on m.id=e.source_id where e.source_type='memoire' and m.cycle<>'actif'")).rows[0].n, 0, "aucune empreinte de version périmée");

    // 6 ter. Les droits s'appliquent AVANT le classement : onze connaissances interdites mieux classées n'évincent pas la permise.
    const permise = await connaissance.ecrire({ categorie: "procedures", titre: "Permise", contenu: "voiture accessible", statut: "confirme" });
    await emp.indexer([{ type: "connaissance", id: permise.id, texte: "voiture accessible" }], { forcer: true });
    await new Promise((r) => setTimeout(r, 30));
    for (let i = 0; i < 11; i++) {
      const k = await connaissance.ecrire({ categorie: "procedures", titre: `Interdite ${i}`, contenu: "voiture réservée", statut: "confirme" });
      await pool.query("update in_connaissance set visibilite='pdg_uniquement' where id=$1", [k.id]);
      await emp.indexer([{ type: "connaissance", id: k.id, texte: "voiture réservée" }], { forcer: true });
    }
    const vue3 = await connaissance.rechercher("quelle auto", ["interne"], 3);
    assert.ok(vue3.some((x) => x.titre === "Permise"), "la connaissance permise n'est pas évincée");
    assert.ok(!vue3.some((x) => x.titre.startsWith("Interdite")), "aucune connaissance interdite");

    // 6 quater. La conversation passe par la recherche globale : le sens doit y arriver aussi.
    const globale = await (await import("../recherche-globale.js")).rechercherGlobale("quelle auto veut-il", 1, { sources: ["memoire_entreprise"] });
    assert.ok(globale.some((x) => x.titre.includes("Citadine préférée")), "le contexte de conversation reçoit le souvenir trouvé par le sens");

    // 6 quinquies. Changement de modèle prouvé par la sonde : les anciennes empreintes ne sont plus « indexées », la reprise les recalcule.
    await pool.query("INSERT INTO in_sondes_openai(capacite, etat, modele, endpoint) VALUES('empreintes_semantiques','FUNCTIONAL','text-embedding-3-small','/v1/embeddings')");
    (await import("../sonde-store.js")).oublierCacheModelesValides();
    const avantChangement = await emp.etatEmpreintes();
    assert.equal(avantChangement.memoire.indexees, 0, "aucune empreinte du nouveau modèle encore");
    const reprise = await emp.reindexerUnLot(96);
    assert.equal(reprise.echec, null);
    assert.equal(reprise.restantes, 0);
    assert.equal(appels.at(-1)?.modele, "text-embedding-3-small");
    assert.equal((await pool.query("select count(*)::int n from in_empreintes where modele <> 'text-embedding-3-small'")).rows[0].n, 0, "anciennes empreintes retirées");
    const apresChangement = await memoire.rechercher("quelle auto veut-il");
    assert.ok(apresChangement.trouvailles.some((t) => t.titre === "Citadine préférée" && t.methode === "semantique"), "recherche par le sens fonctionnelle avec le nouveau modèle");

    // 6 sexies. Le modèle prouvé est refusé, le défaut répond : la reprise ne recalcule pas sans fin.
    await pool.query("UPDATE in_sondes_openai SET modele='text-embedding-3-mini-refuse' WHERE capacite='empreintes_semantiques'");
    (await import("../sonde-store.js")).oublierCacheModelesValides();
    refus = ["text-embedding-3-mini-refuse"];
    const r1 = await emp.reindexerUnLot(96);
    assert.equal(r1.echec, null);
    assert.ok(r1.indexees > 0, "première reprise : recalcul sous le modèle de repli");
    assert.equal(appels.at(-1)?.modele, "text-embedding-3-large", "le repli a répondu");
    const avantR2 = appels.length;
    const r2 = await emp.reindexerUnLot(96);
    assert.equal(r2.restantes, 0, "la deuxième reprise ne trouve plus rien à refaire");
    assert.equal(r2.indexees, 0);
    assert.equal(appels.length, avantR2, "aucun appel facturé de plus");
    refus = [];

    // 6 septies. Calcul en retard : un souvenir remplacé pendant l'indexation ne récupère pas d'empreinte périmée.
    const perime = await memoire.ecrire({ categorie: "entreprise", titre: "Rendez-vous lundi", contenu: "Livraison de la voiture lundi." });
    await attendre();
    await memoire.ecrire({ categorie: "entreprise", titre: "Rendez-vous lundi", contenu: "Livraison de la voiture vendredi." });
    const tardif = await emp.indexer([{ type: "memoire", id: Number(perime.id), texte: "Livraison de la voiture lundi." }], { forcer: true });
    assert.equal(tardif.indexees, 0, "source devenue historique : rien n'est écrit");
    assert.equal((await pool.query("select count(*)::int n from in_empreintes e join in_memoire m on m.id=e.source_id where e.source_type='memoire' and m.cycle<>'actif'")).rows[0].n, 0);
    // Filet : une empreinte périmée qui aurait quand même été écrite est purgée à la reprise.
    await pool.query("INSERT INTO in_empreintes(source_type, source_id, modele, dimensions, hash, vecteur) VALUES('memoire', $1, 'text-embedding-3-large', 1024, 'x', ARRAY[]::real[])", [perime.id]);
    await emp.reindexerUnLot(96);
    assert.equal((await pool.query("select count(*)::int n from in_empreintes where source_type='memoire' and source_id=$1", [perime.id])).rows[0].n, 0, "empreinte périmée purgée");

    // 7. Etat.
    panne = null;
    const etat = await emp.etatEmpreintes();
    assert.equal(etat.active, true);
    assert.equal(etat.memoire.indexees, etat.memoire.total, "tous les souvenirs actifs ont une empreinte");
    assert.equal(etat.connaissances.indexees, etat.connaissances.total);
    assert.ok(THEMES.length === 3);
  } finally {
    globalThis.fetch = fetchOrigine;
    await pool.end();
  }
});
