/**
 * Mémoire des travaux : un échange avec le PDG laisse des faits durables dans la mémoire d'entreprise,
 * jamais un secret, jamais une catégorie étrangère, jamais bloquant. Dépendances injectées : aucune base requise.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleSujet, contientSecret, echangeSubstantiel, faitsDepuisReponse, memoriserTravail } from "../apprentissage-travail.js";
import { FONCTIONS } from "../fonctions.js";

const reponseModele = (faits: unknown) => ({ ok: true, texte: JSON.stringify({ faits }) }) as never;

test("la fonction « mémoire des travaux » existe, allumée par défaut, avec sa précaution dite", () => {
  const f = FONCTIONS.find((x) => x.code === "memoire_travail");
  assert.ok(f);
  assert.equal(f!.activeParDefaut, true);
  assert.match(f!.precaution, /jamais de mot de passe/);
});

test("secrets : l'échange est écarté en bloc, pas seulement masqué", () => {
  for (const t of ["ma clé sk-" + "a".repeat(30), "ghp_" + "A".repeat(30), "Bearer abcdefghijklmnop1234", "mot de passe : Hunter2000!", "token=abcdef123456", "-----BEGIN RSA PRIVATE KEY-----"]) {
    assert.equal(contientSecret(t), true, t);
  }
  for (const t of ["Les mots de passe sont dans le Coffre", "On finalise les produits Cars4Kids", "Le jeton GitHub est déposé"]) assert.equal(contientSecret(t), false, t);
});

test("échange trivial : aucun appel de modèle", () => {
  assert.equal(echangeSubstantiel("Salut", "Bonjour ! Comment puis-je t'aider aujourd'hui avec la plateforme ?"), false);
  assert.equal(echangeSubstantiel("On décide que les photos Cars4Kids restent privées jusqu'à validation", "Noté."), false);
  assert.equal(echangeSubstantiel("On décide que les photos Cars4Kids restent privées jusqu'à validation", "C'est noté : elles ne seront publiées qu'après ta validation."), true);
});

test("sortie du modèle : au plus 3 faits valides, catégories autorisées, sans secret", () => {
  const faits = faitsDepuisReponse(JSON.stringify({ faits: [
    { categorie: "decisions", titre: "Photos Cars4Kids privées", contenu: "Le PDG décide que les photos restent privées jusqu'à sa validation." },
    { categorie: "code", titre: "Catégorie étrangère", contenu: "Cette catégorie appartient à un autre moteur : refusée." },
    { categorie: "projets", titre: "Avec un secret", contenu: "La clé est sk-" + "b".repeat(30) + " pour le test." },
    { categorie: "technique", titre: "Court", contenu: "x" },
    { categorie: "projets", titre: "Boutique : livraison", contenu: "La livraison Cars4Kids est calculée par colis, hors TVA." },
    { categorie: "entreprise", titre: "Quatrième fait", contenu: "Ignoré : au plus trois faits par échange, même valides." },
    { categorie: "entreprise", titre: "Cinquième fait", contenu: "Ignoré lui aussi, par la même limite." },
  ] }));
  assert.deepEqual(faits.map((f) => f.categorie), ["decisions"]);
  assert.equal(faits.length, 1, "les 3 premiers sont examinés : 1 valide, 1 catégorie étrangère, 1 avec secret");
  assert.deepEqual(faitsDepuisReponse("pas du json"), []);
  assert.deepEqual(faitsDepuisReponse('{"faits":"non"}'), []);
  assert.equal(faitsDepuisReponse('```json\n{"faits":[{"categorie":"projets","titre":"Titre assez long","contenu":"Contenu assez long pour être gardé."}]}\n```').length, 1);
});

test("même sujet = même clé (le précédent passe en historique), sujets différents = clés différentes", () => {
  assert.equal(cleSujet("Photos Cars4Kids : privées !"), cleSujet("photos cars4kids privées"));
  assert.notEqual(cleSujet("Livraison par colis"), cleSujet("Photos privées"));
  assert.match(cleSujet("Été — décision"), /^travail:ete-decision$/);
});

test("échange réel : les faits durables sont écrits avec leur provenance ; éteint ou en panne = rien d'écrit, sans erreur", async () => {
  const ecrits: any[] = [];
  const ecrire = (async (x: any) => { ecrits.push(x); return { ok: true, detail: "", id: ecrits.length }; }) as never;
  const echange = { sessionId: 42, traceId: "trace-1", question: "On décide que les photos Cars4Kids restent privées jusqu'à ma validation", reponse: "C'est noté : elles ne seront publiées qu'après ta validation explicite.", outils: ["Outil appelé : boutique.lire — autorisé/ok — lecture du catalogue"] };
  let message = "";
  const n = await memoriserTravail(echange, {
    fonctionActive: async () => true, ecrire,
    appeler: (async (input: any) => { message = input.message; return reponseModele([{ categorie: "decisions", titre: "Photos Cars4Kids privées", contenu: "Le PDG décide que les photos restent privées jusqu'à sa validation explicite." }]); }) as never,
  });
  assert.equal(n, 1);
  assert.equal(ecrits[0].categorie, "decisions");
  assert.match(ecrits[0].cle, /^travail:photos-cars4kids-privees$/);
  assert.equal(ecrits[0].source, "conversation-travail");
  assert.deepEqual(ecrits[0].liens, { session: "42", trace: "trace-1" });
  assert.match(ecrits[0].contenu, /conversation #42/);
  assert.match(message, /Outil appelé : boutique\.lire/);
  assert.match(message, /non vérifiée/, "la réponse de l'assistant est présentée comme non vérifiée au modèle");

  ecrits.length = 0;
  assert.equal(await memoriserTravail(echange, { fonctionActive: async () => false, ecrire, appeler: (async () => { throw Error("ne doit pas être appelé"); }) as never }), 0);
  assert.equal(await memoriserTravail(echange, { fonctionActive: async () => true, ecrire, appeler: (async () => ({ ok: false, texte: "" })) as never }), 0);
  assert.equal(await memoriserTravail(echange, { fonctionActive: async () => true, ecrire, appeler: (async () => { throw Error("fournisseur en panne"); }) as never }), 0);
  assert.equal(await memoriserTravail({ ...echange, question: "Voici ma clé sk-" + "c".repeat(30) + " pour que tu testes l'API ensuite" }, { fonctionActive: async () => true, ecrire, appeler: (async () => { throw Error("ne doit pas être appelé"); }) as never }), 0);
  assert.equal(await memoriserTravail({ ...echange, question: "Salut", reponse: "Bonjour" }, { fonctionActive: async () => true, ecrire, appeler: (async () => { throw Error("ne doit pas être appelé"); }) as never }), 0);
  assert.equal(ecrits.length, 0);
});
