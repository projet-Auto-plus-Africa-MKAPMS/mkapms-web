import { Link } from "react-router-dom";
import { ChevronLeft, Globe, Check, Euro, FileText, Truck } from "lucide-react";
const ETAPES = [{ label: "Réserver le véhicule", icon: Check, done: true }, { label: "Payer en ligne", icon: Euro, done: true }, { label: "Signer numériquement", icon: FileText, done: false }, { label: "Organiser la livraison", icon: Truck, done: false }];
export default function CentreAchatDistance() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Globe size={20} className="text-[#D4AF37]" /> Achat à distance</h1><p className="mt-1 text-sm text-white/60">Achetez sans vous déplacer</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">{ETAPES.map((e, i) => { const Icon = e.icon; return (
        <div key={i} className="flex items-start gap-3"><div className="flex flex-col items-center"><div className={`h-8 w-8 rounded-full flex items-center justify-center ${e.done ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`}><Icon size={14} className={e.done ? "text-white" : "text-red-500"} /></div>{i < ETAPES.length - 1 && <div className={`w-0.5 h-6 ${e.done ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />}</div><p className={`text-sm pb-4 ${e.done ? "font-bold text-[#111]" : "text-red-500"}`}>{e.label}</p></div>); })}</div>
      <div className="px-4 mt-4"><button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Continuer mon achat</button></div>
    </div>
  );
}
