import { Link } from "react-router-dom";
import { ChevronLeft, Users, Plus, Shield, Check } from "lucide-react";
const ROLES = [
  { role: "Directeur", desc: "Accès complet", count: 1 },
  { role: "Responsable VO", desc: "Gestion stock et ventes", count: 1 },
  { role: "Commercial", desc: "Gestion clients et annonces", count: 2 },
  { role: "Comptable", desc: "Factures, paiements, TVA", count: 1 },
  { role: "Préparateur", desc: "Photos, préparation, mise en ligne", count: 1 },
  { role: "Mécanicien", desc: "Diagnostic, réparations, entretien", count: 2 },
];
export default function GestionEmployes() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} /> Employés</h1></div>
      <div className="px-4 mt-4 space-y-2">{ROLES.map(r => (
        <div key={r.role} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50"><Users size={16} className="text-blue-700" /></div>
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{r.role}</h3><p className="text-[10px] text-[#6B7280]">{r.desc}</p></div>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{r.count}</span>
        </div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl bg-blue-800 py-3 text-sm font-bold text-white active:scale-[0.98] flex items-center justify-center gap-2"><Plus size={16} /> Ajouter un employé</button></div>
    </div>
  );
}
