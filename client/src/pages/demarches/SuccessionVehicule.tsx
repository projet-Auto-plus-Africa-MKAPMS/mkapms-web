import { Link } from "react-router-dom";
import { ChevronLeft, Users } from "lucide-react";
import DemarcheFormulaire from "../../components/demarches/DemarcheFormulaire";
export default function SuccessionVehicule() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-indigo-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} /> Succession véhicule</h1></div>
      <DemarcheFormulaire code="succession-vehicule" accent="bg-indigo-700" />
    </div>
  );
}
