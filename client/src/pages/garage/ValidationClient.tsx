import { Link } from "react-router-dom";
import { ChevronLeft, Check, X, FileText, Camera, Euro, Edit } from "lucide-react";
const DEVIS_LIGNES = [
  { label: "Plaquettes avant + disques", pieces: 120, mo: 60 },
  { label: "Filtre habitacle", pieces: 25, mo: 15 },
  { label: "Réparation direction", pieces: 180, mo: 120 },
  { label: "Pneu avant droit", pieces: 90, mo: 20 },
];
export default function ValidationClient() {
  const totalPieces = DEVIS_LIGNES.reduce((s, l) => s + l.pieces, 0);
  const totalMO = DEVIS_LIGNES.reduce((s, l) => s + l.mo, 0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Validation devis</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        {DEVIS_LIGNES.map(l => (<div key={l.label} className="flex justify-between py-2 border-b border-[#F3F4F6] text-sm"><span className="text-[#111]">{l.label}</span><span className="text-[#6B7280]">{l.pieces + l.mo} €</span></div>))}
        <div className="flex justify-between pt-2 text-sm"><span className="text-[#6B7280]">Total pièces</span><span className="font-bold">{totalPieces} €</span></div>
        <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Total main-d'œuvre</span><span className="font-bold">{totalMO} €</span></div>
        <div className="flex justify-between pt-2 border-t-2 border-[#D4AF37] text-base"><span className="font-black text-[#111]">Total TTC</span><span className="font-black text-[#D4AF37]">{totalPieces + totalMO} €</span></div>
      </div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        <button className="rounded-xl bg-green-600 py-3 text-sm font-bold text-white flex items-center justify-center gap-1 active:scale-[0.98]"><Check size={14} /> Accepter</button>
        <button className="rounded-xl bg-amber-500 py-3 text-sm font-bold text-white flex items-center justify-center gap-1 active:scale-[0.98]"><Edit size={14} /> Modifier</button>
        <button className="rounded-xl bg-red-500 py-3 text-sm font-bold text-white flex items-center justify-center gap-1 active:scale-[0.98]"><X size={14} /> Refuser</button>
      </div>
    </div>
  );
}
