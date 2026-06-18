import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Check, Clock } from "lucide-react";
const DOCS_A_SIGNER = [
  { label: "Certificat de cession", statut: "signe", date: "15/03/2025" },
  { label: "Demande carte grise", statut: "en_attente", date: "" },
  { label: "Mandat", statut: "en_attente", date: "" },
];
export default function SignaturesElectroniques() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Signatures</h1></div>
      <div className="px-4 mt-4 space-y-2">{DOCS_A_SIGNER.map(d => (
        <div key={d.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
          {d.statut === "signe" ? <Check size={14} className="text-green-600" /> : <Clock size={14} className="text-amber-500" />}
          <div className="flex-1"><h3 className="text-sm text-[#111]">{d.label}</h3>{d.date && <p className="text-[9px] text-[#6B7280]">{d.date}</p>}</div>
          {d.statut !== "signe" && <button className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-white">Signer</button>}
        </div>))}</div>
    </div>
  );
}
