import { Link } from "react-router-dom";
import { ChevronLeft, Wrench, User, Clock, Check } from "lucide-react";
const TRAVAUX = [
  { label: "Plaquettes + disques avant", mecanicien: "Ahmed B.", pont: "Pont 2", debut: "10:00", duree: "2h", statut: "termine" },
  { label: "Filtre habitacle", mecanicien: "Ahmed B.", pont: "Pont 2", debut: "12:00", duree: "15 min", statut: "termine" },
  { label: "Réparation direction", mecanicien: "Paul M.", pont: "Pont 3", debut: "14:00", duree: "3h", statut: "en_cours" },
  { label: "Pneu avant droit", mecanicien: "Jean D.", pont: "Pont 1", debut: "15:00", duree: "30 min", statut: "a_faire" },
];
export default function OrdreReparation() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Ordre de réparation</h1><p className="mt-1 text-sm text-white/60">OR-2025-0142 · Peugeot 3008 GT</p></div>
      <div className="px-4 mt-4 space-y-2">{TRAVAUX.map(t => (
        <div key={t.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{t.label}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${t.statut === "termine" ? "bg-green-50 text-green-600" : t.statut === "en_cours" ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-[#9CA3AF]"}`}>{t.statut === "termine" ? "Terminé" : t.statut === "en_cours" ? "En cours" : "À faire"}</span></div>
          <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-[#6B7280]"><p>Mécanicien: {t.mecanicien}</p><p>Pont: {t.pont}</p><p>Début: {t.debut}</p><p>Durée: {t.duree}</p></div>
        </div>))}</div>
    </div>
  );
}
