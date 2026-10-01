import { useEffect, useState } from "react";
import { AudioLines, ChevronDown, Clock3, Languages, Play, ShieldCheck, Trash2, Volume2 } from "lucide-react";
import {
  DICTATION_HISTORY_EVENT,
  clearDictationHistory,
  readDictationHistory,
  useVoicePreferences,
  type VoiceLanguage,
  type VoiceMode,
  type RealtimeVoiceName,
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
  const [openSection, setOpenSection] = useState<"voice" | "live" | "language" | "history" | null>(null);
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

  function toggle(section: NonNullable<typeof openSection>) {
    setOpenSection((current) => current === section ? null : section);
  }

  function SectionHeader({ section, icon: Icon, title, description }: { section: NonNullable<typeof openSection>; icon: typeof AudioLines; title: string; description: string }) {
    const expanded = openSection === section;
    return <button type="button" onClick={() => toggle(section)} aria-expanded={expanded} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02]">
      <Icon className="h-5 w-5 text-black/45" /><span className="min-w-0 flex-1"><b className="block text-sm">{title}</b><small className="block text-black/45">{description}</small></span><ChevronDown className={`h-4 w-4 text-black/40 transition ${expanded ? "rotate-180" : ""}`} />
    </button>;
  }

  return <section className="overflow-hidden rounded-2xl border border-black/10 bg-white" aria-label="Réglages de la voix">
    <div className="flex items-center gap-3 border-b border-black/5 px-4 py-4">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600"><AudioLines className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><h2 className="font-black text-[#111]">{title}</h2><p className="text-xs text-black/50">Préférences privées de cet appareil</p></div>
      {ttsSupported ? <button type="button" onClick={previewVoice} className="grid h-9 w-9 place-items-center rounded-full border border-black/10" aria-label="Écouter un aperçu"><Play className="h-4 w-4" /></button> : null}
    </div>

    <div className="divide-y divide-black/5">
      <div>
        <SectionHeader section="voice" icon={Volume2} title="Voix de lecture" description="Voix système utilisée pour les aperçus" />
        {openSection === "voice" ? <div className="border-t border-black/5 bg-black/[0.02] p-4">
          <label className="mb-2 block text-xs font-black uppercase tracking-wide text-black/40" htmlFor="alhud-voice-choice">Voix</label>
          {ttsSupported && voices.length ? <select id="alhud-voice-choice" value={preferences.voiceName} onChange={(event) => update("voiceName", event.target.value)} className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold"><option value="">Voix système</option>{voices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}{voice.default ? " · par défaut" : ""}</option>)}</select> : <p className="rounded-xl bg-white px-3 py-3 text-sm text-black/55">{ttsSupported ? "Chargement des voix installées…" : "La lecture vocale n’est pas disponible sur ce navigateur."}</p>}
        </div> : null}
      </div>
      <div>
        <SectionHeader section="live" icon={AudioLines} title="Conversation directe" description="Voix, qualité et réduction du bruit" />
        {openSection === "live" ? <div className="space-y-4 border-t border-black/5 bg-black/[0.02] p-4">
          <label className="block text-xs font-black uppercase tracking-wide text-black/40" htmlFor="alhud-realtime-voice-choice">Voix de la conversation directe<select id="alhud-realtime-voice-choice" value={preferences.realtimeVoice} onChange={(event) => update("realtimeVoice", event.target.value as RealtimeVoiceName)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold"><option value="marin">Marin</option><option value="coral">Coral</option><option value="sage">Sage</option><option value="verse">Verse</option><option value="alloy">Alloy</option><option value="ash">Ash</option><option value="ballad">Ballad</option><option value="echo">Echo</option><option value="shimmer">Shimmer</option></select></label>
          <label className="block text-xs font-black uppercase tracking-wide text-black/40" htmlFor="alhud-noise-reduction">Environnement sonore<select id="alhud-noise-reduction" value={preferences.noiseReduction} onChange={(event) => update("noiseReduction", event.target.value as typeof preferences.noiseReduction)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold"><option value="auto">Automatique (recommandé)</option><option value="near_field">Téléphone ou micro proche</option><option value="far_field">Ordinateur, tablette ou micro distant</option></select><small className="mt-1 block normal-case text-black/45">Ce réglage est utilisé par les deux micros pour mieux isoler votre voix.</small></label>
        </div> : null}
      </div>
      <div>
        <SectionHeader section="language" icon={Languages} title="Langue & comportement" description="Reconnaissance, réponse et arrière-plan" />
        {openSection === "language" ? <div className="space-y-4 border-t border-black/5 bg-black/[0.02] p-4">
          <label className="block text-xs font-black uppercase tracking-wide text-black/40">Mode vocal<select value={preferences.mode} onChange={(event) => update("mode", event.target.value as VoiceMode)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold"><option value="live">Live — reste actif jusqu’à Stop</option><option value="one_turn">Tour unique</option></select></label>
          <label className="block text-xs font-black uppercase tracking-wide text-black/40">Langue<select value={preferences.language} onChange={(event) => update("language", event.target.value as VoiceLanguage)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold"><option value="auto">Automatique</option><option value="fr-FR">Français</option><option value="en-US">English</option><option value="ar-SA">العربية</option></select></label>
          <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-3"><ShieldCheck className="h-5 w-5 text-black/45" /><span className="min-w-0 flex-1"><b className="block text-sm">Conversation en arrière-plan</b><small className="text-black/45">Si le système et le navigateur l’autorisent</small></span><Toggle label="Conversation en arrière-plan" value={preferences.background} onChange={(value) => update("background", value)} /></div>
        </div> : null}
      </div>
      <div>
      <button type="button" onClick={() => { toggle("history"); setHistoryOpen((open) => openSection !== "history" ? true : !open); }} aria-expanded={openSection === "history"} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-black/[0.02]">
        <Clock3 className="h-5 w-5 text-black/45" /><span className="min-w-0 flex-1"><b className="block text-sm">Historique des dictées</b><small className="text-black/45">{history.length} dictée{history.length === 1 ? "" : "s"} conservée{history.length === 1 ? "" : "s"} localement</small></span><ChevronDown className={`h-4 w-4 text-black/40 transition ${openSection === "history" ? "rotate-180" : ""}`} />
      </button>
      {openSection === "history" && historyOpen ? <div className="border-t border-black/5 bg-black/[0.02] px-4 py-3">
        {history.length ? <><ul className="max-h-52 space-y-2 overflow-y-auto">{history.map((entry) => <li key={entry.id} className="rounded-lg bg-white p-2 text-xs"><p className="line-clamp-3 text-black/70">{entry.text}</p><small className="mt-1 block text-black/35">{new Date(entry.createdAt).toLocaleString("fr-FR")} · {entry.source === "conversation" ? "conversation" : "dictée"}</small></li>)}</ul><button type="button" onClick={() => clearDictationHistory()} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5" /> Effacer l’historique local</button></> : <p className="text-xs text-black/45">Aucune dictée enregistrée sur cet appareil.</p>}
      </div> : null}
      </div>
    </div>
  </section>;
}
