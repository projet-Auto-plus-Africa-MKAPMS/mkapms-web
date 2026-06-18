import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, FileText, Calendar, Clock } from "lucide-react";
const EMPLOYEES = [
  { name: "Sophie Martin", role: "Resp. Vente", contrat: "CDI", salaire: "3 200 €", presence: "98%" },
  { name: "Lucas Bernard", role: "Resp. Location", contrat: "CDI", salaire: "3 000 €", presence: "96%" },
  { name: "Marie Dupont", role: "Resp. Garage", contrat: "CDI", salaire: "3 100 €", presence: "99%" },
  { name: "Ahmed Diallo", role: "Resp. Démarches", contrat: "CDI", salaire: "2 800 €", presence: "97%" },
  { name: "Julie Moreau", role: "Resp. Support", contrat: "CDI", salaire: "2 700 €", presence: "95%" },
  { name: "Pierre Lambert", role: "Comptable", contrat: "CDI", salaire: "3 500 €", presence: "100%" },
];
const CONGES = [
  { name: "Sophie Martin", type: "Congés payés", du: "15/07", au: "30/07", statut: "Validé" },
  { name: "Lucas Bernard", type: "RTT", du: "10/07", au: "12/07", statut: "En attente" },
];
export default function CentreRH() {
  const [tab, setTab] = useState<"equipe"|"planning">("equipe");
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Centre RH</h1>
      </div>
      <div className="px-4 mt-3 flex gap-2 mb-4">
        {(["equipe", "planning"] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${tab === t ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>{t === "equipe" ? "Équipe" : "Planning & Congés"}</button>))}
      </div>
      {tab === "equipe" && <div className="px-4 space-y-2">
        {EMPLOYEES.map(e => (
          <div key={e.name} className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-[#111]">{e.name}</p><span className="text-[9px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full">{e.contrat}</span></div>
            <p className="text-[10px] text-[#6B7280]">{e.role} · {e.salaire}/mois · Présence {e.presence}</p>
          </div>))}
      </div>}
      {tab === "planning" && <div className="px-4 space-y-2">
        {CONGES.map((c, i) => (
          <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-[#111]">{c.name}</p><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.statut === "Validé" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{c.statut}</span></div>
            <p className="text-[10px] text-[#6B7280]">{c.type} · Du {c.du} au {c.au}</p>
          </div>))}
      </div>}
    </div>
  );
}
