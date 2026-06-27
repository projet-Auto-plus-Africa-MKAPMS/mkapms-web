import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Settings, Check } from "lucide-react";
const OPTIONS = [
  { label: "Réservation activée", desc: "Les acheteurs peuvent réserver directement", default: true },
  { label: "Livraison disponible", desc: "Domicile, entreprise, gare, aéroport", default: false },
  { label: "Garantie disponible", desc: "Extension de garantie proposée", default: false },
  { label: "Financement disponible", desc: "Paiement en plusieurs fois, LOA", default: false },
  { label: "Visible immédiatement", desc: "Publiée dès validation (selon règles du compte)", default: true },
];
export default function OptionsAnnonce() {
  const [opts, setOpts] = useState(OPTIONS.map(o => ({ ...o, active: o.default })));
  const toggle = (i: number) => setOpts(prev => prev.map((o, j) => j === i ? { ...o, active: !o.active } : o));
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/documents-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Documents</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Settings size={20} className="text-[#D4AF37]" /> Options</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {opts.map((o, i) => (
          <button key={o.label} onClick={() => toggle(i)} className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left ${o.active ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] bg-white"}`}>
            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${o.active ? "border-[#D4AF37] bg-[#D4AF37]" : "border-[#D4D4D4]"}`}>{o.active && <Check size={12} className="text-white" />}</div>
            <div className="flex-1"><p className="text-sm font-semibold text-[#111]">{o.label}</p><p className="text-[10px] text-[#6B7280]">{o.desc}</p></div>
          </button>))}
        <Link to="/depot-annonce/analyse-ia" className="block w-full py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold text-center mt-4">Continuer → Analyse IA</Link>
      </div>
    </div>
  );
}
