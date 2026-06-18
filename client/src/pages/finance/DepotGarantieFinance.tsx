import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check, Clock } from "lucide-react";
const DEPOTS = [
  { ref: "DEP-001", montant: "3 000 €", statut: "bloque", date: "15/03/2025" },
  { ref: "DEP-002", montant: "1 500 €", statut: "restitue", date: "10/02/2025" },
  { ref: "DEP-003", montant: "2 000 €", statut: "retenue_partielle", date: "05/01/2025" },
];
export default function DepotGarantieFinance() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-green-700 px-4 pt-6 pb-5"><Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Dépôts de garantie</h1></div>
      <div className="px-4 mt-4 space-y-2">{DEPOTS.map(d => (
        <div key={d.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3"><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{d.montant}</h3><p className="text-[9px] text-[#6B7280]">{d.ref} · {d.date}</p></div>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.statut === "bloque" ? "bg-amber-50 text-amber-600" : d.statut === "restitue" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>{d.statut === "bloque" ? "Bloqué" : d.statut === "restitue" ? "Restitué" : "Retenue partielle"}</span></div>))}</div>
    </div>
  );
}
