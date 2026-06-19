import { Link } from "react-router-dom";
import { ChevronLeft, Paintbrush, Camera, FileText, Check, Clock } from "lucide-react";
const TRAVAUX = [
  { label: "Débosselage portière droite", statut: "termine", cout: 350 },
  { label: "Peinture pare-chocs avant", statut: "en_cours", cout: 280 },
  { label: "Remplacement rétroviseur", statut: "a_faire", cout: 150 },
];
export default function CarrosserieGarage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-pink-700 px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Paintbrush size={20} /> Carrosserie</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4"><h3 className="text-sm font-bold text-[#111] mb-2">Photos avant / après</h3><div className="grid grid-cols-2 gap-2"><button className="rounded-lg border-2 border-dashed border-pink-300 bg-pink-50 py-6 flex flex-col items-center gap-1"><Camera size={16} className="text-pink-600" /><span className="text-[9px]">Avant</span></button><button className="rounded-lg border-2 border-dashed border-green-300 bg-green-50 py-6 flex flex-col items-center gap-1"><Camera size={16} className="text-green-600" /><span className="text-[9px]">Après</span></button></div></div>
      <div className="px-4 mt-3 space-y-2">{TRAVAUX.map(t => (
        <div key={t.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          {t.statut === "termine" ? <Check size={14} className="text-green-600" /> : t.statut === "en_cours" ? <Clock size={14} className="text-amber-500" /> : <Clock size={14} className="text-[#9CA3AF]" />}
          <div className="flex-1"><h3 className="text-sm text-[#111]">{t.label}</h3></div><span className="text-sm font-bold text-pink-700">{t.cout} €</span>
        </div>))}</div>
    </div>
  );
}
