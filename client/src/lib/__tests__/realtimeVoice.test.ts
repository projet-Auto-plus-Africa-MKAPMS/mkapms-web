/**
 * Messages d'erreur de la voix temps réel : un micro « ouvert » qui n'écrit rien doit dire
 * pourquoi (code public du service), sans jamais recopier le message libre du service.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { DELAI_CANAL_MS, codeErreurService, messageEvenementErreur } from "../realtimeVoice.js";

test("code d'erreur : seulement un code public court, jamais un message libre", () => {
  assert.equal(codeErreurService({ code: "model_not_found", message: "secret details" }), "model_not_found");
  assert.equal(codeErreurService({ type: "invalid_request_error" }), "invalid_request_error");
  assert.equal(codeErreurService({ code: null, type: "server_error" }), "server_error");
  assert.equal(codeErreurService({ code: "contient des espaces et des détails" }), "");
  assert.equal(codeErreurService({ message: "seulement un message" }), "");
  assert.equal(codeErreurService(undefined), "");
});

test("échec de transcription : le micro capte mais rien ne s'écrit — le dire, avec le code", () => {
  const m = messageEvenementErreur("conversation.item.input_audio_transcription.failed", { code: "model_not_found", message: "secret details here" });
  assert.match(m, /n'a pas pu transcrire/);
  assert.match(m, /\(model_not_found\)/);
  assert.ok(!m.includes("secret details here"));
  assert.match(messageEvenementErreur("error", { code: "rate_limit_exceeded" }), /refusé cet échange \(rate_limit_exceeded\)/);
  assert.match(messageEvenementErreur("error", undefined), /refusé cet échange\.$/);
});

test("veille du canal : un délai borné, pas d'attente infinie", () => {
  assert.ok(DELAI_CANAL_MS >= 5_000 && DELAI_CANAL_MS <= 30_000);
});
