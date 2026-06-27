import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Sparkles, Wand2 } from "lucide-react";

export default function DescriptionAnnonce() {
  const [text, setText] = useState("");
  const [improved, setImproved] = useState(false);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/videos-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vidéos</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Description</h1>
      </div>
      <div className="px-4 mt-4 space-y-3">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-sm">
          <label className="text-[10px] font-bold text-[#6B7280] uppercase">Description de votre annonce</label>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder="Décrivez votre véhicule : historique, entretien, options, état..." className="w-full mt-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm resize-none" />
          <p className="text-[9px] text-[#6B7280] mt-1">{text.length} caractères</p>
        </div>
        <button onClick={() => setImproved(true)} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#111] text-white py-3 text-xs font-bold"><Wand2 size={14} className="text-[#D4AF37]" /> Améliorer avec l'IA</button>
        {improved && <div className="rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3">
          <div className="flex items-center gap-2 mb-2"><Sparkles size={14} className="text-[#D4AF37]" /><p className="text-xs font-bold text-[#D4AF37]">Suggestions IA</p></div>
          <ul className="space-y-1">{["Ajouter le nombre de propriétaires", "Mentionner la dernière révision", "Préciser les options (GPS, caméra, etc.)", "Ajouter l'historique d'entretien"].map(s => (<li key={s} className="text-[10px] text-[#374151] flex items-center gap-1.5"><span className="text-[#D4AF37]">→</span> {s}</li>))}</ul>
        </div>}
        <Link to="/depot-annonce/documents-annonce" className="block w-full py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold text-center">Continuer → Documents</Link>
      </div>
    </div>
  );
}
