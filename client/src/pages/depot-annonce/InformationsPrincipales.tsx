import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";
const FIELDS = [
  { label: "Kilométrage", placeholder: "ex: 45 000 km", type: "number" },
  { label: "Prix", placeholder: "ex: 15 900 €", type: "number" },
  { label: "Couleur", placeholder: "ex: Gris Artense", type: "text" },
  { label: "Boîte de vitesse", placeholder: "Manuelle / Automatique", type: "text" },
  { label: "Nombre de portes", placeholder: "3 / 5", type: "number" },
  { label: "Nombre de places", placeholder: "5", type: "number" },
  { label: "État du véhicule", placeholder: "Excellent / Bon / Correct", type: "text" },
  { label: "Puissance fiscale", placeholder: "ex: 7 CV", type: "number" },
  { label: "Puissance DIN", placeholder: "ex: 130 ch", type: "number" },
];
export default function InformationsPrincipales() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/identification-vehicule" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Identification</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Informations véhicule</h1>
      </div>
      <div className="px-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm space-y-3">
        {FIELDS.map(f => (<div key={f.label}><label className="text-[10px] font-bold text-[#6B7280] uppercase">{f.label}</label><input type={f.type} placeholder={f.placeholder} className="w-full mt-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>))}
        <Link to="/depot-annonce/photos-vehicule" className="block w-full py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold text-center mt-4">Continuer → Photos</Link>
      </div>
    </div>
  );
}
