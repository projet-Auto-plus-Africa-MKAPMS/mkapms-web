import test from "node:test";
import assert from "node:assert/strict";
import { TRANSCRIPTION_PROMPT_MAX_CARACTERES, VOCABULAIRE_MAX_CARACTERES, consigneTranscription, creerAppelVocalTempsReel, transcrireAudioNatif } from "../provider.js";
import { extraireVocabulaire } from "../memoire-utilisateur.js";

test("consigne de transcription : vocabulaire de la mémoire ajouté tel quel, dédoublonné et borné", () => {
  const sans = consigneTranscription("fr");
  assert.match(sans, /salam alaikum/);
  assert.doesNotMatch(sans, /Mots et expressions du locuteur/);
  const avec = consigneTranscription("fr", ["Ouagadougou", "neeba", "Ouagadougou", 'ligne\u0000"piégée"']);
  assert.match(avec, /Mots et expressions du locuteur, à écrire exactement ainsi quand ils sont prononcés : Ouagadougou, neeba, ligne piégée\./);
  const long = consigneTranscription("en", Array.from({ length: 200 }, (_, i) => `terme-${i}`));
  assert.ok(long.length < consigneTranscription("en").length + VOCABULAIRE_MAX_CARACTERES + 120);
  assert.match(long, /dans la langue parlée/);
});

test("vocabulaire : contenus courts repris, consignes longues ignorées", () => {
  const termes = extraireVocabulaire([
    { contenu: "Mooré ; Laafi bala\nneeba" },
    { contenu: "Toujours répondre de façon concise avec des listes à puces et citer la source de chaque chiffre donné." },
    { contenu: "Mooré" },
    { contenu: "x" },
  ]);
  assert.deepEqual(termes, ["Mooré", "Laafi bala", "neeba"]);
});

test("session vocale : le texte d'aide à la transcription ne dépasse jamais 1 000 caractères, quelle que soit la mémoire", () => {
  const enorme = Array.from({ length: 500 }, (_, i) => `expression-personnelle-${i}`);
  for (const langue of [undefined, "fr", "en", "ar", "mos"]) {
    assert.ok(consigneTranscription(langue, enorme).length <= TRANSCRIPTION_PROMPT_MAX_CARACTERES, `langue ${langue ?? "défaut"}`);
  }
  // Un peu de vocabulaire reste repris ; la consigne de base n'est jamais tronquée.
  const fr = consigneTranscription("fr", enorme);
  assert.match(fr, /expression-personnelle-0/);
  assert.ok(fr.startsWith(consigneTranscription("fr")));
});

test("session vocale : le texte envoyé au fournisseur reste sous sa limite, et l'erreur nomme le champ refusé", async () => {
  process.env.OPENAI_API_KEY = "unit-test-only";
  const sdp = "v=0\r\n" + "a=test\r\n".repeat(20);
  let envoye = "";
  const refus = async (_url: unknown, init?: RequestInit) => {
    envoye = String((init?.body as FormData).get("session"));
    return new Response(JSON.stringify({ error: { code: "string_above_max_length", param: "session.audio.input.transcription.prompt" } }), { status: 400 });
  };
  const enorme = Array.from({ length: 500 }, (_, i) => `expression-personnelle-${i}`);
  await assert.rejects(
    () => creerAppelVocalTempsReel(sdp, "conversation", { langue: "fr", vocabulaire: enorme, modeleTranscription: "gpt-4o-mini-transcribe" }, refus as typeof fetch),
    /REALTIME_PROVIDER_400_gpt-realtime_string_above_max_length@session\.audio\.input\.transcription\.prompt/,
  );
  const prompt = (JSON.parse(envoye) as { audio: { input: { transcription: { prompt: string } } } }).audio.input.transcription.prompt;
  assert.ok(prompt.length <= TRANSCRIPTION_PROMPT_MAX_CARACTERES, `prompt de ${prompt.length} caractères`);
});

test("transcription de fichier : la consigne est transmise au service", async () => {
  const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypmp42"), Buffer.alloc(16)]).toString("base64");
  let prompt: FormDataEntryValue | null = null;
  const resultat = await transcrireAudioNatif({ cle: "unit-test-only" }, { format: "mp4", base64: mp4 }, async (_url, init) => {
    prompt = (init?.body as FormData).get("prompt");
    return new Response(JSON.stringify({ text: "Salut" }), { status: 200 });
  }, "whisper-1", "AL-HUDHUD·M, Mooré");
  assert.equal(prompt, "AL-HUDHUD·M, Mooré");
  assert.equal(Buffer.from(resultat.base64, "base64").toString("utf8"), "Salut");
});
