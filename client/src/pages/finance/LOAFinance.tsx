import { Link } from "react-router-dom";
import { ChevronLeft, Clock, Euro } from "lucide-react";
const DETAILS = [{ l: "Prix véhicule", v: "25 000 €" }, { l: "Apport", v: "5 000 €" }, { l: "Durée", v: "48 mois" }, { l: "Mensualité", v: "350 €/mois" }, { l: "Valeur finale", v: "8 000 €" }];
export default function LOAFinance() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-purple-700 px-4 pt-6 pb-5"><Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} /> LOA</h1><p className="mt-1 text-sm text-white/80">Location avec Option d'Achat</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">{DETAILS.map(d => (<div key={d.l} className="flex justify-between py-2 border-b border-[#F3F4F6] last:border-0 text-sm"><span className="text-[#6B7280]">{d.l}</span><span className="font-bold text-[#111]">{d.v}</span></div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl bg-purple-700 py-3 text-sm font-bold text-white active:scale-[0.98]">Simuler ma LOA</button></div>
    </div>
  );
}
