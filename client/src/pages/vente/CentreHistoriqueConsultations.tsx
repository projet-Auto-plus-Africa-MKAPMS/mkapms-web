import { Link } from "react-router-dom";
import { ChevronLeft, Eye, Clock, Search } from "lucide-react";
const VUS = [
  { nom: "BMW X5 xDrive", date: "Aujourd'hui 14:30", prix: "42 000 €" },
  { nom: "Mercedes GLC 300", date: "Aujourd'hui 12:15", prix: "38 500 €" },
  { nom: "Peugeot 3008 GT", date: "Hier 18:45", prix: "26 000 €" },
  { nom: "Audi A6 Avant", date: "Hier 10:20", prix: "35 000 €" },
];
const RECHERCHES = ["BMW X5 diesel auto", "SUV < 30 000 €", "Mercedes GLC 2022"];
export default function CentreHistoriqueConsultations() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/tableau-de-bord" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon espace</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Eye size={20} className="text-[#D4AF37]" /> Historique consultations</h1></div>
      <div className="px-4 mt-4"><h3 className="text-sm font-bold text-[#111] mb-2">Véhicules consultés</h3>{VUS.map(v => (
        <div key={v.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-3 mb-1.5 flex items-center gap-3"><Eye size={12} className="text-[#6B7280]" /><div className="flex-1"><h4 className="text-sm font-semibold text-[#111]">{v.nom}</h4><p className="text-[9px] text-[#9CA3AF]">{v.date}</p></div><span className="text-sm font-bold text-[#D4AF37]">{v.prix}</span></div>))}</div>
      <div className="px-4 mt-4"><h3 className="text-sm font-bold text-[#111] mb-2">Recherches récentes</h3>{RECHERCHES.map(r => (
        <div key={r} className="rounded-xl bg-white border border-[#E5E7EB] p-3 mb-1.5 flex items-center gap-2"><Search size={12} className="text-[#6B7280]" /><span className="text-sm text-[#111]">{r}</span></div>))}</div>
    </div>
  );
}
