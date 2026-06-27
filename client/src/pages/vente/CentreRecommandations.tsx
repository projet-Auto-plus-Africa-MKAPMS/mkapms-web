import { Link } from "react-router-dom";
import { ChevronLeft, Sparkles, ChevronRight } from "lucide-react";
const SECTIONS = [
  { titre: "Véhicules similaires", items: [{ nom: "BMW X3 xDrive", prix: "34 000 €" }, { nom: "Mercedes GLC", prix: "38 000 €" }] },
  { titre: "Alternatives moins chères", items: [{ nom: "Peugeot 3008", prix: "26 000 €" }, { nom: "Renault Arkana", prix: "24 500 €" }] },
  { titre: "Alternatives plus récentes", items: [{ nom: "BMW X5 2024", prix: "52 000 €" }, { nom: "Audi Q5 2024", prix: "48 000 €" }] },
];
export default function CentreRecommandations() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Sparkles size={20} className="text-[#D4AF37]" /> Recommandations</h1></div>
      <div className="px-4 mt-4 space-y-4">{SECTIONS.map(s => (
        <div key={s.titre}><h3 className="text-sm font-bold text-[#111] mb-2">{s.titre}</h3>{s.items.map(it => (
          <div key={it.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-3 mb-1.5 flex items-center gap-3"><div className="flex-1"><h4 className="text-sm font-semibold text-[#111]">{it.nom}</h4></div><span className="text-sm font-bold text-[#D4AF37]">{it.prix}</span><ChevronRight size={14} className="text-red-500" /></div>))}</div>))}</div>
    </div>
  );
}
