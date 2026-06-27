import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Plus, ChevronRight, BarChart3 } from "lucide-react";
const VEHICULES = [
  { immat: "AB-123-CD", modele: "Peugeot 3008", km: "45 000", prochainEntretien: "Sep 2025" },
  { immat: "EF-456-GH", modele: "Renault Trafic", km: "82 000", prochainEntretien: "Juil 2025" },
  { immat: "IJ-789-KL", modele: "Mercedes Sprinter", km: "120 000", prochainEntretien: "Août 2025" },
]
export default function FlottesEntreprises() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/garage/professionnel" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage Pro</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} /> Flotte entreprise</h1><p className="mt-1 text-sm text-white/80">SAS Auto+ — {VEHICULES.length} véhicules</p></div>
      <div className="px-4 mt-4 space-y-2">{VEHICULES.map(v => (
        <Link key={v.immat} to="/garage/dossiers-flottes" className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 active:scale-[0.99]">
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{v.modele}</h3><p className="text-[10px] text-[#6B7280]">{v.immat} · {v.km} km · Prochain: {v.prochainEntretien}</p></div>
          <ChevronRight size={14} className="text-red-500" />
        </Link>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 py-3 text-sm font-bold text-blue-700 flex items-center justify-center gap-2"><Plus size={16} /> Ajouter un véhicule</button></div>
    </div>
  );
}
