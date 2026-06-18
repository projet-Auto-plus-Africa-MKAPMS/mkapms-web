import { Link } from "react-router-dom";
import { ChevronLeft, Calculator, Euro, TrendingUp, Minus, Plus } from "lucide-react";
const CALCUL = [
  { label: "Prix achat", montant: 18000, type: "cout" },
  { label: "Transport", montant: 350, type: "cout" },
  { label: "Réparations", montant: 1250, type: "cout" },
  { label: "Pièces", montant: 680, type: "cout" },
  { label: "Préparation", montant: 200, type: "cout" },
];
export default function CentreMarges() {
  const coutTotal = CALCUL.reduce((s, c) => s + c.montant, 0);
  const prixVente = 26000;
  const marge = prixVente - coutTotal;
  const pct = Math.round((marge / prixVente) * 100);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Calculator size={20} /> Centre Marges</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
        <h3 className="text-sm font-bold text-[#111]">Peugeot 3008 GT — Calcul marge</h3>
        {CALCUL.map(c => (<div key={c.label} className="flex justify-between text-sm border-b border-[#F3F4F6] pb-1"><span className="text-[#6B7280]">{c.label}</span><span className="font-semibold text-red-600">- {c.montant.toLocaleString("fr-FR")} €</span></div>))}
        <div className="flex justify-between text-sm pt-1 border-t border-[#111]"><span className="font-bold text-[#111]">Coût réel</span><span className="font-black text-[#111]">{coutTotal.toLocaleString("fr-FR")} €</span></div>
        <div className="flex justify-between text-sm"><span className="font-bold text-[#111]">Prix vente</span><span className="font-black text-blue-700">{prixVente.toLocaleString("fr-FR")} €</span></div>
        <div className="flex justify-between text-base pt-2 border-t-2 border-[#D4AF37]"><span className="font-black text-[#111]">Marge estimée</span><span className="font-black text-green-600">+ {marge.toLocaleString("fr-FR")} € ({pct}%)</span></div>
      </div>
    </div>
  );
}
