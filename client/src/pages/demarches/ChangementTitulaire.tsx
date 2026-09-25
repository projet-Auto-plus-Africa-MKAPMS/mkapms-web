import { Link } from "react-router-dom";
import { ChevronLeft, Users } from "lucide-react";
import DemarcheFormulaire from "../../components/demarches/DemarcheFormulaire";
export default function ChangementTitulaire() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} /> Changement titulaire</h1></div>
      <DemarcheFormulaire code="changement-titulaire" accent="bg-blue-700" />
    </div>
  );
}
