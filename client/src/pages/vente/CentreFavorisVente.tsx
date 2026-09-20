import { Link } from "react-router-dom";
import { Heart, ChevronLeft, Trash2, Car } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   FAVORIS VENTE (/vente/favoris)
   Données réelles : trpc.favoris.mine / toggle (server/routers/favoris.ts,
   table favoris) — même moteur que /favoris, jamais un second registre
   inventé. La liste FAVORIS codée en dur (3 véhicules fictifs sans id réel,
   impossibles à retirer ou à ouvrir) a été retirée plutôt que maintenue.
   ══════════════════════════════════════════════════════════════════════════ */

export default function CentreFavorisVente() {
  const mesFavoris = trpc.favoris.mine.useQuery();
  const toggle = trpc.favoris.toggle.useMutation({ onSuccess: () => mesFavoris.refetch() });
  const liste = mesFavoris.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Heart size={20} className="text-red-500" /> Mes favoris</h1>
        <p className="mt-1 text-sm text-white/60">{liste.length} véhicule{liste.length > 1 ? "s" : ""} sauvegardé{liste.length > 1 ? "s" : ""}</p>
      </div>

      {mesFavoris.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map(({ annonce }) => (
          <div key={annonce.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden flex">
            {annonce.photoPrincipale ? (
              <img src={annonce.photoPrincipale} alt="" className="w-24 h-20 object-cover" loading="lazy" />
            ) : (
              <div className="w-24 h-20 flex items-center justify-center bg-slate-100"><Car size={20} className="text-slate-400" /></div>
            )}
            <div className="flex-1 p-3">
              <h3 className="text-sm font-bold text-[#111]">{[annonce.marque, annonce.modele].filter(Boolean).join(" ") || "Véhicule"}</h3>
              <p className="text-[10px] text-[#6B7280]">{annonce.kilometrage != null ? `${Number(annonce.kilometrage).toLocaleString("fr-FR")} km` : ""}</p>
              <p className="text-sm font-black text-[#D4AF37] mt-0.5">{annonce.prix ? `${Number(annonce.prix).toLocaleString("fr-FR")} €` : ""}</p>
            </div>
            <div className="flex flex-col justify-center gap-2 pr-3">
              <Link to={`/vehicule/${annonce.id}`} className="text-[#D4AF37]"><Heart size={14} fill="currentColor" /></Link>
              <button onClick={() => toggle.mutate({ annonceId: annonce.id })} disabled={toggle.isPending}>
                <Trash2 size={14} className="text-[#9CA3AF]" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!mesFavoris.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Heart size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun favori pour le moment</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Parcourez les annonces et ajoutez vos véhicules préférés en favori</p>
          <Link to="/acheter" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white">Parcourir les annonces</Link>
        </div>
      )}
    </div>
  );
}
