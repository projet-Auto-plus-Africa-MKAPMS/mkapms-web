import { Link } from "react-router-dom";
import { ChevronLeft, Key } from "lucide-react";
import DemarcheFormulaire from "../../components/demarches/DemarcheFormulaire";
export default function WWGarage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gray-800 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Key size={20} /> WW Garage</h1><p className="mt-1 text-sm text-white/80">Réservé aux professionnels</p></div>
      <DemarcheFormulaire code="ww-garage" accent="bg-gray-800" />
    </div>
  );
}
