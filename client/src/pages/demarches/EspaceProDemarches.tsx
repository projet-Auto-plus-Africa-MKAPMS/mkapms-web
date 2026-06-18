import { Link } from "react-router-dom";
import { ChevronLeft, Building2, FileText, ChevronRight, Plus } from "lucide-react";
const DOSSIERS = [
  { ref: "DOS-2025-0142", vehicule: "3008 GT", type: "Changement titulaire", statut: "en_cours" },
  { ref: "DOS-2025-0138", vehicule: "BMW 320d", type: "Carte grise", statut: "termine" },
  { ref: "DOS-2025-0135", vehicule: "Clio V", type: "Cession", statut: "termine" },
];
export default function EspaceProDemarches() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} /> Espace pro démarches</h1><p className="mt-1 text-sm text-white/80">SAS Auto+ — {DOSSIERS.length} dossiers</p></div>
      <div className="px-4 mt-4 space-y-2">{DOSSIERS.map(d => (
        <div key={d.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3"><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{d.vehicule} — {d.type}</h3><p className="text-[9px] text-[#6B7280]">{d.ref}</p></div><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.statut === "termine" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{d.statut === "termine" ? "Terminé" : "En cours"}</span></div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl border-2 border-dashed border-blue-400 py-3 text-sm font-bold text-blue-700 flex items-center justify-center gap-2"><Plus size={16} /> Nouveau dossier</button></div>
    </div>
  );
}
