import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, CreditCard, ChevronDown, Users, TrendingUp, AlertCircle } from "lucide-react";

const ABOS = [
  { id: 1, client: "Garage Auto 93", plan: "Pro Premium", prix: "89 EUR/mois", debut: "01/01/2025", fin: "01/01/2026", statut: "actif", renouvellement: "auto" },
  { id: 2, client: "LuxDrive VTC", plan: "VTC Max", prix: "249.99 EUR/mois", debut: "15/01/2025", fin: "15/01/2026", statut: "actif", renouvellement: "auto" },
  { id: 3, client: "Carrosserie SD", plan: "Garage Elite", prix: "99 EUR/mois", debut: "01/02/2025", fin: "01/02/2026", statut: "actif", renouvellement: "auto" },
  { id: 4, client: "Flash Location", plan: "Location Ultimate", prix: "249.99 EUR/mois", debut: "01/03/2025", fin: "01/03/2026", statut: "actif", renouvellement: "auto" },
  { id: 5, client: "Pierre Auto", plan: "Pro Start", prix: "49 EUR/mois", debut: "01/04/2025", fin: "01/05/2025", statut: "expire", renouvellement: "manuel" },
  { id: 6, client: "Garage Premium Motors", plan: "AutoData Pro", prix: "49.90 EUR/mois", debut: "10/03/2025", fin: "10/03/2026", statut: "actif", renouvellement: "auto" },
];

export default function AdminAbonnements() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><CreditCard size={20} className="text-[#D4AF37]" /> Abonnements</h1>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {[
          { l: "Actifs", v: "342", c: "text-green-500", bg: "bg-green-50", icon: Users },
          { l: "MRR", v: "48 200 EUR", c: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", icon: TrendingUp },
          { l: "Expires", v: "18", c: "text-red-500", bg: "bg-red-50", icon: AlertCircle },
          { l: "Nouveaux/mois", v: "+32", c: "text-blue-500", bg: "bg-blue-50", icon: TrendingUp },
        ].map((s) => { const Icon = s.icon; return (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3 active:scale-[0.97]">
            <div className={`h-9 w-9 rounded-lg ${s.bg} grid place-items-center`}><Icon size={16} className={s.c} /></div>
            <div className="text-left"><p className="text-[10px] text-[#6B7280]">{s.l}</p><p className={`text-sm font-black ${s.c}`}>{s.v}</p></div>
          </button>
        ); })}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {ABOS.map((a) => {
          const isExp = expanded === a.id;
          return (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{a.client}</p>
                  <p className="text-[10px] text-[#6B7280]">{a.plan}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${a.statut === "actif" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{a.statut}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Prix</span><p className="font-bold text-[#D4AF37]">{a.prix}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Renouvellement</span><p className="font-bold text-[#111]">{a.renouvellement}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Debut</span><p className="font-bold text-[#111]">{a.debut}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Fin</span><p className="font-bold text-[#111]">{a.fin}</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Gerer</button>
                    <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Historique</button>
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
