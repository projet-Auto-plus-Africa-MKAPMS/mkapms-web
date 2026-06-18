import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Check, Clock, MapPin, User, FileText } from "lucide-react";
const MODES = [{ label: "Transporteur", prix: "350 €" }, { label: "Dépanneuse", prix: "250 €" }, { label: "Convoyeur", prix: "180 €" }, { label: "Retrait sur place", prix: "Gratuit" }];
const TRANSPORTS = [
  { id: 1, vehicule: "BMW 320d", mode: "Transporteur", depart: "15/03 08:00", arrivee: "16/03 14:00", chauffeur: "Jean D.", statut: "en_cours" as const },
  { id: 2, vehicule: "Renault Clio V", mode: "Convoyeur", depart: "13/03 10:00", arrivee: "13/03 18:00", chauffeur: "Pierre L.", statut: "livre" as const },
];
export default function CentreTransport() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/stock" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Stock</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} /> Centre Transport</h1></div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">{MODES.map((m) => (<div key={m.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center"><p className="text-sm font-bold text-[#111]">{m.label}</p><p className="text-xs text-blue-600 font-semibold">{m.prix}</p></div>))}</div>
      <div className="px-4 mt-4 space-y-2">{TRANSPORTS.map((t) => (
        <div key={t.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{t.vehicule}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${t.statut === "en_cours" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>{t.statut === "en_cours" ? "En cours" : "Livré"}</span></div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-[#6B7280]"><div><p>Mode: {t.mode}</p><p>Départ: {t.depart}</p></div><div><p>Chauffeur: {t.chauffeur}</p><p>Arrivée: {t.arrivee}</p></div></div>
        </div>))}</div>
    </div>
  );
}
