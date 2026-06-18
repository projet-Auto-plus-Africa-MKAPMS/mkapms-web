import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Clock, Check, Euro, Shield } from "lucide-react";
const DUREES = [{ label: "24 heures", prix: "Gratuit" }, { label: "48 heures", prix: "50 €" }, { label: "72 heures", prix: "100 €" }, { label: "7 jours", prix: "200 €" }];
export default function CentreReservationAchat() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-[#D4AF37]" /> Réservation d'achat</h1></div>
      <div className="px-4 mt-4 space-y-2">{DUREES.map((d, i) => (
        <button key={i} onClick={() => setSelected(i)} className={`w-full rounded-xl p-4 flex items-center gap-3 border-2 transition ${selected === i ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] bg-white"}`}>
          <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selected === i ? "border-[#D4AF37] bg-[#D4AF37]" : "border-[#D4D4D4]"}`}>{selected === i && <Check size={10} className="text-white" />}</span>
          <span className="flex-1 text-sm font-bold text-[#111]">{d.label}</span><span className="text-sm font-bold text-[#D4AF37]">{d.prix}</span>
        </button>))}</div>
      <div className="px-4 mt-4"><button className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white active:scale-[0.98]">Réserver ce véhicule</button></div>
    </div>
  );
}
