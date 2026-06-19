import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ChevronLeft, Trash2, Star, Calendar, Gauge, Users,
  Car, Shield, Truck, Bus
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   FAVORIS
   Le client sauvegarde ses véhicules préférés pour les retrouver facilement.
   ══════════════════════════════════════════════════════════════════════════ */

const FAVORIS_DATA = [
  { id: 1, nom: "Mercedes Classe E Break", univers: "VTC & Taxi", prix: 63, note: 4.8, annee: 2024, carburant: "Diesel", places: 5, photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", to: "/louer/vtc-taxi/vehicule/9201", ajouteLe: "Il y a 2 jours" },
  { id: 2, nom: "Peugeot 3008 GT", univers: "Particulier", prix: 52, note: 4.7, annee: 2024, carburant: "Hybride", places: 5, photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop", to: "/louer/particulier/vehicule/1", ajouteLe: "Il y a 3 jours" },
  { id: 3, nom: "Renault Trafic L2H1", univers: "Pro", prix: 55, note: 4.5, annee: 2024, carburant: "Diesel", places: 3, photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop", to: "/louer/pro", ajouteLe: "Il y a 5 jours" },
  { id: 4, nom: "BMW Série 5 530e", univers: "VTC & Taxi", prix: 140, note: 4.9, annee: 2024, carburant: "Hybride", places: 5, photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", to: "/louer/vtc-taxi/vehicule/9201", ajouteLe: "Il y a 1 semaine" },
  { id: 5, nom: "Mercedes Sprinter 9 pl.", univers: "Minibus", prix: 120, note: 4.6, annee: 2023, carburant: "Diesel", places: 9, photo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=260&fit=crop", to: "/louer/minibus", ajouteLe: "Il y a 1 semaine" },
];

const UNIVERS_COLORS: Record<string, string> = {
  "VTC & Taxi": "bg-[#111] text-[#D4AF37]",
  "Particulier": "bg-[#D4AF37] text-white",
  "Pro": "bg-blue-800 text-white",
  "Minibus": "bg-purple-700 text-white",
};

export default function Favoris() {
  const [favoris, setFavoris] = useState(FAVORIS_DATA);
  const [filter, setFilter] = useState("tous");

  const univers = ["tous", ...new Set(FAVORIS_DATA.map((f) => f.univers))];
  const filtered = filter === "tous" ? favoris : favoris.filter((f) => f.univers === filter);

  const remove = (id: number) => setFavoris(favoris.filter((f) => f.id !== id));

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Heart size={20} className="text-red-400" fill="currentColor" /> Mes favoris</h1>
        <p className="mt-1 text-sm text-white/60">{favoris.length} véhicule{favoris.length > 1 ? "s" : ""} sauvegardé{favoris.length > 1 ? "s" : ""}</p>
      </div>

      {/* Filter */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {univers.map((u) => (
          <button key={u} onClick={() => setFilter(u)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === u ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {u === "tous" ? "Tous" : u}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {filtered.map((f) => (
          <div key={f.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="relative h-[150px]">
              <img src={f.photo} alt={f.nom} className="w-full h-full object-cover" loading="lazy" />
              <span className={`absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[9px] font-bold ${UNIVERS_COLORS[f.univers] || "bg-[#111] text-white"}`}>{f.univers}</span>
              <button onClick={() => remove(f.id)} className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur">
                <Heart size={16} className="text-red-500 fill-red-500" />
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-base font-bold text-[#111]">{f.nom}</h3>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-[#6B7280]">
                <span className="flex items-center gap-1"><Calendar size={10} /> {f.annee}</span>
                <span className="flex items-center gap-1"><Gauge size={10} /> {f.carburant}</span>
                <span className="flex items-center gap-1"><Users size={10} /> {f.places} pl.</span>
                <span className="flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> {f.note}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-[#D4AF37]">{f.prix} €</span>
                  <span className="text-xs text-[#6B7280]"> / jour</span>
                </div>
                <Link to={f.to} className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white active:scale-[0.98] transition">
                  Voir
                </Link>
              </div>
              <p className="mt-2 text-[10px] text-red-500">Ajouté {f.ajouteLe}</p>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Heart size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun favori</p>
          <p className="text-xs text-red-500 mt-1">Parcourez les véhicules et ajoutez-les en favori</p>
          <Link to="/louer" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white">Voir les véhicules</Link>
        </div>
      )}
    </div>
  );
}
