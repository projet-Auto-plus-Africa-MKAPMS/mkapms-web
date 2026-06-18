import { Link } from "react-router-dom";
import { ChevronLeft, Search, Tag, Heart, Clock, Percent } from "lucide-react";
const ANNONCES = [
  { id: 1, nom: "Peugeot 308 GT Line", annee: 2023, km: 18000, prixAvant: 28000, prixApres: 23500, remise: "-16%", fin: "3 jours", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop" },
  { id: 2, nom: "Renault Mégane E-Tech", annee: 2024, km: 5000, prixAvant: 35000, prixApres: 29900, remise: "-15%", fin: "5 jours", photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop" },
  { id: 3, nom: "Dacia Duster Prestige", annee: 2023, km: 22000, prixAvant: 20500, prixApres: 17200, remise: "-16%", fin: "7 jours", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop" },
  { id: 4, nom: "Citroën C5 Aircross", annee: 2022, km: 42000, prixAvant: 25000, prixApres: 20500, remise: "-18%", fin: "2 jours", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop" },
];
export default function VentePromotions() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-green-600 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">PROMOTIONS</span>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Tag size={20} /> Promotions & Déstockage</h1>
        <p className="mt-1 text-sm text-white/80">Offres limitées, fins de série, prix réduits</p>
      </div>
      <div className="px-4 mt-4 space-y-3">
        {ANNONCES.map((a) => (
          <div key={a.id} className="rounded-xl bg-white border border-green-200 overflow-hidden">
            <div className="relative h-[130px]">
              <img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" />
              <button className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"><Heart size={14} /></button>
              <span className="absolute top-2 left-2 rounded-full bg-green-600 px-2.5 py-0.5 text-[10px] font-bold text-white">{a.remise}</span>
              <span className="absolute bottom-2 left-2 rounded-full bg-[#111] px-2 py-0.5 text-[9px] font-bold text-white flex items-center gap-1"><Clock size={10} /> {a.fin}</span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
              <p className="text-[10px] text-[#6B7280] mt-0.5">{a.annee} · {a.km.toLocaleString("fr-FR")} km</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-[#6B7280] line-through">{a.prixAvant.toLocaleString("fr-FR")} €</span>
                <span className="text-lg font-black text-green-600">{a.prixApres.toLocaleString("fr-FR")} €</span>
              </div>
            </div>
          </div>))}
      </div>
    </div>
  );
}
