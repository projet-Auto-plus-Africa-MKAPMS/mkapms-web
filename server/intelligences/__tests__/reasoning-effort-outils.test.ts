/**
 * Panne signalée par le PDG après le correctif des noms d'outils (PR #457) :
 * le chat MKA.P-MS AI reste inutilisable, mais avec une TOUT AUTRE erreur
 * OpenAI (HTTP 400) : « Function tools with reasoning_effort are not
 * supported for gpt-5.6-sol in /v1/chat/completions. To use function tools,
 * use /v1/responses or set reasoning_effort to 'none'. »
 *
 * Audit : `appeler()` (server/intelligences/provider.ts) n'envoyait jamais
 * `reasoning_effort` — le modèle de raisonnement découvert dynamiquement
 * (résolution réelle via /v1/models, jamais codée en dur) le refuse par
 * défaut dès que des outils sont présents sur /v1/chat/completions. On ne
 * devine jamais à l'avance quel modèle est concerné (un autre modèle réel
 * pourrait un jour porter un autre nom) : le fournisseur le dit lui-même
 * dans l'erreur réelle, et c'est cette erreur précise qui déclenche un seul
 * rejeu avec `reasoning_effort: "none"` — jamais un rejeu aveugle, jamais une
 * boucle.
 *
 * Exerce le vrai code de production (`appeler()` réel) ; seul `fetch` est
 * injecté, `fournisseurImpose` évite de dépendre de la Fabrique Intelligence
 * (DB) pour ce scénario ciblé — même philosophie que
 * fuite-fournisseurs.test.ts et independance-openai.test.ts.
 *
 * Lancement : `npx tsx server/intelligences/__tests__/reasoning-effort-outils.test.ts`
 */
import assert from "node:assert/strict";
import { appeler, type OutilFonction } from "../provider.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const ENV_SAUVEGARDE = { ...process.env };
function restaurerEnv() {
  for (const cle of Object.keys(process.env)) if (!(cle in ENV_SAUVEGARDE)) delete process.env[cle];
  Object.assign(process.env, ENV_SAUVEGARDE);
  process.env.OPENAI_API_KEY = "sk-test-1234";
}

function reponseJson(status: number, corps: unknown): Response {
  return new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
}

const ERREUR_REELLE_OPENAI =
  "Function tools with reasoning_effort are not supported for gpt-5.6-sol in /v1/chat/completions. " +
  "To use function tools, use /v1/responses or set reasoning_effort to 'none'.";

const OUTIL_TEST: OutilFonction = {
  type: "function",
  function: { name: "vehicules_decodeVIN", description: "Décoder un VIN.", parameters: { type: "object", properties: {} } },
};

const ENTREE_BASE = {
  capacite: "ia_texte" as const,
  tache: "test_reasoning_effort",
  moteur: "intelligences",
  systeme: "test",
  message: "Bonjour",
  fournisseurImpose: "openai" as const,
};

async function main() {
  // ── 1. Outils + erreur réelle « reasoning_effort » → rejeu automatique avec reasoning_effort:"none", puis succès ──
  restaurerEnv();
  {
    const appels: { url: string; corps: Record<string, unknown> }[] = [];
    const r = await appeler({ ...ENTREE_BASE, outils: [OUTIL_TEST] }, async (url, options) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "gpt-5.6-sol" }] });
      const corps = JSON.parse(String((options as RequestInit)?.body ?? "{}")) as Record<string, unknown>;
      appels.push({ url: u, corps });
      if (appels.length === 1) return reponseJson(400, { error: { message: ERREUR_REELLE_OPENAI } });
      return reponseJson(200, {
        choices: [{ message: { tool_calls: [{ id: "call_1", type: "function", function: { name: "vehicules_decodeVIN", arguments: "{}" } }] } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });
    });
    verif("1. rejeu réussi : ok=true", r.ok === true);
    verif("1. rejeu réussi : deux tentatives HTTP réelles (pas plus, pas moins)", appels.length === 2);
    verif("1. premier envoi : sans reasoning_effort (jamais deviné à l'avance)", !("reasoning_effort" in appels[0].corps));
    verif("1. rejeu : reasoning_effort='none' exactement, comme demandé par l'erreur réelle", appels[1].corps.reasoning_effort === "none");
    verif("1. rejeu : les outils restent bien présents dans le corps rejoué", Array.isArray(appels[1].corps.tools) && (appels[1].corps.tools as unknown[]).length === 1);
    verif("1. l'appel d'outil demandé par le modèle est bien transmis", r.appelsOutils.length === 1 && r.appelsOutils[0].nom === "vehicules_decodeVIN");
  }

  // ── 2. Même erreur réelle mais AUCUN outil envoyé : jamais de rejeu (la garde exige des outils réellement présents) ──
  restaurerEnv();
  {
    let appelsHttp = 0;
    const r = await appeler({ ...ENTREE_BASE, outils: undefined }, async (url) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "gpt-5.6-sol" }] });
      appelsHttp++;
      return reponseJson(400, { error: { message: ERREUR_REELLE_OPENAI } });
    });
    verif("2. sans outils : ok=false (l'erreur réelle reste rapportée, jamais masquée)", r.ok === false);
    verif("2. sans outils : une seule tentative HTTP (aucun rejeu inutile)", appelsHttp === 1);
    verif("2. sans outils : le motif réel de l'échec est conservé", r.motif.includes("reasoning_effort"));
  }

  // ── 3. Outils présents mais une erreur 400 SANS RAPPORT avec reasoning_effort : jamais de rejeu aveugle ──
  restaurerEnv();
  {
    let appelsHttp = 0;
    const r = await appeler({ ...ENTREE_BASE, outils: [OUTIL_TEST] }, async (url) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "gpt-5.6-sol" }] });
      appelsHttp++;
      return reponseJson(400, { error: { message: "invalid gtin" } });
    });
    verif("3. erreur sans rapport : ok=false", r.ok === false);
    verif("3. erreur sans rapport : une seule tentative HTTP (pas de rejeu hors-sujet)", appelsHttp === 1);
    verif("3. erreur sans rapport : motif réel conservé tel quel", r.motif.includes("invalid gtin"));
  }

  // ── 4. Le rejeu échoue aussi (modèle définitivement incompatible) : jamais de boucle, l'échec final est réel ──
  restaurerEnv();
  {
    let appelsHttp = 0;
    const r = await appeler({ ...ENTREE_BASE, outils: [OUTIL_TEST] }, async (url) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "gpt-5.6-sol" }] });
      appelsHttp++;
      return reponseJson(400, { error: { message: ERREUR_REELLE_OPENAI } });
    });
    verif("4. rejeu aussi refusé : ok=false, jamais une fausse réussite", r.ok === false);
    verif("4. rejeu aussi refusé : exactement deux tentatives HTTP, jamais une boucle", appelsHttp === 2);
    verif("4. rejeu aussi refusé : le motif réel du second refus est conservé", r.motif.includes("reasoning_effort"));
  }

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(ok === total ? 0 : 1)).catch((err) => {
  console.error(err);
  process.exit(1);
});
