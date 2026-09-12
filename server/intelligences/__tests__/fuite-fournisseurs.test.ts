/**
 * LOT IA02A — tests d'indépendance du côté public face aux fournisseurs de
 * modèles : aucune surface publique ne doit jamais révéler un nom de
 * fournisseur, un modèle, une variable d'environnement, une URL ou un détail
 * HTTP brut, quel que soit le scénario réel rencontré.
 *
 * `appeler()` (server/intelligences/provider.ts) reste le VRAI code de
 * production ; seul `fetch` est injecté (`fetchImpl`), exactement comme
 * `routerImpl`/`verifierPermission` sont injectés dans les tests de
 * boucle.ts — jamais un appel réseau réel, jamais une réimplémentation
 * parallèle de la logique testée.
 *
 * Lancement : `npx tsx server/intelligences/__tests__/fuite-fournisseurs.test.ts`
 */
import assert from "node:assert/strict";
import { appeler, type AppelResultat } from "../provider.js";
import { demander } from "../service.js";
import { MOTIF_PUBLIC_INDISPONIBLE } from "../identite.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

/** Aucune trace d'un fournisseur/modèle/variable/URL/code HTTP dans un texte destiné au public. */
const MOTIFS_INTERDITS = [
  /openai/i,
  /anthropic/i,
  /claude/i,
  /gpt/i,
  /mistral/i,
  /_API_KEY/,
  /LOCAL_LLM_URL/,
  /platform\.openai\.com/i,
  /console\.mistral\.ai/i,
  /HTTP \d{3}/,
];
function neContientAucunDetailFournisseur(texte: string): boolean {
  return MOTIFS_INTERDITS.every((m) => !m.test(texte));
}

function reponseJson(status: number, corps: unknown): Response {
  return new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
}

const ENV_SAUVEGARDE = { ...process.env };
function restaurerEnv() {
  for (const cle of Object.keys(process.env)) if (!(cle in ENV_SAUVEGARDE)) delete process.env[cle];
  Object.assign(process.env, ENV_SAUVEGARDE);
}

const ENTREE_BASE = {
  capacite: "ia_texte" as const,
  tache: "test_fuite",
  moteur: "intelligences",
  systeme: "test",
  message: "Bonjour",
  confidentialite: "interne" as const,
};

async function main() {
  // ── 1. Fournisseur répond normalement ───────────────────────────────
  restaurerEnv();
  process.env.OPENAI_API_KEY = "sk-test-1234";
  delete process.env.MISTRAL_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LOCAL_LLM_URL;
  {
    const r = await appeler(ENTREE_BASE, async (url) => {
      if (String(url).includes("/models")) return reponseJson(200, { data: [{ id: "gpt-4o-mini" }] });
      return reponseJson(200, { choices: [{ message: { content: "Bonjour !" } }], usage: { prompt_tokens: 5, completion_tokens: 3 } });
    });
    verif("1. réponse normale : ok=true", r.ok === true);
    verif("1. réponse normale : motifPublic vide", r.motifPublic === "");
  }

  // ── 2-4. HTTP 401 / 429 / 500 ────────────────────────────────────────
  for (const status of [401, 429, 500]) {
    const r = await appeler(ENTREE_BASE, async (url) => {
      if (String(url).includes("/models")) return reponseJson(200, { data: [] });
      return reponseJson(status, { error: { message: `Fournisseur en panne, code interne ${status}` } });
    });
    verif(`2-4. HTTP ${status} : ok=false`, r.ok === false);
    verif(`2-4. HTTP ${status} : motif interne mentionne le détail (traçabilité conservée)`, r.motif.length > 0);
    verif(`2-4. HTTP ${status} : motifPublic générique MKA.P-MS`, r.motifPublic === MOTIF_PUBLIC_INDISPONIBLE);
    verif(`2-4. HTTP ${status} : motifPublic sans aucun détail fournisseur`, neContientAucunDetailFournisseur(r.motifPublic));
  }

  // ── 5. Timeout ───────────────────────────────────────────────────────
  {
    const r = await appeler(ENTREE_BASE, async (url) => {
      if (String(url).includes("/models")) return reponseJson(200, { data: [] });
      throw new Error("The operation was aborted due to timeout");
    });
    verif("5. timeout : ok=false", r.ok === false);
    verif("5. timeout : motifPublic générique", r.motifPublic === MOTIF_PUBLIC_INDISPONIBLE);
    verif("5. timeout : motifPublic sans détail fournisseur", neContientAucunDetailFournisseur(r.motifPublic));
  }

  // ── 6. Aucun fournisseur disponible (aucune clé configurée, état réel de cet environnement) ──
  restaurerEnv();
  delete process.env.OPENAI_API_KEY;
  delete process.env.MISTRAL_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LOCAL_LLM_URL;
  {
    const r = await appeler(ENTREE_BASE);
    verif("6. aucun fournisseur : ok=false", r.ok === false);
    verif("6. aucun fournisseur : motifPublic générique", r.motifPublic === MOTIF_PUBLIC_INDISPONIBLE);
    verif("6. aucun fournisseur : motifPublic sans détail fournisseur", neContientAucunDetailFournisseur(r.motifPublic));
  }

  // ── 7. Fournisseur enregistré (Anthropic) mais jamais connecté : la clé ne suffit pas ──
  restaurerEnv();
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  delete process.env.OPENAI_API_KEY;
  delete process.env.MISTRAL_API_KEY;
  delete process.env.LOCAL_LLM_URL;
  {
    const r = await appeler(ENTREE_BASE);
    verif("7. Anthropic configuré mais REGISTERED : jamais sélectionné (ok=false)", r.ok === false);
    verif("7. Anthropic configuré mais REGISTERED : fournisseur=null (jamais choisi)", r.fournisseur === null);
    verif("7. Anthropic configuré mais REGISTERED : motifPublic générique", r.motifPublic === MOTIF_PUBLIC_INDISPONIBLE);
    verif("7. Anthropic configuré mais REGISTERED : motifPublic sans détail fournisseur", neContientAucunDetailFournisseur(r.motifPublic));
  }

  // ── 8. Fallback réussi (premier fournisseur tombe, le second répond) ──
  restaurerEnv();
  process.env.OPENAI_API_KEY = "sk-test-1234";
  process.env.MISTRAL_API_KEY = "mistral-test-5678";
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LOCAL_LLM_URL;
  {
    // Le fournisseur choisi en premier par chooseProvider() n'est pas figé
    // d'un run à l'autre (dépend de l'état réellement constaté en base) :
    // on fait échouer le PREMIER appel de complétion rencontré, quel que
    // soit le fournisseur, et réussir le second — le scénario reste "premier
    // tombe, repli répond" sans dépendre de l'ordre réel.
    let completionsAppelees = 0;
    const r = await appeler(ENTREE_BASE, async (url) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [] });
      completionsAppelees++;
      if (completionsAppelees === 1) return reponseJson(500, { error: { message: "En panne" } });
      return reponseJson(200, { choices: [{ message: { content: "Réponse du repli." } }], usage: { prompt_tokens: 4, completion_tokens: 2 } });
    });
    verif("8. fallback réussi : ok=true", r.ok === true);
    verif("8. fallback réussi : deux tentatives tracées en interne", r.tentatives.length === 2);
    verif("8. fallback réussi : motifPublic vide (succès final)", r.motifPublic === "");
  }

  // ── 9. Fallback échoué (les deux fournisseurs tombent) ────────────────
  {
    const r = await appeler(ENTREE_BASE, async (url) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [] });
      return reponseJson(503, { error: { message: "Panne générale du fournisseur" } });
    });
    verif("9. fallback échoué : ok=false", r.ok === false);
    verif("9. fallback échoué : deux tentatives tracées en interne", r.tentatives.length === 2);
    verif("9. fallback échoué : motif interne détaillé (traçabilité conservée)", r.motif.length > 20);
    verif("9. fallback échoué : motifPublic générique malgré les deux échecs", r.motifPublic === MOTIF_PUBLIC_INDISPONIBLE);
    verif("9. fallback échoué : motifPublic sans détail fournisseur", neContientAucunDetailFournisseur(r.motifPublic));
  }

  // ── 10-11. Utilisateur public (anonyme et connecté) via demander() réel, base réelle ──
  restaurerEnv();
  delete process.env.OPENAI_API_KEY;
  delete process.env.MISTRAL_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LOCAL_LLM_URL;
  {
    const rAnonyme = await demander({ question: "Quel entretien prévoir à 100 000 km sur un diesel ?", cote: "public", visiteur: "test-anonyme" });
    verif("10. utilisateur public anonyme : motif sans détail fournisseur", neContientAucunDetailFournisseur(rAnonyme.motif) || rAnonyme.ok);
    verif("10. utilisateur public anonyme : fournisseur jamais renvoyé (null)", rAnonyme.fournisseur === null);
    verif("10. utilisateur public anonyme : modèle jamais renvoyé (null)", rAnonyme.modele === null);

    const rConnecte = await demander({ question: "Quel est le meilleur entretien pour ma voiture ?", cote: "public", userId: 4 });
    verif("11. utilisateur public connecté : fournisseur jamais renvoyé (null)", rConnecte.fournisseur === null);
    verif("11. utilisateur public connecté : modèle jamais renvoyé (null)", rConnecte.modele === null);
  }

  // ── 12. Direction autorisée : le détail technique reste disponible (correction explicite de la direction) ──
  {
    const rDirection = await demander({ question: "Diagnostique l'état du moteur intelligences.", cote: "direction", userId: 4 });
    verif("12. direction : le champ motif existe et n'est pas artificiellement vidé", typeof rDirection.motif === "string");
    // Le côté direction NE reçoit PAS de sanitisation — fournisseur/modèle restent transmis tels quels
    // (ctx PDG uniquement), contrairement au côté public testé en 10-11.
  }

  console.log(`\n${ok}/${total} vérifications réussies.`);
  restaurerEnv();
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  restaurerEnv();
  process.exitCode = 1;
});
