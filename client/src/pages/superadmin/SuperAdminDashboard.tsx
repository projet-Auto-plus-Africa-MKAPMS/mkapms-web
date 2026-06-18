import { Link } from "react-router-dom";
import { Shield, Users, FileText, BarChart3, Bell, Settings, Globe, Lock, ChevronRight } from "lucide-react";
const STATS = [{ l: "Utilisateurs", v: "12 450" }, { l: "Annonces", v: "8 320" }, { l: "Locations", v: "1 840" }, { l: "Ventes", v: "3 210" }, { l: "Garages", v: "142" }, { l: "Démarches", v: "2 890" }, { l: "Pièces", v: "15 200" }];
const MENUS = [
  { label: "Utilisateurs", to: "/superadmin/utilisateurs" }, { label: "Comptes pro", to: "/superadmin/comptes-pro" },
  { label: "Validation docs", to: "/superadmin/validation-docs" }, { label: "Abonnements", to: "/superadmin/abonnements" },
  { label: "Badges", to: "/superadmin/badges" }, { label: "Modération annonces", to: "/superadmin/moderation-annonces" },
  { label: "Modération avis", to: "/superadmin/moderation-avis" }, { label: "Paiements", to: "/superadmin/paiements" },
  { label: "Commissions", to: "/superadmin/commissions" }, { label: "Litiges", to: "/superadmin/litiges" },
  { label: "Fraude", to: "/superadmin/fraude" }, { label: "Statistiques", to: "/superadmin/statistiques" },
];
export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6"><h1 className="text-2xl font-black text-white flex items-center gap-2"><Shield size={22} className="text-[#D4AF37]" /> Super Admin <span className="text-[#D4AF37]">MKA.P-MS</span></h1><p className="mt-1 text-sm text-white/60">Vision complète · Temps réel</p></div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-4 gap-1.5 mb-3">{STATS.map(s => (<div key={s.l} className="rounded-lg bg-white border border-[#E5E7EB] p-2 text-center"><p className="text-sm font-black text-[#D4AF37]">{s.v}</p><p className="text-[7px] text-[#6B7280]">{s.l}</p></div>))}</div>
      <div className="px-4 space-y-1.5">{MENUS.map(m => (<Link key={m.label} to={m.to} className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] p-3 active:scale-[0.99]"><span className="text-sm font-semibold text-[#111]">{m.label}</span><ChevronRight size={14} className="text-[#D4D4D4]" /></Link>))}</div>
    </div>
  );
}
