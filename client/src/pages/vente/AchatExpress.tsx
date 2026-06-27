import { Link } from "react-router-dom";
import { ChevronLeft, Zap, Check, Euro, FileText, Truck } from "lucide-react";
const ETAPES = ["Sélection véhicule", "Validation documents", "Paiement sécurisé", "Organisation transport", "Confirmation"];
export default function AchatExpress() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Zap size={20} /> Achat Express</h1><p className="mt-1 text-sm text-white/80">Achat rapide pour professionnels</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">{ETAPES.map((e, i) => (<div key={i} className="flex items-start gap-3"><div className="flex flex-col items-center"><div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{i+1}</div>{i < ETAPES.length - 1 && <div className="w-0.5 h-6 bg-blue-200" />}</div><p className="text-sm text-[#111] pb-3">{e}</p></div>))}</div>
      <div className="px-4 mt-4"><button className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98]">Commencer un achat express</button></div>
    </div>
  );
}
