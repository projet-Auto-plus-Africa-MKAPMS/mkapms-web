import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Briefcase, ChevronDown, Check, Clock } from "lucide-react";

const PROS = [
  { id: 1, nom: "Garage Auto 93", type: "Garage", ville: "Bobigny", plan: "Pro Premium", siret: "123 456 789", verifie: true },
  { id: 2, nom: "LuxDrive VTC", type: "VTC / Taxi", ville: "Paris", plan: "VTC Max", siret: "987 654 321", verifie: true },
  { id: 3, nom: "Flash Location", type: "Location", ville: "Lyon", plan: "Location Ultimate", siret: "456 789 123", verifie: true },
  { id: 4, nom: "Carrosserie SD", type: "Carrosserie", ville: "Marseille", plan: "Garage Elite", siret: "789 123 456", verifie: false },
  { id: 5, nom: "MotoSpeed", type: "Vente", ville: "Toulouse", plan: "Pro Start", siret: "321 654 987", verifie: true },
];

export default function AdminComptesPro() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Briefcase size={20} className="text-[#D4AF37]" /> Comptes Pro</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Total Pro", v: "128", c: "text-[#D4AF37]" },
          { l: "Verifies", v: "112", c: "text-green-500" },
          { l: "En attente", v: "16", c: "text-amber-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>
      <div className="px-4 mt-4 space-y-2">
        {PROS.map((p) => {
          const isExp = expanded === p.id;
          return (
            <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : p.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${p.verifie ? "bg-green-50" : "bg-amber-50"}`}>
                  {p.verifie ? <Check size={14} className="text-green-500" /> : <Clock size={14} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{p.nom}</p>
                  <p className="text-[10px] text-[#6B7280]">{p.type} · {p.ville}</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Plan</span><p className="font-bold text-[#D4AF37]">{p.plan}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">SIRET</span><p className="font-bold text-[#111]">{p.siret}</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Voir profil</button>
                    <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Documents</button>
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
