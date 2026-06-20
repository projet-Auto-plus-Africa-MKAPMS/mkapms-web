import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Car, Clock, CheckCircle, Wrench, Package,
  Shield, Truck, Phone, MessageSquare, MapPin, FileText,
  Bell, Eye, Camera
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   SUIVI VEHICULE — COTE CLIENT
   Le client voit en temps reel le statut de son vehicule au garage.
   Plus besoin d'appeler "Mon vehicule est ou ?"
   ══════════════════════════════════════════════════════════════════════════ */

const ETAPES = [
  { id: "recu", label: "Vehicule recu", icon: Car, desc: "Votre vehicule a ete receptionne par le garage." },
  { id: "diagnostic", label: "Diagnostic en cours", icon: Eye, desc: "Le technicien analyse votre vehicule." },
  { id: "pieces_commandees", label: "Pieces commandees", icon: Package, desc: "Les pieces necessaires ont ete commandees." },
  { id: "reparation", label: "Reparation en cours", icon: Wrench, desc: "Le mecanicien travaille sur votre vehicule." },
  { id: "controle_qualite", label: "Controle qualite", icon: Shield, desc: "Verification finale avant restitution." },
  { id: "pret", label: "Vehicule pret", icon: CheckCircle, desc: "Votre vehicule est pret ! Vous pouvez le recuperer." },
  { id: "livre", label: "Vehicule livre", icon: Truck, desc: "Votre vehicule vous a ete restitue." },
];

interface Intervention {
  id: number;
  vehicule: string;
  plaque: string;
  garage: string;
  adresse: string;
  tel: string;
  tech: string;
  statutActuel: string;
  dateEntree: string;
  datePrevue: string;
  travaux: string;
  montantDevis: string;
  progression: number;
  notifications: { date: string; msg: string }[];
}

const INTERVENTIONS: Intervention[] = [
  {
    id: 1,
    vehicule: "Peugeot 3008 GT Hybrid 2024",
    plaque: "AB-123-CD",
    garage: "Garage Auto Express",
    adresse: "12 rue de la Mecanique, 75011 Paris",
    tel: "01 42 56 78 90",
    tech: "Karim M.",
    statutActuel: "reparation",
    dateEntree: "09/06/2025",
    datePrevue: "10/06/2025 16h00",
    travaux: "Revision complete 30 000 km — vidange huile moteur 5W-30, filtre huile, filtre air, filtre habitacle, bougies x4, liquide frein, controle general 65 points",
    montantDevis: "389 EUR",
    progression: 65,
    notifications: [
      { date: "09/06 08:15", msg: "Vehicule receptionne par le garage." },
      { date: "09/06 09:00", msg: "Diagnostic de votre vehicule commence." },
      { date: "09/06 10:30", msg: "Diagnostic termine. Aucun probleme supplementaire detecte." },
      { date: "09/06 11:00", msg: "Reparation en cours — Karim M. travaille sur votre vehicule." },
    ],
  },
  {
    id: 2,
    vehicule: "Mercedes Classe C 220d 2023",
    plaque: "MN-012-OP",
    garage: "Garage Auto Express",
    adresse: "12 rue de la Mecanique, 75011 Paris",
    tel: "01 42 56 78 90",
    tech: "Omar L.",
    statutActuel: "pieces_commandees",
    dateEntree: "08/06/2025",
    datePrevue: "11/06/2025 14h00",
    travaux: "Distribution complete — kit courroie + galets + pompe a eau + liquide refroidissement",
    montantDevis: "1 250 EUR",
    progression: 30,
    notifications: [
      { date: "08/06 09:00", msg: "Vehicule receptionne par le garage." },
      { date: "08/06 10:00", msg: "Diagnostic termine — distribution a remplacer." },
      { date: "08/06 15:00", msg: "Pieces commandees aupres du fournisseur." },
      { date: "09/06 09:00", msg: "Pieces en cours de livraison — arrivee prevue demain matin." },
    ],
  },
];

export default function SuiviVehicule() {
  const [selected, setSelected] = useState(0);
  const intervention = INTERVENTIONS[selected];
  const currentStep = ETAPES.findIndex((e) => e.id === intervention.statutActuel);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Hero */}
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Car size={20} className="text-[#D4AF37]" /> Suivi de mon vehicule</h1>
        <p className="mt-0.5 text-sm text-white/60">Suivez en temps reel l'avancement de vos reparations</p>
      </div>

      {/* Selection vehicule si plusieurs */}
      {INTERVENTIONS.length > 1 && (
        <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {INTERVENTIONS.map((iv, i) => (
            <button key={iv.id} onClick={() => setSelected(i)} className={`shrink-0 rounded-xl px-3 py-2 text-left transition ${selected === i ? "bg-[#111] text-white" : "bg-white text-[#111] border border-[#E5E7EB]"}`}>
              <p className="text-xs font-bold">{iv.vehicule.split(" ").slice(0, 2).join(" ")}</p>
              <p className={`text-[10px] ${selected === i ? "text-[#D4AF37]" : "text-slate-400"}`}>{iv.plaque}</p>
            </button>
          ))}
        </div>
      )}

      <div className="px-4 mt-4 space-y-3">
        {/* Statut actuel — GROS */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-5 text-center">
          <div className="h-16 w-16 rounded-full bg-green-50 grid place-items-center mx-auto">
            {(() => { const Icon = ETAPES[currentStep].icon; return <Icon size={28} className="text-green-600" />; })()}
          </div>
          <p className="mt-3 text-lg font-black text-[#111]">{ETAPES[currentStep].label}</p>
          <p className="mt-1 text-sm text-slate-500">{ETAPES[currentStep].desc}</p>
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
            <span>Progression</span>
            <span className="font-bold text-[#111]">{intervention.progression}%</span>
          </div>
          <div className="mt-1 h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${intervention.progression}%` }} />
          </div>
        </div>

        {/* Vehicule */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-xs font-bold text-[#111] mb-2">Mon vehicule</h3>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]"><span className="text-slate-400">Vehicule</span><span className="font-bold text-[#111]">{intervention.vehicule}</span></div>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]"><span className="text-slate-400">Plaque</span><span className="font-bold text-[#111]">{intervention.plaque}</span></div>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]"><span className="text-slate-400">Entree le</span><span className="font-bold text-[#111]">{intervention.dateEntree}</span></div>
            <div className="flex justify-between py-1 border-b border-[#F3F4F6]"><span className="text-slate-400">Sortie prevue</span><span className="font-bold text-[#D4AF37]">{intervention.datePrevue}</span></div>
          </div>
        </div>

        {/* Travaux */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-xs font-bold text-[#111] mb-1">Travaux en cours</h3>
          <p className="text-xs text-slate-500">{intervention.travaux}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">Devis</span>
            <span className="text-sm font-bold text-[#D4AF37]">{intervention.montantDevis}</span>
          </div>
        </div>

        {/* Timeline etapes */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-xs font-bold text-[#111] mb-3">Progression</h3>
          <div className="space-y-3">
            {ETAPES.map((e, i) => {
              const Icon = e.icon;
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`h-8 w-8 rounded-full grid place-items-center ${active ? "bg-green-500" : done ? "bg-green-100" : "bg-slate-100"}`}>
                      <Icon size={14} className={active ? "text-white" : done ? "text-green-600" : "text-slate-400"} />
                    </div>
                    {i < ETAPES.length - 1 && <div className={`w-0.5 h-6 mt-1 ${done ? "bg-green-300" : "bg-slate-200"}`} />}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className={`text-xs font-bold ${active ? "text-green-700" : done ? "text-[#111]" : "text-slate-400"}`}>{e.label}</p>
                    {active && <p className="text-[10px] text-green-600 mt-0.5">{e.desc}</p>}
                  </div>
                  {done && <CheckCircle size={14} className={`shrink-0 mt-1 ${active ? "text-green-500" : "text-green-300"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications / Historique */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
          <div className="bg-[#111] px-3 py-2 flex items-center gap-2">
            <Bell size={12} className="text-[#D4AF37]" />
            <h3 className="text-xs font-bold text-[#D4AF37]">Notifications</h3>
          </div>
          {intervention.notifications.map((n, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2.5 border-b border-[#F3F4F6] last:border-0">
              <Clock size={10} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-[#111]">{n.msg}</p>
                <p className="text-[9px] text-slate-400">{n.date}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Garage */}
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-xs font-bold text-[#111] mb-2">Votre garage</h3>
          <p className="text-sm font-bold text-[#111]">{intervention.garage}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={10} /> {intervention.adresse}</p>
          <p className="text-xs text-slate-500 mt-0.5">Technicien: {intervention.tech}</p>
          <div className="mt-3 flex gap-2">
            <a href={`tel:${intervention.tel.replace(/ /g, "")}`} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-xs font-bold text-white"><Phone size={14} /> Appeler</a>
            <Link to="/messagerie" className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-white"><MessageSquare size={14} /> Message</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
