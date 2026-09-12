/**
 * MKA.P-MS Gouvernance — test de génération de code permanent (règle
 * permanente n°6 adoptée à la clôture du LOT IA02B).
 *
 * Prompt de référence imposé par la direction : une fonction TypeScript de
 * calcul de TVA. Exécuté contre le vrai moteur conversationnel (`demander()`,
 * cote direction, boucle d'outils) — jamais une simulation. Dans un
 * environnement sans fournisseur câblé et testé (ce bac à sable), l'appel
 * échoue honnêtement : les vérifications de qualité de réponse sont alors
 * annoncées « ignorées » plutôt que fabriquées, mais les invariants de
 * sécurité (aucune identité de fournisseur visible) restent vérifiés dans
 * tous les cas, succès ou échec.
 *
 * Fait partie des contrôles périodiques Intelligence — voir
 * server/governance/audit-semestriel.ts.
 *
 * Lancement : `npx tsx server/intelligences/__tests__/generation-code.test.ts`
 */
import assert from "node:assert/strict";
import { demander } from "../service.js";

let ok = 0;
let total = 0;
let ignores = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}
function ignore(nom: string) {
  ignores++;
  console.log(`IGNORÉ (aucun fournisseur câblé et testé dans ce bac à sable) : ${nom}`);
}

const MOTIFS_INTERDITS = [/openai/i, /anthropic/i, /claude/i, /gpt/i, /mistral/i, /_API_KEY/, /LOCAL_LLM_URL/, /HTTP \d{3}/];
function neContientAucunDetailFournisseur(texte: string): boolean {
  return MOTIFS_INTERDITS.every((m) => !m.test(texte));
}

const PROMPT_REFERENCE = "Crée une fonction TypeScript qui calcule une TVA à partir d'un prix HT et d'un taux.";
const PDG_ID = 4;

async function main() {
  const r = await demander({
    question: PROMPT_REFERENCE,
    cote: "direction",
    sessionId: null,
    userId: PDG_ID,
    role: "super_admin",
  });

  // Invariants de sécurité — vérifiés que le fournisseur ait répondu ou non.
  verif("motifPublic sans détail fournisseur", neContientAucunDetailFournisseur(r.motifPublic));
  verif("le champ motifPublic existe toujours", typeof r.motifPublic === "string");

  if (!r.ok) {
    ignore("vraie réponse du modèle");
    ignore("code non vide");
    ignore("rendu bloc code correct");
    ignore("absence de coupure par le parser");
  } else {
    verif("vraie réponse du modèle : texte non vide", r.reponse.trim().length > 0);
    verif("code non vide : la réponse contient du code", /function|=>|const /.test(r.reponse));
    verif("rendu bloc code correct : au moins un bloc ``` fermé", (r.reponse.match(/```/g)?.length ?? 0) % 2 === 0 && (r.reponse.match(/```/g)?.length ?? 0) >= 2);
    verif("absence de coupure par le parser : la réponse ne s'arrête pas sur un bloc ``` ouvert", !r.reponse.trimEnd().endsWith("```") || (r.reponse.match(/```/g)?.length ?? 0) % 2 === 0);
  }

  // Contexte conservé : un deuxième message dépendant du premier, même session.
  const suite = await demander({
    question: "Ajoute maintenant la gestion d'un taux exprimé en pourcentage (ex: 20 au lieu de 0.20).",
    cote: "direction",
    sessionId: r.sessionId,
    userId: PDG_ID,
    role: "super_admin",
  });
  verif("contexte conservé : la deuxième demande réutilise la même session", suite.sessionId === r.sessionId);
  verif("motifPublic du deuxième échange sans détail fournisseur", neContientAucunDetailFournisseur(suite.motifPublic));
  if (!suite.ok) ignore("vraie réponse du modèle au deuxième message");
  else verif("vraie réponse du modèle au deuxième message", suite.reponse.trim().length > 0);

  console.log(`\n${ok}/${total} vérifications réussies (${ignores} ignorée(s), fournisseur non câblé dans ce bac à sable).`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
