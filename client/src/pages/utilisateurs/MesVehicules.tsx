import { Link } from "react-router-dom";
import { ChevronLeft, Car } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* Données réelles : trpc.annonces.mine (les annonces publiées par le
   compte) — le seul registre de véhicules réellement rattachés à un
   compte particulier sur la plateforme. */

const STATUT_LABEL: Record<string, string> = {
  brouillon: "Brouillon",
  en_validation: "En validation",
  publiee: "En ligne",
  vendue: "Vendue",
  louee: "Louée",
  archivee: "Archivée",
  refusee: "Refusée",
  expiree: "Expirée",
};

export default function MesVehicules() {
  const mesAnnonces = trpc.annonces.mine.useQuery();
  const liste = mesAnnonces.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Mes véhicules</h1>
        <p className="mt-1 text-sm text-white/60">Les véhicules que vous avez mis en ligne</p>
      </div>

      {mesAnnonces.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((v) => (
          <Link key={v.id} to={`/vehicule/${v.id}`} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
              <Car size={20} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#111] truncate">{[v.marque, v.modele].filter(Boolean).join(" ") || "Véhicule"}</h3>
              <p className="text-[10px] text-[#6B7280]">{v.prix ? `${Number(v.prix).toLocaleString("fr-FR")} €` : ""}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0">{STATUT_LABEL[v.status] ?? v.status}</span>
          </Link>
        ))}
      </div>

      {!mesAnnonces.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Car size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Vous n'avez encore mis aucun véhicule en ligne.</p>
          <Link to="/vendre" className="mt-3 inline-block text-xs font-bold text-[#D4AF37] underline">Déposer une annonce</Link>
        </div>
      )}
    </div>
  );
}
