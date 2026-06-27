import { Link } from "react-router-dom";
import { ChevronLeft, Camera, Check, FileText } from "lucide-react";
const PHOTOS = ["Avant gauche", "Avant droite", "Arrière gauche", "Arrière droite", "Intérieur"];
export default function ReceptionVehicule() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Réception véhicule</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111]">Fiche réception</h3>
        {["Plaque", "Marque / Modèle", "Kilométrage", "Observations"].map(f => (<div key={f}><label className="text-xs text-[#6B7280]">{f}</label><input type="text" placeholder={f} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>))}
        <h3 className="text-sm font-bold text-[#111] pt-2">Photos obligatoires</h3>
        <div className="grid grid-cols-3 gap-2">{PHOTOS.map(p => (<button key={p} className="rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 py-6 flex flex-col items-center gap-1"><Camera size={16} className="text-[#D4AF37]" /><span className="text-[8px] font-semibold text-[#111]">{p}</span></button>))}</div>
        <h3 className="text-sm font-bold text-[#111] pt-2">Signature client</h3>
        <div className="rounded-lg border-2 border-dashed border-[#E5E7EB] h-24 flex items-center justify-center text-xs text-red-500">Signer ici</div>
        <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Valider la réception</button>
      </div>
    </div>
  );
}
