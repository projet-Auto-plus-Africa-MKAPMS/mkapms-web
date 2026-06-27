import { Link } from "react-router-dom";
import { ChevronLeft, TrendingUp, Award, MapPin, Car } from "lucide-react";
const DATA = [
  { titre: "Meilleurs vendeurs", items: [{ label: "Ahmed B.", value: "12 ventes" }, { label: "Jean D.", value: "8 ventes" }] },
  { titre: "Meilleurs véhicules", items: [{ label: "Peugeot 3008", value: "5 ventes" }, { label: "BMW Série 3", value: "4 ventes" }] },
  { titre: "Meilleures catégories", items: [{ label: "SUV", value: "42%" }, { label: "Berlines", value: "28%" }] },
  { titre: "Meilleures villes", items: [{ label: "Paris", value: "35%" }, { label: "Lyon", value: "22%" }] },
];
export default function CentrePerformances() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><TrendingUp size={20} /> Performances</h1></div>
      <div className="px-4 mt-4 space-y-3">{DATA.map(d => (
        <div key={d.titre} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111] mb-2">{d.titre}</h3>
          {d.items.map((it, i) => (<div key={i} className="flex justify-between py-1.5 border-b border-[#F3F4F6] last:border-0"><span className="text-sm text-[#6B7280]">{i + 1}. {it.label}</span><span className="text-sm font-bold text-blue-700">{it.value}</span></div>))}
        </div>))}</div>
    </div>
  );
}
