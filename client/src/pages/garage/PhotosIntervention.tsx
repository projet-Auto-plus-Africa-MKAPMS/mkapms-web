import { Link } from "react-router-dom";
import { ChevronLeft, Camera, Check } from "lucide-react";
const PHASES = [
  { label: "Avant intervention", photos: 3, done: true },
  { label: "Pendant intervention", photos: 2, done: true },
  { label: "Après intervention", photos: 0, done: false },
];
export default function PhotosIntervention() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Camera size={20} className="text-[#D4AF37]" /> Photos intervention</h1></div>
      <div className="px-4 mt-4 space-y-3">{PHASES.map(p => (
        <div key={p.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{p.label}</h3>{p.done ? <Check size={14} className="text-green-600" /> : <span className="text-[9px] text-amber-600 font-bold">En attente</span>}</div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">{Array.from({length: 4}, (_, i) => (
            <button key={i} className={`rounded-lg py-5 flex items-center justify-center ${i < p.photos ? "bg-[#D4AF37]/10 border border-[#D4AF37]/30" : "border-2 border-dashed border-[#E5E7EB]"}`}>{i < p.photos ? <Check size={12} className="text-[#D4AF37]" /> : <Camera size={12} className="text-red-500" />}</button>))}</div>
        </div>))}</div>
    </div>
  );
}
