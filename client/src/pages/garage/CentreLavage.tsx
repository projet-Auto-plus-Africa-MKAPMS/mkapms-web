import { Link } from "react-router-dom";
import { ChevronLeft, Droplets, Camera, Star, Check } from "lucide-react";
const FORMULES = [
  { label: "Intérieur", prix: "25 €", details: "Aspirateur + plastiques + vitres" },
  { label: "Extérieur", prix: "15 €", details: "Lavage + séchage + jantes" },
  { label: "Premium", prix: "49 €", details: "Int. + ext. + cire + parfum" },
  { label: "Detailing", prix: "149 €", details: "Polissage + céramique + cuir" },
];
export default function CentreLavage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-cyan-700 px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Droplets size={20} /> Centre lavage</h1></div>
      <div className="px-4 mt-4 space-y-2">{FORMULES.map(f => (
        <div key={f.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{f.label}</h3><span className="text-base font-black text-cyan-700">{f.prix}</span></div>
          <p className="text-[10px] text-[#6B7280] mt-0.5">{f.details}</p>
          <button className="mt-2 w-full rounded-lg bg-cyan-700 py-2 text-xs font-bold text-white">Réserver</button>
        </div>))}</div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-3"><h3 className="text-xs font-bold text-[#111]">Photos avant / après</h3><div className="mt-1.5 grid grid-cols-2 gap-2"><button className="rounded-lg border-2 border-dashed border-cyan-300 bg-cyan-50 py-4 text-[9px] text-cyan-700 flex items-center justify-center gap-1"><Camera size={12} /> Avant</button><button className="rounded-lg border-2 border-dashed border-green-300 bg-green-50 py-4 text-[9px] text-green-700 flex items-center justify-center gap-1"><Camera size={12} /> Après</button></div></div>
    </div>
  );
}
