import { Link } from "react-router-dom";
import { ChevronLeft, Building2, ChevronRight, Users, Car } from "lucide-react";
const GARAGES = [
  { nom: "MKA.P-MS Paris 11e", vehicules: 12, employes: 6, ca: "42 500 €" },
  { nom: "MKA.P-MS Lyon 3e", vehicules: 8, employes: 4, ca: "28 000 €" },
  { nom: "MKA.P-MS Marseille", vehicules: 5, employes: 3, ca: "18 500 €" },
];
export default function MultiGarages() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} className="text-[#D4AF37]" /> Multi-garages</h1></div>
      <div className="px-4 mt-4 space-y-2">{GARAGES.map(g => (
        <div key={g.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111]">{g.nom}</h3>
          <div className="mt-1.5 grid grid-cols-3 gap-2 text-center text-[10px]"><div><p className="text-[#6B7280]">Véhicules</p><p className="font-bold text-[#D4AF37]">{g.vehicules}</p></div><div><p className="text-[#6B7280]">Employés</p><p className="font-bold">{g.employes}</p></div><div><p className="text-[#6B7280]">CA/mois</p><p className="font-bold text-green-600">{g.ca}</p></div></div>
        </div>))}</div>
    </div>
  );
}
