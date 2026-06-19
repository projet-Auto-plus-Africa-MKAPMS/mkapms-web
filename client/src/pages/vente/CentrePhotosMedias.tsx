import { Link } from "react-router-dom";
import { ChevronLeft, Camera, Check, Upload, Video } from "lucide-react";
const ZONES = ["Avant gauche", "Avant droite", "Arrière gauche", "Arrière droite", "Intérieur", "Tableau de bord", "Coffre", "Moteur"];
export default function CentrePhotosMedias() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/stock" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Stock</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Camera size={20} /> Photos & Médias</h1><p className="mt-1 text-sm text-white/80">8 photos obligatoires avant publication</p></div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">{ZONES.map((z, i) => (
        <button key={z} className={`rounded-xl border-2 border-dashed py-8 flex flex-col items-center gap-2 ${i < 5 ? "border-green-300 bg-green-50" : "border-blue-300 bg-blue-50"}`}>
          {i < 5 ? <Check size={20} className="text-green-600" /> : <Camera size={20} className="text-blue-600" />}
          <span className="text-xs font-semibold text-[#111]">{z}</span>
          <span className="text-[9px] text-red-500">{i < 5 ? "Uploadée" : "Obligatoire"}</span>
        </button>))}</div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3"><Video size={16} className="text-blue-600" /><div className="flex-1"><p className="text-sm font-bold text-[#111]">Vidéo (optionnel)</p><p className="text-[10px] text-[#6B7280]">Disponible selon abonnement</p></div><Upload size={14} className="text-red-500" /></div>
      <div className="px-4 mt-4"><button className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98]">Valider les photos</button></div>
    </div>
  );
}
