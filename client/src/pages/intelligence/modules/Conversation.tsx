/**
 * MKA.P-MS Intelligence — module Conversation (LOT IA02B).
 *
 * Premier module réel de l'application dédiée : nouvelle conversation,
 * conversations précédentes (server/intelligences/service.ts::sessions/
 * messages, déjà réel), envoi, historique, régénération, états d'erreur.
 * Réutilise exactement le même moteur que le Centre Intelligence direction
 * (CentreIntelligences.tsx → intelligences.demander) — aucun second cerveau,
 * une seconde façade.
 *
 * Honnêtement absent de ce lot, faute de socle réel derrière (pas fabriqué
 * pour faire joli) :
 *  - réponses en streaming : server/intelligences/provider.ts fait un seul
 *    appel bloquant, aucun flux token par token n'existe dans ce dépôt ;
 *  - arrêt d'une génération en cours : sans flux, il n'y a rien à interrompre
 *    côté serveur — l'annuler côté client masquerait une réponse qui continue
 *    de se préparer, ce serait un faux bouton ;
 *  - pièces jointes, image, voix, outils, code : modules dédiés séparés,
 *    encore à l'état de socle (voir leur propre fichier).
 */
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Menu, Plus, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { trpc } from "../../../lib/trpc";

interface Bulle {
  id: string;
  role: "moi" | "moteur";
  texte: string;
  ok: boolean;
  motif: string;
}

function idBulle(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function Conversation() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [fil, setFil] = useState<Bulle[]>([]);
  const [question, setQuestion] = useState("");
  const [derniereQuestion, setDerniereQuestion] = useState("");
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const sessionChargee = useRef<number | null>(null);
  const finDuFil = useRef<HTMLDivElement>(null);

  const conversations = trpc.intelligences.conversations.useQuery(
    { cote: "direction" },
    { refetchOnWindowFocus: false },
  );

  const filServeur = trpc.intelligences.fil.useQuery(
    { sessionId: sessionId ?? 0 },
    { enabled: !!sessionId, refetchOnWindowFocus: false },
  );

  // Ne recharge le fil local depuis le serveur qu'au moment où une AUTRE
  // conversation est sélectionnée dans le panneau — jamais après, sinon un
  // envoi local optimiste serait écrasé par une réponse serveur en retard.
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
          motif: m.motif,
        })),
    );
  }, [sessionId, filServeur.data]);

  useEffect(() => {
    finDuFil.current?.scrollIntoView({ behavior: "smooth" });
  }, [fil]);

  const demander = trpc.intelligences.demander.useMutation({
    onSuccess: (r) => {
      setSessionId(r.sessionId);
      sessionChargee.current = r.sessionId; // déjà à jour localement, pas besoin du fil serveur
      setFil((f) => [...f, { id: idBulle(), role: "moteur", texte: r.reponse, ok: r.ok, motif: r.motif }]);
      void conversations.refetch();
    },
    onError: (e) =>
      setFil((f) => [...f, { id: idBulle(), role: "moteur", texte: "", ok: false, motif: e.message }]),
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
    setFil((f) => [...f, { id: idBulle(), role: "moi", texte: q, ok: true, motif: "" }]);
    setDerniereQuestion(q);
    setQuestion("");
    demander.mutate({ question: q, sessionId });
  }

  function regenerer() {
    if (!derniereQuestion || demander.isPending) return;
    envoyer(derniereQuestion);
  }

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[420px] gap-3">
      {/* Panneau conversations précédentes — capacité 2 de la demande */}
      <aside
        className={`${panneauOuvert ? "flex" : "hidden"} w-64 shrink-0 flex-col rounded-xl border border-black/10 bg-[#FAFAFA] p-2 md:flex`}
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
            <button
              key={c.id}
              type="button"
              onClick={() => ouvrirConversation(c.id)}
              className={`w-full truncate rounded-lg px-2.5 py-2 text-left text-xs font-semibold ${
                sessionId === c.id ? "bg-black/10 text-black" : "text-black/60 hover:bg-black/5"
              }`}
              title={c.titre}
            >
              {c.titre || "Sans titre"}
            </button>
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
                className={`max-w-[85%] rounded-xl border p-3 text-sm ${
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
                    <span>{b.motif || "Aucune réponse — motif non communiqué."}</span>
                  </p>
                )}
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
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  envoyer();
                }
              }}
              rows={2}
              placeholder="Votre demande…"
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
        </div>
      </div>
    </div>
  );
}
