import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Percent, ChevronDown } from "lucide-react";

const COMMISSIONS = [
  { id: 1, univers: "Vente", taux: "2.5%", montant: "4 961 EUR", transactions: 198 },
  { id: 2, univers: "Location", taux: "5%", montant: "2 780 EUR", transactions: 56 },
  { id: 3, univers: "Garage", taux: "3%", montant: "1 490 EUR", transactions: 87 },
  { id: 4, univers: "Encheres", taux: "4%", montant: "890 EUR", transactions: 22 },
  { id: 5, univers: "Pieces", taux: "8%", montant: "1 240 EUR", transactions: 155 },
  { id: 6, univers: "Publicite", taux: "0%", montant: "3 450 EUR", transactions: 12 },
];

export default function AdminCommissions() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Percent size={20} className="text-[#D4AF37]" /> Commissions</h1>
        <p className="mt-1 text-xs text-white/50">Total ce mois: 14 811 EUR</p>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {COMMISSIONS.map((c) => {
          const isExp = expanded === c.id;
          return (
            <div key={c.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : c.id)} className="w-full text-left p-3 flex items-center justify-between">
                <div><p className="text-sm font-bold text-[#111]">{c.univers}</p><p className="text-[10px] text-[#6B7280]">Taux: {c.taux} · {c.transactions} transactions</p></div>
                <div className="flex items-center gap-2"><span className="text-sm font-black text-[#D4AF37]">{c.montant}</span><ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} /></div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Taux applique</span><p className="font-bold text-[#D4AF37]">{c.taux}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Transactions</span><p className="font-bold text-[#111]">{c.transactions}</p></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
