import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Database, ChevronDown, Check, Download } from "lucide-react";

const SAUVEGARDES = [
  { id: 1, date: "09/06/2025 03:00", taille: "2.4 GB", type: "Auto", statut: "OK" },
  { id: 2, date: "08/06/2025 03:00", taille: "2.3 GB", type: "Auto", statut: "OK" },
  { id: 3, date: "07/06/2025 03:00", taille: "2.3 GB", type: "Auto", statut: "OK" },
  { id: 4, date: "06/06/2025 15:30", taille: "2.2 GB", type: "Manuel", statut: "OK" },
  { id: 5, date: "05/06/2025 03:00", taille: "2.2 GB", type: "Auto", statut: "OK" },
];

export default function AdminSauvegardes() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Database size={20} className="text-[#D4AF37]" /> Sauvegardes</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        <button className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]"><p className="text-lg font-black text-green-500">5</p><p className="text-[9px] text-[#6B7280]">Sauvegardes recentes</p></button>
        <button className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]"><p className="text-lg font-black text-[#D4AF37]">11.4 GB</p><p className="text-[9px] text-[#6B7280]">Espace total</p></button>
      </div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Sauvegarde manuelle maintenant</button></div>
      <div className="px-4 mt-4 space-y-2">
        {SAUVEGARDES.map((s) => {
          const isExp = expanded === s.id;
          return (
            <div key={s.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : s.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-50 grid place-items-center"><Check size={14} className="text-green-500" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-[#111]">{s.date}</p><p className="text-[10px] text-[#6B7280]">{s.type} · {s.taille}</p></div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2 flex gap-2">
                  <button className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1"><Download size={10} /> Telecharger</button>
                  <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Restaurer</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
