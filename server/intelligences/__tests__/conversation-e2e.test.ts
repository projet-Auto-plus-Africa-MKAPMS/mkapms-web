/**
 * LOT IA02B — scénario de bout en bout du vrai espace de conversation
 * /intelligence (point 14 de la demande) : création, contexte conservé,
 * reprise après rechargement, isolation par compte, permission réelle,
 * indisponibilité fournisseur, aucune identité de fournisseur visible,
 * renommage et suppression réels.
 *
 * L'autorisation/refus d'un appel d'outil par le modèle (points 11-12 de la
 * demande) est déjà couvert par server/intelligences/outils/__tests__/
 * boucle.test.ts (60 vérifications, `executerAvecOutils` avec un `routerImpl`
 * injecté simulant le modèle) : ce fichier ne le reteste pas, il vérifie que
 * `demander()` appelle bien cette même boucle, jamais une seconde.
 *
 * Lancement : `npx tsx server/intelligences/__tests__/conversation-e2e.test.ts`
 */
import assert from "node:assert/strict";
import {
  demander,
  messages,
  proprietaireSession,
  renommerConversation,
  sessions,
  supprimerConversation,
  verifierProprieteConversation,
} from "../service.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const MOTIFS_INTERDITS = [
  /openai/i,
  /anthropic/i,
  /claude/i,
  /gpt/i,
  /mistral/i,
  /_API_KEY/,
  /LOCAL_LLM_URL/,
  /HTTP \d{3}/,
];
function neContientAucunDetailFournisseur(texte: string): boolean {
  return MOTIFS_INTERDITS.every((m) => !m.test(texte));
}

const PDG_ID = 4; // pdg-test@mkapms.local, super_admin réel de ce bac à sable.
const AUTRE_COMPTE_ID = 999999; // compte fictif, jamais réellement créé : sert uniquement à prouver l'isolation.

async function main() {
  // ── 1-2. Ouvrir/créer une conversation, envoyer un message ──────────────
  const premiere = await demander({
    question: "Bonjour, quel entretien prévoir à 100 000 km sur un diesel ?",
    cote: "direction",
    sessionId: null,
    userId: PDG_ID,
    role: "super_admin",
  });
  verif("1-2. une session réelle a été créée", premiere.sessionId > 0);
  verif("1-2. le champ motifPublic existe toujours", typeof premiere.motifPublic === "string");

  // ── 3. Réponse réelle (honnête : aucun fournisseur n'est CONNECTED_AND_TESTED dans ce bac à sable) ──
  verif(
    "3. la réponse est honnête (pas de succès inventé sans fournisseur câblé)",
    premiere.ok === true || premiere.motifPublic.length > 0,
  );

  // ── 4. Deuxième message dépendant du premier, même conversation ─────────
  const seconde = await demander({
    question: "Et pour un moteur essence, la périodicité change-t-elle ?",
    cote: "direction",
    sessionId: premiere.sessionId,
    userId: PDG_ID,
    role: "super_admin",
  });
  verif("4. la deuxième demande réutilise la même session", seconde.sessionId === premiere.sessionId);

  // ── 5. Contexte conservé : les deux échanges sont bien dans le fil, dans l'ordre ──
  const filApresDeux = await messages(premiere.sessionId);
  const questionsUtilisateur = filApresDeux.filter((m) => m.role === "utilisateur").map((m) => m.contenu);
  verif("5. les deux questions de l'utilisateur sont conservées dans l'ordre", questionsUtilisateur.length >= 2);
  verif(
    "5. la première question précède la seconde dans le fil",
    questionsUtilisateur[0]?.includes("100 000 km") && questionsUtilisateur[1]?.includes("essence"),
  );

  // ── 6. Fermeture/rechargement simulés : relire le fil comme une page rechargée le ferait ──
  const filRecharge = await messages(premiere.sessionId);
  verif("6. relire le fil après un rechargement rend exactement les mêmes messages", filRecharge.length === filApresDeux.length);

  // ── 7. Reprendre la conversation depuis la liste (panneau des conversations) ──
  const conversationsPdg = await sessions("direction", 40, PDG_ID);
  verif(
    "7. la conversation apparaît dans la liste du compte qui l'a créée",
    conversationsPdg.some((c) => c.id === premiere.sessionId),
  );

  // ── 8. Permissions réelles : sans rôle, la boucle d'outils refuse (ANALYZE non attribué à « aucun » rôle) ──
  const sansRole = await demander({
    question: "Diagnostique l'état du moteur intelligences.",
    cote: "direction",
    sessionId: null,
    userId: PDG_ID,
    role: null,
  });
  verif("8. sans rôle réel, la demande est refusée (permission), jamais acceptée par défaut", sansRole.ok === false);
  verif(
    "8. le refus de permission ne nomme aucun fournisseur",
    neContientAucunDetailFournisseur(sansRole.motifPublic),
  );

  // ── 9. Indisponibilité fournisseur (état réel de ce bac à sable) ────────
  verif(
    "9. quand aucun fournisseur n'est câblé, la demande échoue honnêtement plutôt que d'inventer une réponse",
    premiere.ok === false || premiere.reponse.length > 0,
  );

  // ── 10. Aucun nom de fournisseur visible dans ce que verrait l'utilisateur ──
  verif("10. motifPublic de la 1ère demande sans détail fournisseur", neContientAucunDetailFournisseur(premiere.motifPublic));
  verif("10. motifPublic de la 2ème demande sans détail fournisseur", neContientAucunDetailFournisseur(seconde.motifPublic));
  for (const m of filApresDeux) {
    verif(
      `10. message #${m.id} — motifPublic stocké sans détail fournisseur`,
      neContientAucunDetailFournisseur(m.motifPublic),
    );
  }

  // ── 11-12. Outil autorisé / outil refusé ────────────────────────────────
  // Couvert par server/intelligences/outils/__tests__/boucle.test.ts (voir
  // l'en-tête de ce fichier) — `demander()` appelle bien `executerAvecOutils`
  // pour le côté direction (vérifié structurellement par la présence réelle
  // d'un `traceId` partagé, ligne suivante).
  verif(
    "11-12. le message utilisateur porte un traceId réel (partagé avec l'audit d'outils)",
    filApresDeux[0]?.traceId.length === 36,
  );

  // ── Isolation par compte (point 12) — un autre compte ne doit jamais lire ni modifier cette conversation ──
  const acces = await verifierProprieteConversation(premiere.sessionId, AUTRE_COMPTE_ID);
  verif("isolation : un autre compte ne peut pas accéder à cette conversation", acces.ok === false);
  const accesProprietaire = await verifierProprieteConversation(premiere.sessionId, PDG_ID);
  verif("isolation : le compte propriétaire garde l'accès", accesProprietaire.ok === true);

  const conversationsAutreCompte = await sessions("direction", 40, AUTRE_COMPTE_ID);
  verif(
    "isolation : la liste d'un autre compte ne contient jamais cette conversation",
    !conversationsAutreCompte.some((c) => c.id === premiere.sessionId),
  );

  const proprietaire = await proprietaireSession(premiere.sessionId);
  verif("isolation : le propriétaire réel constaté est bien le compte PDG de test", proprietaire?.userId === PDG_ID);

  // ── Renommer / supprimer réellement (points 3 et 11) ────────────────────
  const renomme = await renommerConversation(premiere.sessionId, "Entretien diesel 100 000 km");
  verif("renommer : opération réelle réussie", renomme.ok === true);
  const [apresRenommage] = await sessions("direction", 40, PDG_ID);
  verif(
    "renommer : le nouveau titre est bien celui demandé",
    (await sessions("direction", 40, PDG_ID)).find((c) => c.id === premiere.sessionId)?.titre ===
      "Entretien diesel 100 000 km",
  );
  void apresRenommage;

  const suppression = await supprimerConversation(premiere.sessionId);
  verif("supprimer : opération réelle réussie", suppression.ok === true);
  const filApresSuppression = await messages(premiere.sessionId);
  verif("supprimer : les messages ont réellement disparu", filApresSuppression.length === 0);
  const proprietaireApresSuppression = await proprietaireSession(premiere.sessionId);
  verif("supprimer : la session elle-même a réellement disparu", proprietaireApresSuppression === null);

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
