import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Download, Check, AlertCircle } from "lucide-react";
const SECTIONS = [
  { label: "Historique propriétaires", statut: "ok", detail: "2 propriétaires" },
  { label: "Contrôles techniques", statut: "ok", detail: "Dernier: 15/01/2025 — OK" },
  { label: "Entretien", statut: "ok", detail: "12 interventions · Dernière: 02/2025" },
  { label: "Sinistres", statut: "ok", detail: "Aucun sinistre déclaré" },
  { label: "Kilométrage", statut: "ok", detail: "45 218 km — Cohérent" },
  { label: "Vol / Gage", statut: "ok", detail: "Aucun vol / Aucun gage" },
];
export default function CentreRapportsVehicule() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Rapport véhicule</h1><p className="mt-1 text-sm text-white/60">Peugeot 3008 GT · VIN: VF3XXXXX</p></div>
      <div className="px-4 mt-4 space-y-1.5">{SECTIONS.map(s => (
        <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          <Check size={14} className="text-green-600" /><div className="flex-1"><h3 className="text-sm font-semibold text-[#111]">{s.label}</h3><p className="text-[9px] text-[#6B7280]">{s.detail}</p></div>
        </div>))}</div>
      <div className="px-4 mt-4"><button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98]"><Download size={14} /> Télécharger le rapport PDF</button></div>
    </div>
  );
}
