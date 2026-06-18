import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MessageSquare, Car, Home, Wrench, FileText, Euro, Clock, Check } from "lucide-react";
const TICKETS = [
  { id: "TK-2401", sujet: "Paiement non reçu", cat: "Paiements", priorite: "haute", statut: "ouvert", date: "08/06" },
  { id: "TK-2400", sujet: "Annonce refusée sans raison", cat: "Vente", priorite: "moyenne", statut: "assigné", date: "08/06" },
  { id: "TK-2399", sujet: "Caution non restituée", cat: "Location", priorite: "haute", statut: "ouvert", date: "07/06" },
  { id: "TK-2398", sujet: "Devis incorrect", cat: "Garage", priorite: "basse", statut: "résolu", date: "06/06" },
  { id: "TK-2397", sujet: "Document bloqué", cat: "Démarches", priorite: "moyenne", statut: "assigné", date: "06/06" },
];
const PRIO_COLORS: Record<string, string> = { haute: "bg-red-100 text-red-700", moyenne: "bg-yellow-100 text-yellow-700", basse: "bg-green-100 text-green-700" };
const STAT_COLORS: Record<string, string> = { ouvert: "bg-blue-100 text-blue-700", "assigné": "bg-purple-100 text-purple-700", "résolu": "bg-green-100 text-green-700" };
export default function CentreTickets() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={20} className="text-[#D4AF37]" /> Centre Tickets</h1>
        <p className="text-xs text-white/50 mt-1">Tous les problèmes · Assignation automatique</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center shadow-sm"><p className="text-lg font-black text-blue-500">12</p><p className="text-[9px] text-[#6B7280]">Ouverts</p></div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center shadow-sm"><p className="text-lg font-black text-purple-500">8</p><p className="text-[9px] text-[#6B7280]">Assignés</p></div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center shadow-sm"><p className="text-lg font-black text-green-500">156</p><p className="text-[9px] text-[#6B7280]">Résolus</p></div>
      </div>
      <div className="px-4 space-y-2">
        {TICKETS.map(t => (
          <div key={t.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-[#111]">{t.sujet}</p><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STAT_COLORS[t.statut] || ""}`}>{t.statut}</span></div>
            <div className="flex items-center gap-2"><span className="text-[9px] text-[#6B7280]">{t.id}</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${PRIO_COLORS[t.priorite] || ""}`}>{t.priorite}</span><span className="text-[9px] text-[#6B7280]">{t.cat}</span><span className="text-[9px] text-[#6B7280]">{t.date}</span></div>
          </div>))}
      </div>
    </div>
  );
}
