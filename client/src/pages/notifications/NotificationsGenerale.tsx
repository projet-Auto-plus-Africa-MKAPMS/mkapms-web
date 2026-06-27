import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ShoppingCart, Home, Wrench, FileText, Euro, Truck, MessageSquare, ChevronRight } from "lucide-react";
const CATS = [
  { label: "Vente", icon: ShoppingCart, count: 3 }, { label: "Location", icon: Home, count: 1 },
  { label: "Garage", icon: Wrench, count: 2 }, { label: "Démarches", icon: FileText, count: 1 },
  { label: "Paiements", icon: Euro, count: 0 }, { label: "Dépannage", icon: Truck, count: 0 },
  { label: "Messages", icon: MessageSquare, count: 4 },
];
export default function NotificationsGenerale() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6"><h1 className="text-2xl font-black text-white flex items-center gap-2"><Bell size={22} className="text-[#D4AF37]" /> Notifications</h1><p className="mt-1 text-sm text-white/60">{CATS.reduce((s, c) => s + c.count, 0)} non lues</p></div>
      <div className="px-4 -mt-3 relative z-10 space-y-1.5">{CATS.map(c => { const Icon = c.icon; return (
        <div key={c.label} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3"><Icon size={16} className="text-[#D4AF37]" /><span className="flex-1 text-sm font-semibold text-[#111]">{c.label}</span>{c.count > 0 && <span className="bg-[#D4AF37] text-white text-[9px] font-bold rounded-full h-5 w-5 flex items-center justify-center">{c.count}</span>}</div>); })}</div>
    </div>
  );
}
