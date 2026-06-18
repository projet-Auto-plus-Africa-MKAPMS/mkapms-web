import { Link } from "react-router-dom";
import { ChevronLeft, Wrench, Calendar, MapPin, Check } from "lucide-react";
const GARAGES = ["MKA.P-MS Paris 11e", "MKA.P-MS Lyon 3e", "MKA.P-MS Marseille"];
export default function MontageGarage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Montage en garage</h1><p className="mt-1 text-sm text-white/60">Connexion directe univers Garage</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111]">Choisir un garage</h3>
        {GARAGES.map(g => (<button key={g} className="w-full rounded-lg border border-[#E5E7EB] p-3 flex items-center gap-2 text-left"><MapPin size={14} className="text-[#D4AF37]" /><span className="text-sm text-[#111]">{g}</span></button>))}
        <h3 className="text-sm font-bold text-[#111]">Date souhaitée</h3>
        <input type="date" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
        <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Réserver le montage</button>
      </div>
    </div>
  );
}
