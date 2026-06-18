import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check } from "lucide-react";
const GARANTIES = [
  { duree: "3 mois", prix: "Inclus", couverture: "Moteur, boîte, direction" },
  { duree: "6 mois", prix: "290 €", couverture: "Moteur, boîte, direction, électronique" },
  { duree: "12 mois", prix: "490 €", couverture: "Mécanique complète, électronique" },
  { duree: "24 mois", prix: "790 €", couverture: "Tout inclus, pièces d'usure" },
];
export default function CentreGarantieOccasion() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Garantie occasion</h1></div>
      <div className="px-4 mt-4 space-y-2">{GARANTIES.map((g, i) => (
        <button key={i} onClick={() => setSelected(i)} className={`w-full rounded-xl p-4 text-left border-2 ${selected === i ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] bg-white"}`}>
          <div className="flex justify-between"><span className="text-sm font-bold text-[#111]">{g.duree}</span><span className="text-sm font-bold text-[#D4AF37]">{g.prix}</span></div>
          <p className="text-[10px] text-[#6B7280] mt-1">{g.couverture}</p>
        </button>))}</div>
    </div>
  );
}
