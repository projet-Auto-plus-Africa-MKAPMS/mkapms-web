import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, Car, AlertTriangle, Users, Clock, ChevronRight } from "lucide-react";
const STATS = [{ label: "Présents", value: "6", icon: Car }, { label: "En retard", value: "1", icon: AlertTriangle }, { label: "Dispo", value: "2", icon: Users }, { label: "Urgents", value: "2", icon: Clock }];
const MENU = [{ label: "Planning", to: "/garage/planning" }, { label: "Ponts", to: "/garage/ponts" }, { label: "Mécaniciens", to: "/garage/mecaniciens" }, { label: "File d'attente", to: "/garage/file-attente" }, { label: "Outillage", to: "/garage/outillage" }, { label: "Rentabilité", to: "/garage/rentabilite" }];
export default function TableauBordChefAtelier() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Chef atelier</h1></div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-4 gap-2">{STATS.map(s => { const Icon = s.icon; return (<div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-center"><Icon size={14} className="mx-auto text-[#D4AF37]" /><p className="text-lg font-black text-[#111] mt-0.5">{s.value}</p><p className="text-[7px] text-[#6B7280]">{s.label}</p></div>); })}</div>
      <div className="px-4 mt-3 space-y-1.5">{MENU.map(m => (<Link key={m.label} to={m.to} className="flex items-center justify-between rounded-xl bg-white border border-[#E5E7EB] p-3"><span className="text-sm font-semibold text-[#111]">{m.label}</span><ChevronRight size={14} className="text-[#D4D4D4]" /></Link>))}</div>
    </div>
  );
}
