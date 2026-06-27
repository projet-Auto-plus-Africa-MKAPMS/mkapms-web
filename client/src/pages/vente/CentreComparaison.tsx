import { Link } from "react-router-dom";
import { ChevronLeft, Check, X, BarChart3 } from "lucide-react";
const VEHICULES = [
  { nom: "BMW Série 5", prix: "38 500 €", km: "45 000", puissance: "190 ch", conso: "5.2 L/100", boite: "Auto", annee: "2022", equip: ["GPS", "Cuir", "Caméra", "LED", "Régulateur"] },
  { nom: "Mercedes Classe E", prix: "42 000 €", km: "38 000", puissance: "194 ch", conso: "5.0 L/100", boite: "Auto", annee: "2022", equip: ["GPS", "Cuir", "Caméra", "LED", "Toit ouvrant"] },
  { nom: "Audi A6", prix: "40 000 €", km: "42 000", puissance: "204 ch", conso: "5.4 L/100", boite: "Auto", annee: "2021", equip: ["GPS", "Cuir", "Caméra", "Matrix LED", "Régulateur"] },
];
const CRITERES = ["Prix", "Kilométrage", "Puissance", "Consommation", "Boîte", "Année"];
export default function CentreComparaison() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Comparateur</h1></div>
      <div className="px-4 mt-4 overflow-x-auto"><table className="w-full text-xs">
        <thead><tr className="border-b border-[#E5E7EB]"><th className="py-2 text-left text-[#6B7280] font-normal w-24"></th>{VEHICULES.map(v => (<th key={v.nom} className="py-2 px-2 text-center font-bold text-[#111]">{v.nom}</th>))}</tr></thead>
        <tbody>{CRITERES.map((c, i) => (<tr key={c} className="border-b border-[#F3F4F6]"><td className="py-2 text-[#6B7280]">{c}</td>{VEHICULES.map(v => { const vals = [v.prix, v.km + " km", v.puissance, v.conso, v.boite, v.annee]; return <td key={v.nom} className="py-2 px-2 text-center font-semibold text-[#111]">{vals[i]}</td>; })}</tr>))}
        <tr><td className="py-2 text-[#6B7280]">Équip.</td>{VEHICULES.map(v => (<td key={v.nom} className="py-2 px-2"><div className="flex flex-wrap gap-0.5 justify-center">{v.equip.map(e => (<span key={e} className="rounded-full bg-[#D4AF37]/10 px-1.5 py-0.5 text-[7px] font-semibold text-[#D4AF37]">{e}</span>))}</div></td>))}</tr>
        </tbody></table></div>
    </div>
  );
}
