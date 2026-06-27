import { Link } from "react-router-dom";
import { Package, Search, Settings, Circle, Battery, Droplets, Headphones, Paintbrush, Lightbulb, Disc, Cog, Phone, Star, MapPin } from "lucide-react";
const CATS = [
  { label: "Pièces auto", icon: Settings, to: "/pieces/moteur", color: "bg-[#D4AF37]" },
  { label: "Pneus", icon: Circle, to: "/pieces/pneumatiques", color: "bg-gray-700" },
  { label: "Batteries", icon: Battery, to: "/pieces/batteries", color: "bg-green-600" },
  { label: "Huiles", icon: Droplets, to: "/pieces/huiles", color: "bg-amber-600" },
  { label: "Accessoires", icon: Headphones, to: "/pieces/accessoires", color: "bg-purple-600" },
  { label: "Carrosserie", icon: Paintbrush, to: "/pieces/carrosserie", color: "bg-pink-600" },
  { label: "Éclairage", icon: Lightbulb, to: "/pieces/eclairage", color: "bg-yellow-500" },
  { label: "Freinage", icon: Disc, to: "/pieces/freinage", color: "bg-red-600" },
  { label: "Suspension", icon: Cog, to: "/pieces/suspension", color: "bg-blue-600" },
  { label: "Moteur", icon: Settings, to: "/pieces/moteur", color: "bg-orange-600" },
];
export default function PiecesGenerale() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Package size={22} className="text-[#D4AF37]" /> Pièces <span className="text-[#D4AF37]">MKA.P-MS</span></h1>
        <p className="mt-1 text-sm text-white/60">Auto · Pneus · Batteries · Huiles · Accessoires</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 mb-3"><div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Plaque, VIN ou référence…" className="w-full bg-transparent text-sm outline-none" /></div></div>
      <div className="px-4 grid grid-cols-2 gap-2">{CATS.map(c => { const Icon = c.icon; return (
        <Link key={c.label} to={c.to} className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center active:scale-[0.98] shadow-sm">
          <div className={`flex h-10 w-10 mx-auto items-center justify-center rounded-lg ${c.color}`}><Icon size={18} className="text-white" /></div>
          <p className="text-xs font-bold text-[#111] mt-2">{c.label}</p>
        </Link>); })}</div>
      <div className="mx-4 mt-6 rounded-xl bg-[#111] p-4 text-center"><p className="text-sm font-bold text-white">99 70 70 50 50</p><p className="text-xs text-[#D4AF37] mt-0.5">7/7 de 8h à 20h</p></div>
    </div>
  );
}
