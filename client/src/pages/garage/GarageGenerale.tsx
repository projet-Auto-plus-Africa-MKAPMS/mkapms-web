import { Link } from "react-router-dom";
import { Wrench, FileText, Calendar, AlertTriangle, Shield, Circle, Search, Car, Paintbrush, Users, Phone, ChevronRight, Star, MapPin } from "lucide-react";

const SERVICES = [
  { label: "Demander un devis", icon: FileText, to: "/garage/devis", color: "bg-[#D4AF37]" },
  { label: "Prendre rendez-vous", icon: Calendar, to: "/garage/rendez-vous", color: "bg-blue-600" },
  { label: "Dépannage", icon: AlertTriangle, to: "/garage/depannage", color: "bg-red-600" },
  { label: "Contrôle technique", icon: Shield, to: "/garage/controle-technique", color: "bg-green-600" },
  { label: "Pneus", icon: Circle, to: "/garage/pneumatiques", color: "bg-gray-700" },
  { label: "Diagnostic", icon: Search, to: "/garage/diagnostic", color: "bg-purple-600" },
  { label: "Entretien", icon: Wrench, to: "/garage/particulier", color: "bg-cyan-600" },
  { label: "Réparation", icon: Wrench, to: "/garage/ordre-reparation", color: "bg-orange-600" },
  { label: "Carrosserie", icon: Paintbrush, to: "/garage/carrosserie", color: "bg-pink-600" },
  { label: "Flottes professionnelles", icon: Users, to: "/garage/professionnel", color: "bg-indigo-600" },
];

const AVANTAGES = [
  "Devis gratuit en 24h", "Pièces d'origine garanties", "Suivi temps réel",
  "Paiement sécurisé", "Garantie pièces et main-d'œuvre", "Historique complet",
];

export default function GarageGenerale() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Wrench size={22} className="text-[#D4AF37]" /> Garage <span className="text-[#D4AF37]">MKA.P-MS</span></h1>
        <p className="mt-1 text-sm text-white/60">Entretien · Réparation · Dépannage · Contrôle technique</p>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-white/40"><MapPin size={10} /> Disponible dans toute la France<span className="mx-1">·</span><Phone size={10} /> 99 70 70 50 50 · 7/7 de 8h à 20h</div>
      </div>

      <div className="px-4 -mt-3 relative z-10">
        <div className="grid grid-cols-2 gap-2">
          {SERVICES.map((s) => { const Icon = s.icon; return (
            <Link key={s.label} to={s.to} className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center active:scale-[0.98] transition shadow-sm">
              <div className={`flex h-10 w-10 mx-auto items-center justify-center rounded-lg ${s.color}`}><Icon size={18} className="text-white" /></div>
              <p className="text-xs font-bold text-[#111] mt-2">{s.label}</p>
            </Link>
          ); })}
        </div>
      </div>

      {/* Avantages */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Pourquoi MKA.P-MS Garage ?</h2>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {AVANTAGES.map((a) => (
            <div key={a} className="flex items-center gap-2 rounded-lg bg-white border border-[#E5E7EB] p-2.5">
              <Star size={10} className="text-[#D4AF37] shrink-0" /><span className="text-[10px] font-semibold text-[#111]">{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mt-6">
        <Link to="/garage/devis" className="block w-full rounded-xl bg-[#D4AF37] py-4 text-center text-base font-extrabold text-white active:scale-[0.98] transition shadow-lg">
          Demander un devis gratuit
        </Link>
      </div>

      {/* Contact */}
      <div className="mx-4 mt-4 rounded-xl bg-[#111] p-4 text-center">
        <p className="text-sm font-bold text-white">Besoin d'aide ?</p>
        <p className="text-xs text-[#D4AF37] mt-1 font-semibold">99 70 70 50 50 · 7/7 de 8h à 20h</p>
      </div>
    </div>
  );
}
