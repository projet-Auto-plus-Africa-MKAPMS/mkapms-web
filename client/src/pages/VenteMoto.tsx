import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, Bike, Star, Heart, MapPin, Filter, ChevronDown } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE MOTO — Univers indépendant
   Scooter, 125, Routière, Trail, Sportive, Cross. Pas mélangé avec voitures.
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { label: "Scooter", photo: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300&h=200&fit=crop" },
  { label: "125 cm³", photo: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=300&h=200&fit=crop" },
  { label: "Routière", photo: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&h=200&fit=crop" },
  { label: "Trail", photo: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=300&h=200&fit=crop" },
  { label: "Sportive", photo: "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=300&h=200&fit=crop" },
  { label: "Cross", photo: "https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=300&h=200&fit=crop" },
];

const ANNONCES = [
  { id: 1, nom: "Yamaha MT-07", annee: 2023, km: 8000, prix: 6500, cat: "Roadster", photo: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=260&fit=crop" },
  { id: 2, nom: "Honda CB 500F", annee: 2022, km: 12000, prix: 5200, cat: "Roadster", photo: "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=400&h=260&fit=crop" },
  { id: 3, nom: "BMW R 1250 GS Adventure", annee: 2023, km: 15000, prix: 16500, cat: "Trail", photo: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=260&fit=crop" },
  { id: 4, nom: "Kawasaki Ninja ZX-6R", annee: 2024, km: 3000, prix: 11900, cat: "Sportive", photo: "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?w=400&h=260&fit=crop" },
  { id: 5, nom: "Vespa Primavera 125", annee: 2023, km: 5000, prix: 3800, cat: "Scooter", photo: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=300&h=200&fit=crop" },
];

export default function VenteMoto() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-red-600 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">MOTO</span>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Bike size={20} /> Achat Moto</h1>
        <p className="mt-1 text-sm text-white/80">Scooters, 125, routières, trail, sportives, cross</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" placeholder="Marque, modèle, cylindrée…" className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Catégories</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.label} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden active:scale-[0.98]">
              <img src={c.photo} alt={c.label} className="w-full h-[60px] object-cover" loading="lazy" />
              <p className="p-2 text-[11px] font-bold text-[#111]">{c.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Annonces motos</h2>
        <div className="mt-3 space-y-3">
          {ANNONCES.map((a) => (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="relative h-[130px]">
                <img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" />
                <button className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"><Heart size={14} className="text-[#6B7280]" /></button>
                <span className="absolute top-2 left-2 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white">{a.cat}</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{a.annee} · {a.km.toLocaleString("fr-FR")} km</p>
                <p className="mt-2 text-lg font-black text-red-600">{a.prix.toLocaleString("fr-FR")} €</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
