import { Link } from "react-router-dom";
import { ChevronLeft, Building2, Users, Truck, FileText, BarChart3, Clock, ChevronRight, Shield } from "lucide-react";

const FONCTIONS = [
  { label: "Gestion multi-véhicules", desc: "Ajoutez tous vos véhicules de flotte", icon: Truck },
  { label: "Suivi entretien flotte", desc: "Calendrier d'entretien par véhicule", icon: Clock },
  { label: "Facturation entreprise", desc: "Factures, TVA, exports automatiques", icon: FileText },
  { label: "Historique complet", desc: "Toutes les interventions conservées", icon: BarChart3 },
  { label: "Multi-employés", desc: "Droits par rôle (conducteur, gestionnaire)", icon: Users },
  { label: "Contrats d'entretien", desc: "Forfaits et abonnements sur mesure", icon: Shield },
];

export default function GarageProfessionnel() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} /> Garage Professionnel</h1>
        <p className="mt-1 text-sm text-white/80">Sociétés · VTC · Taxis · Flottes</p>
      </div>
      <div className="px-4 mt-4 space-y-2">{FONCTIONS.map((f) => { const Icon = f.icon; return (
        <div key={f.label} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50"><Icon size={16} className="text-blue-700" /></div>
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{f.label}</h3><p className="text-[10px] text-[#6B7280]">{f.desc}</p></div>
        </div>
      ); })}</div>
      <div className="px-4 mt-4"><Link to="/garage/devis" className="block w-full rounded-xl bg-blue-800 py-3 text-center text-sm font-bold text-white active:scale-[0.98]">Demander un devis flotte</Link></div>
    </div>
  );
}
