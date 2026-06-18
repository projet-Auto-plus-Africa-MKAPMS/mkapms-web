import { Link } from "react-router-dom";
import { ChevronLeft, Mail, Send, Users, Plus } from "lucide-react";
const CAMPAGNES = [
  { titre: "Déstockage mars", type: "Promotion", envois: 450, ouvertures: 180, clics: 42 },
  { titre: "Nouveautés SUV", type: "Nouveautés", envois: 320, ouvertures: 145, clics: 38 },
];
export default function CentreCampagnes() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Mail size={20} /> Campagnes</h1></div>
      <div className="px-4 mt-4 space-y-2">{CAMPAGNES.map(c => (
        <div key={c.titre} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111]">{c.titre}</h3><p className="text-[10px] text-[#6B7280]">{c.type}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded-lg bg-blue-50 p-1.5"><p className="text-blue-600">Envois</p><p className="font-bold">{c.envois}</p></div><div className="rounded-lg bg-green-50 p-1.5"><p className="text-green-600">Ouvertures</p><p className="font-bold">{c.ouvertures}</p></div><div className="rounded-lg bg-amber-50 p-1.5"><p className="text-amber-600">Clics</p><p className="font-bold">{c.clics}</p></div></div>
        </div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white flex items-center justify-center gap-2"><Plus size={16} /> Nouvelle campagne</button></div>
    </div>
  );
}
