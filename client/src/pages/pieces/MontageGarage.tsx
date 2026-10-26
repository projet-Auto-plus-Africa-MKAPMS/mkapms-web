import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Wrench, Calendar, MapPin, Check } from "lucide-react";
const GARAGES = ["MKA.P-MS Paris 11e", "MKA.P-MS Lyon 3e", "MKA.P-MS Marseille"];
export default function MontageGarage() {
  const [garageChoisi, setGarageChoisi] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [reserve, setReserve] = useState(false);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Montage en garage</h1><p className="mt-1 text-sm text-white/60">Connexion directe univers Garage</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111]">Choisir un garage</h3>
        {GARAGES.map(g => (
          <button
            key={g}
            onClick={() => { setGarageChoisi(g); setReserve(false); }}
            className={`w-full rounded-lg border p-3 flex items-center gap-2 text-left transition ${garageChoisi === g ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}
          >
            <MapPin size={14} className="text-[#D4AF37]" />
            <span className="text-sm text-[#111] flex-1">{g}</span>
            {garageChoisi === g && <Check size={14} className="text-[#D4AF37]" />}
          </button>
        ))}
        <h3 className="text-sm font-bold text-[#111]">Date souhaitée</h3>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setReserve(false); }} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
        <button
          onClick={() => setReserve(true)}
          disabled={!garageChoisi || !date}
          className={`w-full rounded-xl py-3 text-sm font-bold active:scale-[0.98] transition ${!garageChoisi || !date ? "bg-[#E5E7EB] text-[#9CA3AF]" : "bg-[#D4AF37] text-white"}`}
        >
          {reserve ? "Montage réservé ✓" : "Réserver le montage"}
        </button>
        {reserve && garageChoisi && (
          <p className="text-xs text-green-600 font-semibold text-center">Montage réservé chez {garageChoisi} le {date}.</p>
        )}
      </div>
    </div>
  );
}
