import { Link } from "react-router-dom";
import { Car, Bike, Truck, Bus, Package, Home, ChevronRight, Plus, Sparkles } from "lucide-react";

const TYPES = [
  { label: "Vente véhicule", icon: Car, color: "#8B5CF6", to: "/depot-annonce/identification-vehicule" },
  { label: "Vente moto", icon: Bike, color: "#EF4444", to: "/depot-annonce/identification-vehicule" },
  { label: "Vente utilitaire", icon: Truck, color: "#F59E0B", to: "/depot-annonce/identification-vehicule" },
  { label: "Vente camion", icon: Bus, color: "#3B82F6", to: "/depot-annonce/identification-vehicule" },
  { label: "Location particulier", icon: Home, color: "#10B981", to: "/depot-annonce/identification-vehicule" },
  { label: "Location professionnel", icon: Home, color: "#14B8A6", to: "/depot-annonce/identification-vehicule" },
  { label: "Location VTC", icon: Car, color: "#D4AF37", to: "/depot-annonce/identification-vehicule" },
  { label: "Location Taxi", icon: Car, color: "#6366F1", to: "/depot-annonce/identification-vehicule" },
  { label: "Vente pièces détachées", icon: Package, color: "#EC4899", to: "/depot-annonce/identification-vehicule" },
];

export default function DepotAnnoncePortail() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Plus size={22} className="text-[#D4AF37]" /> Déposer une annonce</h1>
        <p className="mt-1 text-xs text-white/50">Publication en moins de 5 minutes · Contrôle IA automatique</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3 mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-[#D4AF37] shrink-0" />
        <p className="text-[10px] text-[#374151]"><span className="font-bold text-[#D4AF37]">Annonce complète en 5 min</span> — Photos guidées, identification auto par plaque, contrôle IA, publication instantanée.</p>
      </div>
      <div className="px-4">
        <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Quel type d'annonce ?</h2>
        <div className="space-y-2">
          {TYPES.map(t => { const Icon = t.icon; return (
            <Link key={t.label} to={t.to} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3.5 shadow-sm active:scale-[0.99]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: t.color + "15" }}><Icon size={18} style={{ color: t.color }} /></div>
              <span className="flex-1 text-sm font-semibold text-[#111]">{t.label}</span>
              <ChevronRight size={14} className="text-red-500" />
            </Link>); })}
        </div>
      </div>
    </div>
  );
}
