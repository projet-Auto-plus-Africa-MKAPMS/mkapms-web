import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Check, Clock, Home, Building2, Train, Plane, MapPin } from "lucide-react";
const MODES = [
  { label: "Retrait sur place", icon: MapPin, prix: "Gratuit" },
  { label: "Livraison domicile", icon: Home, prix: "350 €" },
  { label: "Livraison entreprise", icon: Building2, prix: "300 €" },
  { label: "Livraison gare", icon: Train, prix: "250 €" },
  { label: "Livraison aéroport", icon: Plane, prix: "400 €" },
];
export default function LivraisonVente() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} /> Livraison Vente</h1><p className="mt-1 text-sm text-white/80">5 modes + suivi temps réel</p></div>
      <div className="px-4 mt-4 space-y-2">{MODES.map((m) => { const Icon = m.icon; return (
        <div key={m.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50"><Icon size={16} className="text-blue-700" /></div>
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{m.label}</h3></div>
          <span className="text-sm font-bold text-blue-700">{m.prix}</span>
        </div>); })}</div>
    </div>
  );
}
