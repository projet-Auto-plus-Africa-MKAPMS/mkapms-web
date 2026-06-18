import { Link } from "react-router-dom";
import { ChevronLeft, ArrowRight, Check, Building2 } from "lucide-react";
const TRANSFERTS = [
  { vehicule: "Audi A4", de: "MKA.P-MS Paris", vers: "Garage Express", raison: "Carrosserie spécialisée", statut: "termine" },
  { vehicule: "Mercedes GLC", de: "MKA.P-MS Lyon", vers: "Méca Pro", raison: "Pièce indisponible", statut: "en_cours" },
];
export default function TransfertDossiers() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><ArrowRight size={20} className="text-[#D4AF37]" /> Transfert dossiers</h1></div>
      <div className="px-4 mt-4 space-y-2">{TRANSFERTS.map(t => (
        <div key={t.vehicule} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111]">{t.vehicule}</h3>
          <div className="mt-1 flex items-center gap-2 text-[10px]"><span className="text-[#6B7280]">{t.de}</span><ArrowRight size={10} className="text-[#D4AF37]" /><span className="font-bold text-[#111]">{t.vers}</span></div>
          <p className="text-[9px] text-[#6B7280] mt-0.5">{t.raison}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${t.statut === "termine" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{t.statut === "termine" ? "Terminé" : "En cours"}</span>
        </div>))}</div>
    </div>
  );
}
