import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Check, Clock, X, Upload } from "lucide-react";
const DOCS = [
  { label: "Carte grise AB-123-CD", type: "Carte grise", statut: "valide" },
  { label: "Pièce identité — Jean D.", type: "Identité", statut: "valide" },
  { label: "Justificatif domicile", type: "Domicile", statut: "verifie" },
  { label: "Certificat cession", type: "Cession", statut: "refuse" },
  { label: "KBIS SAS Auto+", type: "KBIS", statut: "recu" },
];
export default function CentreDocumentsDemarches() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Centre documents</h1></div>
      <div className="px-4 mt-4 space-y-2">{DOCS.map(d => (
        <div key={d.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          {d.statut === "valide" ? <Check size={14} className="text-green-600" /> : d.statut === "verifie" ? <Check size={14} className="text-blue-600" /> : d.statut === "refuse" ? <X size={14} className="text-red-500" /> : <Clock size={14} className="text-amber-500" />}
          <div className="flex-1"><h3 className="text-sm text-[#111]">{d.label}</h3><p className="text-[9px] text-[#6B7280]">{d.type}</p></div>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.statut === "valide" ? "bg-green-50 text-green-600" : d.statut === "verifie" ? "bg-blue-50 text-blue-600" : d.statut === "refuse" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{d.statut === "valide" ? "Validé" : d.statut === "verifie" ? "Vérifié" : d.statut === "refuse" ? "Refusé" : "Reçu"}</span>
        </div>))}</div>
    </div>
  );
}
