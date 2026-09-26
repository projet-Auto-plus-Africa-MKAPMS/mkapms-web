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
 * défaut dès que des outils sont présents sur /v1/chat/completions.
 *
 * Vérifié ensuite contre le VRAI compte OpenAI de production (appels réels,
 * hors de ce test, jamais un identifiant ou une clé committée) : "none"
 * résout bien gpt-5.6-sol/luna/terra, mais un autre modèle réel du même
 * compte ("gpt-6-astra") refuse "none" lui-même avec un TROISIÈME message
 * réel ("Unsupported value: 'reasoning_effort' does not support 'none' with
 * this model. Supported values are: 'low', 'medium', 'high', and 'xhigh'.")
 * — et refuse en fait les outils avec n'importe quelle valeur testée
 * (aucune valeur ne fonctionne). D'où le correctif final : ne jamais deviner
 * la valeur, toujours la lire dans l'erreur réelle, avec un second rejeu
 * borné pour les modèles qui refusent "none" lui-même, et un arrêt honnête
 * (pas une boucle) pour un modèle réellement incompatible.
 *
 * Exerce le vrai code de production (`appeler()` réel) ; seul `fetch` est
 * injecté, `fournisseurImpose` évite de dépendre de la Fabrique Intelligence
 * (DB) pour ce scénario ciblé — même philosophie que
 * fuite-fournisseurs.test.ts et independance-openai.test.ts.
 *
 * Le modèle résolu et la valeur de reasoning_effort qui fonctionne sont tous
 * deux mis en cache PAR FOURNISSEUR / PAR MODÈLE dans provider.ts (1h,
 * process global) : les scénarios sont donc groupés par fournisseur imposé
 * ("openai", "openai_vision", "mistral") pour obtenir des compartiments de
 * cache réellement indépendants, plutôt que de supposer un état neuf à
 * chaque bloc — exactement le même partage de cache qu'en production.
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
  process.env.MISTRAL_API_KEY = "test-mistral-1234";
}

function reponseJson(status: number, corps: unknown): Response {
  return new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
}

const ERREUR_PAS_SUPPORTE =
  "Function tools with reasoning_effort are not supported for MODELE in /v1/chat/completions. " +
  "To use function tools, use /v1/responses or set reasoning_effort to 'none'.";
const ERREUR_NONE_REFUSE =
  "Unsupported value: 'reasoning_effort' does not support 'none' with this model. " +
  "Supported values are: 'low', 'medium', 'high', and 'xhigh'.";

const OUTIL_TEST: OutilFonction = {
  type: "function",
  function: { name: "vehicules_decodeVIN", description: "Décoder un VIN.", parameters: { type: "object", properties: {} } },
};

function entree(fournisseurImpose: "openai" | "openai_vision" | "mistral", avecOutils = true) {
  return {
    capacite: "ia_texte" as const,
    tache: "test_reasoning_effort",
    moteur: "intelligences",
    systeme: "test",
    message: "Bonjour",
    fournisseurImpose,
    outils: avecOutils ? [OUTIL_TEST] : undefined,
  };
}

function reponseSucces(): unknown {
  return {
    choices: [{ message: { tool_calls: [{ id: "call_1", type: "function", function: { name: "vehicules_decodeVIN", arguments: "{}" } }] } }],
    usage: { prompt_tokens: 10, completion_tokens: 5 },
  };
}

async function main() {
  restaurerEnv();

  // ═══ Compartiment "openai" : la famille gpt-5.6-sol/luna/terra réelle — "none" suffit ═══

  // ── 1. Erreur réelle « reasoning_effort » → rejeu automatique avec "none", puis succès ──
  {
    const appels: Record<string, unknown>[] = [];
    const r = await appeler(entree("openai"), async (url, options) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "modele-a" }] });
      const corps = JSON.parse(String((options as RequestInit)?.body ?? "{}")) as Record<string, unknown>;
      appels.push(corps);
      if (appels.length === 1) return reponseJson(400, { error: { message: ERREUR_PAS_SUPPORTE } });
      return reponseJson(200, reponseSucces());
    });
    verif("1. rejeu réussi : ok=true", r.ok === true);
    verif("1. rejeu réussi : deux tentatives HTTP réelles (pas plus, pas moins)", appels.length === 2);
    verif("1. premier envoi : sans reasoning_effort (jamais deviné à l'avance)", !("reasoning_effort" in appels[0]));
    verif("1. rejeu : reasoning_effort='none' exactement, comme demandé par l'erreur réelle", appels[1].reasoning_effort === "none");
    verif("1. rejeu : les outils restent bien présents dans le corps rejoué", Array.isArray(appels[1].tools) && (appels[1].tools as unknown[]).length === 1);
    verif("1. l'appel d'outil demandé par le modèle est bien transmis", r.appelsOutils.length === 1 && r.appelsOutils[0].nom === "vehicules_decodeVIN");
  }

  // ── 2. Le même modèle rappelé : la valeur qui a fonctionné est en cache, aucun rejeu rejoué ──
  {
    let appelsHttp = 0;
    const r = await appeler(entree("openai"), async (url, options) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "modele-a" }] });
      appelsHttp++;
      const corps = JSON.parse(String((options as RequestInit)?.body ?? "{}")) as Record<string, unknown>;
      verif("2. grâce au cache : reasoning_effort='none' envoyé dès le premier envoi", corps.reasoning_effort === "none");
      return reponseJson(200, reponseSucces());
    });
    verif("2. second appel : ok=true", r.ok === true);
    verif("2. second appel : une seule tentative HTTP (aucun rejeu, la valeur connue est envoyée d'emblée)", appelsHttp === 1);
  }

  // ── 3. Aucun outil envoyé : jamais de rejeu, même si une valeur est déjà connue en cache pour ce modèle ──
  {
    let appelsHttp = 0;
    const r = await appeler(entree("openai", false), async (url) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "modele-a" }] });
      appelsHttp++;
      return reponseJson(400, { error: { message: ERREUR_PAS_SUPPORTE } });
    });
    verif("3. sans outils : ok=false (l'erreur réelle reste rapportée, jamais masquée)", r.ok === false);
    verif("3. sans outils : une seule tentative HTTP (aucun rejeu inutile)", appelsHttp === 1);
    verif("3. sans outils : le motif réel de l'échec est conservé", r.motif.includes("reasoning_effort"));
  }

  // ── 4. Une erreur 400 SANS RAPPORT avec reasoning_effort : jamais de rejeu aveugle ──
  {
    let appelsHttp = 0;
    const r = await appeler(entree("openai"), async (url) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "modele-a" }] });
      appelsHttp++;
      return reponseJson(400, { error: { message: "invalid gtin" } });
    });
    verif("4. erreur sans rapport : ok=false", r.ok === false);
    verif("4. erreur sans rapport : une seule tentative HTTP (pas de rejeu hors-sujet)", appelsHttp === 1);
    verif("4. erreur sans rapport : motif réel conservé tel quel", r.motif.includes("invalid gtin"));
  }

  // ═══ Compartiment "openai_vision" : un modèle qui refuse "none" lui-même (constaté réellement sur gpt-6-astra) ═══

  // ── 5. Le rejeu "none" échoue AUSSI, avec la MÊME erreur (aucune indication de valeur de repli) → arrêt borné, échec honnête ──
  {
    let appelsHttp = 0;
    const r = await appeler(entree("openai_vision"), async (url) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "modele-b" }] });
      appelsHttp++;
      return reponseJson(400, { error: { message: ERREUR_PAS_SUPPORTE } });
    });
    verif("5. rejeu aussi refusé : ok=false, jamais une fausse réussite", r.ok === false);
    verif("5. rejeu aussi refusé : exactement deux tentatives HTTP, jamais une boucle", appelsHttp === 2);
    verif("5. rejeu aussi refusé : le motif réel du second refus est conservé", r.motif.includes("reasoning_effort"));
  }

  // ── 6. "none" refusé avec la liste réelle des valeurs acceptées → second rejeu avec la PREMIÈRE valeur listée, jamais inventée ──
  // (le compartiment "openai_vision" n'a rien mis en cache au scénario 5, qui s'est terminé en échec — la mémoire reste neuve ici)
  {
    const appels: Record<string, unknown>[] = [];
    const r = await appeler(entree("openai_vision"), async (url, options) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "modele-b" }] });
      const corps = JSON.parse(String((options as RequestInit)?.body ?? "{}")) as Record<string, unknown>;
      appels.push(corps);
      if (appels.length === 1) return reponseJson(400, { error: { message: ERREUR_PAS_SUPPORTE } });
      if (appels.length === 2) return reponseJson(400, { error: { message: ERREUR_NONE_REFUSE } });
      return reponseJson(200, reponseSucces());
    });
    verif("6. second rejeu réussi : ok=true", r.ok === true);
    verif("6. second rejeu réussi : exactement trois tentatives HTTP (borné, jamais plus)", appels.length === 3);
    verif("6. premier rejeu : 'none' essayé comme suggéré par la première erreur", appels[1].reasoning_effort === "none");
    verif(
      "6. second rejeu : la PREMIÈRE valeur réellement listée par l'erreur ('low'), jamais une valeur inventée",
      appels[2].reasoning_effort === "low",
    );
  }

  // ═══ Compartiment "mistral" : un modèle réellement incompatible, quelle que soit la valeur (constaté réellement sur gpt-6-astra) ═══

  // ── 7. Aucune valeur ne fonctionne jamais → échec final honnête, jamais une boucle sur toutes les valeurs listées ──
  {
    let appelsHttp = 0;
    const r = await appeler(entree("mistral"), async (url, options) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "modele-c" }] });
      appelsHttp++;
      const corps = JSON.parse(String((options as RequestInit)?.body ?? "{}")) as Record<string, unknown>;
      if (corps.reasoning_effort === undefined) return reponseJson(400, { error: { message: ERREUR_PAS_SUPPORTE } });
      if (corps.reasoning_effort === "none") return reponseJson(400, { error: { message: ERREUR_NONE_REFUSE } });
      // "low" (ou toute autre valeur listée) refusé à son tour, exactement comme gpt-6-astra réel.
      return reponseJson(400, { error: { message: ERREUR_PAS_SUPPORTE } });
    });
    verif("7. modèle incompatible : ok=false, échec honnête (jamais une fausse réussite)", r.ok === false);
    verif("7. modèle incompatible : au plus trois tentatives HTTP (borné à deux rejeux, jamais une boucle sur toutes les valeurs)", appelsHttp <= 3);
  }

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(ok === total ? 0 : 1)).catch((err) => {
  console.error(err);
  process.exit(1);
});
