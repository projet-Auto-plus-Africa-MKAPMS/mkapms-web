import { Link } from "react-router-dom";
import { Euro, CreditCard, Clock, Shield, FileText, BarChart3, Phone, ChevronRight } from "lucide-react";
const SERVICES = [
  { label: "Paiement comptant", icon: Euro, to: "/finance/comptant", color: "bg-[#D4AF37]" },
  { label: "Paiement en plusieurs fois", icon: CreditCard, to: "/finance/fractionne", color: "bg-blue-600" },
  { label: "LOA", icon: Clock, to: "/finance/loa", color: "bg-purple-600" },
  { label: "Dépôt de garantie", icon: Shield, to: "/finance/garantie", color: "bg-green-600" },
  { label: "Suivi paiements", icon: BarChart3, to: "/finance/echeancier", color: "bg-orange-600" },
  { label: "Factures", icon: FileText, to: "/finance/factures", color: "bg-gray-700" },
];
export default function FinanceGenerale() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6"><h1 className="text-2xl font-black text-white flex items-center gap-2"><Euro size={22} className="text-[#D4AF37]" /> Finance <span className="text-[#D4AF37]">MKA.P-MS</span></h1><p className="mt-1 text-sm text-white/60">Paiements · LOA · Garanties · Factures</p></div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-2 gap-2">{SERVICES.map(s => { const Icon = s.icon; return (
        <Link key={s.label} to={s.to} className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center active:scale-[0.98] shadow-sm"><div className={`flex h-10 w-10 mx-auto items-center justify-center rounded-lg ${s.color}`}><Icon size={18} className="text-white" /></div><p className="text-xs font-bold text-[#111] mt-2">{s.label}</p></Link>); })}</div>
    </div>
  );
}
