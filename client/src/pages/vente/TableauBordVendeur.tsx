import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, Package, Calendar, Euro, MessageSquare, FileText, TrendingUp, ChevronRight } from "lucide-react";
const STATS = [{ label: "Stock", value: "24", icon: Package }, { label: "Réservations", value: "3", icon: Calendar }, { label: "Ventes mois", value: "8", icon: TrendingUp }, { label: "CA mois", value: "186k €", icon: Euro }];
const MENU = [{ label: "Stock", to: "/vente/stock" }, { label: "Réservations", to: "/vente/reservations" }, { label: "Messages", to: "/messagerie" }, { label: "Documents", to: "/documents" }, { label: "Factures", to: "/vente/factures" }, { label: "Statistiques", to: "/vente/statistiques" }];
export default function TableauBordVendeur() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pro</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} /> Résumé Vendeur</h1></div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-4 gap-2">{STATS.map(s => { const Icon = s.icon; return (<div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center"><Icon size={14} className="mx-auto text-blue-600" /><p className="text-lg font-black text-[#111] mt-0.5">{s.value}</p><p className="text-[7px] text-[#6B7280]">{s.label}</p></div>); })}</div>
      <div className="px-4 mt-4 space-y-1.5">{MENU.map(m => (<Link key={m.label} to={m.to} className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] p-3"><span className="text-sm font-semibold text-[#111]">{m.label}</span><ChevronRight size={14} className="text-[#D4D4D4]" /></Link>))}</div>
    </div>
  );
}
