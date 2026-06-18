import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, AlertTriangle, MapPin, Camera, Phone, Truck } from "lucide-react";
const PANNES = ["Panne moteur", "Accident", "Crevaison", "Batterie", "Véhicule immobilisé", "Autre"];
export default function DepannageGarage() {
  const [selectedPanne, setSelectedPanne] = useState<string|null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-red-700 px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><AlertTriangle size={20} /> Dépannage urgent</h1><p className="mt-1 text-sm text-white/80">Assistance 24/7</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-center"><Phone size={20} className="mx-auto text-red-600" /><p className="text-base font-bold text-red-700 mt-1">99 70 70 50 50</p><p className="text-xs text-red-600">Appel d'urgence 24/7</p></div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#111]">Type de panne</h3>
        <div className="flex flex-wrap gap-1.5">{PANNES.map(p => (<button key={p} onClick={() => setSelectedPanne(p)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedPanne === p ? "bg-red-600 text-white" : "bg-[#F5F3EF] text-[#111]"}`}>{p}</button>))}</div>
        <div><label className="text-xs text-[#6B7280]">Votre position</label><div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5"><MapPin size={14} className="text-red-600" /><input type="text" placeholder="Géolocalisation automatique…" className="w-full bg-transparent text-sm outline-none" /></div></div>
        <div className="flex gap-2"><button className="flex-1 rounded-lg border-2 border-dashed border-red-300 bg-red-50 py-4 flex flex-col items-center gap-1"><Camera size={16} className="text-red-600" /><span className="text-[9px]">Photo 1</span></button><button className="flex-1 rounded-lg border-2 border-dashed border-red-300 bg-red-50 py-4 flex flex-col items-center gap-1"><Camera size={16} className="text-red-600" /><span className="text-[9px]">Photo 2</span></button><button className="flex-1 rounded-lg border-2 border-dashed border-red-300 bg-red-50 py-4 flex flex-col items-center gap-1"><Camera size={16} className="text-red-600" /><span className="text-[9px]">Photo 3</span></button></div>
        <button className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white active:scale-[0.98]">🚨 Demander un dépanneur</button>
        <p className="text-center text-[10px] text-[#6B7280]">Estimation tarif calculée automatiquement après localisation</p>
      </div>
    </div>
  );
}
