import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Bell, AlertCircle, FileText, Clock, User, Check } from "lucide-react";
const ALERTES_INIT = [
  { type: "CT manquant", desc: "BMW 320d — Contrôle technique expiré", urgence: "haute", icon: AlertCircle },
  { type: "Document expiré", desc: "Assurance pro expire dans 15 jours", urgence: "moyenne", icon: FileText },
  { type: "Annonce incomplète", desc: "Renault Clio V — Photos manquantes", urgence: "basse", icon: Clock },
  { type: "Réservation en attente", desc: "Jean D. attend validation depuis 2j", urgence: "haute", icon: Clock },
  { type: "Client à relancer", desc: "Marie L. — Pas de nouvelles depuis 5j", urgence: "moyenne", icon: User },
];
export default function AlertesAuto() {
  const [traitees, setTraitees] = useState<Record<number, boolean>>({});
  const actives = ALERTES_INIT.filter((_, i) => !traitees[i]).length;
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/resume-vendeur" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} /> Alertes Automatiques</h1><p className="mt-1 text-sm text-white/80">{actives} alertes actives</p></div>
      <div className="px-4 mt-4 space-y-2">{ALERTES_INIT.map((a, i) => { const Icon = a.icon; const traitee = traitees[i]; return (
        <div key={i} className={`rounded-xl bg-white border p-4 ${traitee ? "border-green-200 opacity-70" : a.urgence === "haute" ? "border-red-300" : a.urgence === "moyenne" ? "border-amber-300" : "border-[#E5E7EB]"}`}>
          <div className="flex items-center gap-3"><Icon size={16} className={a.urgence === "haute" ? "text-red-500" : a.urgence === "moyenne" ? "text-amber-500" : "text-blue-500"} /><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{a.type}</h3><p className="text-[10px] text-[#6B7280]">{a.desc}</p></div><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${traitee ? "bg-green-50 text-green-600" : a.urgence === "haute" ? "bg-red-50 text-red-600" : a.urgence === "moyenne" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>{traitee ? "traitée" : a.urgence}</span></div>
          <button
            onClick={() => setTraitees((prev) => ({ ...prev, [i]: !prev[i] }))}
            className={`mt-2 w-full rounded-lg py-1.5 text-xs font-bold flex items-center justify-center gap-1 ${traitee ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-700"}`}
          >
            {traitee ? <><Check size={10} /> Traitée</> : "Traiter"}
          </button>
        </div>); })}</div>
    </div>
  );
}
