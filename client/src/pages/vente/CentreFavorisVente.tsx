import { Link } from "react-router-dom";
import { ChevronLeft, Heart, Bell, BarChart3, Trash2 } from "lucide-react";
const FAVORIS = [
  { nom: "BMW X5 xDrive", prix: "42 000 €", km: "35 000 km", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&h=130&fit=crop" },
  { nom: "Mercedes GLC 300", prix: "38 500 €", km: "28 000 km", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=200&h=130&fit=crop" },
  { nom: "Audi Q5 S-Line", prix: "35 000 €", km: "45 000 km", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=200&h=130&fit=crop" },
];
export default function CentreFavorisVente() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Heart size={20} className="text-red-500" /> Mes favoris</h1><p className="mt-1 text-sm text-white/60">{FAVORIS.length} véhicules sauvegardés</p></div>
      <div className="px-4 mt-4 space-y-2">{FAVORIS.map(f => (
        <div key={f.nom} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden flex">
          <img src={f.photo} alt="" className="w-24 h-20 object-cover" />
          <div className="flex-1 p-3"><h3 className="text-sm font-bold text-[#111]">{f.nom}</h3><p className="text-[10px] text-[#6B7280]">{f.km}</p><p className="text-sm font-black text-[#D4AF37] mt-0.5">{f.prix}</p></div>
          <div className="flex flex-col justify-center gap-2 pr-3"><button><Bell size={14} className="text-[#D4AF37]" /></button><button><Trash2 size={14} className="text-red-500" /></button></div>
        </div>))}</div>
    </div>
  );
}
