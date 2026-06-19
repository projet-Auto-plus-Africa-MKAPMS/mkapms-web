import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Calendar, Clock, MapPin, Check } from "lucide-react";
const GARAGES = ["MKA.P-MS Paris 11e", "MKA.P-MS Lyon 3e", "MKA.P-MS Marseille"];
const CRENEAUX = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
export default function PriseRendezVous() {
  const [selectedGarage, setSelectedGarage] = useState(0);
  const [selectedCreneau, setSelectedCreneau] = useState<string|null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Rendez-vous</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111]">Choisir un garage</h3>
        {GARAGES.map((g, i) => (<button key={g} onClick={() => setSelectedGarage(i)} className={`w-full rounded-lg p-3 flex items-center gap-2 border-2 ${selectedGarage === i ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}><MapPin size={14} className={selectedGarage === i ? "text-[#D4AF37]" : "text-[#9CA3AF]"} /><span className="text-sm text-[#111]">{g}</span></button>))}
        <h3 className="text-sm font-bold text-[#111] pt-2">Date</h3>
        <input type="date" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
        <h3 className="text-sm font-bold text-[#111]">Créneau</h3>
        <div className="flex flex-wrap gap-1.5">{CRENEAUX.map(c => (<button key={c} onClick={() => setSelectedCreneau(c)} className={`rounded-lg px-3 py-2 text-xs font-bold ${selectedCreneau === c ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#111]"}`}>{c}</button>))}</div>
        <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Confirmer le rendez-vous</button>
      </div>
    </div>
  );
}
