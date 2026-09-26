/**
 * Régression signalée par le PDG : le bandeau du Centre MKA.P-MS AI restait
 * marqué « Dégradé » avec un message brut « OpenAI a refusé l'appel (HTTP
 * 400) : Could not finish the message because max_tokens... » alors que les
 * vraies conversations répondaient normalement.
 *
 * Vérifié par un vrai appel au compte OpenAI de production (2026-09-26, hors
 * de ce test) : `verifierAcces()` (server/intelligences/provider.ts) bornait
 * son test de bout en bout à 16 jetons — insuffisant pour un modèle de
 * raisonnement découvert dynamiquement (gpt-5.5 réel, 10 à 18 jetons de
 * raisonnement mesurés avant même d'écrire « OK »), ce qui faisait échouer ce
 * contrôle avec un vrai HTTP 400 OpenAI, jamais avec un motif fabriqué.
 * 64 jetons est vérifié réellement suffisant (marge ~3x sur le maximum
 * observé) sans changer ce que ce contrôle mesure.
 *
 * Exerce le vrai code de production (`verifierAcces()`) ; seul `fetch` est
 * injecté, `fournisseurImpose` n'existe pas sur ce point d'entrée : le
 * fournisseur reste résolu via chooseProvider() (comme en production), donc
 * seul le budget de jetons envoyé est vérifié ici, pas le fournisseur choisi.
 *
 * Lancement : `npx tsx server/intelligences/__tests__/verifier-acces.test.ts`
 */
import assert from "node:assert/strict";
import { verifierAcces } from "../provider.js";

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
  delete process.env.MISTRAL_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LOCAL_LLM_URL;
}

function reponseJson(status: number, corps: unknown): Response {
  return new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
}

async function main() {
  restaurerEnv();

  // ── 1. Le budget envoyé n'est plus le budget insuffisant d'avant (16) ──
  {
    const appelsOriginal = globalThis.fetch;
    let budgetEnvoye: unknown = undefined;
    globalThis.fetch = (async (url: unknown, options?: RequestInit) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "gpt-5.5" }] });
      const corps = JSON.parse(String(options?.body ?? "{}")) as Record<string, unknown>;
      budgetEnvoye = corps.max_completion_tokens;
      return reponseJson(200, {
        choices: [{ message: { content: "OK" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 20, completion_tokens: 4 },
      });
    }) as typeof fetch;
    try {
      const r = await verifierAcces();
      verif("1. budget de jetons envoyé = 64 (16 vérifié réellement insuffisant sur un modèle réel)", budgetEnvoye === 64);
      verif("1. statut up quand le test de bout en bout réussit", r.status === "up");
    } finally {
      globalThis.fetch = appelsOriginal;
    }
  }

  // ── 2. Le HTTP 400 spécifique « max_tokens » observé réellement reste, lui, honnêtement rapporté (jamais masqué) ──
  {
    const appelsOriginal = globalThis.fetch;
    globalThis.fetch = (async (url: unknown) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "gpt-5.5" }] });
      return reponseJson(400, {
        error: { message: "Could not finish the message because max_tokens or model output limit was reached. Please try again with higher max_tokens." },
      });
    }) as typeof fetch;
    try {
      const r = await verifierAcces();
      verif("2. échec réel du test de bout en bout : status=degraded (fournisseur identifié)", r.status === "degraded");
      verif("2. échec réel : motif brut conservé, jamais masqué ni réécrit", r.message.includes("max_tokens"));
    } finally {
      globalThis.fetch = appelsOriginal;
    }
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
