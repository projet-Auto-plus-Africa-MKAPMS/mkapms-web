import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, ChevronLeft, Car, Key, Wrench, Gavel, Trash2,
  MapPin, Star, Eye, Calendar, Paintbrush
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   HISTORIQUE UTILISATEUR — Dernieres consultations
   Vehicules vus, garages vus, locations vues, encheres vues
   Sans refaire la recherche.
   ══════════════════════════════════════════════════════════════════════════ */

type ConsultUnivers = "vehicule" | "location" | "garage" | "enchere" | "carrosserie";

interface ConsultItem {
  id: number;
  nom: string;
  univers: ConsultUnivers;
  photo: string;
  to: string;
  date: string;
  details?: string;
  prix?: string;
  ville?: string;
}

const HISTORY_DATA: ConsultItem[] = [
  { id: 1, nom: "Peugeot 3008 GT Hybrid", univers: "vehicule", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=260&fit=crop", to: "/vehicule/1", date: "Aujourd'hui, 14h32", details: "2024 . Hybride . 15 000 km", prix: "28 500 EUR", ville: "Paris" },
  { id: 2, nom: "Mercedes Classe E Break", univers: "location", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=260&fit=crop", to: "/louer/vtc-taxi/vehicule/9201", date: "Aujourd'hui, 13h15", details: "VTC & Taxi . 5 places", prix: "63 EUR/jour", ville: "Paris" },
  { id: 3, nom: "Garage Auto Express", univers: "garage", photo: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=400&h=260&fit=crop", to: "/garages", date: "Aujourd'hui, 11h45", details: "Mecanique generale . Diagnostic", ville: "Paris 12e" },
  { id: 4, nom: "BMW Serie 3 320i", univers: "vehicule", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=260&fit=crop", to: "/vehicule/3", date: "Hier, 18h20", details: "2024 . Essence . 8 000 km", prix: "32 000 EUR", ville: "Marseille" },
  { id: 5, nom: "Lot #127 Peugeot 208 + Citroen C3", univers: "enchere", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=260&fit=crop", to: "/acheter/encheres", date: "Hier, 16h00", details: "Lot pro . 2 vehicules . Reprise", prix: "A partir de 4 500 EUR", ville: "Rungis" },
  { id: 6, nom: "Carrosserie Saint-Denis", univers: "carrosserie", photo: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400&h=260&fit=crop", to: "/carrosserie", date: "Hier, 14h30", details: "Peinture . Debosselage . Marbre", ville: "Saint-Denis" },
  { id: 7, nom: "Tesla Model 3 Long Range", univers: "vehicule", photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=260&fit=crop", to: "/vehicule/4", date: "Il y a 2 jours", details: "2024 . Electrique . 12 000 km", prix: "38 900 EUR", ville: "Lyon" },
  { id: 8, nom: "Renault Clio V", univers: "location", photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=400&h=260&fit=crop", to: "/louer/particulier/vehicule/1", date: "Il y a 2 jours", details: "Particulier . 5 places . Essence", prix: "28 EUR/jour", ville: "Bordeaux" },
  { id: 9, nom: "Garage Premium Motors", univers: "garage", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=260&fit=crop", to: "/garages", date: "Il y a 3 jours", details: "Specialiste BMW / Mercedes", ville: "Boulogne" },
  { id: 10, nom: "Audi A4 40 TDI", univers: "vehicule", photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=260&fit=crop", to: "/vehicule/5", date: "Il y a 4 jours", details: "2023 . Diesel . 18 000 km", prix: "34 500 EUR", ville: "Toulouse" },
];

const UNIVERS_CFG: Record<ConsultUnivers, { label: string; icon: typeof Car; color: string }> = {
  vehicule: { label: "Vehicules", icon: Car, color: "bg-blue-600 text-white" },
  location: { label: "Locations", icon: Key, color: "bg-[#D4AF37] text-white" },
  garage: { label: "Garages", icon: Wrench, color: "bg-green-600 text-white" },
  enchere: { label: "Encheres", icon: Gavel, color: "bg-[#111] text-[#D4AF37]" },
  carrosserie: { label: "Carrosserie", icon: Paintbrush, color: "bg-purple-600 text-white" },
};

export default function HistoriqueConsultations() {
  const [history, setHistory] = useState(HISTORY_DATA);
  const [filter, setFilter] = useState<ConsultUnivers | "tous">("tous");

  const filtered = filter === "tous" ? history : history.filter((h) => h.univers === filter);
  const clearAll = () => setHistory([]);
  const remove = (id: number) => setHistory(history.filter((h) => h.id !== id));

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-[#D4AF37]" /> Dernieres consultations</h1>
            <p className="mt-1 text-sm text-white/60">{history.length} element{history.length > 1 ? "s" : ""} consulte{history.length > 1 ? "s" : ""}</p>
          </div>
          {history.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
              <Trash2 size={12} /> Effacer tout
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={() => setFilter("tous")} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === "tous" ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
          Tous ({history.length})
        </button>
        {(Object.keys(UNIVERS_CFG) as ConsultUnivers[]).map((u) => {
          const cfg = UNIVERS_CFG[u];
          const Icon = cfg.icon;
          const count = history.filter((h) => h.univers === u).length;
          if (count === 0) return null;
          return (
            <button key={u} onClick={() => setFilter(u)} className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === u ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={12} /> {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div className="px-4 mt-4 space-y-2">
        {filtered.map((h) => {
          const cfg = UNIVERS_CFG[h.univers];
          const Icon = cfg.icon;
          return (
            <Link key={h.id} to={h.to} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 hover:border-[#D4AF37] transition group">
              <div className="relative w-20 h-14 shrink-0 rounded-lg overflow-hidden">
                <img src={h.photo} alt={h.nom} className="w-full h-full object-cover" loading="lazy" />
                <span className={`absolute bottom-0 left-0 right-0 text-center py-0.5 text-[8px] font-bold ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#111] truncate">{h.nom}</p>
                {h.details && <p className="text-[11px] text-slate-500 truncate">{h.details}</p>}
                <div className="mt-1 flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                  <span className="flex items-center gap-0.5"><Eye size={9} /> {h.date}</span>
                  {h.ville && <span className="flex items-center gap-0.5"><MapPin size={9} /> {h.ville}</span>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {h.prix && <p className="text-sm font-bold text-[#D4AF37]">{h.prix}</p>}
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(h.id); }} className="mt-1 text-[10px] text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Clock size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune consultation recente</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Vos dernieres recherches apparaitront ici</p>
          <Link to="/acheter" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white">Explorer</Link>
        </div>
      )}
    </div>
  );
}
