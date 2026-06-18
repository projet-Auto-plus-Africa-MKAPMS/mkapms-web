import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Check, Search, AlertTriangle } from "lucide-react";
export default function VerificationCompatibilite() {
  const [result, setResult] = useState<"none"|"ok"|"ko">("none");
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Check size={20} className="text-[#D4AF37]" /> Vérification compatibilité</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
        <div><label className="text-xs text-[#6B7280]">Plaque ou VIN</label><input type="text" placeholder="AB-123-CD ou VF3XXX…" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <div><label className="text-xs text-[#6B7280]">Référence pièce</label><input type="text" placeholder="BOS-0986494" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /></div>
        <button onClick={() => setResult("ok")} className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2"><Search size={14} /> Vérifier</button>
      </div>
      {result === "ok" && <div className="mx-4 mt-3 rounded-xl bg-green-50 border border-green-200 p-4 text-center"><Check size={20} className="mx-auto text-green-600" /><p className="text-sm font-bold text-green-700 mt-1">Compatible !</p></div>}
    </div>
  );
}
