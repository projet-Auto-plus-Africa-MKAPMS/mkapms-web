import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Euro, ArrowDown, ArrowUp, AlertCircle, ChevronDown, Check, Clock } from "lucide-react";

const PAIEMENTS = [
  { id: 1, ref: "PAY-20250609-001", client: "Garage Auto 93", montant: "89 EUR", type: "abonnement", statut: "reussi", date: "09/06/2025 14:32", methode: "Carte bancaire", plan: "Pro Premium" },
  { id: 2, ref: "PAY-20250609-002", client: "Martin D.", montant: "24.90 EUR", type: "boost", statut: "reussi", date: "09/06/2025 12:15", methode: "Carte bancaire", plan: "Premium 30j" },
  { id: 3, ref: "PAY-20250609-003", client: "LuxDrive VTC", montant: "249.99 EUR", type: "abonnement", statut: "reussi", date: "09/06/2025 10:00", methode: "Prelevement", plan: "VTC Max" },
  { id: 4, ref: "PAY-20250608-004", client: "Sophie L.", montant: "6.90 EUR", type: "boost", statut: "echoue", date: "08/06/2025 22:45", methode: "Carte bancaire", plan: "Boost 7j" },
  { id: 5, ref: "PAY-20250608-005", client: "Carrosserie SD", montant: "99 EUR", type: "abonnement", statut: "reussi", date: "08/06/2025 09:00", methode: "Prelevement", plan: "Garage Elite" },
  { id: 6, ref: "PAY-20250607-006", client: "Ahmed K.", montant: "5.90 EUR", type: "pack_photos", statut: "rembourse", date: "07/06/2025 16:20", methode: "Carte bancaire", plan: "Pack 5 photos" },
];

export default function AdminPaiements() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("tous");

  const filtered = filter === "tous" ? PAIEMENTS : PAIEMENTS.filter((p) => p.statut === filter);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Euro size={20} className="text-[#D4AF37]" /> Gestion paiements</h1>
      </div>

      {/* Stats grille */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {[
          { l: "CA du jour", v: "4 230 EUR", icon: ArrowDown, c: "text-green-500", bg: "bg-green-50" },
          { l: "CA du mois", v: "198 450 EUR", icon: Euro, c: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
          { l: "Echoues", v: "3", icon: AlertCircle, c: "text-red-500", bg: "bg-red-50" },
          { l: "En attente", v: "7", icon: Clock, c: "text-amber-500", bg: "bg-amber-50" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3 active:scale-[0.97]">
              <div className={`h-9 w-9 rounded-lg ${s.bg} grid place-items-center`}><Icon size={16} className={s.c} /></div>
              <div className="text-left"><p className="text-[10px] text-[#6B7280]">{s.l}</p><p className={`text-sm font-black ${s.c}`}>{s.v}</p></div>
            </button>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="px-4 mt-3 flex gap-2">
        {["tous", "reussi", "echoue", "rembourse"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-bold ${filter === f ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
            {f === "tous" ? "Tous" : f === "reussi" ? "Reussis" : f === "echoue" ? "Echoues" : "Rembourses"}
          </button>
        ))}
      </div>

      {/* Liste paiements */}
      <div className="px-4 mt-3 space-y-2">
        {filtered.map((p) => {
          const isExp = expanded === p.id;
          return (
            <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : p.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center ${p.statut === "reussi" ? "bg-green-50" : p.statut === "echoue" ? "bg-red-50" : "bg-amber-50"}`}>
                  {p.statut === "reussi" ? <Check size={14} className="text-green-600" /> : p.statut === "echoue" ? <AlertCircle size={14} className="text-red-500" /> : <ArrowUp size={14} className="text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111]">{p.client}</p>
                  <p className="text-[10px] text-[#6B7280]">{p.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#D4AF37]">{p.montant}</p>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ml-auto ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Reference</span><p className="font-bold text-[#111]">{p.ref}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Type</span><p className="font-bold text-[#111]">{p.type}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Methode</span><p className="font-bold text-[#111]">{p.methode}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Plan</span><p className="font-bold text-[#D4AF37]">{p.plan}</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Voir details</button>
                    {p.statut === "echoue" && <button className="flex-1 rounded-lg bg-red-50 py-1.5 text-[9px] font-bold text-red-600">Relancer</button>}
                    {p.statut === "reussi" && <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Facture</button>}
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
