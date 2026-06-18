import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Send, Euro, Clock, Download, Check } from "lucide-react";
const ETAPES = [
  { label: "Créer", icon: FileText }, { label: "Envoyer", icon: Send }, { label: "Payer", icon: Euro },
  { label: "Suivre", icon: Clock }, { label: "Signer", icon: Check }, { label: "Télécharger", icon: Download },
];
export default function ObjectifDemarches() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white">Parcours Démarches <span className="text-[#D4AF37]">MKA.P-MS</span></h1><p className="mt-1 text-sm text-white/60">6 étapes — Sans quitter la plateforme</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">{ETAPES.map((e, i) => { const Icon = e.icon; return (
        <div key={i} className="flex items-start gap-3"><div className="flex flex-col items-center"><div className="h-10 w-10 rounded-full bg-[#D4AF37] flex items-center justify-center"><Icon size={16} className="text-white" /></div>{i < ETAPES.length - 1 && <div className="w-0.5 h-6 bg-[#D4AF37]/30" />}</div><div className="pb-4"><p className="text-sm font-bold text-[#111]">{e.label}</p></div></div>); })}</div>
    </div>
  );
}
