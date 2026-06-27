import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, ChevronDown, TrendingUp } from "lucide-react";

const KEYWORDS = [
  { id: 1, mot: "voiture occasion france", position: 3, volume: "12 400/mois", tendance: "+2" },
  { id: 2, mot: "vente voiture particulier", position: 7, volume: "8 100/mois", tendance: "+5" },
  { id: 3, mot: "location voiture pas cher", position: 12, volume: "22 000/mois", tendance: "-1" },
  { id: 4, mot: "garage reparation auto", position: 5, volume: "6 600/mois", tendance: "+3" },
  { id: 5, mot: "estimation voiture gratuit", position: 4, volume: "14 800/mois", tendance: "0" },
];

export default function AdminSEO() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Search size={20} className="text-[#D4AF37]" /> SEO & Visibilite</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Position moy.", v: "6.2", c: "text-green-500" },
          { l: "Trafic organique", v: "8.4k", c: "text-[#D4AF37]" },
          { l: "Pages indexees", v: "4 521", c: "text-blue-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[8px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>
      <div className="px-4 mt-4 space-y-2">
        {KEYWORDS.map((k) => {
          const isExp = expanded === k.id;
          return (
            <div key={k.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : k.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 grid place-items-center text-xs font-black text-blue-600">#{k.position}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-[#111]">{k.mot}</p><p className="text-[10px] text-[#6B7280]">{k.volume}</p></div>
                <div className="flex items-center gap-1">
                  <TrendingUp size={10} className={k.tendance.startsWith("+") ? "text-green-500" : k.tendance === "0" ? "text-slate-400" : "text-red-500"} />
                  <span className={`text-[10px] font-bold ${k.tendance.startsWith("+") ? "text-green-600" : "text-red-600"}`}>{k.tendance}</span>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <button className="w-full rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Optimiser</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
