import { Link } from "react-router-dom";
import { ChevronLeft, MapPin, Upload, Check } from "lucide-react";
export default function ChangementAdresse() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-cyan-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><MapPin size={20} /> Changement adresse</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <div><label className="text-xs text-[#6B7280]">Nouvelle adresse</label><input type="text" placeholder="Adresse complète" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div><label className="text-xs text-[#6B7280]">Code postal</label><input type="text" placeholder="75000" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div><label className="text-xs text-[#6B7280]">Ville</label><input type="text" placeholder="Paris" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div><label className="text-xs text-[#6B7280]">Justificatif domicile</label><button className="mt-1 w-full rounded-lg border-2 border-dashed border-cyan-400 bg-cyan-50 py-4 text-xs text-cyan-700">Télécharger</button></div>
        <button className="w-full rounded-xl bg-cyan-700 py-3 text-sm font-bold text-white active:scale-[0.98]">Valider le changement</button>
      </div>
    </div>
  );
}
