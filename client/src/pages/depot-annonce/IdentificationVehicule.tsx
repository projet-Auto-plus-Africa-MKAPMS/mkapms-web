import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Car, Check, Sparkles } from "lucide-react";
import VehicleIdentification from "../../components/VehicleIdentification";

export default function IdentificationVehicule() {
  const [found, setFound] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Depot annonce</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Identification vehicule</h1>
        <p className="mt-1 text-xs text-white/50 flex items-center gap-1"><Sparkles size={10} /> Remplissage automatique en 2 secondes</p>
      </div>
      <div className="px-4 mt-4">
        <VehicleIdentification onVehicleFound={() => setFound(true)} />
        {found && (
          <Link to="/depot-annonce/informations-principales" className="mt-4 block w-full py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold text-center active:scale-[0.98] shadow-lg">
            <Check size={14} className="inline mr-1" /> Continuer avec ce vehicule
          </Link>
        )}
      </div>
    </div>
  );
}
