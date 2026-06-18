import { Link } from "react-router-dom";
import { ChevronLeft, Search, BarChart3, Clock, ShoppingCart, FileText, Euro, Truck, Star, Check } from "lucide-react";
const PARCOURS = [
  { label: "Trouver", icon: Search, desc: "Recherche, filtres, univers" },
  { label: "Comparer", icon: BarChart3, desc: "Multi-véhicules, alternatives" },
  { label: "Réserver", icon: Clock, desc: "24h à 7 jours, acompte" },
  { label: "Acheter", icon: ShoppingCart, desc: "Paiement sécurisé, financement" },
  { label: "Signer", icon: FileText, desc: "Contrat numérique" },
  { label: "Payer", icon: Euro, desc: "Comptant, fractionné, LOA" },
  { label: "Recevoir", icon: Truck, desc: "Livraison 5 modes" },
  { label: "Évaluer", icon: Star, desc: "Satisfaction, notation" },
];
export default function WorkflowCompletAcheteur() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white">Parcours acheteur <span className="text-[#D4AF37]">MKA.P-MS</span></h1><p className="mt-1 text-sm text-white/60">8 étapes — Sans quitter la plateforme</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">{PARCOURS.map((p, i) => { const Icon = p.icon; return (
        <div key={i} className="flex items-start gap-3"><div className="flex flex-col items-center"><div className="h-10 w-10 rounded-full bg-[#D4AF37] flex items-center justify-center"><Icon size={16} className="text-white" /></div>{i < PARCOURS.length - 1 && <div className="w-0.5 h-6 bg-[#D4AF37]/30" />}</div><div className="pb-4"><p className="text-sm font-bold text-[#111]">{p.label}</p><p className="text-[10px] text-[#6B7280]">{p.desc}</p></div></div>); })}</div>
    </div>
  );
}
