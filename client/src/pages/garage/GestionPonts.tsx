import { Link } from "react-router-dom";
import { ChevronLeft, Layers, Check, Clock, AlertTriangle } from "lucide-react";
const PONTS = [
  { num: 1, type: "2 colonnes", etat: "Disponible", vehicule: null },
  { num: 2, type: "4 colonnes", etat: "Occupé", vehicule: "Peugeot 3008 — Ahmed B." },
  { num: 3, type: "Ciseaux", etat: "Maintenance", vehicule: null },
  { num: 4, type: "2 colonnes", etat: "Occupé", vehicule: "BMW 320d — Paul M." },
];
export default function GestionPonts() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Layers size={20} className="text-[#D4AF37]" /> Gestion des ponts</h1></div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">{PONTS.map(p => (
        <div key={p.num} className={`rounded-xl bg-white border-2 p-4 text-center ${p.etat === "Disponible" ? "border-green-300" : p.etat === "Occupé" ? "border-amber-300" : "border-red-300"}`}>
          <p className="text-2xl font-black text-[#111]">{p.num}</p>
          <p className="text-[10px] text-[#6B7280]">{p.type}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${p.etat === "Disponible" ? "bg-green-50 text-green-600" : p.etat === "Occupé" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>{p.etat}</span>
          {p.vehicule && <p className="text-[9px] text-[#6B7280] mt-1">{p.vehicule}</p>}
        </div>))}</div>
    </div>
  );
}
