/**
 * MKA.P-MS AI — module Conversation (LOT IA02B).
 *
 * Vrai espace de conversation : nouvelle conversation, conversations
 * précédentes (renommer, supprimer, reprendre), envoi, régénération, copie
 * d'une réponse, reprise d'une demande passée, outils réellement appelés,
 * état de service. Réutilise exactement le même moteur que le Centre
 * Intelligence direction (CentreIntelligences.tsx → intelligences.demander,
 * lui-même branché depuis ce lot sur la boucle d'outils déjà construite,
 * server/intelligences/outils/boucle.ts) — aucun second cerveau, une seconde
 * façade.
 *
 * Identité : cette interface n'affiche jamais un nom de fournisseur ou de
 * modèle externe, y compris dans ses erreurs — voir `motifPublic` ci-dessous
 * et server/intelligences/identite.ts (règles du LOT IA02A, reprises ici
 * explicitement pour la conversation elle-même).
 *
 * Honnêtement absent de ce lot, faute de socle réel derrière (pas fabriqué
 * pour faire joli) :
 *  - STREAMING_NOT_IMPLEMENTED : server/intelligences/provider.ts fait un seul
 *    appel bloquant, aucun flux token par token n'existe dans ce dépôt ;
 *  - arrêt d'une génération en cours : sans flux, il n'y a rien à interrompre
 *    côté serveur — l'annuler côté client masquerait une réponse qui continue
 *    de se préparer, ce serait un faux bouton ;
 *  - fermeture/archivage d'une conversation : aucun statut d'archive n'existe
 *    encore dans le schéma (seule la suppression réelle est possible) ;
 *  - les photos et fichiers du compositeur sont réellement transmis au même
 *    moteur (vision ou RAG privé) ; Caméra/Photos/Fichiers/Plugins ne sont pas
 *    des raccourcis vers le formulaire de travail ;
 *  - le bouton vocal bleu ouvre une session WebRTC speech-to-speech dédiée,
 *    sans minuterie sur la surface PDG ; ses tours terminés restent enregistrés
 *    dans ce même fil de conversation.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import "../workspace.css";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Gauge,
  Menu,
  Pencil,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  Mic,
  MicOff,
  AudioLines,
  Camera,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plug,
  Square,
  Trash2,
  Volume2,
  Wrench,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { trpc } from "../../../lib/trpc";
import { EtatServiceIntelligence } from "../../../components/EtatServiceIntelligence";
import { type Intensite, NIVEAUX_INTENSITE, intensiteValide, CLE_INTENSITE_STOCKAGE } from "../../../lib/intensite";
import { addDictationHistory, recognitionLanguage, useVoicePreferences } from "../../../lib/voicePreferences";
import { startRealtimeVoice, type RealtimeVoiceControl, type RealtimeVoiceState } from "../../../lib/realtimeVoice";

import { ProgressiveReply, WaitingReply } from "./ReplyPresentation";

interface Bulle {
  id: string;
  role: "moi" | "moteur";
  texte: string;
  ok: boolean;
  motif: string;
  outils: string[];
  progressive?: boolean;
}

type PieceConversation =
  | { cle: string; type: "image"; nom: string; donnees: string }
  | { cle: string; type: "fichier"; nom: string; fichierId: number };

function lireFichierNavigateur(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result ?? ""));
    lecteur.onerror = () => reject(lecteur.error ?? new Error("Lecture impossible."));
    lecteur.readAsDataURL(fichier);
  });
}

function idBulle(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Les lignes de contexte "Outil appelé : …" (server/intelligences/service.ts) deviennent des puces visibles, sans jamais nommer un fournisseur. */
function outilsDepuisContexte(contexte: string[]): string[] {
  return contexte.filter((l) => l.startsWith("Outil appelé :")).map((l) => l.replace("Outil appelé : ", ""));
}

export function Conversation({ navigation, active = true, mode = "chat", onActivate, onChooseModule, children, searchQuery = "" }: {
  navigation?: ReactNode; active?: boolean; mode?: "chat" | "travail"; onActivate?: () => void; onChooseModule?: (key: string) => void; children?: ReactNode; searchQuery?: string;
} = {}) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [fil, setFil] = useState<Bulle[]>([]);
  const [question, setQuestion] = useState("");
  const questionRef = useRef("");
  const [derniereQuestion, setDerniereQuestion] = useState("");
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [renommageId, setRenommageId] = useState<number | null>(null);
  const [renommageTitre, setRenommageTitre] = useState("");
  const [copieId, setCopieId] = useState<string | null>(null);
  const [lectureId, setLectureId] = useState<string | null>(null);
  const ttsSupporte = typeof window !== "undefined" && "speechSynthesis" in window;
  const partageSupporte = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const [intensite, setIntensite] = useState<Intensite>(() => {
    try {
      return intensiteValide(localStorage.getItem(CLE_INTENSITE_STOCKAGE));
    } catch {
      return "medium";
    }
  });
  const [intensiteMenuOuvert, setIntensiteMenuOuvert] = useState(false);
  const sessionChargee = useRef<number | null>(null);
  const finDuFil = useRef<HTMLDivElement>(null);
  const suitLeFil = useRef(true);
  const [retourAuBas, setRetourAuBas] = useState(false);
  const zoneSaisie = useRef<HTMLTextAreaElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  const sendLock = useRef(false);
  const sent = useRef<{ key: string; text: string; consumesDraft: boolean; vocal: boolean } | null>(null);
  const drafts = useRef(new Map<string, string>());
  const [notice, setNotice] = useState("");
  const [ecoute, setEcoute] = useState(false);
  const [conversationVocale, setConversationVocale] = useState(false);
  const [vocalMuet, setVocalMuet] = useState(false);
  const [transcriptionVocale, setTranscriptionVocale] = useState("");
  const [voicePreferences] = useVoicePreferences();
  const conversationVocaleRef = useRef(false);
  const missionVocaleRef = useRef(false);
  const missionDraftKeyRef = useRef("new");
  const [etatVocal, setEtatVocal] = useState("");
  const dictation = useRef<{ stop: () => void | Promise<void> } | null>(null);
  const realtimeVocal = useRef<RealtimeVoiceControl | null>(null);
  const vocalGeneration = useRef(0);
  const questionsVocales = useRef<string[]>([]);
  const sessionIdRef = useRef<number | null>(null);
  const [menuPiecesOuvert, setMenuPiecesOuvert] = useState(false);
  const [pieces, setPieces] = useState<PieceConversation[]>([]);
  const cameraInput = useRef<HTMLInputElement>(null);
  const photosInput = useRef<HTMLInputElement>(null);
  const fichiersInput = useRef<HTMLInputElement>(null);
  const appuiLong = useRef<number | null>(null);
  const appuiLongDeclenche = useRef(false);
  const texteAvantDictee = useRef("");
  const dicteeGeneration = useRef(0);
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      drafts.current.clear();
      sent.current = null;
      dictation.current?.stop();
      realtimeVocal.current?.close();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const changed = () => { setDesktop(media.matches); if (media.matches) setPanneauOuvert(false); };
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    const dialog = drawer.current;
    if (!dialog) return;
    if (panneauOuvert && !desktop && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    } else if ((!panneauOuvert || desktop) && dialog.open) dialog.close();
  }, [panneauOuvert, desktop]);
  /** La zone de saisie grandit avec le texte dicté ou tapé, jusqu'à une hauteur maximale gérée en CSS (overflow ensuite). */
  useEffect(() => {
    const el = zoneSaisie.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [question]);
  useEffect(() => { questionRef.current = question; }, [question]);
  function saveDraft() { drafts.current.set(String(sessionId ?? "new"), question); }
  const normalise = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

  const utils = trpc.useUtils();
  const conversations = trpc.intelligences.conversations.useQuery(
    { cote: "direction" },
    { refetchOnWindowFocus: false },
  );

  const filServeur = trpc.intelligences.fil.useQuery(
    { sessionId: sessionId ?? 0 },
    { enabled: !!sessionId, refetchOnWindowFocus: false },
  );

  const deposerFichier = trpc.intelligences.fichierDeposer.useMutation();

  useEffect(() => {
    if (!sessionId || !filServeur.data || filServeur.isFetching || filServeur.isError) return;
    if (sessionChargee.current === sessionId) return;
    sessionChargee.current = sessionId;
    setDerniereQuestion([...filServeur.data].reverse().find(m => m.role === "utilisateur")?.contenu ?? "");
    setFil(
      filServeur.data
        .filter((m) => m.role === "utilisateur" || m.role === "moteur")
        .map((m) => ({
          id: String(m.id),
          role: m.role === "utilisateur" ? "moi" : "moteur",
          texte: m.contenu,
          ok: m.ok,
          motif: m.motifPublic || "Aucune réponse — le service n'a pas communiqué de motif.",
          outils: outilsDepuisContexte(m.contexte ?? []),
        })),
    );
  }, [sessionId, filServeur.data, filServeur.isFetching, filServeur.isError]);

  function suivreReponse() {
    const scroller = finDuFil.current?.parentElement;
    if (active && suitLeFil.current && scroller) scroller.scrollTop = scroller.scrollHeight;
  }
  function allerAuBas() {
    suitLeFil.current = true;
    setRetourAuBas(false);
    suivreReponse();
  }
  useEffect(() => { suivreReponse(); }, [fil, active]);

  const demander = trpc.intelligences.demander.useMutation({
    onMutate: () => sent.current,
    onSuccess: (r, _variables, submitted) => {
      if (!mounted.current || !submitted || sent.current !== submitted) return;
      if (submitted.consumesDraft && drafts.current.get(submitted.key) === submitted.text) drafts.current.delete(submitted.key);
      if (!submitted.consumesDraft && submitted.key === "new") {
        drafts.current.set(String(r.sessionId), drafts.current.get("new") ?? "");
        drafts.current.delete("new");
      }
      setNotice("");
      setSessionId(r.sessionId);
      sessionChargee.current = r.sessionId;
      setFil((f) => [
        ...f,
        {
          id: idBulle(),
          role: "moteur",
          texte: r.reponse,
          ok: r.ok,
          progressive: r.ok,
          // Point 5/02A — jamais le motif interne (fournisseur, modèle, code HTTP) dans cette interface.
          motif: r.motifPublic || "Aucune réponse — le service n'a pas communiqué de motif.",
          outils: r.appelsOutils.map((a) => `${a.toolId} — ${a.verdictPolitique}${a.statutExecution ? `/${a.statutExecution}` : ""}`),
        },
      ]);
      void conversations.refetch();
    },
    onError: (_error, _variables, submitted) => {
      if (!mounted.current || !submitted || sent.current !== submitted) return;
      if (submitted.consumesDraft) {
        drafts.current.set(submitted.key, submitted.text);
        setQuestion(current => current || submitted.text);
      }
      setNotice("La demande n’a pas abouti. Votre texte est conservé ; vérifiez l’historique avant un nouvel envoi.");
      setFil((f) => [
        ...f,
        {
          id: idBulle(),
          role: "moteur",
          texte: "",
          ok: false,
          motif: "Le service AL-HUDHUD·M est temporairement indisponible. Réessayez dans un instant.",
          outils: [],
        },
      ]);
    },
    onSettled: (_result, _error, _variables, submitted) => { if (sent.current === submitted) { sendLock.current = false; sent.current = null; } },
  });

  const renommer = trpc.intelligences.renommerConversation.useMutation({
    onSuccess: () => {
      if (!mounted.current) return;
      setRenommageId(null);
      void utils.intelligences.conversations.invalidate();
    },
  });

  const supprimer = trpc.intelligences.supprimerConversation.useMutation({
    onSuccess: (_r, variables) => {
      if (!mounted.current) return;
      drafts.current.delete(String(variables.sessionId));
      if (sessionId === variables.sessionId) {
        setSessionId(null); sessionChargee.current = null; setFil([]); setDerniereQuestion("");
        setQuestion(drafts.current.get("new") ?? ""); setNotice("");
      }
      void utils.intelligences.conversations.invalidate();
    },
  });

  const mission = trpc.intelligences.lancerMission.useMutation({
    onSuccess: (r) => {
      setNotice("");
      drafts.current.delete(missionDraftKeyRef.current);
      setFil((f) => [...f, { id: idBulle(), role: "moteur", texte: r.rapport, ok: r.statut !== "echouee", motif: r.motif || "Mission interrompue.", outils: r.etapes.filter((e) => e.statut === "fait").map((e) => e.libelle), progressive: true }]);
    },
    onError: (_error, variables) => {
      setQuestion((current) => current || variables.objectif);
      setNotice("La mission n’a pas abouti. Votre ordre est conservé pour réessayer.");
      if (missionVocaleRef.current && conversationVocaleRef.current) arreterConversationVocale();
    },
    onSettled: () => { missionVocaleRef.current = false; },
  });

  const creerSessionVocale = trpc.intelligences.creerSessionVocale.useMutation();
  const enregistrerVocal = trpc.intelligences.enregistrerEchangeVocal.useMutation();

  const historyUnavailable = !!sessionId && (filServeur.isFetching || filServeur.isError || sessionChargee.current !== sessionId);
  const busy = demander.isPending || mission.isPending || supprimer.isPending || deposerFichier.isPending || sendLock.current;
  function nouvelleConversation() {
    if (busy) return;
    arreterConversationVocale();
    saveDraft();
    suitLeFil.current = true; setRetourAuBas(false);
    setQuestion(drafts.current.get("new") ?? "");
    setDerniereQuestion(""); setNotice(""); onActivate?.();
    setSessionId(null);
    sessionChargee.current = null;
    setFil([]);
    setPanneauOuvert(false);
  }

  function ouvrirConversation(id: number) {
    if (busy) return;
    saveDraft();
    suitLeFil.current = true; setRetourAuBas(false);
    setQuestion(drafts.current.get(String(id)) ?? "");
    if (sessionId !== id) { sessionChargee.current = null; setFil([]); setDerniereQuestion(""); }
    setNotice(""); onActivate?.();
    setSessionId(id);
    setPanneauOuvert(false);
  }

  async function arreterDictee() {
    const courante = dictation.current;
    if (!courante) dicteeGeneration.current += 1;
    await courante?.stop();
    dictation.current = null;
    setEcoute(false);
  }

  function arreterConversationVocale() {
    vocalGeneration.current += 1;
    conversationVocaleRef.current = false;
    setConversationVocale(false);
    setEtatVocal("");
    setTranscriptionVocale("");
    setVocalMuet(false);
    realtimeVocal.current?.close();
    realtimeVocal.current = null;
  }

  function libelleEtatVocal(etat: RealtimeVoiceState): string {
    return { connexion: "Connexion sécurisée…", ecoute: "Je vous écoute…", reflexion: "AL-HUDHUD·M réfléchit…", reponse: "AL-HUDHUD·M vous répond…" }[etat];
  }

  async function basculerConversationVocale() {
    if (conversationVocaleRef.current) { arreterConversationVocale(); return; }
    void arreterDictee();
    conversationVocaleRef.current = true;
    const generation = ++vocalGeneration.current;
    setConversationVocale(tr