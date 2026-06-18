import { Link } from "react-router-dom";
import { ChevronLeft, RotateCcw, Check, Clock } from "lucide-react";
const RETOURS = [
  { ref: "RET-001", article: "Disque frein Valeo", raison: "Non conforme", statut: "rembourse" },
  { ref: "RET-002", article: "Ampoule LED H7", raison: "Défectueux", statut: "en_cours" },
];
export default function RetoursPieces() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><RotateCcw size={20} className="text-[#D4AF37]" /> Retours</h1></div>
      <div className="px-4 mt-4 space-y-2">{RETOURS.map(r => (
        <div key={r.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-4"><div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{r.article}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${r.statut === "rembourse" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{r.statut === "rembourse" ? "Remboursé" : "En cours"}</span></div><p className="text-[9px] text-[#6B7280]">{r.ref} · {r.raison}</p></div>))}</div>
    </div>
  );
}
