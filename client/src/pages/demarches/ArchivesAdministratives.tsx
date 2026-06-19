import { Link } from "react-router-dom";
import { ChevronLeft, Archive, Download, FileText } from "lucide-react";
const ARCHIVES = [
  { label: "Carte grise AB-123-CD", type: "Carte grise", date: "15/03/2025" },
  { label: "Cession EF-456-GH", type: "Cession", date: "10/01/2025" },
  { label: "Duplicata IJ-789-KL", type: "Duplicata", date: "05/09/2024" },
  { label: "Facture carte grise", type: "Facture", date: "15/03/2025" },
];
export default function ArchivesAdministratives() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Archive size={20} className="text-[#D4AF37]" /> Archives</h1></div>
      <div className="px-4 mt-4 space-y-2">{ARCHIVES.map(a => (
        <div key={a.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3"><FileText size={14} className="text-[#D4AF37]" /><div className="flex-1"><h3 className="text-sm text-[#111]">{a.label}</h3><p className="text-[9px] text-[#6B7280]">{a.type} · {a.date}</p></div><Download size={14} className="text-red-500" /></div>))}</div>
    </div>
  );
}
