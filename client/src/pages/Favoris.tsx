import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ChevronLeft, Trash2, Star, Calendar, Gauge, Users,
  Car, Wrench, Key, Gavel, Settings, MapPin, Clock,
  ShoppingBag, Paintbrush
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   FAVORIS UNIVERSELS
   L'utilisateur enregistre : véhicules, locations, garages, carrosseries,
   enchères, pièces détachées — tout centralisé.
   ══════════════════════════════════════════════════════════════════════════ */

type FavUnivers = "vehicule" | "location" | "garage" | "carrosserie" | "enchere" | "piece";

interface FavItem {
  id: number;
  nom: string;
  univers: FavUnivers;
  prix: string;
  photo: string;
  to: string;
  ajouteLe: string;
  note?: number;
  details?: string;
  ville?: string;
}

const FAVORIS_DATA: FavItem[] = [
  // Véhicules
  { id: 1, nom: "Peugeot 3008 GT", univers: "vehicule", prix: "28 500 \u20ac", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop", to: "/vehicule/1", ajouteLe: "Il y a 2 jours", note: 4.7, details: "2024 \u00b7 Hybride \u00b7 15 000 km", ville: "Paris" },
  { id: 2, nom: "Mercedes Classe C 220d", univers: "vehicule", prix: "35 900 \u20ac", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", to: "/vehicule/2", ajouteLe: "Il y a 3 jours", note: 4.8, details: "2023 \u00b7 Diesel \u00b7 22 000 km", ville: "Lyon" },
  { id: 3, nom: "BMW S\u00e9rie 3 320i", univers: "vehicule", prix: "32 000 \u20ac", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", to: "/vehicule/3", ajouteLe: "Il y a 5 jours", note: 4.9, details: "2024 \u00b7 Essence \u00b7 8 000 km", ville: "Marseille" },
  // Locations
  { id: 4, nom: "Mercedes Classe E Break", univers: "location", prix: "63 \u20ac/jour", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", to: "/louer/vtc-taxi/vehicule/9201", ajouteLe: "Il y a 2 jours", note: 4.8, details: "VTC & Taxi \u00b7 5 places \u00b7 Diesel", ville: "Paris" },
  { id: 5, nom: "Renault Clio V", univers: "location", prix: "28 \u20ac/jour", photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=400&h=260&fit=crop", to: "/louer/particulier/vehicule/1", ajouteLe: "Il y a 4 jours", note: 4.5, details: "Particulier \u00b7 5 places \u00b7 Essence", ville: "Bordeaux" },
  // Garages
  { id: 6, nom: "Garage Auto Express", univers: "garage", prix: "Devis gratuit", photo: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=400&h=260&fit=crop", to: "/garages", ajouteLe: "Il y a 1 semaine", note: 4.6, details: "M\u00e9canique g\u00e9n\u00e9rale \u00b7 Diagnostic", ville: "Paris 12e" },
  { id: 7, nom: "Garage Premium Motors", univers: "garage", prix: "Devis gratuit", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop", to: "/garages", ajouteLe: "Il y a 1 semaine", note: 4.9, details: "Sp\u00e9cialiste BMW / Mercedes", ville: "Boulogne" },
  // Carrosseries
  { id: 8, nom: "Carrosserie Saint-Denis", univers: "carrosserie", prix: "Devis gratuit", photo: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&h=260&fit=crop", to: "/carrosserie", ajouteLe: "Il y a 3 jours", note: 4.7, details: "Peinture \u00b7 D\u00e9bosselage \u00b7 Marbre", ville: "Saint-Denis" },
  // Enchères
  { id: 9, nom: "Lot #127 \u2014 Peugeot 208 + Citro\u00ebn C3", univers: "enchere", prix: "\u00c0 partir de 4 500 \u20ac", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop", to: "/encheres", ajouteLe: "Il y a 1 jour", details: "Lot pro \u00b7 2 v\u00e9hicules \u00b7 Reprise", ville: "Rungis" },
  { id: 10, nom: "Lot #134 \u2014 Renault Trafic", univers: "enchere", prix: "\u00c0 partir de 6 200 \u20ac", photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&h=260&fit=crop", to: "/encheres", ajouteLe: "Il y a 2 jours", details: "Flotte location \u00b7 1 v\u00e9hicule \u00b7 Amorti", ville: "Gennevilliers" },
  // Pièces
  { id: 11, nom: "Kit freins ATE C\u00e9ramique", univers: "piece", prix: "189 \u20ac", photo: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=260&fit=crop", to: "/pieces", ajouteLe: "Il y a 6 jours", details: "Freinage \u00b7 Compatible BMW S\u00e9rie 3", ville: "Stock France" },
];

const UNIVERS_CONFIG: Record<FavUnivers, { label: string; icon: typeof Car; color: string }> = {
  vehicule: { label: "V\u00e9hicules", icon: Car, color: "bg-blue-600 text-white" },
  location: { label: "Locations", icon: Key, color: "bg-[#D4AF37] text-white" },
  garage: { label: "Garages", icon: Wrench, color: "bg-green-600 text-white" },
  carrosserie: { label: "Carrosserie", icon: Paintbrush, color: "bg-purple-600 text-white" },
  enchere: { label: "Ench\u00e8res", icon: Gavel, color: "bg-[#111] text-[#D4AF37]" },
  piece: { label: "Pi\u00e8ces", icon: Settings, color: "bg-orange-600 text-white" },
};

export default function Favoris() {
  const [favoris, setFavoris] = useState(FAVORIS_DATA);
  const [filter, setFilter] = useState<FavUnivers | "tous">("tous");

  const counts = {
    tous: favoris.length,
    vehicule: favoris.filter((f) => f.univers === "vehicule").length,
    location: favoris.filter((f) => f.univers === "location").length,
    garage: favoris.filter((f) => f.univers === "garage").length,
    carrosserie: favoris.filter((f) => f.univers === "carrosserie").length,
    enchere: favoris.filter((f) => f.univers === "enchere").length,
    piece: favoris.filter((f) => f.univers === "piece").length,
  };

  const filtered = filter === "tous" ? favoris : favoris.filter((f) => f.univers === filter);
  const remove = (id: number) => setFavoris(favoris.filter((f) => f.id !== id));

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Heart size={20} className="text-red-400" fill="currentColor" /> Mes favoris</h1>
        <p className="mt-1 text-sm text-white/60">{favoris.length} \u00e9l\u00e9ment{favoris.length > 1 ? "s" : ""} sauvegard\u00e9{favoris.length > 1 ? "s" : ""}</p>
      </div>

      {/* Filtres universels */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => setFilter("tous")} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === "tous" ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
          Tous ({counts.tous})
        </button>
        {(Object.keys(UNIVERS_CONFIG) as FavUnivers[]).map((u) => {
          const cfg = UNIVERS_CONFIG[u];
          const Icon = cfg.icon;
          return (
            <button key={u} onClick={() => setFilter(u)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === u ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {cfg.label} ({counts[u]})
            </button>
          );
        })}
      </div>

      {/* Liste des favoris */}
      <div className="px-4 mt-4 space-y-3">
        {filtered.map((f) => {
          const cfg = UNIVERS_CONFIG[f.univers];
          return (
            <div key={f.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="relative h-[150px]">
                <img src={f.photo} alt={f.nom} className="w-full h-full object-cover" loading="lazy" />
                <span className={`absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[9px] font-bold ${cfg.color}`}>{cfg.label}</span>
                <button onClick={() => remove(f.id)} className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur">
                  <Heart size={16} className="text-red-500 fill-red-500" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#111]">{f.nom}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#6B7280]">
                  {f.details && <span className="flex items-center gap-1"><Gauge size={10} /> {f.details}</span>}
                  {f.ville && <span className="flex items-center gap-1"><MapPin size={10} /> {f.ville}</span>}
                  {f.note && <span className="flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> {f.note}</span>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-black text-[#D4AF37]">{f.prix}</span>
                  <Link to={f.to} className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white active:scale-[0.98] transition">
                    Voir
                  </Link>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[10px] text-[#9CA3AF] flex items-center gap-1"><Clock size={10} /> Ajout\u00e9 {f.ajouteLe}</p>
                  <button onClick={() => remove(f.id)} className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1"><Trash2 size={10} /> Retirer</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Heart size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun favori {filter !== "tous" ? `dans ${UNIVERS_CONFIG[filter].label}` : ""}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Parcourez la plateforme et ajoutez vos \u00e9l\u00e9ments pr\u00e9f\u00e9r\u00e9s en favori</p>
          <Link to="/" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white">Explorer MKA.P-MS</Link>
        </div>
      )}
    </div>
  );
}
