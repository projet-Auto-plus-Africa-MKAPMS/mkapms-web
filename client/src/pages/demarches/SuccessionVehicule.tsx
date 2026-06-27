import { Link } from "react-router-dom";
import { ChevronLeft, Users, Upload, Check } from "lucide-react";
const DOCS = ["Acte de décès", "Certificat d'hérédité", "Carte grise du véhicule", "Pièce d'identité héritier", "Justificatif domicile"];
export default function SuccessionVehicule() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-indigo-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} /> Succession véhicule</h1></div>
      <div className="px-4 mt-4 space-y-2">{DOCS.map(d => (
        <div key={d} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3"><Upload size={14} className="text-indigo-600" /><span className="flex-1 text-sm text-[#111]">{d}</span></div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl bg-indigo-700 py-3 text-sm font-bold text-white active:scale-[0.98]">Soumettre le dossier succession</button></div>
    </div>
  );
}
