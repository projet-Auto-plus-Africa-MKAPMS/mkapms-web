import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Calendar, Clock, Wrench, Euro } from "lucide-react";
const INTERVENTIONS = ["Révision", "Vidange", "Freinage", "Distribution", "Embrayage", "Climatisation", "Diagnostic", "Pneus"];
const CRENEAUX = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
export default function ReservationAtelier() {
  const [selectedInt, setSelectedInt] = useState<string|null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Réservation atelier</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111]">Intervention</h3>
        <div className="flex flex-wrap gap-1.5">{INTERVENTIONS.map(i => (<button key={i} onClick={() => setSelectedInt(i)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedInt === i ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#111]"}`}>{i}</button>))}</div>
        <h3 className="text-sm font-bold text-[#111]">Date</h3><input type="date" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
        <h3 className="text-sm font-bold text-[#111]">Créneau</h3><div className="flex flex-wrap gap-1.5">{CRENEAUX.map(c => (<button key={c} className="rounded-lg bg-[#F5F3EF] px-3 py-2 text-xs font-bold text-[#111]">{c}</button>))}</div>
        <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Réserver et payer</button>
      </div>
    </div>
  );
}
