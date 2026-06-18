import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Users, FileText, Check, X, Clock, Eye } from "lucide-react";
const QUEUES = [
  { type: "Comptes pro", pending: 8, icon: Users },
  { type: "Annonces", pending: 15, icon: FileText },
  { type: "Documents", pending: 22, icon: FileText },
  { type: "Clients", pending: 5, icon: Users },
];
const RESTRICTIONS = ["Finances globales", "Abonnements", "Statistiques fondateur", "Paramètres système"];
export default function AdminGeneral() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Administrateur Général</h1>
        <p className="text-xs text-white/50 mt-1">Validation comptes · annonces · documents · clients</p>
      </div>
      <div className="px-4 mt-4 space-y-3">
        <h2 className="text-xs font-bold text-[#6B7280] uppercase">Files de validation</h2>
        {QUEUES.map(q => { const Icon = q.icon; return (
          <div key={q.type} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/10"><Icon size={16} className="text-[#D4AF37]" /></div>
            <div className="flex-1"><p className="text-sm font-semibold text-[#111]">{q.type}</p></div>
            <span className="bg-[#D4AF37] text-white text-[10px] font-bold rounded-full h-6 w-6 flex items-center justify-center">{q.pending}</span>
          </div>); })}
        <h2 className="text-xs font-bold text-[#6B7280] uppercase mt-4">Accès restreint</h2>
        <div className="rounded-xl bg-white border border-red-200 p-3">
          {RESTRICTIONS.map(r => (<div key={r} className="flex items-center gap-2 py-1"><X size={12} className="text-red-400" /><span className="text-xs text-[#6B7280]">{r}</span></div>))}
        </div>
      </div>
    </div>
  );
}
