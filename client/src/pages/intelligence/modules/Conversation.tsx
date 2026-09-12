/**
 * MKA.P-MS Intelligence — module Conversation (LOT IA02B).
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
import { useEffect, useRef, useState } from "react";
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

export function Conversation() {
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
    if (!sessionId || !filServeur.data) return;
    if (sessionChargee.current === sessionId) return;
    sessionChargee.current = sessionId;
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
  }, [sessionId, filServeur.data]);

  useEffect(() => {
    finDuFil.current?.scrollIntoView({ behavior: "smooth" });
  }, [fil]);

  const demander = trpc.intelligences.demander.useMutation({
    onSuccess: (r) => {
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
    onError: () =>
      setFil((f) => [
        ...f,
        {
          id: idBulle(),
          role: "moteur",
          texte: "",
          ok: false,
          motif: "Le service MKA.P-MS Intelligence est temporairement indisponible. Réessayez dans un instant.",
          outils: [],
        },
      ]),
  });

  const renommer = trpc.intelligences.renommerConversation.useMutation({
    onSuccess: () => {
      setRenommageId(null);
      void utils.intelligences.conversations.invalidate();
    },
  });

  const supprimer = trpc.intelligences.supprimerConversation.useMutation({
    onSuccess: (_r, variables) => {
      if (sessionId === variables.sessionId) nouvelleConversation();
      void utils.intelligences.conversations.invalidate();
    },
  });

  function nouvelleConversation() {
    setSessionId(null);
    sessionChargee.current = null;
    setFil([]);
    setPanneauOuvert(false);
  }

  function ouvrirConversation(id: number) {
    setSessionId(id);
    setPanneauOuvert(false);
  }

  function envoyer(texte?: string) {
    const q = (texte ?? question).trim();
    if (q.length < 2 || demander.isPending) return;
    setFil((f) => [...f, { id: idBulle(), role: "moi", texte: q, ok: true, motif: "", outils: [] }]);
    setDerniereQuestion(q);
    setQuestion("");
    demander.mutate({ question: q, sessionId });
  }

  function regenerer() {
    if (!derniereQuestion || demander.isPending) return;
    envoyer(derniereQuestion);
  }

  /** Reprendre/modifier une demande passée : reporte son texte dans la zone de saisie, ne réécrit pas l'historique. */
  function reprendre(texte: string) {
    setQuestion(texte);
    zoneSaisie.current?.focus();
  }

  async function copier(id: string, texte: string) {
    try {
      await navigator.clipboard.writeText(texte);
      setCopieId(id);
      setTimeout(() => setCopieId((c) => (c === id ? null : c)), 1500);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permission refusée) : aucune fausse confirmation.
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
    if (!window.confirm("Supprimer définitivement cette conversation et ses messages ?")) return;
    supprimer.mutate({ sessionId: id });
  }

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[420px] flex-col gap-3">
      <EtatServiceIntelligence />

      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
      <aside
        className={`${panneauOuvert ? "flex" : "hidden"} w-full shrink-0 flex-col rounded-xl border border-black/10 bg-[#FAFAFA] p-2 md:flex md:w-64`}
      >
        <button
          type="button"
          onClick={nouvelleConversation}
          className="mb-2 flex items-center gap-2 rounded-lg bg-[#111] px-3 py-2 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" /> Nouvelle conversation
        </button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {(conversations.data ?? []).map((c) => (
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
                    className="hidden shrink-0 p-1 text-black/40 hover:text-black/70 group-hover:block"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => demanderSuppression(c.id)}
                    aria-label="Supprimer cette conversation"
                    title="Supprimer"
                    className="hidden shrink-0 p-1 text-black/40 hover:text-red-600 group-hover:block"
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-black/10">
        <div className="flex items-center justify-between border-b border-black/5 px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setPanneauOuvert((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-black/60"
          >
            {panneauOuvert ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />} Conversations
          </button>
          <button type="button" onClick={nouvelleConversation} className="flex items-center gap-1 text-xs font-bold text-[#8B7500]">
            <Plus className="h-3.5 w-3.5" /> Nouvelle
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
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

                <div className="mt-1 hidden justify-end gap-2 group-hover:flex">
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
                    <button
                      type="button"
                      onClick={() => reprendre(b.texte)}
                      aria-label="Reprendre cette demande"
                      title="Reprendre / modifier"
                      className="text-black/30 hover:text-black/60"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          {demander.isPending && (
            <div className="max-w-[85%] rounded-xl border border-black/5 bg-[#FAFAFA] p-3 text-sm text-black/40">
              MKA.P-MS Intelligence réfléchit…
            </div>
          )}
          <div ref={finDuFil} />
        </div>

        <div className="border-t border-black/5 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={zoneSaisie}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  envoyer();
                }
              }}
              rows={2}
              maxLength={8000}
              placeholder="Votre demande… (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)"
              className="flex-1 rounded-xl border border-black/10 p-2 text-sm outline-none focus:border-[#8B7500]"
            />
            {derniereQuestion && !demander.isPending && (
              <button
                type="button"
                onClick={regenerer}
                aria-label="Régénérer la dernière réponse"
                title="Régénérer la dernière réponse"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/10 text-black/60 hover:bg-black/5"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => envoyer()}
              disabled={demander.isPending || question.trim().length < 2}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#111] text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-[10px] text-black/30">
            Réponse envoyée en un seul bloc (streaming non disponible dans ce lot — aucun arrêt de génération n'est donc proposé).
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
