import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, ChevronDown, AlertTriangle, Lock, Eye } from "lucide-react";

const EVENTS = [
  { id: 1, type: "Connexion suspecte", detail: "IP 185.234.xx.xx — 3 tentatives echouees", date: "09/06 14:32", niveau: "haute" },
  { id: 2, type: "2FA desactive", detail: "Utilisateur pierre.m@email.com a desactive 2FA", date: "09/06 12:10", niveau: "moyenne" },
  { id: 3, type: "Export donnees", detail: "Admin Sarah B. a exporte la liste utilisateurs", date: "09/06 10:00", niveau: "info" },
  { id: 4, type: "Tentative brute force", detail: "12 tentatives sur /api/auth/login depuis meme IP", date: "08/06 22:45", niveau: "critique" },
  { id: 5, type: "Nouveau role admin", detail: "Ahmed T. promu admin par PDG", date: "08/06 09:30", niveau: "info" },
];

export default function AdminSecurite() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Securite</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Critiques", v: "1", c: "text-red-500" },
          { l: "Alertes", v: "4", c: "text-amber-500" },
          { l: "Score", v: "94/100", c: "text-green-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>
      <div className="px-4 mt-4 space-y-2">
        {EVENTS.map((e) => {
          const isExp = expanded === e.id;
          return (
            <div key={e.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : e.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${e.niveau === "critique" ? "bg-red-50" : e.niveau === "haute" ? "bg-amber-50" : "bg-slate-50"}`}>
                  {e.niveau === "critique" ? <AlertTriangle size={14} className="text-red-500" /> : e.niveau === "haute" ? <Lock size={14} className="text-amber-500" /> : <Eye size={14} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-[#111]">{e.type}</p><p className="text-[10px] text-[#6B7280]">{e.date}</p></div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <p className="text-[10px] text-[#6B7280]">{e.detail}</p>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Investiguer</button>
                    <button className="flex-1 rounded-lg bg-red-50 py-1.5 text-[9px] font-bold text-red-600">Bloquer</button>
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
