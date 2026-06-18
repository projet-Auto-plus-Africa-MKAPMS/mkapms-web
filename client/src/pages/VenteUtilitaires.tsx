import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, Truck, Heart, Star, ChevronDown } from "lucide-react";

const CATEGORIES = [
  { label: "Kangoo / Berlingo / Partner", photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=300&h=200&fit=crop" },
  { label: "Trafic / Vivaro / Transit", photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=300&h=200&fit=crop" },
  { label: "Master / Boxer / Ducato", photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=300&h=200&fit=crop" },
];

const ANNONCES = [
  { id: 1, nom: "Renault Kangoo Van", annee: 2023, km: 35000, prix: 14500, volume: "3.3 m³", charge: "650 kg", photo: "https://images.unsplash.com/photo-1549194898-60fd030ecc0f?w=400&h=260&fit=crop" },
  { id: 2, nom: "Citroën Berlingo Van M", annee: 2022, km: 48000, prix: 13200, volume: "3.8 m³", charge: "750 kg", photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop" },
  { id: 3, nom: "Renault Master L2H2", annee: 2021, km: 82000, prix: 18500, volume: "10.8 m³", charge: "1 400 kg", photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop" },
  { id: 4, nom: "Ford Transit Custom L2", annee: 2023, km: 28000, prix: 24900, volume: "6.8 m³", charge: "1 100 kg", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop" },
];

export default function VenteUtilitaires() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-orange-600 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2">UTILITAIRES</span>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} /> Achat Utilitaires</h1>
        <p className="mt-1 text-sm text-white/80">Kangoo, Berlingo, Partner, Trafic, Master, Boxer</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mx-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5">
          <Search size={14} className="text-[#6B7280]" />
          <input type="text" placeholder="Marque, modèle, volume…" className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Catégories</h2>
        <div className="mt-3 space-y-2">
          {CATEGORIES.map((c) => (
            <button key={c.label} className="w-full flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 active:scale-[0.99]">
              <img src={c.photo} alt="" className="w-16 h-11 rounded-lg object-cover" /><span className="text-sm font-bold text-[#111]">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Annonces utilitaires</h2>
        <div className="mt-3 space-y-3">
          {ANNONCES.map((a) => (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="relative h-[130px]">
                <img src={a.photo} alt={a.nom} className="w-full h-full object-cover" loading="lazy" />
                <button className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"><Heart size={14} /></button>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-[#111]">{a.nom}</h3>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{a.annee} · {a.km.toLocaleString("fr-FR")} km</p>
                <div className="mt-1 flex gap-2 text-[10px]"><span className="rounded bg-orange-50 px-1.5 py-0.5 font-semibold text-orange-700">{a.volume}</span><span className="rounded bg-orange-50 px-1.5 py-0.5 font-semibold text-orange-700">{a.charge}</span></div>
                <p className="mt-2 text-lg font-black text-orange-600">{a.prix.toLocaleString("fr-FR")} €</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
