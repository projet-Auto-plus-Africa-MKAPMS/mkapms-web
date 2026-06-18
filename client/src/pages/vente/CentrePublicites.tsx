import { Link } from "react-router-dom";
import { ChevronLeft, Megaphone, Eye, Clock, Euro, TrendingUp } from "lucide-react";
const PUBS = [
  { annonce: "Peugeot 3008 GT", type: "Boost", duree: "7 jours", cout: 15, vues: 1250, clics: 48 },
  { annonce: "BMW 320d M Sport", type: "Urgente", duree: "3 jours", cout: 10, vues: 890, clics: 32 },
  { annonce: "Mercedes E 220d", type: "Mise en avant", duree: "14 jours", cout: 25, vues: 2100, clics: 85 },
];
export default function CentrePublicites() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Megaphone size={20} /> Publicités</h1></div>
      <div className="px-4 mt-4 space-y-2">{PUBS.map(p => (
        <div key={p.annonce} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{p.annonce}</h3><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">{p.type}</span></div>
          <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]"><div><p className="text-[#6B7280]">Durée</p><p className="font-bold">{p.duree}</p></div><div><p className="text-[#6B7280]">Coût</p><p className="font-bold">{p.cout}€</p></div><div><p className="text-[#6B7280]">Vues</p><p className="font-bold text-blue-700">{p.vues}</p></div><div><p className="text-[#6B7280]">Clics</p><p className="font-bold text-green-600">{p.clics}</p></div></div>
        </div>))}</div>
    </div>
  );
}
