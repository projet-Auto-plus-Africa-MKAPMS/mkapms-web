import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { ChevronLeft, Edit3, Pause, RefreshCw, Trash2 } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   GÉRER L'ANNONCE (/depot-annonce/modification-annonce/:id)
   Données réelles : trpc.annonces.update / remove (server/routers/
   annonces.ts, déjà utilisé par MesAnnonces.tsx pour modifier/prolonger/
   supprimer) — jamais un second moteur. Suspendre/Republier réutilisent le
   même champ status ("archivee"/"publiee") déjà géré par update.
   ══════════════════════════════════════════════════════════════════════════ */

export default function ModificationAnnonce() {
  const { id } = useParams();
  const annonceId = Number(id);
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: annonce, isLoading } = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: Number.isFinite(annonceId) });
  const update = trpc.annonces.update.useMutation({ onSuccess: () => utils.annonces.get.invalidate({ id: annonceId }) });
  const remove = trpc.annonces.remove.useMutation({ onSuccess: () => navigate("/acheter/mes-annonces") });

  if (!Number.isFinite(annonceId) || (!isLoading && !annonce)) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-4">
        <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">Annonce introuvable — revenez depuis « Mes annonces ».</p>
      </div>
    );
  }

  const estArchivee = annonce?.status === "archivee";

  const ACTIONS = [
    { label: "Modifier l'annonce", desc: "Prix, photos, description, options", icon: Edit3, color: "#3B82F6", action: () => navigate(`/vendre?edit=${annonceId}`) },
    !estArchivee
      ? { label: "Suspendre l'annonce", desc: "Masquer temporairement sans supprimer", icon: Pause, color: "#F59E0B", action: () => update.mutate({ id: annonceId, status: "archivee" }) }
      : { label: "Republier l'annonce", desc: "Remettre en ligne après suspension", icon: RefreshCw, color: "#10B981", action: () => update.mutate({ id: annonceId, status: "publiee" }) },
    {
      label: "Supprimer l'annonce", desc: "Suppression définitive", icon: Trash2, color: "#EF4444", action: () => {
        if (window.confirm("Supprimer définitivement cette annonce ? Cette action est irréversible.")) remove.mutate({ id: annonceId });
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter/mes-annonces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mes annonces</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Edit3 size={20} className="text-[#D4AF37]" /> Gérer l'annonce</h1>
        {annonce && <p className="mt-1 text-sm text-white/60">{annonce.titre || `${annonce.marque ?? ""} ${annonce.modele ?? ""}`.trim()}</p>}
      </div>

      {(update.error || remove.error) && (
        <p className="mx-4 mt-3 text-xs text-red-600">{update.error?.message || remove.error?.message}</p>
      )}

      <div className="px-4 mt-4 space-y-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const busy = update.isPending || remove.isPending;
          return (
            <button
              key={a.label}
              onClick={a.action}
              disabled={busy}
              className="w-full flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3.5 shadow-sm text-left active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: a.color + "15" }}><Icon size={16} style={{ color: a.color }} /></div>
              <div className="flex-1"><p className="text-sm font-semibold text-[#111]">{a.label}</p><p className="text-[10px] text-[#6B7280]">{a.desc}</p></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
