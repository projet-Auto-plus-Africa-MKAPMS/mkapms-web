import { Link } from "react-router-dom";
import { ChevronLeft, Euro, Check, Clock } from "lucide-react";
const ACOMPTES = [
  { ref: "ACP-001", montant: "2 000 €", statut: "paye", date: "15/03/2025" },
  { ref: "ACP-002", montant: "500 €", statut: "en_attente", date: "14/03/2025" },
  { ref: "ACP-003", montant: "1 000 €", statut: "rembourse", date: "10/03/2025" },
];
export default function AcompteFinance() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Euro size={20} className="text-[#D4AF37]" /> Acomptes</h1></div>
      <div className="px-4 mt-4 space-y-2">{ACOMPTES.map(a => (
        <div key={a.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3"><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{a.montant}</h3><p className="text-[9px] text-[#6B7280]">{a.ref} · {a.date}</p></div>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${a.statut === "paye" ? "bg-green-50 text-green-600" : a.statut === "en_attente" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>{a.statut === "paye" ? "Payé" : a.statut === "en_attente" ? "En attente" : "Remboursé"}</span></div>))}</div>
    </div>
  );
}
