import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Copy, Check } from "lucide-react";
const MOTIFS = ["Perte", "Vol", "Détérioration"];
export default function DuplicataDemarche() {
  const [motif, setMotif] = useState(0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-orange-600 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Copy size={20} /> Duplicata</h1></div>
      <div className="px-4 mt-4 flex gap-2">{MOTIFS.map((m, i) => (<button key={m} onClick={() => setMotif(i)} className={`flex-1 rounded-lg py-2.5 text-xs font-bold ${motif === i ? "bg-orange-600 text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>{m}</button>))}</div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <div><label className="text-xs text-[#6B7280]">Plaque d'immatriculation</label><input type="text" placeholder="AB-123-CD" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div><label className="text-xs text-[#6B7280]">Pièce d'identité</label><button className="mt-1 w-full rounded-lg border-2 border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/5 py-4 text-xs text-[#D4AF37]">Télécharger</button></div>
        <button className="w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white active:scale-[0.98]">Demander le duplicata</button>
      </div>
    </div>
  );
}
