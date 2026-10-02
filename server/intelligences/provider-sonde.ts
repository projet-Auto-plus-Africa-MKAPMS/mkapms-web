/**
 * Sonde des capacités du fournisseur de modèles : un vrai appel par capacité.
 *
 * « Activé chez le fournisseur » ne veut pas dire « branché dans MKA.P-MS AI ».
 * Pour chaque capacité, la sonde établit — par un vrai appel, jamais par une
 * supposition — dans quel état elle est :
 *
 *   NOT_AVAILABLE → AVAILABLE_IN_OPENAI → ENABLED_FOR_PROJECT → ADAPTER_READY
 *   → CONNECTED_TO_MKA_PMS_IA → TESTED → FUNCTIONAL      (ou WAITING_EXTERNAL_ACCESS)
 *
 *  - la liste des modèles du projet (/v1/models) donne les identifiants API exacts :
 *    aucun nom n'est pris d'un libellé d'interface ;
 *  - FUNCTIONAL n'est atteint que par une requête réussie passant par l'adaptateur
 *    de la plateforme (appeler, modererTexte, rechercherWebNatif, creerApercuVoix,
 *    transcrireAudioNatif) ;
 *  - TESTED : le point d'entrée exact répond avec le modèle exact, mais aucun
 *    adaptateur MKA.P-MS AI ne le traverse encore ;
 *  - WAITING_EXTERNAL_ACCESS : le fournisseur refuse malgré l'activation (403/404/
 *    model_not_found) — la preuve (statut, type, code, modèle, endpoint) est conservée ;
 *  - la clé n'apparaît jamais, ni le message brut du fournisseur (il peut en citer
 *    un fragment) : seulement le statut HTTP et les codes publics d'erreur.
 *
 * Les capacités coûteuses (génération d'image) ne s'exécutent que sur demande explicite.
 */
import {
  MODELES_TRANSCRIPTION_FICHIER,
  appeler,
  codePublicErreur,
  creerApercuVoix,
  modererTexte,
  rechercherWebNatif,
  transcrireAudioNatif,
} from "./provider.js";
import { enregistrerPreuve, oublierCacheModelesValides, type EtatCapacite, type PreuveCapacite } from "./sonde-store.js";

const API = "https://api.openai.com";
// PNG 1×1 rouge : image d'essai pour la vision.
const PNG_ROUGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

export interface DependancesSonde {
  appeler: typeof appeler;
  modererTexte: typeof modererTexte;
  rechercherWebNatif: typeof rechercherWebNatif;
  creerApercuVoix: typeof creerApercuVoix;
  transcrireAudioNatif: typeof transcrireAudioNatif;
}

const DEPENDANCES_REELLES: DependancesSonde = { appeler, modererTexte, rechercherWebNatif, creerApercuVoix, transcrireAudioNatif };

export interface OptionsSonde {
  cle?: string;
  fetchImpl?: typeof fetch;
  deps?: DependancesSonde;
  /** Inclut les capacités qui coûtent de l'argent à chaque essai (génération d'image). */
  inclureCouteux?: boolean;
  /** Écrire les preuves en base (désactivé dans les tests sans base). */
  persister?: boolean;
}

interface EssaiModele {
  modele: string;
  http: number | null;
  erreurType: string;
  erreurCode: string;
}

interface Verdict {
  ok: boolean;
  http: number | null;
  modele: string | null;
  erreurType?: string;
  erreurCode?: string;
  /** Vrai quand la requête a traversé l'adaptateur MKA.P-MS AI. */
  adaptateur: boolean;
  note?: string;
  essais?: EssaiModele[];
}

interface Contexte {
  cle: string;
  fetchImpl: typeof fetch;
  deps: DependancesSonde;
  ids: Set<string>;
  audioEssai: string | null;
}

interface DefinitionCapacite {
  code: string;
  libelle: string;
  endpoint: string;
  /** Modèles du projet qui conviennent à cette capacité, par ordre de préférence. */
  modeles: (ids: string[]) => string[];
  /** Un adaptateur MKA.P-MS AI existe-t-il dans le code ? */
  adaptateurPresent: boolean;
  couteux?: boolean;
  tester?: (c: Contexte, modeles: string[]) => Promise<Verdict>;
  note?: string;
}

const motif = (re: RegExp) => (ids: string[]) => ids.filter((i) => re.test(i)).sort();

async function directPost(c: Contexte, chemin: string, corps: unknown): Promise<{ http: number | null; texte: string; json: unknown; erreurType: string; erreurCode: string }> {
  try {
    const r = await c.fetchImpl(`${API}${chemin}`, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(60_000),
      headers: { Authorization: `Bearer ${c.cle}`, "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    const texte = (await r.text()).slice(0, 200_000);
    if (r.ok) {
      let json: unknown = null;
      try { json = JSON.parse(texte); } catch { /* réponse non JSON : seul le statut compte */ }
      return { http: r.status, texte, json, erreurType: "", erreurCode: "" };
    }
    const e = codePublicErreur(texte);
    return { http: r.status, texte: "", json: null, erreurType: e.type, erreurCode: e.code };
  } catch {
    return { http: null, texte: "", json: null, erreurType: "network_error", erreurCode: "" };
  }
}

const refuseParAcces = (v: { http: number | null; erreurCode?: string; erreurType?: string }) =>
  v.http === 403 || v.http === 404 || /model_not_found|model_not_available/i.test(`${v.erreurCode ?? ""} ${v.erreurType ?? ""}`);

function ecart(modele: string | null, http: number | null, e: { erreurType?: string; erreurCode?: string }, adaptateur: boolean, note: string): Verdict {
  return { ok: false, http, modele, erreurType: e.erreurType ?? "", erreurCode: e.erreurCode ?? "", adaptateur, note };
}

async function testerTexte(c: Contexte): Promise<Verdict> {
  const r = await c.deps.appeler({
    capacite: "ia_texte", tache: "sonde_capacites", moteur: "intelligences",
    systeme: "Réponds exactement le mot OK, sans ponctuation.", message: "Test de capacité.", maxTokens: 64,
  }, c.fetchImpl);
  return r.ok
    ? { ok: true, http: 200, modele: r.modele, adaptateur: true }
    : ecart(r.modele, null, {}, true, `L'adaptateur de texte a échoué : ${r.motif.slice(0, 300)}`);
}

async function testerSortieStructuree(c: Contexte): Promise<Verdict> {
  const r = await c.deps.appeler({
    capacite: "ia_texte", tache: "sonde_capacites", moteur: "intelligences",
    systeme: "Réponds uniquement par l'objet JSON demandé.", message: "Renvoie ok=true.", maxTokens: 200,
    sortieStructuree: { nom: "sonde", schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false }, strict: true },
  }, c.fetchImpl);
  let conforme = false;
  try { conforme = (JSON.parse(r.texte) as { ok?: unknown }).ok === true; } catch { /* non conforme */ }
  return r.ok && conforme
    ? { ok: true, http: 200, modele: r.modele, adaptateur: true }
    : ecart(r.modele, null, {}, true, r.ok ? "Réponse non conforme au schéma demandé." : `Échec : ${r.motif.slice(0, 300)}`);
}

async function testerOutils(c: Contexte): Promise<Verdict> {
  const r = await c.deps.appeler({
    capacite: "ia_texte", tache: "sonde_capacites", moteur: "intelligences",
    systeme: "Tu dois appeler l'outil repondre.", message: "Appelle l'outil repondre avec mot=OK.", maxTokens: 200,
    outils: [{ type: "function", function: { name: "repondre", description: "Répond par un mot.", parameters: { type: "object", properties: { mot: { type: "string" } }, required: ["mot"], additionalProperties: false }, strict: true } }],
  }, c.fetchImpl);
  return r.ok && r.appelsOutils.length > 0
    ? { ok: true, http: 200, modele: r.modele, adaptateur: true }
    : ecart(r.modele, null, {}, true, r.ok ? "Le modèle n'a demandé aucun appel d'outil." : `Échec : ${r.motif.slice(0, 300)}`);
}

async function testerVision(c: Contexte): Promise<Verdict> {
  const r = await c.deps.appeler({
    capacite: "ia_vision", tache: "sonde_capacites", moteur: "intelligences",
    systeme: "Décris l'image en un mot.", message: "Quelle est la couleur de cette image ?", images: [PNG_ROUGE], maxTokens: 200,
  }, c.fetchImpl);
  return r.ok && r.texte.trim().length > 0
    ? { ok: true, http: 200, modele: r.modele, adaptateur: true }
    : ecart(r.modele, null, {}, true, `Échec : ${r.motif.slice(0, 300)}`);
}

async function testerModeration(c: Contexte): Promise<Verdict> {
  const r = await c.deps.modererTexte("Bonjour, ceci est un test de modération.", c.fetchImpl);
  const http = /HTTP (\d{3})/.exec(r.motif)?.[1];
  return r.disponible
    ? { ok: true, http: 200, modele: "omni-moderation-latest", adaptateur: true }
    : ecart("omni-moderation-latest", http ? Number(http) : null, {}, true, "Modération indisponible (voir le statut HTTP).");
}

async function testerRechercheWeb(c: Contexte): Promise<Verdict> {
  const r = await c.deps.rechercherWebNatif("Quelle est la capitale de la France ?", c.fetchImpl);
  const http = /HTTP (\d{3})/.exec(r.motif)?.[1];
  return r.disponible
    ? { ok: true, http: 200, modele: null, adaptateur: true, note: `${r.sources.length} source(s) citée(s).` }
    : ecart(null, http ? Number(http) : null, {}, true, "Recherche web indisponible (voir le statut HTTP).");
}

async function testerVoix(c: Contexte): Promise<Verdict> {
  try {
    const a = await c.deps.creerApercuVoix("alloy", c.fetchImpl);
    c.audioEssai = a.base64;
    return { ok: true, http: 200, modele: (a as { modele?: string }).modele ?? null, adaptateur: true };
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    const http = /_(\d{3})_/.exec(m)?.[1];
    return ecart(null, http ? Number(http) : null, { erreurCode: m.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 80) }, true, "Synthèse vocale refusée.");
  }
}

async function testerTranscription(c: Contexte): Promise<Verdict> {
  if (!c.audioEssai) return ecart(null, null, {}, true, "Pas d'audio d'essai : la synthèse vocale a échoué avant.");
  // Diagnostic direct, modèle par modèle : on voit exactement lequel est accepté et pourquoi les autres sont refusés.
  const essais: EssaiModele[] = [];
  let valide: string | null = null;
  const octets = Buffer.from(c.audioEssai, "base64");
  for (const modele of MODELES_TRANSCRIPTION_FICHIER) {
    const form = new FormData();
    form.append("model", modele);
    form.append("response_format", "json");
    form.append("file", new Blob([new Uint8Array(octets)], { type: "audio/mpeg" }), "essai.mp3");
    let http: number | null = null; let e = { type: "", code: "" };
    try {
      const r = await c.fetchImpl(`${API}/v1/audio/transcriptions`, { method: "POST", redirect: "error", signal: AbortSignal.timeout(60_000), headers: { Authorization: `Bearer ${c.cle}` }, body: form });
      http = r.status;
      const corps = (await r.text()).slice(0, 4000);
      if (!r.ok) e = codePublicErreur(corps);
    } catch { e = { type: "network_error", code: "" }; }
    essais.push({ modele, http, erreurType: e.type, erreurCode: e.code });
    if (http !== null && http >= 200 && http < 300 && !valide) valide = modele;
  }
  if (!valide) {
    const dernier = essais[essais.length - 1];
    return { ok: false, http: dernier.http, modele: null, erreurType: dernier.erreurType, erreurCode: dernier.erreurCode, adaptateur: true, essais, note: "Aucun modèle de transcription de fichier n'a répondu." };
  }
  // Puis le chemin de la plateforme : l'adaptateur doit retrouver le texte parlé.
  try {
    const t = await c.deps.transcrireAudioNatif({ cle: c.cle }, { format: "mp3", base64: c.audioEssai }, c.fetchImpl, valide);
    const texte = Buffer.from(t.base64, "base64").toString("utf8").toLowerCase();
    return /bonjour|mka|hudhud/.test(texte)
      ? { ok: true, http: 200, modele: valide, adaptateur: true, essais }
      : { ok: false, http: 200, modele: valide, adaptateur: true, essais, note: "L'adaptateur a répondu mais le texte ne correspond pas à l'audio d'essai." };
  } catch (e) {
    return { ok: false, http: null, modele: valide, erreurCode: e instanceof Error ? e.message.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 80) : "", adaptateur: true, essais, note: "L'adaptateur de transcription a échoué." };
  }
}

async function testerTempsReel(c: Contexte, modeles: string[]): Promise<Verdict> {
  const essais: EssaiModele[] = [];
  const configure = process.env.OPENAI_REALTIME_MODEL?.trim();
  const liste = [...new Set([configure, "gpt-realtime", ...modeles].filter((m): m is string => !!m && /^[A-Za-z0-9._-]{1,80}$/.test(m)))].slice(0, 6);
  for (const modele of liste) {
    const r = await directPost(c, "/v1/realtime/client_secrets", { session: { type: "realtime", model: modele } });
    essais.push({ modele, http: r.http, erreurType: r.erreurType, erreurCode: r.erreurCode });
    if (r.http !== null && r.http >= 200 && r.http < 300) {
      return { ok: true, http: r.http, modele, adaptateur: false, essais, note: "Session créée (le secret éphémère n'est jamais conservé). L'appel audio WebRTC réel se valide depuis le micro." };
    }
  }
  const d = essais[essais.length - 1];
  return { ok: false, http: d?.http ?? null, modele: null, erreurType: d?.erreurType, erreurCode: d?.erreurCode, adaptateur: false, essais };
}

async function testerTranscriptionTempsReel(c: Contexte, modeles: string[], modeleSession: string | null): Promise<Verdict> {
  if (!modeleSession) return ecart(null, null, {}, false, "Pas de session temps réel valide pour tester la transcription.");
  const essais: EssaiModele[] = [];
  for (const modele of modeles) {
    const r = await directPost(c, "/v1/realtime/client_secrets", {
      session: { type: "realtime", model: modeleSession, audio: { input: { transcription: { model: modele } } } },
    });
    essais.push({ modele, http: r.http, erreurType: r.erreurType, erreurCode: r.erreurCode });
    if (r.http !== null && r.http >= 200 && r.http < 300) {
      return { ok: true, http: r.http, modele, adaptateur: false, essais, note: "Modèle de transcription accepté à la création de la session temps réel." };
    }
  }
  const d = essais[essais.length - 1];
  return { ok: false, http: d?.http ?? null, modele: null, erreurType: d?.erreurType, erreurCode: d?.erreurCode, adaptateur: false, essais };
}

async function testerEmpreintes(c: Contexte, modeles: string[]): Promise<Verdict> {
  const modele = modeles.find((m) => m === "text-embedding-3-large") ?? modeles[0];
  const r = await directPost(c, "/v1/embeddings", { model: modele, input: "test de mémoire sémantique", dimensions: 256 });
  const vecteur = (r.json as { data?: { embedding?: number[] }[] } | null)?.data?.[0]?.embedding;
  return Array.isArray(vecteur) && vecteur.length === 256
    ? { ok: true, http: r.http, modele, adaptateur: false, note: "Vecteur de 256 dimensions reçu." }
    : ecart(modele, r.http, { erreurType: r.erreurType, erreurCode: r.erreurCode }, false, "Pas de vecteur exploitable.");
}

async function testerImage(c: Contexte): Promise<Verdict> {
  const r = await c.deps.appeler({
    media: "image", capacite: "ia_vision", tache: "sonde_capacites", moteur: "intelligences",
    systeme: "", message: "Un petit cercle bleu sur fond blanc, style simple.", maxTokens: 1200,
  }, c.fetchImpl);
  return r.ok && r.media
    ? { ok: true, http: 200, modele: r.modele, adaptateur: true, note: "Image générée (coût réel d'un essai)." }
    : ecart(r.modele, null, {}, true, `Échec : ${r.motif.slice(0, 300)}`);
}

export const DEFINITIONS: DefinitionCapacite[] = [
  { code: "texte", libelle: "Texte et raisonnement", endpoint: "/v1/chat/completions", modeles: motif(/^(gpt-5|gpt-4o$|gpt-4\.1|o3$|o4-mini$)/), adaptateurPresent: true, tester: testerTexte },
  { code: "sortie_structuree", libelle: "Sorties structurées (JSON garanti)", endpoint: "/v1/chat/completions", modeles: motif(/^(gpt-5|gpt-4o$|gpt-4\.1)/), adaptateurPresent: true, tester: testerSortieStructuree },
  { code: "appel_outils", libelle: "Appel d'outils (function calling)", endpoint: "/v1/chat/completions", modeles: motif(/^(gpt-5|gpt-4o$|gpt-4\.1)/), adaptateurPresent: true, tester: testerOutils },
  { code: "vision", libelle: "Vision (lire une image)", endpoint: "/v1/chat/completions", modeles: motif(/^(gpt-5|gpt-4o$|gpt-4\.1)/), adaptateurPresent: true, tester: testerVision },
  { code: "moderation", libelle: "Modération", endpoint: "/v1/moderations", modeles: motif(/moderation/), adaptateurPresent: true, tester: testerModeration },
  { code: "recherche_web", libelle: "Recherche web", endpoint: "/v1/responses", modeles: motif(/^(gpt-5|search)|search-api|search-preview/), adaptateurPresent: true, tester: testerRechercheWeb },
  { code: "synthese_vocale", libelle: "Synthèse vocale (TTS)", endpoint: "/v1/audio/speech", modeles: motif(/^(tts-|gpt-4o-mini-tts)/), adaptateurPresent: true, tester: testerVoix },
  { code: "transcription", libelle: "Transcription de fichiers audio", endpoint: "/v1/audio/transcriptions", modeles: motif(/transcribe|whisper|^gpt-transcription/), adaptateurPresent: true, tester: testerTranscription },
  { code: "conversation_temps_reel", libelle: "Conversation vocale temps réel", endpoint: "/v1/realtime/client_secrets", modeles: motif(/^gpt-realtime(?!.*(whisper|translate))/), adaptateurPresent: true, tester: testerTempsReel },
  { code: "transcription_temps_reel", libelle: "Transcription dans la session temps réel", endpoint: "/v1/realtime/client_secrets", modeles: motif(/transcribe|whisper|realtime-whisper/), adaptateurPresent: true },
  { code: "empreintes_semantiques", libelle: "Embeddings (mémoire par le sens)", endpoint: "/v1/embeddings", modeles: motif(/embedding/), adaptateurPresent: false, tester: testerEmpreintes, note: "Aucun adaptateur MKA.P-MS AI : la passerelle d'embeddings est encore « non connectée »." },
  { code: "generation_image", libelle: "Génération d'images", endpoint: "/v1/responses (outil image_generation)", modeles: motif(/^(gpt-image|chatgpt-image)/), adaptateurPresent: true, couteux: true, tester: testerImage },
  { code: "traduction_audio", libelle: "Traduction audio en direct", endpoint: "/v1/realtime", modeles: motif(/realtime-translate/), adaptateurPresent: false, note: "Disponibilité constatée seulement : aucun adaptateur MKA.P-MS AI." },
  { code: "video", libelle: "Génération de vidéo", endpoint: "/v1/videos", modeles: motif(/^sora/), adaptateurPresent: false, note: "Disponibilité constatée seulement : aucun adaptateur MKA.P-MS AI." },
  { code: "code", libelle: "Modèles de code (Codex)", endpoint: "/v1/responses", modeles: motif(/codex/), adaptateurPresent: false, note: "Disponibilité constatée seulement : aucun adaptateur MKA.P-MS AI." },
];

export interface ResultatSonde {
  ok: boolean;
  /** Statut HTTP de la liste des modèles quand elle échoue. */
  httpListe: number | null;
  /** Identifiants API exacts renvoyés par le projet. */
  modelesDuProjet: string[];
  capacites: PreuveCapacite[];
}

function etatFinal(def: DefinitionCapacite, modeles: string[], v: Verdict | null, saute: boolean): EtatCapacite {
  if (modeles.length === 0 && !v?.ok) return "NOT_AVAILABLE";
  if (v) {
    if (v.ok) return v.adaptateur && def.adaptateurPresent ? "FUNCTIONAL" : "TESTED";
    if (refuseParAcces(v)) return "WAITING_EXTERNAL_ACCESS";
  }
  if (saute || !v) return def.adaptateurPresent ? "CONNECTED_TO_MKA_PMS_IA" : "ENABLED_FOR_PROJECT";
  return def.adaptateurPresent ? "CONNECTED_TO_MKA_PMS_IA" : "ENABLED_FOR_PROJECT";
}

/**
 * Lance la sonde. Ne jette jamais : l'échec est une donnée. Sans clé, ou si la
 * liste des modèles est refusée, aucune capacité n'est supposée.
 */
export async function lancerSonde(options: OptionsSonde = {}): Promise<ResultatSonde> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const cle = (options.cle ?? process.env.OPENAI_API_KEY ?? "").trim();
  const vide: ResultatSonde = { ok: false, httpListe: null, modelesDuProjet: [], capacites: [] };
  if (!cle) return vide;

  let ids: string[] = [];
  try {
    const r = await fetchImpl(`${API}/v1/models`, { headers: { Authorization: `Bearer ${cle}` }, redirect: "error", signal: AbortSignal.timeout(30_000) });
    if (!r.ok) {
      const e = codePublicErreur((await r.text()).slice(0, 4000));
      const preuve: PreuveCapacite = { capacite: "catalogue_modeles", etat: "WAITING_EXTERNAL_ACCESS", modele: null, endpoint: "/v1/models", httpStatus: r.status, erreurType: e.type, erreurCode: e.code, details: {} };
      if (options.persister !== false) await enregistrerPreuve(preuve);
      return { ...vide, httpListe: r.status, capacites: [preuve] };
    }
    ids = ((await r.json()) as { data?: { id?: string }[] }).data?.map((m) => m.id ?? "").filter(Boolean) ?? [];
  } catch {
    return { ...vide, capacites: [{ capacite: "catalogue_modeles", etat: "WAITING_EXTERNAL_ACCESS", modele: null, endpoint: "/v1/models", httpStatus: null, erreurType: "network_error", erreurCode: "", details: {} }] };
  }

  const contexte: Contexte = { cle, fetchImpl, deps: options.deps ?? DEPENDANCES_REELLES, ids: new Set(ids), audioEssai: null };
  const preuves: PreuveCapacite[] = [{
    capacite: "catalogue_modeles", etat: "ENABLED_FOR_PROJECT", modele: null, endpoint: "/v1/models", httpStatus: 200, erreurType: "", erreurCode: "",
    details: { nombre: ids.length, ids: [...ids].sort() },
  }];

  let modeleSessionTempsReel: string | null = null;
  // Ordre voulu : la voix avant la transcription (elle fournit l'audio d'essai), la session temps réel avant sa transcription.
  const ordre = ["texte", "sortie_structuree", "appel_outils", "vision", "moderation", "recherche_web", "synthese_vocale", "transcription", "conversation_temps_reel", "transcription_temps_reel", "empreintes_semantiques", "generation_image", "traduction_audio", "video", "code"];
  for (const code of ordre) {
    const def = DEFINITIONS.find((d) => d.code === code)!;
    const modeles = def.modeles(ids);
    const saute = !!def.couteux && !options.inclureCouteux;
    let verdict: Verdict | null = null;
    try {
      if (code === "transcription_temps_reel") verdict = await testerTranscriptionTempsReel(contexte, modeles.length ? modeles : [...MODELES_TRANSCRIPTION_FICHIER], modeleSessionTempsReel);
      else if (def.tester && !saute && (modeles.length > 0 || !["empreintes_semantiques", "conversation_temps_reel"].includes(code))) verdict = await def.tester(contexte, modeles);
    } catch (e) {
      verdict = ecart(null, null, { erreurType: "sonde_exception" }, def.adaptateurPresent, e instanceof Error ? e.message.slice(0, 80).replace(/[^A-Za-z0-9 ._-]/g, "") : "erreur");
    }
    if (code === "conversation_temps_reel" && verdict?.ok) modeleSessionTempsReel = verdict.modele;
    const etat = etatFinal(def, modeles, verdict, saute);
    preuves.push({
      capacite: code,
      etat,
      modele: verdict?.modele ?? modeles[0] ?? null,
      endpoint: def.endpoint,
      httpStatus: verdict?.http ?? null,
      erreurType: verdict?.erreurType ?? "",
      erreurCode: verdict?.erreurCode ?? "",
      details: {
        libelle: def.libelle,
        modelesDuProjet: modeles,
        adaptateurPresent: def.adaptateurPresent,
        traverseAdaptateur: verdict?.adaptateur ?? false,
        ...(saute ? { saute: "Capacité coûteuse : non testée sans demande explicite." } : {}),
        ...(verdict?.note || def.note ? { note: verdict?.note ?? def.note } : {}),
        ...(verdict?.essais ? { essais: verdict.essais } : {}),
      },
    });
  }

  if (options.persister !== false) {
    for (const p of preuves) await enregistrerPreuve(p);
    oublierCacheModelesValides();
  }
  return { ok: true, httpListe: 200, modelesDuProjet: [...ids].sort(), capacites: preuves };
}
