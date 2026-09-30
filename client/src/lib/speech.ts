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

/**
 * Demande l'autorisation dans le geste explicite de l'utilisateur avant de
 * démarrer SpeechRecognition. Sur iOS, un démarrage automatique au chargement
 * est refusé même si le micro avait déjà fonctionné auparavant.
 */
export async function requestMicrophoneAccess(): Promise<{ ok: boolean; message: string }> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, message: "Micro indisponible dans ce navigateur." };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { ok: true, message: "" };
  } catch (error) {
    const nom = error instanceof DOMException ? error.name : "";
    if (nom === "NotAllowedError" || nom === "SecurityError") {
      return { ok: false, message: "Micro bloqué : ouvrez les réglages du navigateur pour AL-HUDHUD·M, autorisez le microphone, puis revenez appuyer sur le micro." };
    }
    if (nom === "NotFoundError") return { ok: false, message: "Aucun microphone n’est disponible sur cet appareil." };
    return { ok: false, message: "Le microphone n’a pas pu démarrer. Réessayez après avoir vérifié son autorisation." };
  }
}

const MESSAGES: Record<string, string> = {
  "not-allowed": "Micro refusé par le navigateur : autorisez l'accès au micro pour dicter.",
  "service-not-allowed": "Reconnaissance vocale refusée par le navigateur.",
  "no-speech": "Aucune parole détectée.",
  "audio-capture": "Aucun micro détecté sur cet appareil.",
  network: "Reconnaissance vocale indisponible : problème réseau.",
  aborted: "Dictée interrompue.",
};

/** Erreurs qui signalent un blocage réel (permission, matériel) : jamais de relance dessus. */
const SANS_REDEMARRAGE = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);

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
  // Constructeur re-typé non-nul explicitement : TypeScript ne conserve pas
  // l'étroitesse de `Ctor` à l'intérieur de la fonction imbriquée demarrerSession.
  const ConstructeurReco: SpeechRecognitionConstructor = Ctor;

  let arretDemande = false;
  let bloquant = false;
  let texteAccumule = "";
  let texteSessionCourante = "";
  let actuel: SpeechRecognitionLike;

  const texteComplet = () => [texteAccumule, texteSessionCourante].filter(Boolean).join(" ");

  function demarrerSession(): SpeechRecognitionLike {
    const reco = new ConstructeurReco();
    reco.lang = lang;
    // Continue tant que la personne n'a pas cliqué pour arrêter : le navigateur
    // ne doit jamais couper la dictée tout seul après une pause de parole.
    reco.continuous = true;
    reco.interimResults = true;

    reco.onresult = (event) => {
      let texte = "";
      let final = false;
      for (let i = 0; i < event.results.length; i += 1) {
        const r = event.results[i];
        texte += r[0].transcript;
        if (r.isFinal) final = true;
      }
      texteSessionCourante = texte;
      handlers.onText(texteComplet(), final);
    };
    reco.onerror = (event) => {
      bloquant = SANS_REDEMARRAGE.has(event.error);
      // Une erreur récupérable (no-speech, aborted, network) est suivie d'un
      // redémarrage automatique et silencieux dans onend : inutile d'alarmer la
      // personne pour une coupure qu'elle ne verra jamais. Seule une erreur
      // bloquante (permission refusée, pas de micro…) lui est montrée.
      if (bloquant) {
        handlers.onError(MESSAGES[event.error] ?? `Dictée impossible : ${event.error}.`);
      }
    };
    reco.onend = () => {
      if (arretDemande || bloquant) { handlers.onEnd(); return; }
      // Certains navigateurs (Safari/iOS notamment) coupent la reconnaissance tout seuls
      // après une courte pause même avec continuous=true : on relance automatiquement, en
      // conservant ce qui a déjà été dicté, tant que la personne n'a pas cliqué sur stop.
      texteAccumule = texteComplet();
      texteSessionCourante = "";
      try {
        actuel = demarrerSession();
      } catch {
        bloquant = true;
        handlers.onError("La dictée n’a pas pu redémarrer. Appuyez de nouveau sur le micro.");
        handlers.onEnd();
      }
    };
    reco.start();
    return reco;
  }

  try {
    actuel = demarrerSession();
  } catch {
    handlers.onError("La dictée n’a pas pu démarrer. Vérifiez l’autorisation du microphone puis réessayez.");
    handlers.onEnd();
    return null;
  }
  return {
    stop: () => {
      arretDemande = true;
      actuel.stop();
    },
  };
}
