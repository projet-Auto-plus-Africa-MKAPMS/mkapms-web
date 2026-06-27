import { Link } from "react-router-dom";
import { ChevronLeft, Bell, AlertCircle, FileText, Clock, User, Check } from "lucide-react";
const ALERTES = [
  { type: "CT manquant", desc: "BMW 320d — Contrôle technique expiré", urgence: "haute", icon: AlertCircle },
  { type: "Document expiré", desc: "Assurance pro expire dans 15 jours", urgence: "moyenne", icon: FileText },
  { type: "Annonce incomplète", desc: "Renault Clio V — Photos manquantes", urgence: "basse", icon: Clock },
  { type: "Réservation en attente", desc: "Jean D. attend validation depuis 2j", urgence: "haute", icon: Clock },
  { type: "Client à relancer", desc: "Marie L. — Pas de nouvelles depuis 5j", urgence: "moyenne", icon: User },
];
export default function AlertesAuto() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} /> Alertes Automatiques</h1><p className="mt-1 text-sm text-white/80">{ALERTES.length} alertes actives</p></div>
      <div className="px-4 mt-4 space-y-2">{ALERTES.map((a, i) => { const Icon = a.icon; return (
        <div key={i} className={`rounded-xl bg-white border p-4 ${a.urgence === "haute" ? "border-red-300" : a.urgence === "moyenne" ? "border-amber-300" : "border-[#E5E7EB]"}`}>
          <div className="flex items-center gap-3"><Icon size={16} className={a.urgence === "haute" ? "text-red-500" : a.urgence === "moyenne" ? "text-amber-500" : "text-blue-500"} /><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{a.type}</h3><p className="text-[10px] text-[#6B7280]">{a.desc}</p></div><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${a.urgence === "haute" ? "bg-red-50 text-red-600" : a.urgence === "moyenne" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>{a.urgence}</span></div>
          <button className="mt-2 w-full rounded-lg bg-blue-50 py-1.5 text-xs font-bold text-blue-700">Traiter</button>
        </div>); })}</div>
    </div>
  );
}
