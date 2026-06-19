import { Link } from "react-router-dom";
import { ChevronLeft, Camera, Check, Clock } from "lucide-react";
const DOSSIERS = [
  { vehicule: "Peugeot 3008 GT", or: "OR-2025-0142", avant: 5, pendant: 3, apres: 4 },
  { vehicule: "BMW 320d", or: "OR-2025-0138", avant: 4, pendant: 2, apres: 0 },
];
export default function PhotosTechniques() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Camera size={20} className="text-[#D4AF37]" /> Photos techniques</h1></div>
      <div className="px-4 mt-4 space-y-3">{DOSSIERS.map(d => (
        <div key={d.or} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111]">{d.vehicule}</h3><p className="text-[9px] text-[#6B7280]">{d.or}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">{[{l:"Avant",n:d.avant},{l:"Pendant",n:d.pendant},{l:"Après",n:d.apres}].map(p => (
            <div key={p.l} className={`rounded-lg py-3 ${p.n > 0 ? "bg-[#D4AF37]/10 border border-[#D4AF37]/30" : "border-2 border-dashed border-[#E5E7EB]"}`}><Camera size={14} className={`mx-auto ${p.n > 0 ? "text-[#D4AF37]" : "text-[#9CA3AF]"}`} /><p className="text-[9px] font-bold mt-1">{p.l}: {p.n}</p></div>))}</div>
        </div>))}</div>
    </div>
  );
}
