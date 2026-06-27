import { Link } from "react-router-dom";
import { ChevronLeft, Wrench, Check, Clock, User, Calendar } from "lucide-react";
const REPARATIONS = [
  { desc: "Remplacement plaquettes avant", pieces: "Plaquettes Bosch", mo: 1.5, tech: "Ahmed B.", date: "14/03", cout: 180, fait: true },
  { desc: "Changement pneu AR gauche", pieces: "Michelin 225/45 R18", mo: 0.5, tech: "Ahmed B.", date: "14/03", cout: 120, fait: true },
  { desc: "Débosselage portière droite", pieces: "-", mo: 3, tech: "Paul M.", date: "15/03", cout: 350, fait: false },
];
export default function CentreReparations() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/stock" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Stock</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} /> Centre Réparations</h1></div>
      <div className="px-4 mt-4 space-y-2">{REPARATIONS.map((r, i) => (
        <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between items-start"><h3 className="text-sm font-bold text-[#111]">{r.desc}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${r.fait ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{r.fait ? "Terminé" : "En cours"}</span></div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-[#6B7280]"><p>Pièces: {r.pieces}</p><p>Main-d'œuvre: {r.mo}h</p><p>Technicien: {r.tech}</p><p>Date: {r.date}</p></div>
          <p className="mt-1 text-sm font-bold text-blue-800 text-right">{r.cout} €</p>
        </div>))}</div>
    </div>
  );
}
