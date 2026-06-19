import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Upload, Check, User } from "lucide-react";
const DOCS = [{ label: "Pièce d'identité", statut: "valide" }, { label: "Justificatif domicile", statut: "valide" }, { label: "Permis de conduire", statut: "en_attente" }, { label: "Documents financiers", statut: "non_envoye" }];
export default function CentreDossiersAcheteurs() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/tableau-de-bord" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon espace</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Dossier acheteur</h1><p className="mt-1 text-sm text-white/60">Préparez vos documents avant achat</p></div>
      <div className="px-4 mt-4 space-y-2">{DOCS.map(d => (
        <div key={d.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          {d.statut === "valide" ? <Check size={14} className="text-green-600" /> : <FileText size={14} className={d.statut === "en_attente" ? "text-amber-500" : "text-[#9CA3AF]"} />}
          <span className="flex-1 text-sm text-[#111]">{d.label}</span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.statut === "valide" ? "bg-green-50 text-green-600" : d.statut === "en_attente" ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-[#9CA3AF]"}`}>{d.statut === "valide" ? "Validé" : d.statut === "en_attente" ? "En attente" : "Non envoyé"}</span>
          {d.statut !== "valide" && <Upload size={12} className="text-[#9CA3AF]" />}
        </div>))}</div>
    </div>
  );
}
