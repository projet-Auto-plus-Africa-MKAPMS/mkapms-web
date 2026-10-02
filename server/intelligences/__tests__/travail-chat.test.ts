/**
 * Chat et Travail (décision du PDG, 2 octobre 2026) : même mémoire et même fonction, le Chat renseigne sans agir, le Travail
 * exécute. Et l'Agent développeur n'est plus arrêté d'emblée par un moteur sans permission (« ANALYZE exigée »).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { defautMoteur } from "../permissions.js";
import { listerActifs, listerActifsPourMode } from "../outils/registre.js";
import { classerObjectif } from "../orchestrateur.js";
import { CONSIGNE_MODE_CHAT, CONSIGNE_MODE_TRAVAIL } from "../regles.js";

test("le moteur de l'orchestrateur reçoit ANALYZE et PROPOSE (pas WRITE, TEST, DEPLOY ni plus)", () => {
  const p = defautMoteur("intelligences_orchestrateur");
  assert.ok(p.includes("READ") && p.includes("ANALYZE") && p.includes("PROPOSE"));
  for (const interdit of ["WRITE", "TEST", "DEPLOY", "FINANCIAL", "ADMINISTRATION", "INFRASTRUCTURE"]) {
    assert.equal(p.includes(interdit as never), false, interdit);
  }
});

test("Chat : aucun outil qui agit ; Travail : tous les outils actifs", () => {
  const chat = listerActifsPourMode("chat");
  const travail = listerActifsPourMode("travail");
  assert.equal(travail.length, listerActifs().length);
  assert.ok(chat.length > 0 && chat.length < travail.length);
  for (const o of chat) {
    for (const p of o.requiredPermissions) assert.ok(["READ", "ANALYZE", "PROPOSE"].includes(p), `${o.toolId} exige ${p}`);
  }
  const noms = (l: { toolId: string }[]) => l.map((o) => o.toolId);
  // Lecture et mémoire restent au Chat (même mémoire des deux côtés).
  for (const id of ["boutique.capacites", "boutique.listerProduits", "boutique.lireProduit", "memory.write", "rag.answer", "automobile.rechercherMemoire"]) {
    assert.ok(noms(chat).includes(id), `${id} au chat`);
  }
  // Ce qui agit dans la boutique n'existe qu'en Travail.
  for (const id of ["boutique.lancerPhotos", "boutique.proposerFiche"]) {
    assert.equal(noms(chat).includes(id), false, `${id} absent du chat`);
    assert.ok(noms(travail).includes(id), `${id} au travail`);
  }
});

test("consignes d'environnement : le Chat renvoie vers Travail, le Travail exécute et ne ment pas", () => {
  assert.match(CONSIGNE_MODE_CHAT, /CHAT/);
  assert.match(CONSIGNE_MODE_CHAT, /mode « Travail »/);
  assert.match(CONSIGNE_MODE_CHAT, /même mémoire/);
  assert.match(CONSIGNE_MODE_TRAVAIL, /TRAVAIL/);
  assert.match(CONSIGNE_MODE_TRAVAIL, /même mémoire/);
  assert.match(CONSIGNE_MODE_TRAVAIL, /N'annonce jamais qu'une action est faite si aucun outil/);
});

test("classement : le travail de la boutique va à la boucle d'outils, un chantier de code reste un chantier de code", () => {
  for (const o of ["Est-ce que tu peux analyser la boutique ?", "Lance les photos du produit Cars4Kids", "Prépare la fiche produit de la voiture électrique", "Calcule les colis du panier"]) {
    assert.equal(classerObjectif(o).domaine, "boutique", o);
  }
  for (const o of ["Corrige le bug du bouton de la boutique", "Répare le formulaire de paiement", "Ajoute une route dans le code de la boutique"]) {
    assert.notEqual(classerObjectif(o).domaine, "boutique", o);
  }
});
