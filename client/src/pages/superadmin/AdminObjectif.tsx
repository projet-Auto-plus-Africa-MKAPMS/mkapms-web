import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Target, ChevronDown } from "lucide-react";

const OBJECTIFS = [
  { id: 1, label: "CA mensuel", objectif: "250 000 EUR", actuel: "198 450 EUR", pct: 79 },
  { id: 2, label: "Nouveaux inscrits", objectif: "150", actuel: "89", pct: 59 },
  { id: 3, label: "Taux retention", objectif: "90%", actuel: "85%", pct: 94 },
  { id: 4, label: "Annonces actives", objectif: "2 000", actuel: "1 456", pct: 73 },
  { id: 5, label: "NPS (satisfaction)", objectif: "75", actuel: "72", pct: 96 },
  { id: 6, label: "Temps reponse support", objectif: "< 1h", actuel: "2h", pct: 50 },
];

export default function AdminObjectif() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Target size={20} className="text-[#D4AF37]" /> Objectifs</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {OBJECTIFS.map((o) => {
          const isExp = expanded === o.id;
          return (
            <div key={o.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : o.id)} className="w-full text-left p-3">
                <p className="text-[10px] text-[#6B7280]">{o.label}</p>
                <p className="text-sm font-black text-[#111]">{o.actuel}</p>
                <div className="mt-1 h-1.5 rounded-full bg-[#E5E7EB]"><div className={`h-full rounded-full ${o.pct >= 80 ? "bg-green-500" : o.pct >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${o.pct}%` }} /></div>
                <p className="text-[9px] text-[#6B7280] mt-0.5">{o.pct}% de {o.objectif}</p>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <button className="w-full rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Modifier objectif</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
