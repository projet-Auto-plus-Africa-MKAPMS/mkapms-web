import { Link } from "react-router-dom";
import { ChevronLeft, Check, FileText, Euro, Download, Car } from "lucide-react";
export default function RestitutionClient() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Restitution</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-center"><Check size={24} className="mx-auto text-green-600" /><p className="text-base font-bold text-green-700 mt-1">Véhicule prêt</p><p className="text-xs text-green-600">Contrôle qualité validé</p></div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        {[{ label: "Signature client", icon: FileText }, { label: "Facture", icon: Euro }, { label: "Paiement", icon: Euro }, { label: "Archivage dossier", icon: Download }].map(e => (
          <div key={e.label} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0"><e.icon size={14} className="text-[#D4AF37]" /><span className="flex-1 text-sm text-[#111]">{e.label}</span><Check size={14} className="text-green-600" /></div>))}
        <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Confirmer la restitution</button>
      </div>
    </div>
  );
}
