/**
 * Point 72 — dictée. On utilise la reconnaissance vocale du navigateur, la
 * seule réellement disponible sans prestataire configuré. Si le navigateur ne
 * la fournit pas, l'écran doit le dire au lieu d'afficher un micro inerte.
 */

export interface SpeechAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechResult {
  readonly length: number;
  isFinal: boolean;
  item(index: number): SpeechAlternative;
  [index: number]: SpeechAlternative;
}

interface SpeechResultList {
  readonly length: number;
  item(index: number): SpeechResult;
  [index: number]: SpeechResult;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechResultList;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

/** Constructeur réellement présent, ou null. Aucun repli inventé. */
export function speechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface DictationHandlers {
  onText: (text: string, final: boolean) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}

const MESSAGES: Record<string, string> = {
  "not-allowed": "Micro refusé par le navigateur : autorisez l'accès au micro pour dicter.",
  "service-not-allowed": "Reconnaissance vocale refusée par le navigateur.",
  "no-speech": "Aucune parole détectée.",
  "audio-capture": "Aucun micro détecté sur cet appareil.",
  network: "Reconnaissance vocale indisponible : problème réseau.",
  aborted: "Dictée interrompue.",
};

/**
 * Démarre une dictée. Retourne un objet permettant de l'arrêter, ou null si le
 * navigateur ne sait pas dicter.
 */
export function startDictation(
  lang: string,
  handlers: DictationHandlers,
): { stop: () => void } | null {
  const Ctor = speechRecognitionConstructor();
  if (!Ctor) return null;

  const reco = new Ctor();
  reco.lang = lang;
  reco.continuous = false;
  reco.interimResults = true;

  reco.onresult = (event) => {
    let texte = "";
    let final = false;
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const r = event.results[i];
      texte += r[0].transcript;
      if (r.isFinal) final = true;
    }
    handlers.onText(texte, final);
  };
  reco.onerror = (event) => {
    handlers.onError(MESSAGES[event.error] ?? `Dictée impossible : ${event.error}.`);
  };
  reco.onend = () => handlers.onEnd();

  reco.start();
  return { stop: () => reco.stop() };
}
