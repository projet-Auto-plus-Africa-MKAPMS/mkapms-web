import { useEffect, useState } from "react";

export type VoiceMode = "live" | "one_turn";
export type VoiceLanguage = "auto" | "fr-FR" | "en-US" | "ar-SA" | "es-ES" | "pt-PT" | "de-DE" | "it-IT" | "nl-NL" | "tr-TR";

/** Langues proposées aux deux micros : reconnaissance du navigateur, transcription du service et langue de réponse. */
export const VOICE_LANGUAGES: { id: VoiceLanguage; label: string }[] = [
  { id: "auto", label: "Automatique" },
  { id: "fr-FR", label: "Français" },
  { id: "en-US", label: "English" },
  { id: "ar-SA", label: "العربية" },
  { id: "es-ES", label: "Español" },
  { id: "pt-PT", label: "Português" },
  { id: "de-DE", label: "Deutsch" },
  { id: "it-IT", label: "Italiano" },
  { id: "nl-NL", label: "Nederlands" },
  { id: "tr-TR", label: "Türkçe" },
];

/** Groupes d'écoute des voix de la conversation directe (impression d'écoute, l'aperçu sonore décide). */
export const REALTIME_VOICE_GROUPS: { timbre: "plutôt douce" | "plutôt grave" | "neutre"; label: string }[] = [
  { timbre: "plutôt douce", label: "Timbre doux (souvent perçu féminin)" },
  { timbre: "plutôt grave", label: "Timbre grave (souvent perçu masculin)" },
  { timbre: "neutre", label: "Timbre neutre" },
];
export type VoiceNoiseReduction = "auto" | "near_field" | "far_field";
export type RealtimeVoiceName = "marin" | "cedar" | "coral" | "sage" | "verse" | "alloy" | "ash" | "ballad" | "echo" | "shimmer";

/**
 * Voix de la conversation directe. Le « timbre » est une impression d'écoute, pas une donnée du fournisseur :
 * il sert à repérer des voix graves ou douces, c'est l'aperçu sonore qui décide.
 */
export const REALTIME_VOICES: { id: RealtimeVoiceName; label: string; timbre: "plutôt grave" | "plutôt douce" | "neutre" }[] = [
  { id: "marin", label: "Marin", timbre: "plutôt douce" },
  { id: "cedar", label: "Cedar", timbre: "plutôt grave" },
  { id: "ash", label: "Ash", timbre: "plutôt grave" },
  { id: "echo", label: "Echo", timbre: "plutôt grave" },
  { id: "verse", label: "Verse", timbre: "plutôt grave" },
  { id: "ballad", label: "Ballad", timbre: "plutôt grave" },
  { id: "alloy", label: "Alloy", timbre: "neutre" },
  { id: "coral", label: "Coral", timbre: "plutôt douce" },
  { id: "sage", label: "Sage", timbre: "plutôt douce" },
  { id: "shimmer", label: "Shimmer", timbre: "plutôt douce" },
];

export interface VoicePreferences {
  voiceName: string;
  realtimeVoice: RealtimeVoiceName;
  mode: VoiceMode;
  language: VoiceLanguage;
  autoStart: boolean;
  background: boolean;
  /** Profil sonore envoyé au serveur, sans transmettre d'information sur l'appareil. */
  noiseReduction: VoiceNoiseReduction;
}

export interface DictationHistoryEntry {
  id: string;
  text: string;
  createdAt: string;
  source: "dictation" | "conversation";
}

export const VOICE_PREFERENCES_KEY = "mkapms_voice_preferences_v1";
export const LEGACY_VOICE_KEY = "mkapms_voix_tts";
export const DICTATION_HISTORY_KEY = "mkapms_dictation_history_v1";
export const VOICE_PREFERENCES_EVENT = "mkapms:voice-preferences";
export const DICTATION_HISTORY_EVENT = "mkapms:dictation-history";

export const DEFAULT_VOICE_PREFERENCES: VoicePreferences = {
  voiceName: "",
  realtimeVoice: "marin",
  mode: "live",
  language: "auto",
  autoStart: false,
  background: false,
  noiseReduction: "auto",
};

function storageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readVoicePreferences(): VoicePreferences {
  if (!storageAvailable()) return DEFAULT_VOICE_PREFERENCES;
  try {
    const parsed = JSON.parse(localStorage.getItem(VOICE_PREFERENCES_KEY) ?? "{}") as Partial<VoicePreferences>;
    const legacyVoice = localStorage.getItem(LEGACY_VOICE_KEY) ?? "";
    return {
      voiceName: typeof parsed.voiceName === "string" ? parsed.voiceName : legacyVoice,
      realtimeVoice: REALTIME_VOICES.map((v) => v.id).includes(String(parsed.realtimeVoice) as RealtimeVoiceName)
        ? parsed.realtimeVoice as RealtimeVoiceName
        : "marin",
      mode: parsed.mode === "one_turn" ? "one_turn" : "live",
      language: VOICE_LANGUAGES.some((langue) => langue.id === parsed.language)
        ? parsed.language as VoiceLanguage
        : "auto",
      autoStart: parsed.autoStart === true,
      background: parsed.background === true,
      noiseReduction: ["auto", "near_field", "far_field"].includes(String(parsed.noiseReduction))
        ? parsed.noiseReduction as VoiceNoiseReduction
        : "auto",
    };
  } catch {
    try {
      return { ...DEFAULT_VOICE_PREFERENCES, voiceName: localStorage.getItem(LEGACY_VOICE_KEY) ?? "" };
    } catch {
      return DEFAULT_VOICE_PREFERENCES;
    }
  }
}

export function writeVoicePreferences(next: VoicePreferences): void {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(VOICE_PREFERENCES_KEY, JSON.stringify(next));
    localStorage.setItem(LEGACY_VOICE_KEY, next.voiceName);
    window.dispatchEvent(new CustomEvent(VOICE_PREFERENCES_EVENT, { detail: next }));
  } catch {
    // En navigation privée, les réglages restent actifs dans l'état React courant.
  }
}

export function useVoicePreferences(): [VoicePreferences, (next: VoicePreferences) => void] {
  const [preferences, setPreferences] = useState<VoicePreferences>(readVoicePreferences);

  useEffect(() => {
    const refresh = () => setPreferences(readVoicePreferences());
    window.addEventListener(VOICE_PREFERENCES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(VOICE_PREFERENCES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return [preferences, (next) => {
    setPreferences(next);
    writeVoicePreferences(next);
  }];
}

export function recognitionLanguage(preferences: VoicePreferences): string {
  if (preferences.language !== "auto") return preferences.language;
  return typeof navigator !== "undefined" && navigator.language ? navigator.language : "fr-FR";
}

/** Résout un réglage réellement exploité par la réduction de bruit Realtime. */
export function noiseReductionFor(preferences: VoicePreferences): Exclude<VoiceNoiseReduction, "auto"> {
  if (preferences.noiseReduction !== "auto") return preferences.noiseReduction;
  // Le téléphone est habituellement tenu près de la bouche ; ordinateur et tablette
  // ont plus souvent un micro distant. Seule la catégorie acoustique est envoyée.
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  return /android|iphone|ipod|mobile/i.test(userAgent) ? "near_field" : "far_field";
}

export function readDictationHistory(): DictationHistoryEntry[] {
  if (!storageAvailable()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(DICTATION_HISTORY_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is DictationHistoryEntry =>
      entry && typeof entry.id === "string" && typeof entry.text === "string" &&
      typeof entry.createdAt === "string" && (entry.source === "dictation" || entry.source === "conversation"),
    ).slice(0, 30);
  } catch {
    return [];
  }
}

export function addDictationHistory(text: string, source: DictationHistoryEntry["source"]): void {
  const cleaned = text.trim();
  if (!cleaned || !storageAvailable()) return;
  const current = readDictationHistory();
  const latest = current[0];
  if (latest?.text === cleaned && latest.source === source) return;
  const entry: DictationHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: cleaned.slice(0, 2000),
    createdAt: new Date().toISOString(),
    source,
  };
  try {
    const extendsLatest = latest?.source === source && cleaned.startsWith(latest.text) &&
      Date.now() - new Date(latest.createdAt).getTime() < 120_000;
    localStorage.setItem(DICTATION_HISTORY_KEY, JSON.stringify([entry, ...(extendsLatest ? current.slice(1) : current)].slice(0, 30)));
    window.dispatchEvent(new Event(DICTATION_HISTORY_EVENT));
  } catch {
    // L'historique privé local n'est pas indispensable au fonctionnement du micro.
  }
}

export function clearDictationHistory(): void {
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(DICTATION_HISTORY_KEY);
    window.dispatchEvent(new Event(DICTATION_HISTORY_EVENT));
  } catch {
    // Stockage local indisponible.
  }
}
