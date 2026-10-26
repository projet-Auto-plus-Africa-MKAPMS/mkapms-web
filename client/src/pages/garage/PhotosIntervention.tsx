import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Camera, Check } from "lucide-react";
const PHASES = [
  { label: "Avant intervention", photos: 3 },
  { label: "Pendant intervention", photos: 2 },
  { label: "Après intervention", photos: 0 },
];
export default function PhotosIntervention() {
  const [captures, setCaptures] = useState<boolean[][]>(() =>
    PHASES.map((p) => Array.from({ length: 4 }, (_, i) => i < p.photos))
  );

  const togglePhoto = (phaseIdx: number, slotIdx: number) => {
    setCaptures((prev) =>
      prev.map((slots, pi) => (pi === phaseIdx ? slots.map((v, si) => (si === slotIdx ? !v : v)) : slots))
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Camera size={20} className="text-[#D4AF37]" /> Photos intervention</h1></div>
      <div className="px-4 mt-4 space-y-3">{PHASES.map((p, phaseIdx) => {
        const slots = captures[phaseIdx];
        const done = slots.every(Boolean);
        return (
        <div key={p.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{p.label}</h3>{done ? <Check size={14} className="text-green-600" /> : <span className="text-[9px] text-amber-600 font-bold">En attente</span>}</div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">{slots.map((captured, slotIdx) => (
            <button
              key={slotIdx}
              onClick={() => togglePhoto(phaseIdx, slotIdx)}
              aria-label={`Photo ${slotIdx + 1} — ${p.label}${captured ? " (prise)" : ""}`}
              className={`rounded-lg py-5 flex items-center justify-center ${captured ? "bg-[#D4AF37]/10 border border-[#D4AF37]/30" : "border-2 border-dashed border-[#E5E7EB]"}`}
            >{captured ? <Check size={12} className="text-[#D4AF37]" /> : <Camera size={12} className="text-[#9CA3AF]" />}</button>))}</div>
        </div>);
      })}</div>
    </div>
  );
}
