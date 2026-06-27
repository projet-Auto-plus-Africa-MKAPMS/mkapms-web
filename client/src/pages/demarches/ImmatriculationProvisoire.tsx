import { Link } from "react-router-dom";
import { ChevronLeft, Car, Upload, Check } from "lucide-react";
export default function ImmatriculationProvisoire() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-purple-700 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} /> Immatriculation provisoire</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        {["Plaque / VIN", "Carte grise étrangère ou ancienne", "Pièce d'identité", "Justificatif domicile", "Assurance"].map(f => (
          <div key={f}><label className="text-xs text-[#6B7280]">{f}</label>{f.includes("Plaque") ? <input type="text" placeholder={f} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /> : <button className="mt-1 w-full rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 py-3 text-xs text-purple-700">Télécharger</button>}</div>))}
        <button className="w-full rounded-xl bg-purple-700 py-3 text-sm font-bold text-white active:scale-[0.98]">Demander WW provisoire</button>
      </div>
    </div>
  );
}
