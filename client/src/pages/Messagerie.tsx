import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageSquare, Search, Send, ChevronLeft, CheckCheck, Check, Loader2, ChevronRight,
  HandCoins, ThumbsUp, ThumbsDown, Repeat,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { getAnnonceUrl } from "../lib/annonceUrl";
import { useCurrency } from "../lib/currency";

const LIBELLE_STATUT_OFFRE: Record<string, string> = {
  en_attente: "En attente de réponse",
  acceptee: "Offre acceptée",
  refusee: "Offre refusée",
  contre_offre: "Remplacée par une contre-offre",
  annulee: "Annulée",
};

/* ══════════════════════════════════════════════════════════════════════════
   MESSAGERIE INTERNE UNIQUE
   Chaque conversation est liée à une annonce précise et à son vendeur
   (comme LeBonCoin / La Centrale). Tout passe par MKA.P-MS.
   ══════════════════════════════════════════════════════════════════════════ */

function fmtDate(d: string | Date | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default function Messagerie() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const threadParam = params.get("thread");
  const selectedId = threadParam ? Number(threadParam) : null;

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [offerForm, setOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [counterFor, setCounterFor] = useState<number | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const utils = trpc.useUtils();
  const { format: formatPrice } = useCurrency();

  const threadsQuery = trpc.messages.listThreads.useQuery();
  const threadQuery = trpc.messages.getThread.useQuery(
    { id: selectedId ?? 0 },
    { enabled: selectedId != null },
  );
  const markRead = trpc.messages.markRead.useMutation({
    onSuccess: () => {
      utils.messages.listThreads.invalidate();
      utils.messages.unreadCount.invalidate();
    },
  });
  const sendMut = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessage("");
      if (selectedId != null) utils.messages.getThread.invalidate({ id: selectedId });
      utils.messages.listThreads.invalidate();
    },
  });
  const invalidateApresOffre = () => {
    if (selectedId != null) utils.messages.getThread.invalidate({ id: selectedId });
    utils.messages.listThreads.invalidate();
  };
  const proposerOffre = trpc.messages.proposerOffre.useMutation({
    onSuccess: () => { setOfferForm(false); setOfferAmount(""); invalidateApresOffre(); },
  });
  const repondreOffre = trpc.messages.repondreOffre.useMutation({
    onSuccess: () => { setCounterFor(null); setCounterAmount(""); invalidateApresOffre(); },
  });

  // Marque comme lus les messages reçus dès l'ouverture d'une conversation.
  useEffect(() => {
    if (selectedId != null) markRead.mutate({ threadId: selectedId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const openThread = (id: number) => setParams({ thread: String(id) });
  const backToList = () => setParams({});

  function sendMessage() {
    const content = message.trim();
    if (!content || selectedId == null) return;
    sendMut.mutate({ threadId: selectedId, content });
  }

  /* ─────────────────────────── VUE CONVERSATION ─────────────────────────── */
  if (selectedId != null) {
    const t = threadQuery.data;
    const a = t?.annonce;
    const produitUrl = a ? getAnnonceUrl(a.id, a.categorieAnnonce, a.vendeurType) : null;
    return (
      <div className="fixed inset-0 z-[60] bg-[#F5F3EF] flex flex-col">
        <div className="bg-[#111] px-4 pb-3 flex items-center gap-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
          <button onClick={backToList} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
            <ChevronLeft size={18} className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{t?.other?.nom ?? "Conversation"}</h2>
          </div>
        </div>

        {/* Lien produit (demande Direction 26/10) — toujours visible, jamais
            seulement un titre : un clic ramène directement sur la fiche
            produit (prix inclus), aussi bien pour l'acheteur que pour le
            propriétaire qui ouvre ce même fil. */}
        {a && produitUrl && (
          <button
            onClick={() => navigate(produitUrl)}
            className="flex w-full items-center gap-2 border-b border-[#E5E7EB] bg-white px-4 py-2.5 text-left active:scale-[0.99] transition"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#111] truncate">{a.titre}</p>
              {a.prix != null && <p className="text-xs font-bold text-[#B8960C]">{formatPrice(Number(a.prix))}</p>}
            </div>
            <ChevronRight size={14} className="text-[#9CA3AF] shrink-0" />
          </button>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {threadQuery.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#D4AF37]" /></div>
          ) : (t?.messages.length ?? 0) === 0 ? (
            <p className="text-center text-xs text-[#9CA3AF] py-8">
              Envoyez votre premier message au vendeur au sujet de cette annonce.
            </p>
          ) : (
            t?.messages.map((m) => {
              if (m.offer) {
                const peutRepondre = m.offer.status === "en_attente" && !m.mine;
                return (
                  <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] rounded-2xl border border-[#D4AF37]/40 bg-[#FFFBEA] px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8B7500]">
                        <HandCoins size={12} /> {m.mine ? "Votre offre" : "Offre reçue"}
                      </div>
                      <p className="mt-1 text-lg font-black text-[#111]">{formatPrice(Number(m.offer.montant))}</p>
                      <p className="text-[11px] font-semibold text-[#6B7280]">{LIBELLE_STATUT_OFFRE[m.offer.status] ?? m.offer.status}</p>
                      {peutRepondre && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            disabled={repondreOffre.isPending}
                            onClick={() => repondreOffre.mutate({ offerId: m.offer!.id, decision: "acceptee" })}
                            className="flex items-center gap-1 rounded-lg bg-[#1a7f37] px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                          >
                            <ThumbsUp size={12} /> Accepter
                          </button>
                          <button
                            type="button"
                            disabled={repondreOffre.isPending}
                            onClick={() => repondreOffre.mutate({ offerId: m.offer!.id, decision: "refusee" })}
                            className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-600 disabled:opacity-50"
                          >
                            <ThumbsDown size={12} /> Refuser
                          </button>
                          <button
                            type="button"
                            onClick={() => setCounterFor(counterFor === m.offer!.id ? null : m.offer!.id)}
                            className="flex items-center gap-1 rounded-lg border border-[#D4AF37]/40 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#8B7500]"
                          >
                            <Repeat size={12} /> Contre-offrir
                          </button>
                        </div>
                      )}
                      {peutRepondre && counterFor === m.offer.id && (
                        <div className="mt-2 flex gap-1.5">
                          <input
                            type="number"
                            min={1}
                            placeholder="Votre montant"
                            value={counterAmount}
                            onChange={(e) => setCounterAmount(e.target.value)}
                            className="flex-1 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs"
                          />
                          <button
                            type="button"
                            disabled={!counterAmount || Number(counterAmount) <= 0 || repondreOffre.isPending}
                            onClick={() => repondreOffre.mutate({ offerId: m.offer!.id, decision: "contre_offre", contreMontant: Number(counterAmount) })}
                            className="rounded-lg bg-[#111] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-40"
                          >
                            Envoyer
                          </button>
                        </div>
                      )}
                      <p className={`mt-1.5 text-[9px] ${m.mine ? "text-black/40" : "text-[#9CA3AF]"}`}>{fmtDate(m.createdAt)}</p>
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.mine ? "bg-[#D4AF37] text-white rounded-br-sm" : "bg-white text-[#111] border border-[#E5E7EB] rounded-bl-sm"}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${m.mine ? "text-white/60" : "text-[#9CA3AF]"}`}>
                      <span className="text-[9px]">{fmtDate(m.createdAt)}</span>
                      {m.mine && (m.status === "lu" ? <CheckCheck size={10} /> : <Check size={10} />)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {(proposerOffre.error || repondreOffre.error) && (
          <p className="px-4 pb-1 text-[11px] font-semibold text-red-600 bg-white">
            {proposerOffre.error?.message ?? repondreOffre.error?.message}
          </p>
        )}

        {a?.negociable && offerForm && (
          <div className="bg-white border-t border-[#E5E7EB] px-4 py-2.5 flex items-center gap-2">
            <input
              type="number"
              min={1}
              placeholder={`Votre offre en ${a.devise ?? "EUR"}`}
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="flex-1 rounded-full border border-[#D4AF37]/40 bg-[#FFFBEA] px-3.5 py-2 text-sm outline-none"
            />
            <button
              type="button"
              disabled={!offerAmount || Number(offerAmount) <= 0 || selectedId == null || proposerOffre.isPending}
              onClick={() => selectedId != null && proposerOffre.mutate({ threadId: selectedId, montant: Number(offerAmount) })}
              className="rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {proposerOffre.isPending ? "…" : "Envoyer"}
            </button>
          </div>
        )}

        <div className="bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center gap-2" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
          {a?.negociable && (
            <button
              type="button"
              onClick={() => setOfferForm((v) => !v)}
              aria-label="Faire une offre"
              aria-pressed={offerForm}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${offerForm ? "border-[#D4AF37] bg-[#FFFBEA] text-[#8B7500]" : "border-[#E5E7EB] text-[#6B7280]"}`}
            >
              <HandCoins size={15} />
            </button>
          )}
          <div className="flex-1 flex items-center rounded-full bg-[#F5F3EF] px-3 py-2">
            <input
              type="text"
              placeholder="Écrire un message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!message.trim() || sendMut.isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] hover:bg-[#C4A030] active:scale-95 transition disabled:opacity-50"
          >
            {sendMut.isPending ? <Loader2 size={14} className="text-white animate-spin" /> : <Send size={14} className="text-white" />}
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────── LISTE DES FILS ─────────────────────────── */
  const threads = threadsQuery.data ?? [];
  const filtered = threads.filter((c) => {
    const hay = `${c.other?.nom ?? ""} ${c.annonceTitre ?? ""}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white">Messagerie</h1>
        <p className="mt-0.5 text-sm text-white/60">Toutes vos conversations MKA.P-MS</p>
      </div>

      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" placeholder="Rechercher une conversation…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="mx-4 mt-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3">
        <p className="text-xs text-[#111] font-semibold text-center">
          Toutes les communications passent par MKA.P-MS. Aucune information par WhatsApp.
        </p>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {threadsQuery.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#D4AF37]" /></div>
        ) : (
          filtered.map((c) => (
            <button key={c.id} onClick={() => openThread(c.id)} className="w-full flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 text-left active:scale-[0.99] transition">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F5F3EF] text-lg font-bold text-[#B8960C]">
                {(c.other?.nom ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111] truncate">{c.other?.nom ?? "Vendeur"}</h3>
                  <span className="text-[10px] text-[#9CA3AF] shrink-0">{fmtDate(c.lastMessageAt)}</span>
                </div>
                {c.annonceTitre && (
                  <p className="text-[11px] text-[#B8960C] font-semibold mt-0.5 truncate">
                    {c.annonceTitre}{c.annoncePrix != null && ` · ${formatPrice(Number(c.annoncePrix))}`}
                  </p>
                )}
                <p className="text-xs text-[#6B7280] mt-0.5 truncate">{c.lastMessage ?? "Nouvelle conversation"}</p>
              </div>
              {c.unread > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-bold text-white">{c.unread}</span>
              )}
            </button>
          ))
        )}
      </div>

      {!threadsQuery.isLoading && filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <MessageSquare size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune conversation</p>
        </div>
      )}
    </div>
  );
}
