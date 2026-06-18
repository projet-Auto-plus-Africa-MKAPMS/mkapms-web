import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Star, Send } from "lucide-react";
const CRITERES = ["Vendeur", "Véhicule", "Livraison", "Service"];
export default function CentreRetourClient() {
  const [notes, setNotes] = useState<Record<string, number>>({});
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/tableau-de-bord" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon espace</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Star size={20} className="text-[#D4AF37]" /> Satisfaction achat</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-4">{CRITERES.map(c => (
        <div key={c}><p className="text-sm font-bold text-[#111] mb-1">{c}</p><div className="flex gap-1">{[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => setNotes({...notes, [c]: n})}><Star size={22} className={`transition ${(notes[c] || 0) >= n ? "text-[#D4AF37]" : "text-[#E5E7EB]"}`} fill={(notes[c] || 0) >= n ? "#D4AF37" : "none"} /></button>))}</div></div>))}
        <textarea placeholder="Commentaire (optionnel)…" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm h-20" />
        <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98]"><Send size={14} /> Envoyer mon avis</button>
      </div>
    </div>
  );
}
