import { Link } from "react-router-dom";
import { ChevronLeft, Car, Wrench, Euro, Clock } from "lucide-react";
const STATS = [{ label: "Entretiens", value: "12" }, { label: "Réparations", value: "3" }, { label: "Coût total", value: "2 850 €" }, { label: "Immobilisations", value: "8 jours" }];
const INTERVENTIONS = [
  { date: "15/03/2025", type: "Révision", cout: 289 },
  { date: "10/01/2025", type: "Pneus", cout: 520 },
  { date: "15/09/2024", type: "Freinage", cout: 180 },
];
export default function DossiersFlottes() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/garage/flottes" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Flotte</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} /> Peugeot 3008</h1><p className="mt-1 text-sm text-white/80">AB-123-CD · 45 000 km</p></div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-4 gap-1.5">{STATS.map(s => (<div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-2 text-center"><p className="text-sm font-black text-blue-700">{s.value}</p><p className="text-[7px] text-[#6B7280]">{s.label}</p></div>))}</div>
      <div className="px-4 mt-3 space-y-1.5">{INTERVENTIONS.map(i => (<div key={i.date} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex justify-between"><div><p className="text-sm text-[#111]">{i.type}</p><p className="text-[9px] text-[#6B7280]">{i.date}</p></div><span className="text-sm font-bold text-blue-700">{i.cout} €</span></div>))}</div>
    </div>
  );
}
