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
  onClosed?: () => void;
}

type RealtimeEvent = {
  type?: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
};

/**
 * Ne transmet jamais une offre SDP incomplète. Sur iPhone, Android et certains
 * navigateurs d'ordinateur, `setLocalDescription()` revient avant la collecte
 * des candidats ICE ; envoyer l'offre à cet instant conduit le service à la refuser
 * (`invalid_offer`) et l'interface donne l'impression que le micro s'arrête.
 */
function attendreIceComplet(peer: RTCPeerConnection, timeoutMs = 10_000): Promise<void> {
  if (peer.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve, reject) => {
    let timeout: number | undefined;
    const verifier = () => { if (peer.iceGatheringState === "complete") terminer(); };
    function terminer(erreur?: Error) {
      window.clearTimeout(timeout);
      peer.removeEventListener("icegatheringstatechange", verifier);
      if (erreur) reject(erreur); else resolve();
    }
    peer.addEventListener("icegatheringstatechange", verifier);
    timeout = window.setTimeout(() => terminer(new Error("REALTIME_ICE_TIMEOUT")), timeoutMs);
    verifier();
  });
}

/** Session audio WebRTC continue pour Safari, Chrome, Edge et Firefox, mobile ou ordinateur. */
export async function startRealtimeVoice(options: RealtimeVoiceOptions): Promise<RealtimeVoiceControl> {
  if (typeof RTCPeerConnection === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("REALTIME_NOT_SUPPORTED");
  }
  options.onState?.("connexion");
  // `audio: true` laisse chaque navigateur choisir ses contraintes réellement
  // prises en charge. Certains Android/WebView et ordinateurs refusaient les
  // contraintes avancées avant même d'ouvrir la connexion.
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const peer = new RTCPeerConnection();
  const channel = peer.createDataChannel("oai-events");
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.setAttribute("playsinline", "true");
  audio.hidden = true;
  document.body.appendChild(audio);
  let closed = false;
  const userPartial = new Map<string, string>();
  let assistantPartial = "";

  const close = () => {
    if (closed) return;
    closed = true;
    channel.close();
    peer.close();
    stream.getTracks().forEach((track) => track.stop());
    audio.pause();
    audio.srcObject = null;
    audio.remove();
    options.onClosed?.();
  };

  peer.ontrack = (event) => {
    audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
    void audio.play().catch(() => options.onError?.("Touchez l’écran puis réessayez pour autoriser la lecture audio."));
  };
  peer.onconnectionstatechange = () => {
    if (peer.connectionState === "connected") options.onState?.("ecoute");
    // `disconnected` est souvent transitoire sur mobile ou Wi-Fi : WebRTC peut
    // se rétablir. Seuls les états terminaux ferment réellement la session.
    if (["failed", "closed"].includes(peer.connectionState) && !closed) {
      if (peer.connectionState === "failed") options.onError?.("La connexion vocale a été interrompue.");
      close();
    }
  };
  channel.onopen = () => options.onState?.("ecoute");
  channel.onmessage = (message) => {
    let event: RealtimeEvent;
    try { event = JSON.parse(String(message.data)) as RealtimeEvent; } catch { return; }
    const type = event.type ?? "";
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
    if (type === "error") options.onError?.(event.error?.message ? "Le service vocal a refusé cet échange." : "Erreur du service vocal.");
  };

  stream.getAudioTracks().forEach((track) => peer.addTrack(track, stream));
  try {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    // Le serveur reçoit l'offre locale finale (candidats ICE inclus), pas la
    // copie initiale de `createOffer()`. C'est indispensable aux mobiles.
    await attendreIceComplet(peer);
    const answerSdp = await options.exchangeSdp(peer.localDescription?.sdp ?? "");
    if (closed) throw new Error("REALTIME_CLOSED");
    await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });
  } catch (error) {
    close();
    throw error;
  }

  return {
    close,
    setMuted: (muted) => stream.getAudioTracks().forEach((track) => { track.enabled = !muted; }),
  };
}
