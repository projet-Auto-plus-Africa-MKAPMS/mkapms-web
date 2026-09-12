import { Link } from "react-router-dom";
import { Heart, ChevronLeft, Trash2, Star, MapPin, Car } from "lucide-react";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   MES FAVORIS (/favoris)
   Données réelles : trpc.favoris.mine / toggle (server/routers/favoris.ts,
   table favoris) — jamais un second registre inventé. Le vrai moteur ne
   couvre que les véhicules (annonceId) : les catégories garage/carrosserie/
   enchère/pièce affichées ici auparavant n'avaient aucune contrepartie
   réelle (fausses entreprises, fausses notes, photos de stock présentées
   comme des annonces) — retirées plutôt que maintenues fictives.
   ══════════════════════════════════════════════════════════════════════════ */

export default function Favoris() {
  const mesFavoris = trpc.favoris.mine.useQuery();
  const toggle = trpc.favoris.toggle.useMutation({ onSuccess: () => mesFavoris.refetch() });
  const liste = mesFavoris.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Heart size={20} className="text-red-400" fill="currentColor" /> Mes favoris</h1>
        <p className="mt-1 text-sm text-white/60">{liste.length} véhicule{liste.length > 1 ? "s" : ""} sauvegardé{liste.length > 1 ? "s" : ""}</p>
      </div>

      {mesFavoris.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {liste.map(({ annonce }) => (
          <div key={annonce.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="relative h-[100px]">
              {annonce.photoPrincipale ? (
                <img src={annonce.photoPrincipale} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100"><Car size={24} className="text-slate-400" /></div>
              )}
              <button onClick={() => toggle.mutate({ annonceId: annonce.id })} disabled={toggle.isPending} className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 backdrop-blur disabled:opacity-50">
                <Heart size={12} className="text-red-500 fill-red-500" />
              </button>
            </div>
            <div className="p-2">
              <h3 className="text-[11px] font-bold text-[#111] truncate">{[annonce.marque, annonce.modele].filter(Boolean).join(" ") || "Véhicule"}</h3>
              <div className="mt-0.5 flex items-center gap-1 text-[9px] text-[#6B7280]">
                {annonce.ville && <span className="flex items-center gap-0.5"><MapPin size={8} /> {annonce.ville}</span>}
                {annonce.annee && <span className="ml-auto">{annonce.annee}</span>}
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs font-black text-[#D4AF37]">{annonce.prix ? `${Number(annonce.prix).toLocaleString("fr-FR")} €` : ""}</span>
              </div>
              <Link to={`/vehicule/${annonce.id}`} className="mt-1.5 block w-full rounded-lg bg-[#D4AF37] py-1.5 text-center text-[9px] font-bold text-white active:scale-[0.98]">Voir</Link>
              <button onClick={() => toggle.mutate({ annonceId: annonce.id })} disabled={toggle.isPending} className="mt-1 w-full text-center text-[9px] text-red-400 flex items-center justify-center gap-0.5 disabled:opacity-50"><Trash2 size={9} /> Retirer</button>
            </div>
          </div>
        ))}
      </div>

      {!mesFavoris.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Heart size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun favori pour le moment</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Parcourez les annonces et ajoutez vos véhicules préférés en favori</p>
          <Link to="/" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white">Explorer MKA.P-MS</Link>
        </div>
      )}
    </div>
  );
}
