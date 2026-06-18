import { Link } from "react-router-dom";
import { ChevronLeft, Star, Check } from "lucide-react";
const ABOS = [
  { nom: "Start", prix: "49 €/mois", refs: "500", features: ["Catalogue", "Stock", "Commandes"] },
  { nom: "Premium", prix: "99 €/mois", refs: "2 000", features: ["Catalogue", "Stock", "Commandes", "Publicité", "Statistiques"] },
  { nom: "Elite", prix: "199 €/mois", refs: "Illimité", features: ["Tout inclus", "Support prioritaire", "API"] },
];
export default function AbonnementsProPieces() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Star size={20} className="text-[#D4AF37]" /> Abonnements pro</h1></div>
      <div className="px-4 mt-4 space-y-3">{ABOS.map(a => (
        <div key={a.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-base font-black text-[#111]">{a.nom}</h3><span className="text-base font-black text-[#D4AF37]">{a.prix}</span></div>
          <p className="text-[10px] text-[#6B7280]">Jusqu'à {a.refs} références</p>
          <div className="mt-2 space-y-1">{a.features.map(f => (<div key={f} className="flex items-center gap-1.5"><Check size={10} className="text-[#D4AF37]" /><span className="text-xs text-[#111]">{f}</span></div>))}</div>
          <button className="mt-3 w-full rounded-lg bg-[#D4AF37] py-2 text-sm font-bold text-white">Choisir</button>
        </div>))}</div>
    </div>
  );
}
