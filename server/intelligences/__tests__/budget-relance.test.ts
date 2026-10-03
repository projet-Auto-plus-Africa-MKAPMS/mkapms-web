/**
 * Panne observée en production (mode Travail) : « OpenAI a répondu sans contenu utilisable (arrêté par limite de jetons :
 * 4000 jeton(s) de raisonnement sur 4000 alloué(s)) » à la dernière étape d'un travail de 34 étapes (33 faites, seul le rendu
 * échouait). Sans base : la décision de relance est une fonction pure ; le mode Travail reçoit un budget plus large.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { corpsRelanceBudget } from "../provider.js";

const vide = (finish: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ choices: [{ finish_reason: finish, message: { content: "", ...extra } }], usage: { completion_tokens: 4000, completion_tokens_details: { reasoning_tokens: 4000 } } });

test("budget épuisé par le raisonnement (length, aucun texte, aucun outil) : une relance avec un budget plus large, même intensité de réflexion", () => {
  const corps = { model: "m", max_completion_tokens: 4000, reasoning_effort: "high", messages: [] };
  const relance = corpsRelanceBudget(vide("length"), corps);
  assert.ok(relance);
  assert.equal(relance.max_completion_tokens, 16_000);
  assert.equal(relance.reasoning_effort, "high", "l'intensité choisie par le PDG est conservée");
  assert.deepEqual({ ...relance, max_completion_tokens: 4000 }, corps, "rien d'autre ne change");
  assert.equal(corps.max_completion_tokens, 4000, "le corps d'origine n'est pas modifié");
});

test("budget : quatre fois l'ancien, entre 16 000 et 32 000 ; déjà au plafond, pas de relance", () => {
  assert.equal(corpsRelanceBudget(vide("length"), { max_completion_tokens: 1200 })?.max_completion_tokens, 16_000);
  assert.equal(corpsRelanceBudget(vide("length"), { max_completion_tokens: 6000 })?.max_completion_tokens, 24_000);
  assert.equal(corpsRelanceBudget(vide("length"), { max_completion_tokens: 20_000 })?.max_completion_tokens, 32_000);
  assert.equal(corpsRelanceBudget(vide("length"), { max_completion_tokens: 32_000 }), null);
});

test("aucune relance quand la réponse est utilisable ou que l'arrêt a une autre cause", () => {
  const corps = { max_completion_tokens: 4000 };
  assert.equal(corpsRelanceBudget(JSON.stringify({ choices: [{ finish_reason: "length", message: { content: "Début de réponse tronquée" } }] }), corps), null);
  assert.equal(corpsRelanceBudget(vide("length", { tool_calls: [{ id: "1", type: "function", function: { name: "x", arguments: "{}" } }] }), corps), null);
  assert.equal(corpsRelanceBudget(vide("stop"), corps), null);
  assert.equal(corpsRelanceBudget(vide("content_filter"), corps), null);
  assert.equal(corpsRelanceBudget("pas du json", corps), null);
  assert.equal(corpsRelanceBudget(JSON.stringify({}), corps), null);
});

test("mode Travail : budget de sortie élargi (le chat garde 4000)", () => {
  const source = readFileSync("server/intelligences/service.ts", "utf8");
  assert.match(source, /maxTokens: input\.mode === "travail" \? 16_000 : 4000,/);
});
