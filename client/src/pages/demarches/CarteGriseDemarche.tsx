import { Link } from "react-router-dom";
import { ChevronLeft, FileText, ChevronRight } from "lucide-react";
const SERVICES = [
  { label: "Achat véhicule", desc: "Changement de propriétaire après achat" },
  { label: "Vente véhicule", desc: "Déclaration de cession" },
  { label: "Véhicule occasion", desc: "Carte grise à votre nom" },
  { label: "Véhicule neuf", desc: "Première immatriculation" },
  { label: "Import", desc: "Véhicule acheté à l'étranger" },
];
export default function CarteGriseDemarche() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Carte grise</h1></div>
      <div className="px-4 mt-4 space-y-2">{SERVICES.map(s => (
        <Link key={s.label} to="/demarches/suivi-dossier" className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 active:scale-[0.99]"><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{s.label}</h3><p className="text-[10px] text-[#6B7280]">{s.desc}</p></div><ChevronRight size={16} className="text-red-500" /></Link>))}</div>
    </div>
  );
}
