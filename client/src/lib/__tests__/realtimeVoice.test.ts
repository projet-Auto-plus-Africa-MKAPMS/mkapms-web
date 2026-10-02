/**
 * Messages d'erreur de la voix temps réel : un micro « ouvert » qui n'écrit rien doit dire
 * pourquoi (code public du service), sans jamais recopier le message libre du service.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { DELAI_CANAL_MS, MESSAGE_TRANSCRIPTION_IMPOSSIBLE, codeErreurService, messageEvenementErreur, prochainModeleTranscription, startRealtimeVoice } from "../realtimeVoice.js";

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

test("modèle de transcription introuvable : on essaie les suivants, une seule fois chacun, et seulement pour cette cause", () => {
  assert.equal(prochainModeleTranscription("model_not_found", ["gpt-4o-mini-transcribe"]), "whisper-1");
  assert.equal(prochainModeleTranscription("model_not_found", ["gpt-4o-mini-transcribe", "whisper-1"]), "gpt-4o-transcribe");
  assert.equal(prochainModeleTranscription("model_not_found", ["gpt-4o-mini-transcribe", "whisper-1", "gpt-4o-transcribe"]), null);
  assert.equal(prochainModeleTranscription("rate_limit_exceeded", ["gpt-4o-mini-transcribe"]), null, "une autre cause ne change pas de modèle");
  assert.equal(prochainModeleTranscription("", ["gpt-4o-mini-transcribe"]), null);
});

test("session réelle simulée : un échec « model_not_found » bascule la transcription sans couper le micro", async () => {
  const envoyes: any[] = [];
  const erreurs: string[] = [];
  let canal: any;
  const piste = { stop() {} };
  const flux = { getAudioTracks: () => [piste], getTracks: () => [piste] };
  class FauxPeer {
    iceGatheringState = "complete"; connectionState = "new"; localDescription = { sdp: "v=0\r\n" + "a=x\r\n".repeat(20) };
    ontrack: unknown; onconnectionstatechange: unknown;
    createDataChannel() { canal = { readyState: "open", onopen: null, onmessage: null, send: (m: string) => envoyes.push(JSON.parse(m)), close() {} }; return canal; }
    addTrack() {} async createOffer() { return { type: "offer", sdp: this.localDescription.sdp }; } async setLocalDescription() {}
    async setRemoteDescription() {} addEventListener() {} removeEventListener() {} close() {}
  }
  const fauxAudio = { setAttribute() {}, hidden: false, autoplay: false, srcObject: null, play: async () => {}, pause() {}, remove() {} };
  const g = globalThis as any;
  const sauvegarde = { peer: g.RTCPeerConnection, nav: Object.getOwnPropertyDescriptor(g, "navigator"), doc: g.document, win: g.window };
  g.RTCPeerConnection = FauxPeer;
  Object.defineProperty(g, "navigator", { value: { mediaDevices: { getUserMedia: async () => flux } }, configurable: true });
  g.document = { createElement: () => fauxAudio, body: { appendChild() {} } };
  g.window = { setTimeout, clearTimeout };
  try {
    const control = await startRealtimeVoice({ mode: "dictee", exchangeSdp: async (sdp) => sdp, onError: (m) => erreurs.push(m), langueTranscription: "fr-FR" });
    canal.onopen();
    const echec = (code?: string) => canal.onmessage({ data: JSON.stringify({ type: "conversation.item.input_audio_transcription.failed", error: code ? { code } : {} }) });
    echec("model_not_found");
    assert.equal(envoyes.length, 1);
    assert.deepEqual(envoyes[0], { type: "session.update", session: { type: "realtime", audio: { input: { transcription: { model: "whisper-1", language: "fr" } } } } });
    assert.match(erreurs.at(-1)!, /essai avec whisper-1/);
    echec("model_not_found");
    assert.equal(envoyes[1].session.audio.input.transcription.model, "gpt-4o-transcribe");
    echec("model_not_found");
    assert.equal(envoyes.length, 2, "plus rien à essayer : pas de troisième bascule");
    assert.equal(erreurs.at(-1), MESSAGE_TRANSCRIPTION_IMPOSSIBLE);
    assert.match(MESSAGE_TRANSCRIPTION_IMPOSSIBLE, /Model usage/);
    echec("rate_limit_exceeded");
    assert.equal(envoyes.length, 2, "une autre cause ne change pas de modèle");
    assert.match(erreurs.at(-1)!, /rate_limit_exceeded/);
    control.close();
  } finally {
    g.RTCPeerConnection = sauvegarde.peer; g.document = sauvegarde.doc; g.window = sauvegarde.win;
    if (sauvegarde.nav) Object.defineProperty(g, "navigator", sauvegarde.nav);
  }
});
