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
 *  - pièces jointes, image, voix, code : modules dédiés séparés, encore à
 *    l'état de socle (voir leur propre fichier).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import "../workspace.css";
import {
  AlertTriangle,
  Check,
  Copy,
  Menu,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Mic,
  AudioLines,
  Paperclip,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { trpc } from "../../../lib/trpc";
import { EtatServiceIntelligence } from "../../../components/EtatServiceIntelligence";

interface Bulle {
  id: string;
  role: "moi" | "moteur";
  texte: string;
  ok: boolean;
  motif: string;
  outils: string[];
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
  const sessionChargee = useRef<number | null>(null);
  const finDuFil = useRef<HTMLDivElement>(null);
  const zoneSaisie = useRef<HTMLTextAreaElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  const sendLock = useRef(false);
  const sent = useRef<{ key: string; text: string; consumesDraft: boolean } | null>(null);
  const drafts = useRef(new Map<string, string>());
  const [notice, setNotice] = useState("");
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; drafts.current.clear(); sent.current = null; };
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

  useEffect(() => {
    const scroller = finDuFil.current?.parentElement;
    if (active && scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [fil, active]);

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

  const historyUnavailable = !!sessionId && (filServeur.isFetching || filServeur.isError || sessionChargee.current !== sessionId);
  const busy = demander.isPending || supprimer.isPending || sendLock.current;
  function nouvelleConversation() {
    if (busy) return;
    saveDraft();
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
    setQuestion(drafts.current.get(String(id)) ?? "");
    if (sessionId !== id) { sessionChargee.current = null; setFil([]); setDerniereQuestion(""); }
    setNotice(""); onActivate?.();
    setSessionId(id);
    setPanneauOuvert(false);
  }

  function envoyer(texte?: string, mode: "composer" | "regenerate" = "composer") {
    const q = (texte ?? question).trim();
    if (q.length < 2 || busy || historyUnavailable || !active || !mounted.current) return;
    sendLock.current = true;
    const key = String(sessionId ?? "new");
    const consumesDraft = mode === "composer";
    sent.current = { key, text: q, consumesDraft };
    // Regenerating an earlier answer never consumes the text being composed.
    if (consumesDraft) drafts.current.set(key, q);
    else saveDraft();
    setNotice("");
    setFil((f) => [...f, { id: idBulle(), role: "moi", texte: q, ok: true, motif: "", outils: [] }]);
    setDerniereQuestion(q);
    if (consumesDraft) setQuestion("");
    demander.mutate({ question: q, sessionId });
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

  const sidebarContent = <><div onClick={e => { if ((e.target as HTMLElement).closest("button")) setPanneauOuvert(false); }}>{navigation}</div>
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
</>;
  return (
    <div className="alhud-conversation-workspace flex h-[calc(100dvh-160px)] min-h-[420px] flex-col gap-3">
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
            {panneauOuvert ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} Conversations
          </button>
          <button type="button" onClick={nouvelleConversation} disabled={busy} className="flex items-center gap-1 text-xs font-bold text-[#8B7500]">
            <Plus className="h-3.5 w-3.5" /> Nouvelle
          </button>
        </div>

        {!active ? <section className="alhud-active-tool flex-1 overflow-auto p-4" aria-label="Outil sélectionné">{children}</section> : null}
        <div hidden={!active} className="alhud-live-conversation flex min-h-0 flex-1 flex-col">
        {sessionId && filServeur.isFetching ? <p role="status" className="p-3 text-sm">Chargement de la conversation…</p> : null}
        {sessionId && filServeur.isError ? <div role="alert" className="p-3 text-sm">Cette conversation n’a pas pu être chargée. L’envoi reste bloqué pour préserver son contexte. <button type="button" onClick={() => void filServeur.refetch()}>Réessayer</button></div> : null}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-label="Conversation" aria-live="polite" aria-busy={demander.isPending || (!!sessionId && filServeur.isFetching)}>
          {fil.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-black/40">
              <Sparkles className="h-6 w-6" />
              <p className="text-sm">Écris ta demande — même moteur que le Centre Intelligence direction.</p>
            </div>
          ) : (
            fil.map((b) => (
              <div
                key={b.id}
                className={`group relative max-w-[85%] rounded-xl border p-3 text-sm ${
                  b.role === "moi"
                    ? "ml-auto border-black/5 bg-[#FAFAFA]"
                    : b.ok
                      ? "border-[#8B7500]/20 bg-[#FFFBEA]"
                      : "border-red-200 bg-red-50/40"
                }`}
              >
                {b.ok ? (
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

                <div className="mt-2 flex justify-end gap-3">
                  {b.role === "moteur" && b.ok && (
                    <button
                      type="button"
                      onClick={() => copier(b.id, b.texte)}
                      aria-label="Copier cette réponse"
                      title="Copier"
                      className="text-black/30 hover:text-black/60"
                    >
                      {copieId === b.id ? <Check className="h-3.5 w-3.5 text-[#1a7f37]" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
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
              </div>
            ))
          )}
          {demander.isPending && (
            <div className="max-w-[85%] rounded-xl border border-black/5 bg-[#FAFAFA] p-3 text-sm text-black/40">
              AL-HUDHUD·M réfléchit…
            </div>
          )}
          <div ref={finDuFil} />
        </div>

        <div className="alhud-composer-wrap border-t border-black/5 p-3">
          <div className="alhud-composer flex items-end gap-2">
            <button type="button" className="alhud-composer-action" onClick={() => onChooseModule?.("documents")} aria-label="Ajouter un fichier"><Paperclip className="h-5 w-5" /></button>
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
              rows={4}
              maxLength={8000}
              placeholder="Demander à AL-HUDHUD·M"
              className="alhud-composer-input flex-1 rounded-xl border-0 p-2 text-sm outline-none"
            />
            <button type="button" className="alhud-composer-action" onClick={() => onChooseModule?.("voix")} aria-label="Microphone"><Mic className="h-5 w-5" /></button>
            <button type="button" className="alhud-composer-voice" onClick={() => onChooseModule?.("voix")} aria-label="Conversation vocale"><AudioLines className="h-5 w-5" /></button>
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
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p role="status" className="text-xs text-black/60">{notice}</p>
          <p className="mt-1 text-[10px] text-black/50">
            Réponse envoyée en un seul bloc (streaming non disponible dans ce lot — aucun arrêt de génération n'est donc proposé).
          </p>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}
