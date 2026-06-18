import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Check, Clock, Package } from "lucide-react";
const COMMANDES = [
  { ref: "CMD-2025-042", statut: "livree", articles: 3, date: "15/03/2025" },
  { ref: "CMD-2025-041", statut: "expedition", articles: 1, date: "14/03/2025" },
  { ref: "CMD-2025-040", statut: "preparation", articles: 2, date: "14/03/2025" },
];
export default function LogistiquePieces() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-[#D4AF37]" /> Suivi commandes</h1></div>
      <div className="px-4 mt-4 space-y-2">{COMMANDES.map(c => (
        <div key={c.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-3">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{c.ref}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${c.statut === "livree" ? "bg-green-50 text-green-600" : c.statut === "expedition" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>{c.statut === "livree" ? "Livrée" : c.statut === "expedition" ? "Expédiée" : "Préparation"}</span></div>
          <p className="text-[9px] text-[#6B7280]">{c.articles} articles · {c.date}</p>
        </div>))}</div>
    </div>
  );
}
