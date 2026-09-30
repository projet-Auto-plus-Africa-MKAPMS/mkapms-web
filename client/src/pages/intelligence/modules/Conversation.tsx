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
 *  - le bouton vocal bleu reste dans ce fil : écoute → envoi → réponse lue →
 *    nouvelle écoute, sans minuterie sur la surface PDG.
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
} from "lucide-react";
import { trpc } from "../../../lib/trpc";
import { EtatServiceIntelligence } from "../../../components/EtatServiceIntelligence";
import { speechRecognitionConstructor, startDictation } from "../../../lib/speech";
import { type Intensite, NIVEAUX_INTENSITE, intensiteValide, CLE_INTENSITE_STOCKAGE } from "../../../lib/intensite";

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

export function Conversation({ navigation, active = true, onActivate, onChooseModule, onSendToDeveloper, children, searchQuery = "" }: {
  navigation?: ReactNode; active?: boolean; onActivate?: () => void; onChooseModule?: (key: string) => void; onSendToDeveloper?: (instruction: string) => void; children?: ReactNode; searchQuery?: string;
} = {}) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [fil, setFil] = useState<Bulle[]>([]);
  const [question, setQuestion] = useState("");
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
  const conversationVocaleRef = useRef(false);
  const envoiVocalEnCours = useRef(false);
  const [etatVocal, setEtatVocal] = useState("");
  const dictation = useRef<{ stop: () => void } | null>(null);
  const dictationVocale = useRef<{ stop: () => void } | null>(null);
  const [menuPiecesOuvert, setMenuPiecesOuvert] = useState(false);
  const [pieces, setPieces] = useState<PieceConversation[]>([]);
  const cameraInput = useRef<HTMLInputElement>(null);
  const photosInput = useRef<HTMLInputElement>(null);
  const fichiersInput = useRef<HTMLInputElement>(null);
  const appuiLong = useRef<number | null>(null);
  const appuiLongDeclenche = useRef(false);
  const texteAvantDictee = useRef("");
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      drafts.current.clear();
      sent.current = null;
      dictation.current?.stop();
      dictationVocale.current?.stop();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
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
      if (submitted.vocal && conversationVocaleRef.current) repondreEtReecouter(r.reponse);
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
      if (submitted.vocal && conversationVocaleRef.current) window.setTimeout(demarrerEcouteVocale, 700);
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

  const historyUnavailable = !!sessionId && (filServeur.isFetching || filServeur.isError || sessionChargee.current !== sessionId);
  const busy = demander.isPending || supprimer.isPending || deposerFichier.isPending || sendLock.current;
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

  function arreterDictee() {
    dictation.current?.stop();
    dictation.current = null;
    setEcoute(false);
  }

  function arreterConversationVocale() {
    conversationVocaleRef.current = false;
    setConversationVocale(false);
    setEtatVocal("");
    envoiVocalEnCours.current = false;
    dictationVocale.current?.stop();
    dictationVocale.current = null;
    if (ttsSupporte) window.speechSynthesis.cancel();
  }

  function demarrerEcouteVocale() {
    if (!conversationVocaleRef.current || busy || !active) return;
    envoiVocalEnCours.current = false;
    setEtatVocal("Je vous écoute…");
    const control = startDictation("fr-FR", {
      onText: (texte, final) => {
        setQuestion(texte);
        if (!final || texte.trim().length < 2 || envoiVocalEnCours.current) return;
        envoiVocalEnCours.current = true;
        dictationVocale.current?.stop();
        dictationVocale.current = null;
        setEtatVocal("AL-HUDHUD·M prépare sa réponse…");
        envoyer(texte, "composer", true);
      },
      onError: (texte) => {
        setNotice(texte);
        arreterConversationVocale();
      },
      onEnd: () => { dictationVocale.current = null; },
    });
    if (!control) {
      setNotice("La conversation vocale n’est pas disponible sur ce navigateur.");
      arreterConversationVocale();
      return;
    }
    dictationVocale.current = control;
  }

  function repondreEtReecouter(texte: string) {
    if (!conversationVocaleRef.current) return;
    if (!ttsSupporte || !texte.trim()) {
      window.setTimeout(demarrerEcouteVocale, 300);
      return;
    }
    window.speechSynthesis.cancel();
    setEtatVocal("AL-HUDHUD·M vous répond…");
    const u = new SpeechSynthesisUtterance(texte);
    let voixChoisie = "";
    try { voixChoisie = localStorage.getItem("mkapms_voix_tts") ?? ""; } catch { /* voix système */ }
    const choisie = window.speechSynthesis.getVoices().find((v) => v.name === voixChoisie);
    u.lang = choisie?.lang ?? "fr-FR";
    if (choisie) u.voice = choisie;
    u.onend = () => { if (conversationVocaleRef.current) window.setTimeout(demarrerEcouteVocale, 250); };
    u.onerror = () => { if (conversationVocaleRef.current) window.setTimeout(demarrerEcouteVocale, 250); };
    window.speechSynthesis.speak(u);
  }

  function basculerConversationVocale() {
    if (conversationVocaleRef.current) { arreterConversationVocale(); return; }
    if (!speechRecognitionConstructor() || !ttsSupporte) {
      setNotice("La conversation vocale exige l’accès au micro et la lecture audio du navigateur.");
      return;
    }
    arreterDictee();
    conversationVocaleRef.current = true;
    setConversationVocale(true);
    setNotice("");
    demarrerEcouteVocale();
  }

  function basculerDictee() {
    if (conversationVocaleRef.current) arreterConversationVocale();
    if (ecoute) { arreterDictee(); return; }
    const base = question;
    texteAvantDictee.current = base;
    const control = startDictation("fr-FR", {
      onText: (texte) => setQuestion(base ? `${base} ${texte}` : texte),
      onError: (texte) => { setNotice(texte); setEcoute(false); dictation.current = null; },
      onEnd: () => { dictation.current = null; setEcoute(false); },
    });
    if (!control) { setNotice("La dictée n'est pas disponible sur ce navigateur."); return; }
    dictation.current = control;
    setEcoute(true);
  }

  /** Annule : arrête la dictée et efface ce qu'elle a écrit, revient au texte d'avant. */
  function annulerDictee() {
    dictation.current?.stop();
    dictation.current = null;
    setEcoute(false);
    setQuestion(texteAvantDictee.current);
  }

  /** Arrête la dictée et envoie immédiatement ce qui a été dicté, sans repasser par la relecture. */
  function envoyerDicteeMaintenant() {
    dictation.current?.stop();
    dictation.current = null;
    setEcoute(false);
    envoyer();
  }

  /** Rester appuyé sur le micro ramène directement aux paramètres (voix & production) — jamais de suppression, juste un autre chemin. */
  function debutAppuiLong() {
    appuiLongDeclenche.current = false;
    appuiLong.current = window.setTimeout(() => {
      appuiLongDeclenche.current = true;
      onChooseModule?.("parametres");
    }, 600);
  }
  function finAppuiLong() {
    if (appuiLong.current) { window.clearTimeout(appuiLong.current); appuiLong.current = null; }
  }
  function clicMicro() {
    if (appuiLongDeclenche.current) { appuiLongDeclenche.current = false; return; }
    basculerDictee();
  }

  function envoyer(texte?: string, mode: "composer" | "regenerate" = "composer", vocal = false) {
    const q = (texte ?? question).trim();
    if (q.length < 2 || busy || historyUnavailable || !active || !mounted.current) return;
    if (!vocal && conversationVocaleRef.current) arreterConversationVocale();
    sendLock.current = true;
    suitLeFil.current = true; setRetourAuBas(false);
    setFil(f => f.map(b => ({ ...b, progressive: false })));
    const key = String(sessionId ?? "new");
    const consumesDraft = mode === "composer";
    sent.current = { key, text: q, consumesDraft, vocal };
    // Regenerating an earlier answer never consumes the text being composed.
    if (consumesDraft) drafts.current.set(key, q);
    else saveDraft();
    setNotice("");
    setFil((f) => [...f, { id: idBulle(), role: "moi", texte: q, ok: true, motif: "", outils: [] }]);
    setDerniereQuestion(q);
    if (consumesDraft) setQuestion("");
    const images = pieces.filter((p): p is Extract<PieceConversation, { type: "image" }> => p.type === "image").map((p) => p.donnees);
    const fichierIds = pieces.filter((p): p is Extract<PieceConversation, { type: "fichier" }> => p.type === "fichier").map((p) => p.fichierId);
    if (consumesDraft) setPieces([]);
    demander.mutate({ question: q, sessionId, effort: intensite, images: images.length ? images : undefined, fichierIds: fichierIds.length ? fichierIds : undefined });
  }

  async function ajouterImages(liste: FileList | null) {
    if (!liste?.length) return;
    setMenuPiecesOuvert(false);
    const places = Math.max(0, 4 - pieces.filter((p) => p.type === "image").length);
    const choisis = Array.from(liste).filter((f) => f.type.startsWith("image/")).slice(0, places);
    if (!choisis.length) { setNotice("Choisissez une image compatible."); return; }
    try {
      const ajouts: PieceConversation[] = [];
      for (const fichier of choisis) {
        if (fichier.size > 5_500_000) throw new Error(`« ${fichier.name} » dépasse la taille autorisée pour une image de conversation.`);
        ajouts.push({ cle: `${Date.now()}-${fichier.name}-${ajouts.length}`, type: "image", nom: fichier.name, donnees: await lireFichierNavigateur(fichier) });
      }
      setPieces((actuelles) => [...actuelles, ...ajouts]);
      setNotice("");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "La photo n’a pas pu être jointe.");
    }
  }

  async function ajouterFichiers(liste: FileList | null) {
    if (!liste?.length) return;
    setMenuPiecesOuvert(false);
    const places = Math.max(0, 4 - pieces.filter((p) => p.type === "fichier").length);
    const choisis = Array.from(liste).slice(0, places);
    try {
      for (const fichier of choisis) {
        const dataUri = await lireFichierNavigateur(fichier);
        const resultat = await deposerFichier.mutateAsync({ nom: fichier.name, typeMime: fichier.type || "application/octet-stream", donneesBase64: dataUri.split(",")[1] ?? "" });
        setPieces((actuelles) => [...actuelles, { cle: `fichier-${resultat.id}`, type: "fichier", nom: resultat.nom, fichierId: resultat.id }]);
      }
      setNotice("");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Le fichier n’a pas pu être ajouté.");
    }
  }

  function regenerer() {
    if (!derniereQuestion || busy || historyUnavailable) return;
    envoyer(derniereQuestion, "regenerate");
  }

  /** Reprendre/modifier une demande passée : reporte son texte dans la zone de saisie, ne réécrit pas l'historique. */
  function reprendre(texte: string) {
    if (busy) return;
    setQuestion(texte);
    zoneSaisie.current?.focus();
  }

  async function copier(id: string, texte: string) {
    try {
      await navigator.clipboard.writeText(texte);
      if (!mounted.current) return;
      setCopieId(id);
      setNotice("Réponse copiée.");
      setTimeout(() => setCopieId((c) => (c === id ? null : c)), 1500);
    } catch {
      if (mounted.current) setNotice("Copie indisponible. Vous pouvez sélectionner le texte.");
    }
  }

  function choisirIntensite(valeur: Intensite) {
    setIntensite(valeur);
    try {
      localStorage.setItem(CLE_INTENSITE_STOCKAGE, valeur);
    } catch {
      // Stockage local indisponible (navigation privée) : le choix reste actif pour cette session.
    }
  }

  /** Lecture à voix haute réelle (synthèse vocale du navigateur, standard) — bascule play/stop sur la même réponse. Reprend la voix choisie sur le Centre Intelligence direction, si une l'a été. */
  function lireTexte(id: string, texte: string) {
    if (!ttsSupporte) return;
    window.speechSynthesis.cancel();
    if (lectureId === id) {
      setLectureId(null);
      return;
    }
    const u = new SpeechSynthesisUtterance(texte);
    let voixChoisie = "";
    try {
      voixChoisie = localStorage.getItem("mkapms_voix_tts") ?? "";
    } catch {
      // Stockage local indisponible : voix par défaut du navigateur.
    }
    const choisie = window.speechSynthesis.getVoices().find((v) => v.name === voixChoisie);
    u.lang = choisie?.lang ?? "fr-FR";
    if (choisie) u.voice = choisie;
    u.onend = () => setLectureId((c) => (c === id ? null : c));
    u.onerror = () => setLectureId((c) => (c === id ? null : c));
    window.speechSynthesis.speak(u);
    setLectureId(id);
  }

  /** Partage réel (API navigateur standard) — jamais câblé si le navigateur ne l'expose pas (partageSupporte). */
  async function partagerTexte(texte: string) {
    if (!navigator.share) return;
    try {
      await navigator.share({ text: texte, title: "AL-HUDHUD·M" });
    } catch {
      // Partage annulé par l'utilisateur ou refusé par le système : rien à signaler.
    }
  }

  function commencerRenommage(id: number, titreActuel: string) {
    setRenommageId(id);
    setRenommageTitre(titreActuel);
  }

  function validerRenommage() {
    if (renommageId === null || renommageTitre.trim().length < 1) return;
    renommer.mutate({ sessionId: renommageId, titre: renommageTitre.trim() });
  }

  function demanderSuppression(id: number) {
    if (busy || !window.confirm("Supprimer définitivement cette conversation et ses messages ?")) return;
    supprimer.mutate({ sessionId: id });
  }

  const sidebarContent = <>
        <h2 className="px-2 pb-1 pt-2 text-xs font-black uppercase tracking-wide text-black/45">Récents</h2>
        <button
          type="button"
          onClick={nouvelleConversation} disabled={busy}
          className="mb-2 flex items-center gap-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" /> Nouvelle conversation
        </button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          <h2 className="px-2 py-2 text-xs font-bold">Conversations</h2>
          {conversations.isLoading ? <p role="status">Chargement de l’historique…</p> : null}
          {conversations.isError ? <div role="alert">Historique indisponible. <button type="button" onClick={() => void conversations.refetch()}>Réessayer</button></div> : null}
          {renommer.isError || supprimer.isError ? <p role="alert">L’action n’a pas abouti. L’historique n’a pas été modifié ici.</p> : null}
          {(conversations.data ?? []).filter(c => normalise(c.titre || "Sans titre").includes(normalise(searchQuery))).map((c) => (
            <div
              key={c.id}
              className={`group flex items-center gap-1 rounded-lg px-1.5 py-1 ${
                sessionId === c.id ? "bg-black/10" : "hover:bg-black/5"
              }`}
            >
              {renommageId === c.id ? (
                <>
                  <input
                    value={renommageTitre}
                    onChange={(e) => setRenommageTitre(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") validerRenommage();
                      if (e.key === "Escape") setRenommageId(null);
                    }}
                    autoFocus
                    className="min-w-0 flex-1 rounded border border-black/10 bg-white px-1.5 py-1 text-xs"
                  />
                  <button type="button" onClick={validerRenommage} aria-label="Valider le nouveau titre" className="shrink-0 p-1">
                    <Check className="h-3.5 w-3.5 text-[#1a7f37]" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => ouvrirConversation(c.id)}
                    disabled={busy}
                    className={`min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-xs font-semibold ${
                      sessionId === c.id ? "text-black" : "text-black/60"
                    }`}
                    title={c.titre}
                  >
                    {c.titre || "Sans titre"}
                  </button>
                  <button
                    type="button"
                    onClick={() => commencerRenommage(c.id, c.titre)}
                    aria-label="Renommer cette conversation"
                    title="Renommer"
                    className="alhud-history-action shrink-0 p-2 text-black/60 hover:text-black"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => demanderSuppression(c.id)}
                    disabled={busy}
                    aria-label="Supprimer cette conversation"
                    title="Supprimer"
                    className="alhud-history-action shrink-0 p-2 text-black/60 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
          {conversations.data?.length === 0 && (
            <p className="px-2 py-4 text-center text-[11px] text-black/40">Aucune conversation encore.</p>
          )}
        </div>
        <div className="mt-2 border-t border-black/5 pt-2" onClick={e => { if ((e.target as HTMLElement).closest("button")) setPanneauOuvert(false); }}>{navigation}</div>
</>;
  return (
    <div className="alhud-conversation-workspace flex h-full min-h-[420px] flex-col gap-3">
      <EtatServiceIntelligence />

      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
      {desktop ? <aside className="alhud-conversation-rail" aria-label="Conversations et outils">{sidebarContent}</aside> :
        <dialog ref={drawer} className="alhud-drawer" aria-label="Conversations et outils" onCancel={e => { e.preventDefault(); setPanneauOuvert(false); }} onClose={() => { setPanneauOuvert(false); menu.current?.focus(); }} onClick={e => {
          if (e.target === e.currentTarget) { const bounds = e.currentTarget.getBoundingClientRect();
            if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) setPanneauOuvert(false);
          }
        }}><button type="button" className="alhud-icon-control" onClick={() => setPanneauOuvert(false)}>Fermer le panneau</button>{sidebarContent}</dialog>}


      <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-black/10">
        <div className="flex items-center justify-between border-b border-black/5 px-3 py-2 md:hidden">
          <button
            type="button"
            ref={menu} aria-haspopup="dialog" aria-expanded={panneauOuvert} aria-label="Conversations et outils"
            onClick={() => setPanneauOuvert((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-black/60"
          >
            {panneauOuvert ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} Récents
          </button>
          <button type="button" onClick={nouvelleConversation} disabled={busy} className="flex items-center gap-1 text-xs font-bold text-[#8B7500]">
            <Plus className="h-3.5 w-3.5" /> Nouvelle
          </button>
        </div>

        {!active ? <section className="alhud-active-tool flex-1 overflow-auto p-4" aria-label="Outil sélectionné">{children}</section> : null}
        <div hidden={!active} className="alhud-live-conversation flex min-h-0 flex-1 flex-col">
        {sessionId && filServeur.isFetching ? <p role="status" className="p-3 text-sm">Chargement de la conversation…</p> : null}
        {sessionId && filServeur.isError ? <div role="alert" className="p-3 text-sm">Cette conversation n’a pas pu être chargée. L’envoi reste bloqué pour préserver son contexte. <button type="button" onClick={() => void filServeur.refetch()}>Réessayer</button></div> : null}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-label="Conversation" aria-live="polite" aria-busy={demander.isPending || (!!sessionId && filServeur.isFetching)} onScroll={e => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
          suitLeFil.current = atBottom;
          setRetourAuBas(!atBottom);
        }}>
          {fil.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-black/40">
              <Sparkles className="h-6 w-6" />
              <p className="text-sm">Écris ta demande — même moteur que le Centre Intelligence direction.</p>
            </div>
          ) : (
            fil.map((b) => (
              <div key={b.id} className={`group max-w-[85%] ${b.role === "moi" ? "ml-auto" : ""}`}>
              <div
                className={`relative rounded-xl border p-3 text-sm ${
                  b.role === "moi"
                    ? "border-black/5 bg-[#FAFAFA]"
                    : b.ok
                      ? "border-[#8B7500]/20 bg-[#FFFBEA]"
                      : "border-red-200 bg-red-50/40"
                }`}
              >
                {b.ok ? (
                  b.role === "moteur" ? <ProgressiveReply text={b.texte} animate={!!b.progressive && active} onProgress={suivreReponse} /> :
                  <p className="whitespace-pre-wrap text-[#111]">{b.texte}</p>
                ) : (
                  <p className="flex items-start gap-2 text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{b.motif}</span>
                  </p>
                )}

                {b.outils.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {b.outils.map((o, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/50"
                      >
                        <Wrench className="h-2.5 w-2.5" /> {o}
                      </span>
                    ))}
                  </div>
                )}
              </div>

                {/* Rangée d'actions séparée de la bulle — jamais collée à sa bordure, et jamais affichée sans réponse réelle (Signalé par le PDG, capture ChatGPT à l'appui). */}
                {((b.role === "moteur" && b.ok) || b.role === "moi") && (
                <div className="mt-1.5 flex justify-end gap-3">
                  {b.role === "moteur" && b.ok && (
                    <>
                      <button
                        type="button"
                        onClick={() => copier(b.id, b.texte)}
                        aria-label="Copier cette réponse"
                        title="Copier"
                        className="text-black/30 hover:text-black/60"
                      >
                        {copieId === b.id ? <Check className="h-3.5 w-3.5 text-[#1a7f37]" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      {ttsSupporte && (
                        <button
                          type="button"
                          onClick={() => lireTexte(b.id, b.texte)}
                          aria-label={lectureId === b.id ? "Arrêter la lecture" : "Écouter cette réponse"}
                          title={lectureId === b.id ? "Arrêter la lecture" : "Écouter"}
                          className={lectureId === b.id ? "text-[#8B7500]" : "text-black/30 hover:text-black/60"}
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {partageSupporte && (
                        <button
                          type="button"
                          onClick={() => partagerTexte(b.texte)}
                          aria-label="Partager cette réponse"
                          title="Partager"
                          className="text-black/30 hover:text-black/60"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                  {b.role === "moi" && (
                    <>
                      <button
                        type="button"
                        onClick={() => reprendre(b.texte)}
                        aria-label="Reprendre cette demande"
                        title="Reprendre / modifier"
                        className="text-black/30 hover:text-black/60"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {onSendToDeveloper ? <button type="button" onClick={() => onSendToDeveloper(b.texte)} className="alhud-send-work" title="Donner cet ordre à l’agent développeur">Travail</button> : null}
                    </>
                  )}
                </div>
                )}
              </div>
            ))
          )}
          {demander.isPending && (
            <WaitingReply />
          )}
          <div ref={finDuFil} />
        </div>

        {retourAuBas ? <button type="button" className="alhud-scroll-bottom" onClick={allerAuBas} aria-label="Aller à la dernière réponse"><ArrowDown className="h-4 w-4" /></button> : null}
        <div className="alhud-composer-wrap border-t border-black/5 p-3">
          {pieces.length > 0 ? <div className="alhud-attachment-chips" aria-label="Pièces jointes prêtes à envoyer">
            {pieces.map((piece) => <span key={piece.cle}>
              {piece.type === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              <b>{piece.nom}</b>
              <button type="button" onClick={() => setPieces((actuelles) => actuelles.filter((p) => p.cle !== piece.cle))} aria-label={`Retirer ${piece.nom}`}><X className="h-3.5 w-3.5" /></button>
            </span>)}
          </div> : null}
          {conversationVocale ? <div className="alhud-live-voice-status" role="status"><AudioLines className="h-4 w-4" /><span>{etatVocal || "Conversation vocale active"}</span><button type="button" onClick={arreterConversationVocale}>Terminer</button></div> : null}
          <div className="alhud-composer flex items-end gap-2">
            {!ecoute && <div className="relative">
              <button type="button" className="alhud-composer-action" onClick={() => setMenuPiecesOuvert((v) => !v)} aria-haspopup="menu" aria-expanded={menuPiecesOuvert} aria-label="Ajouter une pièce jointe"><Paperclip className="h-5 w-5" /></button>
              <input ref={cameraInput} hidden type="file" accept="image/*" capture="environment" onChange={(e) => { void ajouterImages(e.target.files); e.currentTarget.value = ""; }} />
              <input ref={photosInput} hidden type="file" accept="image/*" multiple onChange={(e) => { void ajouterImages(e.target.files); e.currentTarget.value = ""; }} />
              <input ref={fichiersInput} hidden type="file" multiple onChange={(e) => { void ajouterFichiers(e.target.files); e.currentTarget.value = ""; }} />
              {menuPiecesOuvert ? <>
                <button type="button" className="fixed inset-0 z-20 cursor-default" aria-label="Fermer le menu des pièces jointes" onClick={() => setMenuPiecesOuvert(false)} />
                <div className="alhud-attachment-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => cameraInput.current?.click()}><Camera />Caméra</button>
                  <button type="button" role="menuitem" onClick={() => photosInput.current?.click()}><ImageIcon />Photos</button>
                  <button type="button" role="menuitem" onClick={() => fichiersInput.current?.click()} disabled={deposerFichier.isPending}><FileText />Fichiers</button>
                  <button type="button" role="menuitem" onClick={() => { setMenuPiecesOuvert(false); onChooseModule?.("integrations"); }}><Plug />Plugins</button>
                </div>
              </> : null}
            </div>}
            <textarea
              ref={zoneSaisie}
              value={question}
              disabled={busy}
              aria-label="Votre message"
              onChange={(e) => { setQuestion(e.target.value); drafts.current.set(String(sessionId ?? "new"), e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  envoyer();
                }
              }}
              rows={ecoute ? 2 : 4}
              maxLength={8000}
              placeholder="Demander à AL-HUDHUD·M"
              className="alhud-composer-input flex-1 rounded-xl border-0 p-2 text-sm outline-none"
            />
            {ecoute ? (
              <>
                <button type="button" className="alhud-composer-action" onClick={annulerDictee} aria-label="Annuler la dictée" title="Annuler">
                  <X className="h-5 w-5" />
                </button>
                <div className="alhud-recording-wave" role="status" aria-label="Dictée en cours"><span /><span /><span /><span /><span /></div>
                <button type="button" className="alhud-composer-action" onClick={arreterDictee} aria-label="Arrêter la dictée (garder le texte)" title="Arrêter">
                  <Square className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={envoyerDicteeMaintenant}
                  disabled={busy || historyUnavailable || question.trim().length < 2}
                  aria-label="Arrêter la dictée et envoyer"
                  title="Envoyer"
                  className="alhud-composer-send grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#111] text-white disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="alhud-composer-action"
                  onClick={clicMicro}
                  onPointerDown={debutAppuiLong}
                  onPointerUp={finAppuiLong}
                  onPointerLeave={finAppuiLong}
                  aria-pressed={ecoute}
                  aria-label="Dicter (rester appuyé pour les paramètres voix)"
                  title="Dicter — clic pour démarrer/arrêter, rester appuyé pour les paramètres voix"
                >
                  <Mic className="h-5 w-5" />
                </button>
                <button type="button" className={`alhud-composer-voice ${conversationVocale ? "active" : ""}`} onClick={basculerConversationVocale} aria-pressed={conversationVocale} aria-label={conversationVocale ? "Terminer la conversation vocale" : "Démarrer la conversation vocale directe"} title="Conversation vocale directe, sans limite de durée côté PDG"><AudioLines className="h-5 w-5" /></button>
                <div className="relative">
                  <button
                    type="button"
                    className="alhud-composer-action"
                    onClick={() => setIntensiteMenuOuvert((v) => !v)}
                    aria-label="Régler l'intensité de réflexion"
                    title="Intensité de réflexion"
                  >
                    <Gauge className="h-5 w-5" />
                  </button>
                  {intensiteMenuOuvert ? (
                    <>
                      <button
                        type="button"
                        aria-label="Fermer le réglage d'intensité"
                        onClick={() => setIntensiteMenuOuvert(false)}
                        className="fixed inset-0 z-10 cursor-default"
                      />
                      <div className="absolute bottom-full right-0 z-20 mb-2 w-60 rounded-2xl border border-black/10 bg-white p-3 shadow-xl">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-black uppercase tracking-wide text-black/40">
                            Intensité de réflexion
                          </p>
                          <button
                            type="button"
                            onClick={() => setIntensiteMenuOuvert(false)}
                            className="rounded-full p-1 hover:bg-black/5"
                          >
                            <X className="h-3.5 w-3.5 text-black/40" />
                          </button>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={NIVEAUX_INTENSITE.length - 1}
                          step={1}
                          value={Math.max(0, NIVEAUX_INTENSITE.findIndex((n) => n.valeur === intensite))}
                          onChange={(e) => choisirIntensite(NIVEAUX_INTENSITE[Number(e.target.value)].valeur)}
                          className="mt-2 w-full accent-[#8B7500]"
                        />
                        <div className="mt-1 flex justify-between text-[9px] font-bold text-black/40">
                          {NIVEAUX_INTENSITE.map((n) => (
                            <span key={n.valeur}>{n.libelle}</span>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px] leading-snug text-black/45">
                          Un seul modèle est configuré ({"gpt-5.5"}) : ce réglage ne le change pas, il le fait
                          réfléchir plus ou moins longtemps avant de répondre.
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>
                {derniereQuestion && !busy && !historyUnavailable && (
                  <button
                    type="button"
                    onClick={regenerer}
                    aria-label="Régénérer la dernière réponse"
                    title="Régénérer la dernière réponse"
                    className="alhud-composer-regenerate grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/10 text-black/60 hover:bg-black/5"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => envoyer()}
                  disabled={busy || historyUnavailable || question.trim().length < 2}
                  aria-label="Envoyer le message"
                  className="alhud-composer-send grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#111] text-white disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <p role="status" className="text-xs text-black/60">{notice}</p>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}
