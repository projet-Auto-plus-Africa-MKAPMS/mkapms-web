import { Link } from "react-router-dom";
import { User, Car, ShoppingCart, Home, Wrench, FileText, Euro, Heart, MessageSquare, ChevronRight, Phone } from "lucide-react";
const MENUS = [
  { label: "Mon profil", icon: User, to: "/utilisateurs/profil" }, { label: "Mes véhicules", icon: Car, to: "/utilisateurs/vehicules" },
  { label: "Mes achats", icon: ShoppingCart, to: "/utilisateurs/achats" }, { label: "Mes locations", icon: Home, to: "/utilisateurs/locations" },
  { label: "Mes réparations", icon: Wrench, to: "/utilisateurs/reparations" }, { label: "Mes démarches", icon: FileText, to: "/utilisateurs/demarches-historique" },
  { label: "Mes paiements", icon: Euro, to: "/utilisateurs/paiements" }, { label: "Mes documents", icon: FileText, to: "/utilisateurs/documents" },
  { label: "Mes favoris", icon: Heart, to: "/utilisateurs/favoris" }, { label: "Mes messages", icon: MessageSquare, to: "/utilisateurs/messages" },
];
export default function CompteParticulier() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6"><h1 className="text-2xl font-black text-white flex items-center gap-2"><User size={22} className="text-[#D4AF37]" /> Mon compte</h1><p className="mt-1 text-sm text-white/60">Jean Dupont · Particulier</p></div>
      <div className="px-4 -mt-3 relative z-10 space-y-1.5">{MENUS.map(m => { const Icon = m.icon; return (
        <Link key={m.label} to={m.to} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 active:scale-[0.99]"><Icon size={16} className="text-[#D4AF37]" /><span className="flex-1 text-sm font-semibold text-[#111]">{m.label}</span><ChevronRight size={14} className="text-red-500" /></Link>); })}</div>
    </div>
  );
}
