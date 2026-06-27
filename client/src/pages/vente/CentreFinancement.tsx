import { Link } from "react-router-dom";
import { ChevronLeft, CreditCard, Euro, Check, Calculator } from "lucide-react";
const MODES = [
  { label: "Paiement comptant", desc: "Paiement intégral à la commande", icon: Euro },
  { label: "Paiement fractionné", desc: "3x ou 4x sans frais selon montant", icon: CreditCard },
  { label: "LOA", desc: "Location avec option d'achat", icon: Calculator },
  { label: "Financement partenaire", desc: "Crédit via nos partenaires bancaires", icon: CreditCard },
];
export default function CentreFinancement() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><CreditCard size={20} /> Financement</h1></div>
      <div className="px-4 mt-4 space-y-2">{MODES.map(m => { const Icon = m.icon; return (
        <div key={m.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50"><Icon size={16} className="text-blue-700" /></div>
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{m.label}</h3><p className="text-[10px] text-[#6B7280]">{m.desc}</p></div>
        </div>); })}</div>
    </div>
  );
}
