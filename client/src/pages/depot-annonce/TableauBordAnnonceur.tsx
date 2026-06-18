import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, Eye, MousePointer, MessageSquare, Heart, ShoppingCart, TrendingUp } from "lucide-react";
const ANNONCES = [
  { titre: "Peugeot 308 — 15 900 €", vues: 342, clics: 89, messages: 12, favoris: 28, reservations: 3, statut: "active" },
  { titre: "Renault Clio V — 12 500 €", vues: 215, clics: 54, messages: 7, favoris: 15, reservations: 1, statut: "active" },
  { titre: "BMW Série 3 — 28 900 €", vues: 128, clics: 31, messages: 4, favoris: 9, reservations: 0, statut: "suspendue" },
];
export default function TableauBordAnnonceur() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dépôt annonce</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Mes annonces</h1>
      </div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center shadow-sm"><Eye size={14} className="text-blue-500 mx-auto mb-1" /><p className="text-sm font-black text-blue-500">685</p><p className="text-[8px] text-[#6B7280]">Vues totales</p></div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center shadow-sm"><MessageSquare size={14} className="text-green-500 mx-auto mb-1" /><p className="text-sm font-black text-green-500">23</p><p className="text-[8px] text-[#6B7280]">Messages</p></div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center shadow-sm"><ShoppingCart size={14} className="text-[#D4AF37] mx-auto mb-1" /><p className="text-sm font-black text-[#D4AF37]">4</p><p className="text-[8px] text-[#6B7280]">Réservations</p></div>
      </div>
      <div className="px-4 space-y-2">
        {ANNONCES.map(a => (
          <div key={a.titre} className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2"><p className="text-sm font-bold text-[#111]">{a.titre}</p><span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${a.statut === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{a.statut}</span></div>
            <div className="grid grid-cols-5 gap-1">
              {[["Vues", a.vues, Eye], ["Clics", a.clics, MousePointer], ["Messages", a.messages, MessageSquare], ["Favoris", a.favoris, Heart], ["Réserv.", a.reservations, ShoppingCart]].map(([l, v, Icon]: any) => (
                <div key={l} className="text-center"><Icon size={10} className="text-[#6B7280] mx-auto mb-0.5" /><p className="text-[10px] font-bold text-[#111]">{v}</p><p className="text-[7px] text-[#6B7280]">{l}</p></div>
              ))}
            </div>
          </div>))}
      </div>
    </div>
  );
}
