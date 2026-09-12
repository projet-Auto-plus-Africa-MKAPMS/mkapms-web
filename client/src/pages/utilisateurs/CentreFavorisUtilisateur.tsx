import { Link } from "react-router-dom";
import { ChevronLeft, Heart } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* Données réelles : trpc.favoris.mine (server/routers/favoris.ts) — déjà
   utilisé par les fiches véhicules pour le bouton favori, jamais un
   second registre inventé pour cet écran. */

export default function CentreFavorisUtilisateur() {
  const mesFavoris = trpc.favoris.mine.useQuery();
  const toggle = trpc.favoris.toggle.useMutation({ onSuccess: () => mesFavoris.refetch() });
  const liste = mesFavoris.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Heart size={20} className="text-[#D4AF37]" /> Mes favoris</h1>
        <p className="mt-1 text-sm text-white/60">Les véhicules que vous avez enregistrés</p>
      </div>

      {mesFavoris.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map(({ annonce }) => (
          <div key={annonce.id} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
            <Link to={`/vehicule/${annonce.id}`} className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
              {annonce.photoPrincipale ? <img src={annonce.photoPrincipale} alt="" className="h-full w-full object-cover" /> : <Heart size={20} className="text-slate-400" />}
            </Link>
            <Link to={`/vehicule/${annonce.id}`} className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#111] truncate">{[annonce.marque, annonce.modele].filter(Boolean).join(" ") || "Véhicule"}</h3>
              <p className="text-[10px] text-[#6B7280]">{annonce.prix ? `${Number(annonce.prix).toLocaleString("fr-FR")} €` : ""}</p>
            </Link>
            <button
              onClick={() => toggle.mutate({ annonceId: annonce.id })}
              disabled={toggle.isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#D4AF37] disabled:opacity-50"
            >
              <Heart size={14} className="fill-[#D4AF37]" />
            </button>
          </div>
        ))}
      </div>

      {!mesFavoris.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Heart size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun favori pour le moment.</p>
        </div>
      )}
    </div>
  );
}
