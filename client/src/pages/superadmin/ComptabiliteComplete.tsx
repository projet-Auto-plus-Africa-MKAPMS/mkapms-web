import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Calculator, TrendingUp, TrendingDown, Euro, BarChart3 } from "lucide-react";
const REVENUS = [
  { source: "Vente", montant: "45 200 €", pct: "+12%" },
  { source: "Location", montant: "28 300 €", pct: "+8%" },
  { source: "Garage", montant: "18 700 €", pct: "+15%" },
  { source: "Pièces", montant: "12 400 €", pct: "+22%" },
  { source: "Démarches", montant: "8 900 €", pct: "+5%" },
  { source: "Publicité", montant: "6 200 €", pct: "+30%" },
];
const DEPENSES = [
  { poste: "Salaires", montant: "35 000 €" },
  { poste: "Publicité", montant: "8 500 €" },
  { poste: "Fournisseurs", montant: "12 000 €" },
  { poste: "Logiciels", montant: "2 200 €" },
  { poste: "Serveurs", montant: "1 800 €" },
];
export default function ComptabiliteComplete() {
  const totalRevenus = 119700;
  const totalDepenses = 59500;
  const benefice = totalRevenus - totalDepenses;
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Calculator size={20} className="text-[#D4AF37]" /> Comptabilité</h1>
      </div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm"><TrendingUp size={16} className="text-green-500 mx-auto mb-1" /><p className="text-lg font-black text-green-600">119 700 €</p><p className="text-[9px] text-[#6B7280]">CA mensuel</p></div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm"><TrendingDown size={16} className="text-red-500 mx-auto mb-1" /><p className="text-lg font-black text-red-500">59 500 €</p><p className="text-[9px] text-[#6B7280]">Charges</p></div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center shadow-sm"><Euro size={16} className="text-[#D4AF37] mx-auto mb-1" /><p className="text-lg font-black text-[#D4AF37]">60 200 €</p><p className="text-[9px] text-[#6B7280]">Bénéfice</p></div>
      </div>
      <div className="px-4 mb-4">
        <h2 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Revenus par service</h2>
        <div className="space-y-1.5">{REVENUS.map(r => (
          <div key={r.source} className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm"><span className="text-sm font-semibold text-[#111]">{r.source}</span><div className="text-right"><span className="text-sm font-bold text-[#111]">{r.montant}</span><span className="text-[10px] text-green-500 ml-2">{r.pct}</span></div></div>))}</div>
      </div>
      <div className="px-4">
        <h2 className="text-xs font-bold text-[#6B7280] uppercase mb-2">Dépenses</h2>
        <div className="space-y-1.5">{DEPENSES.map(d => (
          <div key={d.poste} className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm"><span className="text-sm font-semibold text-[#111]">{d.poste}</span><span className="text-sm font-bold text-red-500">{d.montant}</span></div>))}</div>
      </div>
    </div>
  );
}
