/**
 * Consignes du PDG, documents de livraison et récit des travaux (connaissances-travaux.ts) + autonomie de travail
 * (CONSIGNE_DIRECTION, regles.ts). Sans base : contenu, unicité, absence de secret, fidélité des copies, limites gardées.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONNAISSANCES_TRAVAUX } from "../connaissances-travaux.js";
import { CONNAISSANCES_BOUTIQUE } from "../connaissances-boutique.js";
import { CONSIGNE_DIRECTION } from "../regles.js";

test("sept entrées : titres uniques (aussi face aux connaissances boutique), courts, sources datées, aucun secret", () => {
  assert.equal(CONNAISSANCES_TRAVAUX.length, 7);
  const tous = [...CONNAISSANCES_TRAVAUX, ...CONNAISSANCES_BOUTIQUE].map((c) => `${c.categorie}|${c.titre}`);
  assert.equal(new Set(tous).size, tous.length);
  for (const c of CONNAISSANCES_TRAVAUX) {
    assert.ok(c.titre.length <= 220 && c.contenu.length > 500 && c.source.length > 10, c.titre);
    assert.ok(!/(?:\bsk-[A-Za-z0-9]|shopsvc_[A-Za-z0-9_-]{20}|-----BEGIN|password\s*[:=]|mot de passe\s*[:=])/i.test(c.contenu), `secret apparent dans « ${c.titre} »`);
  }
});

test("consignes du PDG reproduites mot pour mot (phrases clés intactes)", () => {
  const un = CONNAISSANCES_TRAVAUX.find((c) => c.titre.includes("1er–2 octobre"))!.contenu;
  const deux = CONNAISSANCES_TRAVAUX.find((c) => c.titre.includes("(2 octobre 2026) : réponse"))!.contenu;
  for (const phrase of [
    "Ne jamais inventer une caractéristique absente des données disponibles.",
    "Le stock ne doit plus rester affiché UNKNOWN lorsqu'une correspondance existe dans le flux live.",
    "produit A = 1 colis",
    "Le prix fournisseur interne Cars4Kids ne doit jamais être affiché au client.",
    "ne jamais modifier le produit lui-même au point de présenter quelque chose de différent de ce qui est réellement vendu",
  ]) {
    assert.ok(un.includes(phrase), phrase);
  }
  for (const phrase of [
    "Ne bloque pas le chantier en attendant que je fournisse manuellement les taux de TVA de chaque pays.",
    "un produit nécessitant 2 colis, acheté en quantité 2 = 4 colis à calculer.",
    "Prix fournisseur : il reste strictement interne et n'est jamais publié.",
  ]) {
    assert.ok(deux.includes(phrase), phrase);
  }
});

test("documents de livraison copiés tels quels, récit honnête sur ce qui reste", () => {
  const photos = CONNAISSANCES_TRAVAUX.find((c) => c.titre.includes("Photos fournisseur"))!.contenu;
  assert.ok(photos.includes("Aucune route ne supprime ni ne modifie un original."));
  assert.ok(photos.includes("la tâche reste `BLOCKED` « droits manquants »"));
  const stock = CONNAISSANCES_TRAVAUX.find((c) => c.titre.includes("Stock en direct"))!.contenu;
  assert.ok(stock.includes("Aucun taux n'est livré avec le code."));
  assert.ok(stock.includes("checkoutReady"));
  const recit = CONNAISSANCES_TRAVAUX.find((c) => c.titre.startsWith("Récit des travaux"))!.contenu;
  for (const pr of ["#71", "#72", "#73", "#74", "#75", "#530", "#531", "#532"]) assert.ok(recit.includes(pr), pr);
  assert.ok(recit.includes("Ce qui reste, à ne pas présenter comme fait."));
  assert.ok(recit.includes("Taux de TVA par pays avec leur source (aucun n'est livré)"));
});

test("autonomie : consigne directe, enchaînement, solutions de repli — et limites intactes", () => {
  assert.ok(CONSIGNE_DIRECTION.includes("Autonomie de travail"));
  assert.ok(CONSIGNE_DIRECTION.includes("fais-le directement"));
  assert.ok(CONSIGNE_DIRECTION.includes("cherche une autre solution"));
  assert.ok(!CONSIGNE_DIRECTION.includes("explique d'abord ce que tu vas faire"));
  for (const limite of [
    "n'invente jamais une donnée",
    "ne publie, n'approuve, ne paie, ne déploie pas",
    "ne fais jamais passer un secret par la conversation",
    "n'affirme jamais avoir fait ce qu'un outil n'a pas confirmé",
  ]) {
    assert.ok(CONSIGNE_DIRECTION.includes(limite), limite);
  }
  const autonomie = CONNAISSANCES_TRAVAUX.find((c) => c.titre.startsWith("Autonomie de travail"))!.contenu;
  assert.ok(autonomie.includes("Limites qui ne bougent pas"));
});
