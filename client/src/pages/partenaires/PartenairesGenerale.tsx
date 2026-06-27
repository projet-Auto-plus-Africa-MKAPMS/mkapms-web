import { Link } from "react-router-dom";
import { Users, Wrench, Car, Home, Truck, Shield, Package, Paintbrush, MapPin, ChevronRight, Phone } from "lucide-react";
const CATS = [
  { label: "Garages", icon: Wrench, to: "/partenaires/inscription" },
  { label: "Vendeurs VO", icon: Car, to: "/partenaires/inscription" },
  { label: "Loueurs", icon: Home, to: "/partenaires/inscription" },
  { label: "Dépanneurs", icon: Truck, to: "/partenaires/inscription" },
  { label: "Centres CT", icon: Shield, to: "/partenaires/inscription" },
  { label: "Transporteurs", icon: Truck, to: "/partenaires/inscription" },
  { label: "Vendeurs pièces", icon: Package, to: "/partenaires/inscription" },
  { label: "Préparateurs", icon: Paintbrush, to: "/partenaires/inscription" },
];
export default function PartenairesGenerale() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6"><h1 className="text-2xl font-black text-white flex items-center gap-2"><Users size={22} className="text-[#D4AF37]" /> Partenaires <span className="text-[#D4AF37]">MKA.P-MS</span></h1><p className="mt-1 text-sm text-white/60">Rejoignez le réseau automobile #1</p></div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-2 gap-2">{CATS.map(c => { const Icon = c.icon; return (
        <Link key={c.label} to={c.to} className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center active:scale-[0.98] shadow-sm"><div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-[#D4AF37]"><Icon size={18} className="text-white" /></div><p className="text-xs font-bold text-[#111] mt-2">{c.label}</p></Link>); })}</div>
    </div>
  );
}
