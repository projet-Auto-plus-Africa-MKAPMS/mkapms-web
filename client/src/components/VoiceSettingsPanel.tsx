import { useEffect, useState } from "react";
import { AudioLines, Clock3, Languages, Play, ShieldCheck, Trash2, Volume2 } from "lucide-react";
import {
  DICTATION_HISTORY_EVENT,
  clearDictationHistory,
  readDictationHistory,
  useVoicePreferences,
  type VoiceLanguage,
  type VoiceMode,
} from "../lib/voicePreferences";

function Toggle({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)} className={`relative h-7 w-12 shrink-0 rounded-full transition ${value ? "bg-blue-600" : "bg-black/15"}`}>
    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${value ? "left-6" : "left-1"}`} />
  </button>;
}

export function VoiceSettingsPanel({ title = "Voix" }: { title?: string }) {
  const [preferences, save] = useVoicePreferences();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(readDictationHistory);
  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!ttsSupported) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, [ttsSupported]);

  useEffect(() => {
    const refresh = () => setHistory(readDictationHistory());
    window.addEventListener(DICTATION_HISTORY_EVENT, refresh);
    return () => window.removeEventListener(DICTATION_HISTORY_EVENT, refresh);
  }, []);

  const selectedVoice = voices.find((voice) => voice.name === preferences.voiceName);
  const update = <K extends keyof typeof preferences>(key: K, value: (typeof preferences)[K]) => save({ ...preferences, [key]: value });

  function previewVoice() {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Bonjour, je suis AL-HUDHUD M. Je suis prêt à vous répondre.");
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }
    window.speechSynthesis.speak(utterance);
  }

  return <section className="overflow-hidden rounded-2xl border border-black/10 bg-white" aria-label="Réglages de la voix">
    <div className="flex items-center gap-3 border-b border-black/5 px-4 py-4">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600"><AudioLines className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><h2 className="font-black text-[#111]">{title}</h2><p className="text-xs text-black/50">Préférences privées de cet appareil</p></div>
      {ttsSupported ? <button type="button" onClick={previewVoice} className="grid h-9 w-9 place-items-center rounded-full border border-black/10" aria-label="Écouter un aperçu"><Play className="h-4 w-4" /></button> : null}
    </div>

    <div className="border-b border-black/5 p-4">
      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-black/40" htmlFor="alhud-voice-choice">Voix</label>
      {ttsSupported && voices.length ? <select id="alhud-voice-choice" value={preferences.voiceName} onChange={(event) => update("voiceName", event.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold">
        <option value="">Voix système</option>
        {voices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}{voice.default ? " · par défaut" : ""}</option>)}
      </select> : <p className="rounded-xl bg-black/[0.03] px-3 py-3 text-sm text-black/55">{ttsSupported ? "Chargement des voix installées…" : "La lecture vocale n’est pas disponible sur ce navigateur."}</p>}
    </div>

    <div className="divide-y divide-black/5">
      <label className="flex items-center gap-3 px-4 py-3.5">
        <Volume2 className="h-5 w-5 text-black/45" /><span className="min-w-0 flex-1"><b className="block text-sm">Mode vocal</b><small className="text-black/45">Live continue, Tour unique s’arrête après une réponse</small></span>
        <select value={preferences.mode} onChange={(event) => update("mode", event.target.value as VoiceMode)} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm font-bold"><option value="live">Live</option><option value="one_turn">Tour unique</option></select>
      </label>
      <label className="flex items-center gap-3 px-4 py-3.5">
        <Languages className="h-5 w-5 text-black/45" /><span className="min-w-0 flex-1"><b className="block text-sm">Langue</b><small className="text-black/45">Reconnaissance et réponse vocale</small></span>
        <select value={preferences.language} onChange={(event) => update("language", event.target.value as VoiceLanguage)} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm font-bold"><option value="auto">Automatique</option><option value="fr-FR">Français</option><option value="en-US">English</option><option value="ar-SA">العربية</option></select>
      </label>
      <button type="button" onClick={() => setHistoryOpen((open) => !open)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <Clock3 className="h-5 w-5 text-black/45" /><span className="min-w-0 flex-1"><b className="block text-sm">Historique des dictées</b><small className="text-black/45">{history.length} dictée{history.length === 1 ? "" : "s"} conservée{history.length === 1 ? "" : "s"} localement</small></span><span className="text-sm font-bold text-black/40">{historyOpen ? "Fermer" : "Voir"}</span>
      </button>
      {historyOpen ? <div className="bg-black/[0.02] px-4 py-3">
        {history.length ? <><ul className="max-h-52 space-y-2 overflow-y-auto">{history.map((entry) => <li key={entry.id} className="rounded-lg bg-white p-2 text-xs"><p className="line-clamp-3 text-black/70">{entry.text}</p><small className="mt-1 block text-black/35">{new Date(entry.createdAt).toLocaleString("fr-FR")} · {entry.source === "conversation" ? "conversation" : "dictée"}</small></li>)}</ul><button type="button" onClick={() => clearDictationHistory()} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5" /> Effacer l’historique local</button></> : <p className="text-xs text-black/45">Aucune dictée enregistrée sur cet appareil.</p>}
      </div> : null}
      <div className="flex items-center gap-3 px-4 py-3.5"><AudioLines className="h-5 w-5 text-black/45" /><span className="min-w-0 flex-1"><b className="block text-sm">Démarrage du vocal</b><small className="text-black/45">Sur iPhone, appuyez sur le bouton vocal : le navigateur exige ce geste avant d’autoriser le micro.</small></span></div>
      <div className="flex items-center gap-3 px-4 py-3.5"><ShieldCheck className="h-5 w-5 text-black/45" /><span className="min-w-0 flex-1"><b className="block text-sm">Conversation en arrière-plan</b><small className="text-black/45">Maintient l’écoute si le système et le navigateur l’autorisent</small></span><Toggle label="Conversation en arrière-plan" value={preferences.background} onChange={(value) => update("background", value)} /></div>
    </div>
  </section>;
}
