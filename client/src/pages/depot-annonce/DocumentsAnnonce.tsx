import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Upload, Check, Shield } from "lucide-react";
const DOCS = [
  { label: "Carte grise", required: true, added: false },
  { label: "Contrôle technique", required: true, added: false },
  { label: "Assurance", required: false, added: false },
  { label: "Permis de conduire", required: false, added: false },
  { label: "KBIS (Pro)", required: false, added: false },
  { label: "SIRET (Pro)", required: false, added: false },
];
export default function DocumentsAnnonce() {
  const [docs, setDocs] = useState(DOCS);
  const toggle = (i: number) => setDocs(prev => prev.map((d, j) => j === i ? { ...d, added: !d.added } : d));
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/description-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Description</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Documents</h1>
        <p className="text-xs text-white/50 mt-1">Seuls les documents nécessaires sont demandés</p>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {docs.map((d, i) => (
          <button key={d.label} onClick={() => toggle(i)} className={`w-full flex items-center gap-3 rounded-xl border-2 p-3 text-left ${d.added ? "border-green-400 bg-green-50" : "border-[#E5E7EB] bg-white"}`}>
            {d.added ? <Check size={16} className="text-green-500" /> : <Upload size={16} className="text-[#D4D4D4]" />}
            <div className="flex-1"><p className="text-sm font-semibold text-[#111]">{d.label}</p></div>
            {d.required && !d.added && <span className="text-[8px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">OBLIGATOIRE</span>}
            {d.added && <span className="text-[8px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">AJOUTÉ</span>}
          </button>))}
        <div className="rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3 flex items-center gap-2"><Shield size={14} className="text-[#D4AF37]" /><p className="text-[10px] text-[#374151]">Vos documents sont vérifiés par l'IA puis validés par un humain. Jamais de validation IA seule.</p></div>
        <Link to="/depot-annonce/options-annonce" className="block w-full py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold text-center mt-2">Continuer → Options</Link>
      </div>
    </div>
  );
}
