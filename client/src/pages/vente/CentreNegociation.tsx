import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MessageSquare, Euro, Check, Clock, Send } from "lucide-react";
const HISTORIQUE = [
  { auteur: "Client", message: "Je propose 22 000 €", date: "15/03 14:30", type: "offre" },
  { auteur: "Vendeur", message: "Merci, mon prix minimum est 24 000 €", date: "15/03 15:00", type: "contre" },
  { auteur: "Client", message: "23 000 € ? Dernier prix.", date: "15/03 15:20", type: "offre" },
];
export default function CentreNegociation() {
  const [mode, setMode] = useState<"fixe"|"offre"|"nego">("nego");
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={20} className="text-[#D4AF37]" /> Négociation</h1><p className="mt-1 text-sm text-white/60">Peugeot 3008 GT — 25 000 €</p></div>
      <div className="px-4 mt-4"><h3 className="text-xs font-bold text-[#6B7280] mb-2">Mode de vente</h3><div className="flex gap-2">{(["fixe","offre","nego"] as const).map(m => (<button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${mode === m ? "bg-[#D4AF37] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>{m === "fixe" ? "Prix fixe" : m === "offre" ? "Offre acceptée" : "Négociation"}</button>))}</div></div>
      <div className="px-4 mt-4 space-y-2">{HISTORIQUE.map((h, i) => (
        <div key={i} className={`rounded-xl p-3 ${h.auteur === "Client" ? "bg-white border border-[#E5E7EB] mr-8" : "bg-[#D4AF37]/10 border border-[#D4AF37]/30 ml-8"}`}>
          <div className="flex justify-between text-[9px]"><span className="font-bold text-[#111]">{h.auteur}</span><span className="text-red-500">{h.date}</span></div>
          <p className="text-sm text-[#111] mt-1">{h.message}</p>
        </div>))}</div>
      <div className="px-4 mt-4 flex gap-2"><input type="text" placeholder="Votre offre…" className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /><button className="rounded-lg bg-[#D4AF37] px-4 py-2.5 active:scale-[0.98]"><Send size={16} className="text-white" /></button></div>
    </div>
  );
}
