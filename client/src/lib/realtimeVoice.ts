export type RealtimeVoiceMode = "dictee" | "conversation";
export type RealtimeVoiceState = "connexion" | "ecoute" | "reflexion" | "reponse";

export interface RealtimeVoiceControl {
  close: () => void;
  setMuted: (muted: boolean) => void;
}

interface RealtimeVoiceOptions {
  mode: RealtimeVoiceMode;
  exchangeSdp: (sdp: string) => Promise<string>;
  onState?: (state: RealtimeVoiceState) => void;
  onUserPartial?: (text: string) => void;
  onUserTranscript?: (text: string) => void;
  onAssistantPartial?: (text: string) => void;
  onAssistantTranscript?: (text: string) => void;
  onError?: (message: string) => void;
  /** `echec` = la session n'a jamais pu s'établir (le micro est déjà coupé) : l'appelant peut proposer un relais. */
  onClosed?: (info?: { echec: boolean }) => void;
  /** Texte court décrivant l'état réel de la liaison (canal, événements reçus) — pour que le PDG puisse dire exactement ce qu'il voit. */
  onDiagnostic?: (texte: string) => void;
  /** Annule la connexion à tout moment : le micro est coupé immédiatement, même avant que la liaison soit établie. */
  signal?: AbortSignal;
}

type RealtimeEvent = {
  type?: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string; code?: string | null; type?: string };
};

/** Délai laissé au canal d'événements pour s'ouvrir après la réponse du service. */
export const DELAI_CANAL_MS = 15_000;

/**
 * Code public d'une erreur du service vocal (jamais son message libre, qui peut citer des
 * éléments de la demande) : de quoi dire au PDG pourquoi rien ne s'écrit.
 */
export function codeErreurService(erreur: RealtimeEvent["error"]): string {
  const brut = String(erreur?.code ?? erreur?.type ?? "");
  return /^[A-Za-z0-9_.-]{1,60}$/.test(brut) ? brut : "";
}

/** Message affiché pour un événement d'erreur ou d'échec de transcription du service. */
export function messageEvenementErreur(type: string, erreur: RealtimeEvent["error"]): string {
  const code = codeErreurService(erreur);
  const detail = code ? ` (${code})` : "";
  if (type === "conversation.item.input_audio_transcription.failed") {
    return `Le service n'a pas pu transcrire ce que vous dites${detail}. Le micro capte, mais rien ne peut être écrit.`;
  }
  return `Le service vocal a refusé cet échange${detail}.`;
}

/**
 * Ne transmet jamais une offre SDP incomplète. Sur iPhone, Android et certains
 * navigateurs d'ordinateur, `setLocalDescription()` revient avant la collecte
 * des candidats ICE ; envoyer l'offre à cet instant conduit le service à la refuser
 * (`invalid_offer`) et l'interface donne l'impression que le micro s'arrête.
 */
function attendreIceComplet(peer: RTCPeerConnection, timeoutMs = 10_000, graceApresPremierCandidatMs = 3_000): Promise<void> {
  if (peer.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve, reject) => {
    let total: number | undefined;
    let grace: number | undefined;
    const verifier = () => { if (peer.iceGatheringState === "complete") terminer(); };
    // Au moins un vrai candidat est déjà dans l'offre : on n'attend plus que quelques secondes
    // la fin de la collecte (certains mobiles ne la terminent jamais, et le micro paraissait « ouvert » sans rien faire).
    const surCandidat = (e: Event) => {
      if ((e as RTCPeerConnectionIceEvent).candidate && grace === undefined) grace = window.setTimeout(() => terminer(), graceApresPremierCandidatMs);
    };
    function terminer(erreur?: Error) {
      window.clearTimeout(total);
      window.clearTimeout(grace);
      peer.removeEventListener("icegatheringstatechange", verifier);
      peer.removeEventListener("icecandidate", surCandidat);
      if (erreur) reject(erreur); else resolve();
    }
    peer.addEventListener("icegatheringstatechange", verifier);
    peer.addEventListener("icecandidate", surCandidat);
    total = window.setTimeout(() => terminer(new Error("REALTIME_ICE_TIMEOUT")), timeoutMs);
    verifier();
  });
}

/** Session audio WebRTC continue pour Safari, Chrome, Edge et Firefox, mobile ou ordinateur. */
export async function startRealtimeVoice(options: RealtimeVoiceOptions): Promise<RealtimeVoiceControl> {
  if (typeof RTCPeerConnection === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("REALTIME_NOT_SUPPORTED");
  }
  if (options.signal?.aborted) throw new Error("REALTIME_ABORTED");
  options.onState?.("connexion");
  // `audio: true` laisse chaque navigateur choisir ses contraintes réellement
  // prises en charge. Certains Android/WebView et ordinateurs refusaient les
  // contraintes avancées avant même d'ouvrir la connexion.
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  if (options.signal?.aborted) {
    // L'arrêt a été demandé pendant l'autorisation du micro : on le rend tout de suite.
    stream.getTracks().forEach((track) => track.stop());
    throw new Error("REALTIME_ABORTED");
  }
  const peer = new RTCPeerConnection();
  const channel = peer.createDataChannel("oai-events");
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.setAttribute("playsinline", "true");
  audio.hidden = true;
  document.body.appendChild(audio);
  let closed = false;
  let canalOuvert = false;
  let veilleCanal: number | undefined;
  let evenements = 0;
  const typesVus: string[] = [];
  const userPartial = new Map<string, string>();
  let assistantPartial = "";

  const diagnostic = (etat: string) => {
    const derniers = typesVus.slice(-3).join(", ");
    options.onDiagnostic?.(`${etat} · ${evenements} événement(s) reçu(s)${derniers ? ` : ${derniers}` : ""}`);
  };

  const close = (info?: { echec: boolean }) => {
    if (closed) return;
    closed = true;
    window.clearTimeout(veilleCanal);
    options.signal?.removeEventListener("abort", surAnnulation);
    channel.close();
    peer.close();
    stream.getTracks().forEach((track) => track.stop());
    audio.pause();
    audio.srcObject = null;
    audio.remove();
    options.onClosed?.(info);
  };
  function surAnnulation() { close(); }
  // Arrêt demandé à n'importe quel moment — y compris avant que la liaison soit établie : micro coupé aussitôt.
  options.signal?.addEventListener("abort", surAnnulation, { once: true });

  peer.ontrack = (event) => {
    audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
    void audio.play().catch(() => options.onError?.("Touchez l’écran puis réessayez pour autoriser la lecture audio."));
  };
  peer.onconnectionstatechange = () => {
    diagnostic(`liaison ${peer.connectionState}`);
    if (peer.connectionState === "connected") options.onState?.("ecoute");
    // `disconnected` est souvent transitoire sur mobile ou Wi-Fi : WebRTC peut
    // se rétablir. Seuls les états terminaux ferment réellement la session.
    if (["failed", "closed"].includes(peer.connectionState) && !closed) {
      if (peer.connectionState === "failed") options.onError?.(canalOuvert ? "La connexion vocale a été interrompue." : "La connexion vocale n'a pas pu s'établir.");
      // Jamais établie (canal jamais ouvert) : l'appelant peut proposer un relais plutôt qu'un micro muet.
      close(canalOuvert ? undefined : { echec: true });
    }
  };
  channel.onopen = () => {
    canalOuvert = true;
    window.clearTimeout(veilleCanal);
    options.onState?.("ecoute");
    diagnostic("canal ouvert");
  };
  channel.onmessage = (message) => {
    let event: RealtimeEvent;
    try { event = JSON.parse(String(message.data)) as RealtimeEvent; } catch { return; }
    const type = event.type ?? "";
    evenements += 1;
    if (type && typesVus[typesVus.length - 1] !== type) { typesVus.push(type); if (typesVus.length > 12) typesVus.shift(); }
    diagnostic("canal ouvert");
    if (type === "input_audio_buffer.speech_started") options.onState?.("ecoute");
    if (type === "input_audio_buffer.speech_stopped") options.onState?.("reflexion");
    if (type === "conversation.item.input_audio_transcription.delta") {
      const key = event.item_id ?? "current";
      const next = `${userPartial.get(key) ?? ""}${event.delta ?? ""}`;
      userPartial.set(key, next);
      options.onUserPartial?.(next);
    }
    if (type === "conversation.item.input_audio_transcription.completed") {
      const key = event.item_id ?? "current";
      const finalText = (event.transcript ?? userPartial.get(key) ?? "").trim();
      userPartial.delete(key);
      if (finalText) options.onUserTranscript?.(finalText);
    }
    if (type === "response.output_audio_transcript.delta") {
      assistantPartial += event.delta ?? "";
      options.onAssistantPartial?.(assistantPartial);
      options.onState?.("reponse");
    }
    if (type === "response.output_audio_transcript.done") {
      const finalText = (event.transcript ?? assistantPartial).trim();
      assistantPartial = "";
      if (finalText) options.onAssistantTranscript?.(finalText);
      options.onState?.("ecoute");
    }
    if (type === "output_audio_buffer.started") options.onState?.("reponse");
    if (type === "output_audio_buffer.stopped") options.onState?.("ecoute");
    // Échec de transcription : le micro capte mais rien ne s'écrit — c'était ignoré en silence.
    if (type === "error" || type === "conversation.item.input_audio_transcription.failed") {
      options.onError?.(messageEvenementErreur(type, event.error));
    }
  };

  stream.getAudioTracks().forEach((track) => peer.addTrack(track, stream));
  try {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    // Le serveur reçoit l'offre locale finale (candidats ICE inclus), pas la
    // copie initiale de `createOffer()`. C'est indispensable aux mobiles.
    await attendreIceComplet(peer);
    if (closed) throw new Error("REALTIME_ABORTED");
    const answerSdp = await options.exchangeSdp(peer.localDescription?.sdp ?? "");
    if (closed) throw new Error("REALTIME_ABORTED");
    await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });
  } catch (error) {
    close();
    throw error;
  }
  // Le service a répondu : le canal d'événements doit s'ouvrir. Sinon le micro resterait « ouvert » sans jamais rien écrire.
  diagnostic("réponse du service reçue, canal en attente");
  veilleCanal = window.setTimeout(() => {
    if (closed || canalOuvert) return;
    options.onError?.("La connexion vocale ne s'établit pas (le service n'ouvre pas son canal). Le micro est coupé.");
    close({ echec: true });
  }, DELAI_CANAL_MS);

  return {
    close,
    setMuted: (muted) => stream.getAudioTracks().forEach((track) => { track.enabled = !muted; }),
  };
}
