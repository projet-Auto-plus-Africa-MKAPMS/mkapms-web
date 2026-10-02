/**
 * Sonde des capacités du fournisseur : états séparés, preuve de chaque refus,
 * aucune fuite de clé. Fetch et adaptateurs injectés : jamais d'appel réseau réel.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { lancerSonde, type DependancesSonde } from "../provider-sonde.js";

const CLE = "sk-test-cle-secrete-123456";
const IDS = ["gpt-5.5", "gpt-realtime", "gpt-4o-mini-transcribe", "whisper-1", "tts-1", "text-embedding-3-large", "omni-moderation-latest", "gpt-image-2", "sora-2-pro", "gpt-5-codex"];
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });

function fetchSimule(opts: { transcription?: Record<string, number>; liste?: number } = {}) {
  const appels: string[] = [];
  const f = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    appels.push(u);
    assert.equal((init?.headers as Record<string, string> | undefined)?.Authorization, `Bearer ${CLE}`);
    if (u.endsWith("/v1/models")) return opts.liste ? json({ error: { type: "invalid_request_error", code: "invalid_api_key", message: `Incorrect API key provided: ${CLE}` } }, opts.liste) : json({ data: IDS.map((id) => ({ id })) });
    if (u.endsWith("/v1/embeddings")) return json({ data: [{ embedding: new Array(256).fill(0.1) }] });
    if (u.endsWith("/v1/realtime/client_secrets")) return json({ value: "ek_secret_ephemere" });
    if (u.endsWith("/v1/audio/transcriptions")) {
      const modele = String((init?.body as FormData).get("model"));
      const statut = opts.transcription?.[modele] ?? 200;
      return statut === 200 ? json({ text: "Bonjour, je suis AL-HUDHUD" }) : json({ error: { type: "invalid_request_error", code: "model_not_found", message: `The model does not exist. key=${CLE}` } }, statut);
    }
    throw new Error(`appel inattendu ${u}`);
  }) as typeof fetch;
  return { f, appels };
}

const deps = (surcharge: Partial<DependancesSonde> = {}): DependancesSonde => ({
  appeler: (async (i: { media?: string; outils?: unknown[]; sortieStructuree?: unknown }) => ({
    ok: true, texte: i.sortieStructuree ? '{"ok":true}' : "OK", fournisseur: "openai", modele: "gpt-5.5", motif: "", motifPublic: "", jetonsEntree: 0, jetonsSortie: 0, dureeMs: 1, tentatives: [],
    appelsOutils: i.outils ? [{ id: "1", nom: "repondre", arguments: '{"mot":"OK"}' }] : [], ...(i.media ? { media: { mime: "image/png", base64: "AAAA" } } : {}),
  })) as unknown as DependancesSonde["appeler"],
  modererTexte: async () => ({ disponible: true, signale: false, categories: [], motif: "" }),
  rechercherWebNatif: async () => ({ disponible: true, reponse: "Paris", sources: [{ titre: "x", url: "https://x.test" }], motif: "" }),
  creerApercuVoix: async () => ({ mime: "audio/mpeg", base64: Buffer.alloc(300, 1).toString("base64"), modele: "tts-1" }),
  transcrireAudioNatif: async () => ({ mime: "text/plain", base64: Buffer.from("Bonjour").toString("base64") }),
  ...surcharge,
});

const par = (r: Awaited<ReturnType<typeof lancerSonde>>, code: string) => r.capacites.find((c) => c.capacite === code)!;

test("états séparés : FUNCTIONAL seulement via l'adaptateur, TESTED quand aucun adaptateur n'existe", async () => {
  const { f } = fetchSimule();
  const r = await lancerSonde({ cle: CLE, fetchImpl: f, deps: deps(), persister: false });
  assert.equal(r.ok, true);
  assert.equal(par(r, "texte").etat, "FUNCTIONAL");
  assert.equal(par(r, "appel_outils").etat, "FUNCTIONAL");
  assert.equal(par(r, "moderation").etat, "FUNCTIONAL");
  assert.equal(par(r, "empreintes_semantiques").etat, "TESTED", "pas d'adaptateur d'embeddings : jamais FUNCTIONAL");
  assert.equal(par(r, "conversation_temps_reel").etat, "TESTED", "l'appel WebRTC réel reste à valider depuis le micro");
  assert.equal(par(r, "generation_image").etat, "CONNECTED_TO_MKA_PMS_IA", "essai coûteux non lancé sans demande");
  assert.equal(par(r, "video").etat, "ENABLED_FOR_PROJECT");
  assert.equal(par(r, "traduction_audio").etat, "NOT_AVAILABLE", "aucun modèle correspondant dans la liste du projet");
  assert.ok(r.modelesDuProjet.includes("gpt-5.5"));
});

test("transcription : le modèle refusé est documenté (statut, code), le suivant est retenu, aucune fuite de clé", async () => {
  const { f } = fetchSimule({ transcription: { "whisper-1": 404 } });
  const r = await lancerSonde({ cle: CLE, fetchImpl: f, deps: deps(), persister: false });
  const t = par(r, "transcription");
  assert.equal(t.etat, "FUNCTIONAL");
  assert.equal(t.modele, "gpt-4o-mini-transcribe");
  const essais = (t.details as { essais: { modele: string; http: number; erreurCode: string }[] }).essais;
  assert.deepEqual(essais[0], { modele: "whisper-1", http: 404, erreurType: "invalid_request_error", erreurCode: "model_not_found" });
  assert.ok(!JSON.stringify(r).includes(CLE), "la clé n'apparaît jamais");
  assert.ok(!JSON.stringify(r).includes("The model does not exist"), "le message brut du fournisseur n'est jamais conservé");
});

test("transcription refusée partout malgré l'activation : WAITING_EXTERNAL_ACCESS avec la preuve", async () => {
  const { f } = fetchSimule({ transcription: { "whisper-1": 404, "gpt-4o-mini-transcribe": 404, "gpt-4o-transcribe": 404 } });
  const r = await lancerSonde({ cle: CLE, fetchImpl: f, deps: deps(), persister: false });
  const t = par(r, "transcription");
  assert.equal(t.etat, "WAITING_EXTERNAL_ACCESS");
  assert.equal(t.httpStatus, 404);
  assert.equal(t.erreurCode, "model_not_found");
  assert.equal(t.endpoint, "/v1/audio/transcriptions");
});

test("liste des modèles refusée : aucune capacité supposée, preuve conservée sans la clé", async () => {
  const { f, appels } = fetchSimule({ liste: 401 });
  const r = await lancerSonde({ cle: CLE, fetchImpl: f, deps: deps(), persister: false });
  assert.equal(r.ok, false);
  assert.equal(r.httpListe, 401);
  assert.equal(r.capacites.length, 1);
  assert.equal(r.capacites[0].erreurCode, "invalid_api_key");
  assert.deepEqual(appels, [appels[0]], "aucun autre appel après le refus de la liste");
  assert.ok(!JSON.stringify(r).includes(CLE));
});

test("sans clé : rien n'est testé", async () => {
  const antérieure = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const r = await lancerSonde({ cle: "", fetchImpl: (async () => { throw new Error("pas d'appel"); }) as typeof fetch, deps: deps(), persister: false });
    assert.equal(r.ok, false);
    assert.equal(r.capacites.length, 0);
  } finally {
    if (antérieure !== undefined) process.env.OPENAI_API_KEY = antérieure;
  }
});

test("un adaptateur qui échoue n'est jamais marqué FUNCTIONAL", async () => {
  const { f } = fetchSimule();
  const r = await lancerSonde({ cle: CLE, fetchImpl: f, deps: deps({ modererTexte: async () => ({ disponible: false, signale: false, categories: [], motif: "HTTP 403" }) }), persister: false });
  const m = par(r, "moderation");
  assert.equal(m.etat, "WAITING_EXTERNAL_ACCESS");
  assert.equal(m.httpStatus, 403);
});

test("l'essai coûteux (image) ne part que sur demande explicite", async () => {
  const { f } = fetchSimule();
  const r = await lancerSonde({ cle: CLE, fetchImpl: f, deps: deps(), persister: false, inclureCouteux: true });
  assert.equal(par(r, "generation_image").etat, "FUNCTIONAL");
});

test("adaptateur de transcription : un modèle refusé passe au suivant ; l'erreur finale nomme statut, modèle et code, jamais la clé", async () => {
  const { transcrireAudioNatif } = await import("../provider.js");
  const audio = { format: "mp3" as const, base64: Buffer.concat([Buffer.from("ID3"), Buffer.alloc(40, 1)]).toString("base64") };
  const vus: string[] = [];
  const f = (async (_u: unknown, init?: RequestInit) => {
    const m = String((init?.body as FormData).get("model"));
    vus.push(m);
    return m === "gpt-4o-transcribe" ? json({ text: "bonjour" }) : json({ error: { type: "invalid_request_error", code: "model_not_found", message: CLE } }, 404);
  }) as typeof fetch;
  const ok = await transcrireAudioNatif({ cle: CLE }, audio, f);
  assert.equal(Buffer.from(ok.base64, "base64").toString(), "bonjour");
  assert.deepEqual(vus, ["whisper-1", "gpt-4o-mini-transcribe", "gpt-4o-transcribe"]);
  const refus = (async () => json({ error: { type: "invalid_request_error", code: "model_not_found", message: CLE } }, 404)) as typeof fetch;
  await assert.rejects(() => transcrireAudioNatif({ cle: CLE }, audio, refus), (e: Error) => e.message === "AUDIO_PROVIDER_404_gpt-4o-transcribe_model_not_found" && !e.message.includes(CLE));
  const interdit = (async () => json({ error: { type: "server_error", code: "boom" } }, 500)) as typeof fetch;
  await assert.rejects(() => transcrireAudioNatif({ cle: CLE }, audio, interdit), /^Error: AUDIO_PROVIDER_500_whisper-1_boom$/);
});
