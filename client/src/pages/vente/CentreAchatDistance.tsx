import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Globe, Check, Euro, FileText, Truck } from "lucide-react";
const ETAPES = [{ label: "Réserver le véhicule", icon: Check }, { label: "Payer en ligne", icon: Euro }, { label: "Signer numériquement", icon: FileText }, { label: "Organiser la livraison", icon: Truck }];
export default function CentreAchatDistance() {
  const [etapeActuelle, setEtapeActuelle] = useState(2);
  const avancer = () => setEtapeActuelle((prev) => Math.min(prev + 1, ETAPES.length));
  const termine = etapeActuelle >= ETAPES.length;
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Globe size={20} className="text-[#D4AF37]" /> Achat à distance</h1><p className="mt-1 text-sm text-white/60">Achetez sans vous déplacer</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">{ETAPES.map((e, i) => { const Icon = e.icon; const done = i < etapeActuelle; return (
        <div key={i} className="flex items-start gap-3"><div className="flex flex-col items-center"><div className={`h-8 w-8 rounded-full flex items-center justify-center ${done ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`}><Icon size={14} className={done ? "text-white" : "text-[#9CA3AF]"} /></div>{i < ETAPES.length - 1 && <div className={`w-0.5 h-6 ${done ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />}</div><p className={`text-sm pb-4 ${done ? "font-bold text-[#111]" : "text-[#9CA3AF]"}`}>{e.label}</p></div>); })}</div>
      <div className="px-4 mt-4">
        <button onClick={avancer} disabled={termine} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50">
          {termine ? "Achat finalisé ✓" : "Continuer mon achat"}
        </button>
        {termine && <p className="mt-2 text-xs text-green-600 text-center font-semibold">Toutes les étapes de l'achat à distance sont validées.</p>}
      </div>
    </div>
  );
}
