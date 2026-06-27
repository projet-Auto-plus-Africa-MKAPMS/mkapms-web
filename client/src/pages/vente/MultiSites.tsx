import { Link } from "react-router-dom";
import { ChevronLeft, Building2, MapPin, Package, Users, BarChart3, ChevronRight, Plus } from "lucide-react";
const SITES = [
  { nom: "Garage Paris 11e", vehicules: 12, employes: 4, ca: "85k €" },
  { nom: "Garage Lyon 3e", vehicules: 8, employes: 3, ca: "62k €" },
  { nom: "Garage Marseille", vehicules: 4, employes: 2, ca: "28k €" },
];
export default function MultiSites() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} /> Multi-Sites</h1></div>
      <div className="px-4 mt-4 space-y-2">{SITES.map(s => (
        <div key={s.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2"><MapPin size={14} className="text-blue-600" /><h3 className="text-sm font-bold text-[#111]">{s.nom}</h3></div>
          <div className="mt-2 grid grid-cols-3 gap-2"><div className="rounded-lg bg-blue-50 p-2 text-center"><p className="text-[8px] text-blue-600">Véhicules</p><p className="text-sm font-bold text-blue-700">{s.vehicules}</p></div><div className="rounded-lg bg-blue-50 p-2 text-center"><p className="text-[8px] text-blue-600">Employés</p><p className="text-sm font-bold text-blue-700">{s.employes}</p></div><div className="rounded-lg bg-blue-50 p-2 text-center"><p className="text-[8px] text-blue-600">CA mois</p><p className="text-sm font-bold text-blue-700">{s.ca}</p></div></div>
        </div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 py-3 text-sm font-bold text-blue-700 flex items-center justify-center gap-2"><Plus size={16} /> Ajouter un site</button></div>
    </div>
  );
}
