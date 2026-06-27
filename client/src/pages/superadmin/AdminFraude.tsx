import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, AlertTriangle, ChevronDown, Ban, Eye } from "lucide-react";

const ALERTES = [
  { id: 1, type: "Annonce suspecte", detail: "Prix anormalement bas: BMW M3 a 2 500 EUR", user: "compte_fake_92", date: "09/06 15:30", risque: "eleve" },
  { id: 2, type: "Compte multi", detail: "3 comptes lies a la meme IP et meme adresse", user: "user_345, user_678, user_901", date: "09/06 14:00", risque: "moyen" },
  { id: 3, type: "Photo volee", detail: "Photo identique detectee sur leboncoin.fr", user: "vendeur_rapide", date: "09/06 10:45", risque: "eleve" },
  { id: 4, type: "Paiement suspect", detail: "Carte bancaire prepayee utilisee 5x en 1 heure", user: "test_account_3", date: "08/06 23:20", risque: "critique" },
];

export default function AdminFraude() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><AlertTriangle size={20} className="text-red-400" /> Anti-Fraude</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Critiques", v: "1", c: "text-red-500" },
          { l: "Eleves", v: "3", c: "text-amber-500" },
          { l: "Bloques", v: "28", c: "text-slate-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>
      <div className="px-4 mt-4 space-y-2">
        {ALERTES.map((a) => {
          const isExp = expanded === a.id;
          return (
            <div key={a.id} className={`rounded-xl bg-white border overflow-hidden ${a.risque === "critique" ? "border-red-300" : "border-[#E5E7EB]"}`}>
              <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${a.risque === "critique" ? "bg-red-100" : "bg-amber-50"}`}><AlertTriangle size={14} className={a.risque === "critique" ? "text-red-600" : "text-amber-500"} /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-[#111]">{a.type}</p><p className="text-[10px] text-[#6B7280]">{a.user} · {a.date}</p></div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <p className="text-[10px] text-[#6B7280] mb-2">{a.detail}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1"><Eye size={10} /> Inspecter</button>
                    <button className="flex-1 rounded-lg bg-red-500 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1"><Ban size={10} /> Bloquer</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
