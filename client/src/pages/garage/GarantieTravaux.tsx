import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check, Clock } from "lucide-react";
const GARANTIES = [
  { reparation: "Plaquettes + disques avant", date: "15/03/2025", km: "45 218", duree: "12 mois / 20 000 km", elements: "Plaquettes, disques, montage", actif: true },
  { reparation: "Réparation direction", date: "15/03/2025", km: "45 218", duree: "6 mois / 10 000 km", elements: "Joint, crémaillère, MO", actif: true },
  { reparation: "Pneu avant droit", date: "15/03/2025", km: "45 218", duree: "2 ans usure", elements: "Pneu Michelin Primacy 4", actif: true },
];
export default function GarantieTravaux() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-green-700 px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Garantie travaux</h1></div>
      <div className="px-4 mt-4 space-y-2">{GARANTIES.map(g => (
        <div key={g.reparation} className="rounded-xl bg-white border border-green-200 p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{g.reparation}</h3>{g.actif && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-600">Active</span>}</div>
          <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-[#6B7280]"><p>Date: {g.date}</p><p>Km: {g.km}</p><p>Durée: {g.duree}</p></div>
          <p className="mt-1 text-[9px] text-green-700">Éléments couverts: {g.elements}</p>
        </div>))}</div>
    </div>
  );
}
