import { Link } from "react-router-dom";
import { ChevronLeft, MessageSquare, Send } from "lucide-react";
const MESSAGES = [
  { de: "MKA.P-MS", msg: "Votre dossier est en cours de traitement.", date: "15/03 14:30" },
  { de: "Vous", msg: "Merci, quand sera-t-il finalisé ?", date: "15/03 15:00" },
  { de: "MKA.P-MS", msg: "Comptez 48h ouvrées. Un document complémentaire est nécessaire.", date: "15/03 15:15" },
];
export default function MessagerieDemarches() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><MessageSquare size={20} className="text-[#D4AF37]" /> Messagerie</h1></div>
      <div className="px-4 mt-4 space-y-2">{MESSAGES.map((m, i) => (
        <div key={i} className={`rounded-xl p-3 ${m.de === "Vous" ? "bg-white border border-[#E5E7EB] mr-8" : "bg-[#D4AF37]/10 border border-[#D4AF37]/30 ml-8"}`}>
          <div className="flex justify-between text-[9px]"><span className="font-bold text-[#111]">{m.de}</span><span className="text-red-500">{m.date}</span></div>
          <p className="text-sm text-[#111] mt-1">{m.msg}</p>
        </div>))}</div>
      <div className="px-4 mt-3 flex gap-2"><input type="text" placeholder="Votre message…" className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" /><button className="rounded-lg bg-[#D4AF37] px-4 py-2.5"><Send size={16} className="text-white" /></button></div>
    </div>
  );
}
