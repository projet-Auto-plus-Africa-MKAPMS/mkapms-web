import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check, MapPin, Car } from "lucide-react";
const FONCTIONS = ["Géolocalisation contractuelle", "Statut véhicule", "Protection impayés", "Activation selon contrat signé"];
export default function GarantieSecurite() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Garantie sécurité</h1><p className="mt-1 text-sm text-white/60">Pour LOA et paiement fractionné</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">{FONCTIONS.map(f => (<div key={f} className="flex items-center gap-2"><Check size={12} className="text-[#D4AF37]" /><span className="text-sm text-[#111]">{f}</span></div>))}</div>
    </div>
  );
}
