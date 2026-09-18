import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Eye, ChevronDown, Check, X, Clock } from "lucide-react";
import { trpc } from "../../lib/trpc";

/**
 * Modération annonces (/superadmin/admin-moderation-annonces).
 *
 * Données réelles : trpc.admin.annoncesPending / moderateAnnonce
 * (server/routers/admin.ts, table annonces, statut "en_validation") — la
 * même file d'attente de modération §10.3 déjà utilisée pour publier ou
 * refuser une annonce, jamais un second registre inventé pour l'écran.
 */
export default function AdminModerationAnnonces() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const pending = trpc.admin.annoncesPending.useQuery();
  const moderate = trpc.admin.moderateAnnonce.useMutation({
    onSuccess: () => utils.admin.annoncesPending.invalidate(),
  });

  const liste = pending.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Eye size={20} className="text-[#D4AF37]" /> Modération annonces</h1>
      </div>
      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-amber-500">{liste.length}</p>
          <p className="text-[9px] text-[#6B7280]">En attente de validation</p>
        </div>
      </div>

      {pending.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((a) => {
          const isExp = expanded === a.id;
          return (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-50 grid place-items-center"><Clock size={14} className="text-amber-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{a.titre}</p>
                  <p className="text-[10px] text-[#6B7280]">{a.marque} {a.modele} · Vendeur #{a.ownerId} · {new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className="text-xs font-black text-[#D4AF37]">{Number(a.prix).toLocaleString("fr-FR")} {a.devise}</span>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  {a.description && <p className="text-[10px] text-[#6B7280] mb-2">{a.description}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderate.mutate({ id: a.id, action: "publiee" })}
                      disabled={moderate.isPending}
                      className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Check size={10} /> Approuver
                    </button>
                    <Link to={`/annonce/${a.id}`} className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[9px] font-bold text-white text-center">Voir</Link>
                    <button
                      onClick={() => moderate.mutate({ id: a.id, action: "refusee" })}
                      disabled={moderate.isPending}
                      className="flex-1 rounded-lg bg-red-50 py-1.5 text-[9px] font-bold text-red-600 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <X size={10} /> Refuser
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!pending.isLoading && liste.length === 0 && (
          <p className="text-sm text-[#6B7280] text-center py-8">Aucune annonce en attente de validation.</p>
        )}
      </div>
    </div>
  );
}
