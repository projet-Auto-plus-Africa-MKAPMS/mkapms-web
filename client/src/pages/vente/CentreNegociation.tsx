import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MessageSquare, Send } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   NÉGOCIATION (/vente/negociation/:id)
   Données réelles : trpc.messages.openThread / getThread / send (server/
   routers/messages.ts, moteur de messagerie déjà utilisé par « Contacter le
   vendeur » sur la fiche véhicule). Une négociation EST une conversation
   liée à l'annonce : jamais un second registre pour les offres, qui sont de
   simples messages formatés. Réservé aux acheteurs connectés (porte d'accès
   générale U, pas la porte VO professionnelle — cet écran ne concerne pas
   un vendeur), mais la fiche annonce reste visible avant connexion.
   ══════════════════════════════════════════════════════════════════════════ */

export default function CentreNegociation() {
  const { id } = useParams();
  const annonceId = Number(id);
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: annonce, isLoading: annonceLoading } = trpc.annonces.get.useQuery(
    { id: annonceId },
    { enabled: Number.isFinite(annonceId) },
  );

  const openThread = trpc.messages.openThread.useMutation();
  const [threadId, setThreadId] = useState<number | null>(null);

  useEffect(() => {
    if (user && Number.isFinite(annonceId) && threadId === null && !openThread.isPending && !openThread.isError) {
      openThread.mutate({ annonceId }, { onSuccess: (r) => setThreadId(r.threadId) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annonceId, user]);

  const thread = trpc.messages.getThread.useQuery({ id: threadId! }, { enabled: threadId !== null, refetchInterval: 5000 });

  const send = trpc.messages.send.useMutation({
    onSuccess: () => {
      setContent("");
      setOffre("");
      if (threadId !== null) utils.messages.getThread.invalidate({ id: threadId });
    },
  });

  const [content, setContent] = useState("");
  const [offre, setOffre] = useState("");

  if (!Number.isFinite(annonceId) || (!annonceLoading && !annonce)) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-4">
        <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">Véhicule introuvable — revenez depuis sa fiche.</p>
      </div>
    );
  }

  const envoyerOffre = () => {
    const montant = Number(offre);
    if (!montant || threadId === null) return;
    const devise = annonce?.devise || "EUR";
    send.mutate({ threadId, content: `💰 Nouvelle offre : ${montant.toLocaleString("fr-FR")} ${devise}` });
  };

  const envoyerMessage = () => {
    if (!content.trim() || threadId === null) return;
    send.mutate({ threadId, content: content.trim() });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to={`/vehicule/${annonceId}`} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={20} className="text-[#D4AF37]" /> Négociation</h1>
        {annonce && (
          <p className="mt-1 text-sm text-white/60">
            {annonce.titre || `${annonce.marque ?? ""} ${annonce.modele ?? ""}`.trim()} — {Number(annonce.prix).toLocaleString("fr-FR")} {annonce.devise}
          </p>
        )}
      </div>

      {annonce && (
        <div className="px-4 mt-3">
          <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${annonce.negociable ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-slate-100 text-slate-500"}`}>
            {annonce.negociable ? "Prix négociable" : "Prix fixe — non négociable"}
          </span>
        </div>
      )}

      {!user ? (
        <div className="px-4 mt-6">
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">Connectez-vous pour négocier avec le vendeur.</p>
          <Link to="/connexion" className="mt-3 block w-full rounded-xl bg-[#D4AF37] py-3 text-center text-sm font-bold text-white">Se connecter</Link>
        </div>
      ) : (
        <>
          {openThread.isError && (
            <p className="mx-4 mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-red-600">{openThread.error.message}</p>
          )}

          <div className="px-4 mt-4 space-y-2">
            {(openThread.isPending || (threadId !== null && thread.isLoading)) && (
              <p className="text-sm text-[#6B7280] text-center">Chargement…</p>
            )}
            {thread.data?.messages.length === 0 && (
              <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">
                Aucun message pour l'instant — envoyez votre première offre ou question.
              </p>
            )}
            {thread.data?.messages.map((m) => (
              <div key={m.id} className={`rounded-xl p-3 ${!m.mine ? "bg-white border border-[#E5E7EB] mr-8" : "bg-[#D4AF37]/10 border border-[#D4AF37]/30 ml-8"}`}>
                <div className="flex justify-between text-[9px]">
                  <span className="font-bold text-[#111]">{m.mine ? "Vous" : (thread.data.other.nom ?? "Vendeur")}</span>
                  <span className="text-[#9CA3AF]">{new Date(m.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="text-sm text-[#111] mt-1">{m.content}</p>
              </div>
            ))}
          </div>

          {send.error && <p className="mx-4 mt-3 text-xs text-red-600">{send.error.message}</p>}

          {annonce?.negociable && (
            <div className="px-4 mt-4">
              <h3 className="text-xs font-bold text-[#6B7280] mb-2">Faire une offre</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Montant en €"
                  value={offre}
                  onChange={(e) => setOffre(e.target.value)}
                  className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm"
                />
                <button
                  onClick={envoyerOffre}
                  disabled={!offre || threadId === null || send.isPending}
                  className="rounded-lg bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Envoyer l'offre
                </button>
              </div>
            </div>
          )}

          <div className="px-4 mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Votre message…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
              className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm"
            />
            <button
              onClick={envoyerMessage}
              disabled={!content.trim() || threadId === null || send.isPending}
              className="rounded-lg bg-[#D4AF37] px-4 py-2.5 disabled:opacity-50"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
