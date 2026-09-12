import { Link } from "react-router-dom";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* Données réelles : trpc.messages.listThreads (server/routers/messages.ts) —
   la même messagerie déjà utilisée par client/src/pages/Messagerie.tsx.
   Cet écran en est une vue depuis « Mon espace », jamais un second système
   de messages inventé. */

export default function MessagerieGlobale() {
  const threads = trpc.messages.listThreads.useQuery();
  const liste = threads.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={20} className="text-[#D4AF37]" /> Messagerie</h1>
        <p className="mt-1 text-sm text-white/60">Vos conversations</p>
      </div>

      {threads.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((t) => (
          <Link key={t.id} to={`/messagerie?thread=${t.id}`} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-bold text-sm">
              {t.other.nom?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#111] truncate">{t.other.nom ?? "Utilisateur"}</h3>
                {t.unread > 0 && <span className="h-2 w-2 rounded-full bg-[#D4AF37] shrink-0" />}
              </div>
              {t.annonceTitre && <p className="text-[10px] text-[#9CA3AF] truncate">{t.annonceTitre}</p>}
              {t.lastMessage && <p className="text-xs text-[#6B7280] truncate mt-0.5">{t.lastMessage}</p>}
            </div>
            {t.lastMessageAt && <span className="text-[10px] text-[#9CA3AF] shrink-0">{new Date(t.lastMessageAt).toLocaleDateString("fr-FR")}</span>}
          </Link>
        ))}
      </div>

      {!threads.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <MessageSquare size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune conversation pour le moment.</p>
        </div>
      )}
    </div>
  );
}
