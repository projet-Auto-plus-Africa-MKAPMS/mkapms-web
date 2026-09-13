/**
 * LOT IA02F — Mémoire, fichiers, recherche et RAG : tests réels, base de
 * données réelle. Couvre les scénarios de sécurité (point 24) et RAG
 * (point 25) obligatoires.
 *
 * Aucun fournisseur de modèle n'est câblé et testé dans ce bac à sable (même
 * constat que tous les tests précédents de ce dépôt) : les scénarios qui
 * dépendent d'un appel modèle (résumé de conversation, rag.answer) tolèrent
 * un échec fournisseur honnête sans jamais accepter un texte inventé à la
 * place — même principe que server/intelligences/__tests__/generation-code.test.ts.
 *
 * Lancement : `npx tsx server/intelligences/__tests__/memoire-fichiers-rag.test.ts`
 */
import assert from "node:assert/strict";
import { db } from "../../db.js";
import { inConnaissance, inFichierMorceaux, inFichiers, inMemoireProjet, inMemoireUtilisateur, inProjets } from "../schema.js";
import { eq } from "drizzle-orm";
import * as memoireUtilisateur from "../memoire-utilisateur.js";
import * as memoireProjet from "../memoire-projet.js";
import * as fichiers from "../fichiers.js";
import * as connaissance from "../connaissance.js";
import { rechercherGlobale } from "../recherche-globale.js";
import { retrieve, answer } from "../rag.js";
import { creerProjet } from "../chantier/projets.js";
import { promises as fsp } from "node:fs";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const PDG_ID = 4;
const AUTRE_COMPTE_ID = 999999; // jamais réellement créé : sert uniquement à prouver l'isolation.

async function nettoyer() {
  await db.delete(inMemoireUtilisateur).where(eq(inMemoireUtilisateur.userId, PDG_ID));
  const fichiersDePdg = await db.select({ id: inFichiers.id }).from(inFichiers).where(eq(inFichiers.ownerId, PDG_ID));
  for (const f of fichiersDePdg) {
    await db.delete(inFichierMorceaux).where(eq(inFichierMorceaux.fichierId, f.id));
  }
  await db.delete(inFichiers).where(eq(inFichiers.ownerId, PDG_ID));
  await db.delete(inConnaissance).where(eq(inConnaissance.auteur, "test-ia02f"));
  const projetsDeTest = await db.select({ id: inProjets.id }).from(inProjets).where(eq(inProjets.nom, "Projet test IA02F"));
  for (const p of projetsDeTest) {
    await db.delete(inMemoireProjet).where(eq(inMemoireProjet.projetId, p.id));
    await db.delete(inProjets).where(eq(inProjets.id, p.id));
  }
}

async function main() {
  await nettoyer();

  // ── 1. User Memory : isolation stricte, jamais un accès cross-compte ──────
  const entree = await memoireUtilisateur.ecrire({ userId: PDG_ID, categorie: "preference", cle: "test-ia02f-cle", contenu: "valeur secrète du PDG" });
  verif("1. écriture réelle en base", entree.id > 0);

  const lueParProprietaire = await memoireUtilisateur.lister(PDG_ID);
  verif("1. le propriétaire retrouve sa propre entrée", lueParProprietaire.some((e) => e.id === entree.id));

  await assert.rejects(() => memoireUtilisateur.modifier({ id: entree.id, userId: AUTRE_COMPTE_ID, contenu: "piraté" }), /autre compte|introuvable/i);
  verif("1. un autre compte ne peut pas modifier l'entrée", true);

  await assert.rejects(() => memoireUtilisateur.supprimer(entree.id, AUTRE_COMPTE_ID), /autre compte|introuvable/i);
  verif("1. un autre compte ne peut pas supprimer l'entrée", true);

  const lueParAutre = await memoireUtilisateur.lister(AUTRE_COMPTE_ID);
  verif("1. cross_user_memory_access = 0 : l'autre compte ne voit jamais l'entrée du PDG", !lueParAutre.some((e) => e.id === entree.id));

  // ── 2. Project Memory : isolation par projet, jamais cross-projet ────────
  const projet = await creerProjet({ ownerId: PDG_ID, nom: "Projet test IA02F" });
  const ligneProjet = await memoireProjet.ecrire({ projetId: projet.id, ownerId: PDG_ID, type: "decision", titre: "Décision test", contenu: "Choix technique réel." });
  verif("2. écriture réelle en base pour le projet", ligneProjet.id > 0);

  const lueParProprietaireProjet = await memoireProjet.lire(projet.id, PDG_ID);
  verif("2. le propriétaire du projet retrouve l'entrée", lueParProprietaireProjet.some((e) => e.id === ligneProjet.id));

  await assert.rejects(() => memoireProjet.lire(projet.id, AUTRE_COMPTE_ID), /autre compte|introuvable/i);
  verif("2. cross_project_document_access = 0 : un autre compte ne lit pas la mémoire d'un projet qui n'est pas le sien", true);

  await assert.rejects(() => memoireProjet.ecrire({ projetId: projet.id, ownerId: AUTRE_COMPTE_ID, type: "decision", titre: "x", contenu: "x" }), /autre compte|introuvable/i);
  verif("2. un autre compte ne peut pas écrire dans la mémoire d'un projet qui n'est pas le sien", true);

  // ── 3. Pipeline fichier : réel, honnête, jamais « prêt » sur un échec ────
  const texteReel = "Le contrat de transport prévoit un montant de 4200 euros pour la livraison Paris vers Conakry.\n\nCette clause est confirmée par les deux parties.";
  const fichierTxt = await fichiers.deposer({ ownerId: PDG_ID, nom: "contrat-test.txt", typeMime: "text/plain", donneesBase64: Buffer.from(texteReel, "utf8").toString("base64") });
  verif("3. fichier texte : pipeline atteint ready_for_rag", fichierTxt.statutPipeline === "ready_for_rag");

  const fichierNonSupporte = await fichiers.deposer({ ownerId: PDG_ID, nom: "archive.zip", typeMime: "application/zip", donneesBase64: Buffer.from("PK\x03\x04").toString("base64") });
  verif("3. type non supporté : failed, jamais ready_for_rag sur un type inconnu", fichierNonSupporte.statutPipeline === "failed" && fichierNonSupporte.erreur.length > 0);

  const pdfCorrompu = await fichiers.deposer({ ownerId: PDG_ID, nom: "corrompu.pdf", typeMime: "application/pdf", donneesBase64: Buffer.from("ceci n'est pas un vrai PDF").toString("base64") });
  verif("3. fichier corrompu : failed avec erreur réelle, jamais un crash ni un texte inventé", pdfCorrompu.statutPipeline === "failed" && pdfCorrompu.erreur.length > 0);

  const tropGros = Buffer.alloc(21 * 1024 * 1024, "a").toString("base64");
  await assert.rejects(() => fichiers.deposer({ ownerId: PDG_ID, nom: "trop-gros.txt", typeMime: "text/plain", donneesBase64: tropGros }), /volumineux/i);
  verif("3. fichier trop volumineux : refusé explicitement", true);

  // ── 4. Isolation fichiers : jamais un fichier d'un autre compte ─────────
  await assert.rejects(() => fichiers.lireFichier(fichierTxt.id, AUTRE_COMPTE_ID), /autre compte|introuvable/i);
  verif("4. un autre compte ne peut pas lire le fichier du PDG", true);

  await assert.rejects(() => fichiers.supprimerFichier(fichierTxt.id, AUTRE_COMPTE_ID), /autre compte|introuvable/i);
  verif("4. un autre compte ne peut pas supprimer le fichier du PDG", true);

  const rechercheAutreCompte = await fichiers.rechercherDansFichiers("4200 euros", AUTRE_COMPTE_ID);
  verif("4. private_document_leakage = 0 : un autre compte ne retrouve jamais ce fichier par recherche", rechercheAutreCompte.length === 0);

  const rechercheProprietaire = await fichiers.rechercherDansFichiers("4200 euros", PDG_ID);
  verif("4. le propriétaire retrouve bien son fichier par recherche plein texte réelle", rechercheProprietaire.some((r) => r.fichierId === fichierTxt.id));

  // ── 5. Document supprimé : plus jamais retrouvé ─────────────────────────
  await fichiers.supprimerFichier(fichierTxt.id, PDG_ID);
  const rechercheApresSuppression = await fichiers.rechercherDansFichiers("4200 euros", PDG_ID);
  verif("5. document supprimé : introuvable en recherche après suppression", !rechercheApresSuppression.some((r) => r.fichierId === fichierTxt.id));

  // ── 6. Document non indexé jamais présenté comme cherchable ─────────────
  verif(
    "6. documents_marked_ready_without_index = 0 : le fichier non supporté n'est jamais ready_for_rag",
    fichierNonSupporte.statutPipeline !== "ready_for_rag" && pdfCorrompu.statutPipeline !== "ready_for_rag",
  );

  // ── 7-9. RAG : retrieval réel, citations, jamais un montant inventé sans source ──
  const fichierRag = await fichiers.deposer({
    ownerId: PDG_ID,
    nom: "devis-test-rag.txt",
    typeMime: "text/plain",
    donneesBase64: Buffer.from("Le devis de réparation du véhicule Renault Clio s'élève à 850 euros TTC, validé le 12 mars.", "utf8").toString("base64"),
  });
  verif("7. fichier RAG déposé et indexé", fichierRag.statutPipeline === "ready_for_rag");

  const retrievalAvecSource = await retrieve({ query: "montant du devis de réparation Renault Clio", userId: PDG_ID });
  verif("7. rag.retrieve trouve une citation réelle quand la source existe", retrievalAvecSource.citations.length > 0);
  verif("7. chaque citation porte sourceType, sourceId, titre, extrait, score — traçabilité complète (point 11)", retrievalAvecSource.citations.every((c) => c.sourceType && c.sourceId !== undefined && c.titre && c.score >= 0));
  verif("7. méthode déclarée honnêtement lexicale, jamais présentée comme sémantique", retrievalAvecSource.methode === "lexical");

  const retrievalSansSource = await retrieve({ query: "xyzzy-mot-totalement-absent-de-toute-source-987654", userId: PDG_ID });
  verif("8. rag.retrieve : aucune citation quand rien ne correspond (aucune donnée inventée)", retrievalSansSource.citations.length === 0);

  const reponseSansSource = await answer({ query: "xyzzy-mot-totalement-absent-de-toute-source-987654", userId: PDG_ID });
  verif("8. rag.answer : SOURCE_NOT_FOUND explicite quand aucune source ne correspond, jamais un texte inventé", reponseSansSource.status === "source_not_found" && reponseSansSource.reponse === null);

  const reponseAvecSource = await answer({ query: "montant du devis de réparation Renault Clio", userId: PDG_ID });
  verif(
    "9. rag.answer avec source réelle : soit une vraie réponse citée, soit un échec fournisseur honnête (aucun fournisseur câblé dans ce bac à sable) — jamais un statut inconnu",
    (reponseAvecSource.status === "ok" && typeof reponseAvecSource.reponse === "string" && reponseAvecSource.citations.length > 0) ||
      (reponseAvecSource.status === "insufficient_source_data" && reponseAvecSource.reponse === null),
  );

  // ── 10. RAG : jamais un fichier d'un autre compte dans le retrieval ─────
  const retrievalAutreCompte = await retrieve({ query: "montant du devis de réparation Renault Clio", userId: AUTRE_COMPTE_ID });
  verif("10. rag.retrieve isolé par compte : l'autre compte ne retrouve jamais le fichier du PDG", retrievalAutreCompte.citations.length === 0);

  // ── 11. Recherche globale : agrège plusieurs sources, isolée par compte ──
  const rechercheGlobalePdg = await rechercherGlobale("devis réparation", PDG_ID, { sources: ["fichier"] });
  verif("11. recherche globale retrouve le fichier du PDG", rechercheGlobalePdg.some((r) => r.source === "fichier"));
  const rechercheGlobaleAutre = await rechercherGlobale("devis réparation", AUTRE_COMPTE_ID, { sources: ["fichier"] });
  verif("11. recherche globale isolée : l'autre compte ne retrouve rien du PDG", rechercheGlobaleAutre.length === 0);

  await fichiers.supprimerFichier(fichierRag.id, PDG_ID);

  // ── 12. Knowledge Base : catégorie islamique toujours pdg_uniquement à l'écriture ──
  const savoirSensible = await connaissance.ecrire({ categorie: "connaissance_islamique", titre: "Test architecture", contenu: "Contenu de test, architecture uniquement.", auteur: "test-ia02f", statut: "confirme" });
  verif("12. connaissance_islamique forcée en pdg_uniquement même sans le demander explicitement", savoirSensible.visibilite === "pdg_uniquement");

  const visibleAvecAccesPdg = await connaissance.lister("connaissance_islamique", ["interne", "pdg_uniquement"]);
  verif("12. visible avec l'accès pdg_uniquement", visibleAvecAccesPdg.some((e) => e.id === savoirSensible.id));

  const visibleSansAccesPdg = await connaissance.lister("connaissance_islamique", ["interne"]);
  verif("12. invisible sans l'accès pdg_uniquement (permission réellement appliquée, pas juste déclarée)", !visibleSansAccesPdg.some((e) => e.id === savoirSensible.id));

  await db.delete(inConnaissance).where(eq(inConnaissance.id, savoirSensible.id));

  // ── 13. Conversation resume : jamais bloquant, jamais un texte inventé sur échec fournisseur ──
  // (couvert fonctionnellement par server/intelligences/__tests__/conversation-e2e.test.ts,
  // qui exerce déjà demander() de bout en bout ; ici on vérifie seulement l'absence de crash
  // de resumerSiNecessaire sur un flux réel, sans dupliquer ce test.)
  const { resumerSiNecessaire, resumeActif } = await import("../conversation-resume.js");
  await resumerSiNecessaire(999999999, "test-trace-ia02f");
  const resumeInexistant = await resumeActif(999999999);
  verif("13. résumé absent pour une session inexistante : aucune ligne fabriquée", resumeInexistant === null);

  await nettoyer();
  const dirTest = projet.workspacePath;
  await fsp.rm(dirTest, { recursive: true, force: true }).catch(() => {});

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
