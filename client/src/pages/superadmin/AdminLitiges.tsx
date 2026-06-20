import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Scale, ChevronDown, AlertCircle } from "lucide-react";

const LITIGES = [
  { id: 1, objet: "Vehicule non conforme a l'annonce", plaignant: "Pierre L.", accuse: "Garage Auto 93", montant: "1 200 EUR", date: "09/06", statut: "ouvert" },
  { id: 2, objet: "Remboursement location annulee", plaignant: "Marie K.", accuse: "Flash Location", montant: "450 EUR", date: "08/06", statut: "en_mediation" },
  { id: 3, objet: "Double facturation abonnement", plaignant: "LuxDrive VTC", accuse: "MKA.P-MS", montant: "249.99 EUR", date: "07/06", statut: "resolu" },
];

export default function AdminLitiges() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Scale size={20} className="text-[#D4AF37]" /> Litiges</h1>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Ouverts", v: "3", c: "text-red-500" },
          { l: "Mediation", v: "2", c: "text-amber-500" },
          { l: "Resolus", v: "45", c: "text-green-500" },
        ].map((s) => (
          <button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]">
            <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
            <p className="text-[9px] text-[#6B7280]">{s.l}</p>
          </button>
        ))}
      </div>
      <div className="px-4 mt-4 space-y-2">
        {LITIGES.map((l) => {
          const isExp = expanded === l.id;
          return (
            <div key={l.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : l.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-50 grid place-items-center"><AlertCircle size={14} className="text-red-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{l.objet}</p>
                  <p className="text-[10px] text-[#6B7280]">{l.plaignant} vs {l.accuse} · {l.date}</p>
                </div>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Montant</span><p className="font-bold text-[#D4AF37]">{l.montant}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Statut</span><p className="font-bold text-[#111]">{l.statut}</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Mediation</button>
                    <button className="flex-1 rounded-lg bg-green-500 py-1.5 text-[9px] font-bold text-white">Resoudre</button>
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
