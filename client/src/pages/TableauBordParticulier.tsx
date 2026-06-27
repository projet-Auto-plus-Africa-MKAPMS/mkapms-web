import { Link } from "react-router-dom";
import { ChevronLeft, ShoppingCart, Tag, FileText, Heart, MessageSquare, Package, History, CreditCard, Car, Truck, HelpCircle, ChevronRight, User, Bell, Settings } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   2. TABLEAU DE BORD PARTICULIER
   Acheter, Vendre, Annonces, Favoris, Messages, Achats, Documents, etc.
   ══════════════════════════════════════════════════════════════════════════ */

const SECTIONS = [
  { label: "Acheter un véhicule", icon: ShoppingCart, to: "/acheter", color: "bg-[#D4AF37]", count: null },
  { label: "Vendre mon véhicule", icon: Tag, to: "/acheter/depot-annonce", color: "bg-green-600", count: null },
  { label: "Mes annonces", icon: FileText, to: "/acheter/mes-annonces", color: "bg-blue-600", count: 2 },
  { label: "Mes favoris", icon: Heart, to: "/louer/favoris", color: "bg-red-500", count: 5 },
  { label: "Mes messages", icon: MessageSquare, to: "/messagerie", color: "bg-purple-600", count: 3 },
  { label: "Mes achats", icon: Package, to: "/acheter/mes-achats", color: "bg-orange-600", count: 1 },
  { label: "Mes documents", icon: FileText, to: "/documents", color: "bg-teal-600", count: null },
  { label: "Historique véhicule", icon: History, to: "/acheter/historique-vehicule", color: "bg-indigo-600", count: null },
  { label: "Carte grise", icon: CreditCard, to: "/carte-grise", color: "bg-[#111]", count: null },
  { label: "Mes locations", icon: Car, to: "/louer/historique", color: "bg-amber-600", count: null },
  { label: "Livraison", icon: Truck, to: "/louer/livraison", color: "bg-cyan-600", count: null },
  { label: "Support", icon: HelpCircle, to: "/support", color: "bg-gray-600", count: null },
];

export default function TableauBordParticulier() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Accueil</Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Mon espace</h1>
            <p className="text-sm text-white/60">Compte particulier</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative h-9 w-9 rounded-full bg-white/10 flex items-center justify-center"><Bell size={16} className="text-white" /><span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">3</span></Link>
            <Link to="/profil" className="h-9 w-9 rounded-full bg-[#D4AF37] flex items-center justify-center"><User size={16} className="text-white" /></Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-2 gap-2">
        <Link to="/acheter" className="rounded-xl bg-[#D4AF37] p-4 text-center active:scale-[0.98] transition shadow-md">
          <ShoppingCart size={20} className="mx-auto text-white" />
          <p className="text-sm font-bold text-white mt-1">Acheter</p>
        </Link>
        <Link to="/acheter/depot-annonce" className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center active:scale-[0.98] transition shadow-md">
          <Tag size={20} className="mx-auto text-[#D4AF37]" />
          <p className="text-sm font-bold text-[#111] mt-1">Vendre</p>
        </Link>
      </div>

      {/* Menu */}
      <div className="px-4 mt-4 space-y-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={s.to} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3.5 active:scale-[0.99] transition">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.color}`}><Icon size={16} className="text-white" /></div>
              <span className="flex-1 text-sm font-semibold text-[#111]">{s.label}</span>
              {s.count !== null && <span className="rounded-full bg-red-500 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[9px] font-bold text-white">{s.count}</span>}
              <ChevronRight size={16} className="text-red-500" />
            </Link>
          );
        })}
      </div>

      {/* Passer en pro */}
      <div className="mx-4 mt-6 rounded-xl bg-gradient-to-r from-blue-800 to-blue-900 p-4">
        <h3 className="text-sm font-bold text-white">Vous êtes professionnel ?</h3>
        <p className="text-[10px] text-white/60 mt-0.5">Passez en compte pro pour débloquer la gestion de stock, les statistiques et la visibilité premium.</p>
        <Link to="/acheter/inscription-pro" className="mt-3 inline-block rounded-lg bg-white px-4 py-2 text-xs font-bold text-blue-800 active:scale-[0.98]">Passer en compte pro</Link>
      </div>
    </div>
  );
}
