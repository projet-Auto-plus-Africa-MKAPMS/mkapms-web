/**
 * Journal historique des livraisons : clés uniques, champs complets, aucun motif que les garde-fous du dépôt interdisent,
 * existant intact. Aucune base : lecture des deux registres.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { LIVRAISONS, TOUTES_LES_LIVRAISONS, contenuLivraison } from "../livraisons.js";
import { LIVRAISONS_HISTORIQUE } from "../livraisons-historique.js";
import { CATEGORIES } from "../memoire.js";

const CATEGORIES_ECRITES = new Set(CATEGORIES.filter((c) => c.detenteur === "intelligences").map((c) => c.code));

test("l'existant est conservé et le journal historique s'y ajoute", () => {
  assert.ok(LIVRAISONS.length >= 186, "les entrées déjà en mémoire sont toujours là");
  assert.equal(TOUTES_LES_LIVRAISONS.length, LIVRAISONS.length + LIVRAISONS_HISTORIQUE.length);
  assert.ok(LIVRAISONS_HISTORIQUE.length >= 100);
  // Une entrée existante n'est jamais redéfinie par le journal historique.
  const existantes = new Set(LIVRAISONS.map((l) => l.cle));
  for (const l of LIVRAISONS_HISTORIQUE) assert.equal(existantes.has(l.cle), false, `${l.cle} redéfinit une entrée existante`);
});

test("clés uniques sur l'ensemble, champs renseignés, catégories écrivables", () => {
  const vues = new Set<string>();
  for (const l of TOUTES_LES_LIVRAISONS) {
    assert.equal(vues.has(l.cle), false, `clé en double : ${l.cle}`);
    vues.add(l.cle);
  }
  for (const l of LIVRAISONS_HISTORIQUE) {
    assert.match(l.cle, /^(pr-\d+|commit-[0-9a-f]{8}|recit-[a-z0-9-]+)$/);
    for (const champ of ["titre", "quoi", "pourquoi", "lecon"] as const) assert.ok(l[champ].trim().length > 10, `${l.cle}.${champ}`);
    assert.ok(l.domaine.trim().length >= 3, `${l.cle}.domaine`);
    assert.ok(l.moteurs.length > 0 && l.ou.length > 0, l.cle);
    assert.equal(l.historique, true, l.cle);
    assert.ok(CATEGORIES_ECRITES.has(l.categorie ?? "technique"), `${l.cle} : catégorie ${l.categorie}`);
  }
});

test("les sept récits attendus sont présents, dans les bonnes mémoires", () => {
  const recits = new Map(LIVRAISONS_HISTORIQUE.filter((l) => l.cle.startsWith("recit-")).map((l) => [l.cle, l]));
  const attendus: Record<string, string> = {
    "recit-chantier-chronologie": "projets",
    "recit-methode-de-travail": "apprentissage",
    "recit-problemes-causes-et-solutions": "apprentissage",
    "recit-retours-arriere-et-capacite-manquante": "decisions",
    "recit-journee-1-2-octobre-2026": "projets",
    "recit-regles-permanentes-du-pdg": "decisions",
    "recit-ce-qui-reste-a-faire-au-3-octobre-2026": "projets",
  };
  for (const [cle, categorie] of Object.entries(attendus)) assert.equal(recits.get(cle)?.categorie, categorie, cle);
  // Le manque de retour arrière automatique est dit tel quel : jamais présenté comme disponible.
  const retour = recits.get("recit-retours-arriere-et-capacite-manquante")!;
  assert.match(retour.quoi, /cette capacité n'existe pas/);
  assert.match(retour.quoi, /NON implémentées/);
});

test("aucun motif interdit par les garde-fous (clés et adresses de fournisseurs, identité, e-mails, secrets)", () => {
  const interdits: [RegExp, string][] = [
    // Noms construits par morceaux : ce fichier est lui-même scanné par check:providers.
    [new RegExp(["OPENAI", "ANTHROPIC", "MISTRAL"].map((n) => `${n}_API_KEY`).join("|")), "variable de clé de fournisseur"],
    [/api\.openai\.com|api\.anthropic\.com|api\.mistral\.ai|generativelanguage\.googleapis\.com/, "adresse de fournisseur"],
    [/\bmoussa\b|\bkonat[eé]\b/i, "identité du PDG"],
    [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, "adresse e-mail"],
    [/\bsk-[A-Za-z0-9_-]{16,}|\bgh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}/, "secret"],
    [/postgres(?:ql)?:\/\//, "adresse de base"],
  ];
  for (const l of LIVRAISONS_HISTORIQUE) {
    const texte = [l.titre, l.quoi, l.pourquoi, l.lecon, l.ou.join(" ")].join("\n");
    for (const [motif, nom] of interdits) assert.equal(motif.test(texte), false, `${l.cle} contient ${nom}`);
  }
});

test("fidélité : un message de commit est cité tel quel, et une coupure est marquée", () => {
  const pr332 = LIVRAISONS_HISTORIQUE.find((l) => l.cle === "pr-332");
  if (pr332) assert.match(pr332.quoi, /Origine : PR 332 du 2026-09-15/);
  for (const l of LIVRAISONS_HISTORIQUE.filter((x) => x.cle.startsWith("pr-") || x.cle.startsWith("commit-"))) {
    assert.match(l.quoi, /^Origine : /, l.cle);
    assert.ok(l.quoi.length <= 7600, `${l.cle} trop long`);
  }
});

test("la recherche ne transmet que le début d'une entrée : chaque récit commence par un résumé autonome", () => {
  const recits = LIVRAISONS_HISTORIQUE.filter((l) => l.cle.startsWith("recit-"));
  assert.ok(recits.length >= 45, "récits et sections détaillées");
  for (const l of recits) {
    assert.match(l.quoi, /^RÉSUMÉ — /, l.cle);
    const debut = contenuLivraison(l).slice(0, 300);
    // Le résumé est lisible dans les 300 premiers caractères (après « Moteurs : … Quoi : »).
    const resume = debut.split("RÉSUMÉ — ")[1] ?? "";
    assert.ok(resume.length >= 100 || l.quoi.length < 350, `${l.cle} : résumé trop court dans le début visible (${resume.length})`);
    assert.ok(l.quoi.length <= 4000, `${l.cle} : section trop longue pour rester lisible`);
  }
  // Le point le plus important du récit des retours en arrière est dans le début visible.
  const retour = LIVRAISONS_HISTORIQUE.find((l) => l.cle === "recit-retours-arriere-et-capacite-manquante")!;
  assert.match(contenuLivraison(retour).slice(0, 300), /n'existe PAS encore/);
  // Les sections détaillées sont retrouvables : titre propre à chaque problème.
  const titres = new Set(recits.map((r) => r.titre));
  assert.equal(titres.size, recits.length, "titres uniques");
});
