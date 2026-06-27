import { Link } from "react-router-dom";
import { ChevronLeft, Check, Car, Search, FileText, Euro, Wrench, Shield, Receipt, Clock } from "lucide-react";
const ETAPES = [
  { label: "Réception", icon: Car }, { label: "Diagnostic", icon: Search }, { label: "Devis", icon: FileText },
  { label: "Validation", icon: Check }, { label: "Commande pièces", icon: Clock },
  { label: "Réparation", icon: Wrench }, { label: "Contrôle qualité", icon: Shield },
  { label: "Facturation", icon: Receipt }, { label: "Restitution", icon: Car },
];
export default function ObjectifGarage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white">Workflow Garage <span className="text-[#D4AF37]">MKA.P-MS</span></h1><p className="mt-1 text-sm text-white/60">9 étapes — Sans papier, sans perte d'information</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">{ETAPES.map((e, i) => { const Icon = e.icon; return (
        <div key={i} className="flex items-start gap-3"><div className="flex flex-col items-center"><div className="h-10 w-10 rounded-full bg-[#D4AF37] flex items-center justify-center"><Icon size={16} className="text-white" /></div>{i < ETAPES.length - 1 && <div className="w-0.5 h-6 bg-[#D4AF37]/30" />}</div><div className="pb-4"><p className="text-sm font-bold text-[#111]">{e.label}</p></div></div>); })}</div>
    </div>
  );
}
