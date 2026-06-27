import { Link } from "react-router-dom";
import { ChevronLeft, Key, Plus, Check, Clock } from "lucide-react";
const DEMANDES = [
  { num: "WW-2025-042", statut: "active", date: "15/03/2025", expiration: "15/03/2026" },
  { num: "WW-2024-018", statut: "expiree", date: "10/01/2024", expiration: "10/01/2025" },
];
export default function WWGarage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gray-800 px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Key size={20} /> WW Garage</h1><p className="mt-1 text-sm text-white/80">Réservé aux professionnels</p></div>
      <div className="px-4 mt-4 space-y-2">{DEMANDES.map(d => (
        <div key={d.num} className={`rounded-xl bg-white border-2 p-4 ${d.statut === "active" ? "border-green-300" : "border-[#E5E7EB]"}`}>
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{d.num}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.statut === "active" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-600"}`}>{d.statut === "active" ? "Active" : "Expirée"}</span></div>
          <p className="text-[10px] text-[#6B7280] mt-0.5">Du {d.date} au {d.expiration}</p>
          {d.statut === "expiree" && <button className="mt-2 w-full rounded-lg bg-gray-800 py-1.5 text-xs font-bold text-white">Renouveler</button>}
        </div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl border-2 border-dashed border-gray-400 py-3 text-sm font-bold text-gray-700 flex items-center justify-center gap-2"><Plus size={16} /> Nouvelle demande WW</button></div>
    </div>
  );
}
