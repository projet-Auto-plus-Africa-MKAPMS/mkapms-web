import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Home, Building2, Train, Plane, MapPin } from "lucide-react";
const POINTS = [
  { label: "Domicile", icon: Home, prix: "350 €", delai: "3-5 jours" },
  { label: "Entreprise", icon: Building2, prix: "300 €", delai: "3-5 jours" },
  { label: "Gare", icon: Train, prix: "250 €", delai: "2-4 jours" },
  { label: "Aéroport", icon: Plane, prix: "400 €", delai: "2-4 jours" },
  { label: "Point partenaire", icon: MapPin, prix: "200 €", delai: "3-7 jours" },
];
export default function CentreLivraisonAcheteur() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-[#D4AF37]" /> Livraison acheteur</h1></div>
      <div className="px-4 mt-4 space-y-2">{POINTS.map(p => { const Icon = p.icon; return (
        <div key={p.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10"><Icon size={16} className="text-[#D4AF37]" /></div>
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{p.label}</h3><p className="text-[10px] text-[#6B7280]">{p.delai}</p></div>
          <span className="text-sm font-bold text-[#D4AF37]">{p.prix}</span>
        </div>); })}</div>
    </div>
  );
}
