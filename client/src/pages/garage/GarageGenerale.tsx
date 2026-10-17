import { Link } from "react-router-dom";
import { Wrench, FileText, Calendar, AlertTriangle, Shield, Circle, Search, Paintbrush, Users, Phone, Star, MapPin, Home, ArrowRight, Clock3 } from "lucide-react";

const SERVICES = [
  { label: "Mécanicien à domicile", description: "Intervention mécanique sur place", icon: Home, to: "/devis?estimation=1&service=mecanicien-domicile", color: "bg-[#0B6B8F]" },
  { label: "Demander un devis", description: "Comparez les estimations des garages", icon: FileText, to: "/garage/demande-devis", color: "bg-[#D4AF37]" },
  { label: "Prendre rendez-vous", description: "Choisissez un créneau disponible", icon: Calendar, to: "/garage/prise-rendez-vous", color: "bg-[#2563EB]" },
  { label: "Dépannage", description: "Une assistance quand vous en avez besoin", icon: AlertTriangle, to: "/garage/depannage-garage", color: "bg-[#DC2626]" },
  { label: "Contrôle technique", description: "Préparez et vérifiez votre véhicule", icon: Shield, to: "/garage/controle-technique", color: "bg-[#16A34A]" },
  { label: "Pneus", description: "Montage, crevaison et géométrie", icon: Circle, to: "/garage/pneumatiques", color: "bg-[#364152]" },
  { label: "Diagnostic", description: "Identifiez l’origine d’une panne", icon: Search, to: "/garage/diagnostic-garage", color: "bg-[#9333EA]" },
  { label: "Entretien", description: "Révisions et maintenance courante", icon: Wrench, to: "/garage/garage-particulier", color: "bg-[#0891B2]" },
  { label: "Réparation", description: "Pièces et main-d’œuvre adaptées", icon: Wrench, to: "/garage/ordre-reparation", color: "bg-[#EA580C]" },
  { label: "Carrosserie", description: "Débosselage, peinture et vitrage", icon: Paintbrush, to: "/garage/carrosserie-garage", color: "bg-[#DB2777]" },
  { label: "Flottes professionnelles", description: "Un suivi pour vos véhicules d’entreprise", icon: Users, to: "/garage/garage-professionnel", color: "bg-[#4F46E5]" },
];

const AVANTAGES = [
  "Devis gratuit en 24h", "Pièces d'origine garanties", "Suivi temps réel",
  "Paiement sécurisé", "Garantie pièces et main-d'œuvre", "Historique complet",
];

export default function GarageGenerale() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 text-[#102A43]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#102A43] via-[#123E56] to-[#0B6B8F] px-4 pb-7 pt-6 text-white">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#D4AF37]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-2 text-center text-sm font-bold"><Wrench size={20} className="text-[#F4D35E]" /> Garage <span className="text-[#F4D35E]">MKA.P-MS</span></div>
          <h1 className="mx-auto mt-3 max-w-2xl text-center text-2xl font-black leading-tight sm:text-3xl">Votre entretien automobile, suivi de bout en bout.</h1>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-white/80">Trouvez le bon professionnel, obtenez une estimation claire et suivez votre réparation au même endroit.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs text-white/75">
            <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-[#F4D35E]" /> Disponible dans toute la France</span>
            <span className="inline-flex items-center gap-1.5"><Phone size={14} className="text-[#F4D35E]" /> 99 70 70 50 50</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={14} className="text-[#F4D35E]" /> 7/7 de 8h à 20h</span>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-3 max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SERVICES.map((service) => { const Icon = service.icon; return (
            <Link key={service.label} to={service.to} className="group flex min-h-[132px] flex-col justify-between rounded-2xl border border-[#DCE6EE] bg-white p-4 shadow-[0_8px_24px_rgba(16,42,67,0.07)] transition hover:-translate-y-0.5 hover:border-[#D4AF37] active:scale-[0.98]">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${service.color} shadow-sm`}><Icon size={19} className="text-white" /></div>
              <div className="mt-4"><p className="text-sm font-extrabold leading-5 text-[#102A43]">{service.label}</p><p className="mt-1 text-[11px] leading-4 text-[#64748B]">{service.description}</p></div>
              <ArrowRight size={15} className="mt-3 text-[#D4AF37] transition group-hover:translate-x-1" />
            </Link>
          ); })}
        </div>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Une plateforme pensée pour vous</p><h2 className="mt-1 text-xl font-black text-[#102A43]">Pourquoi MKA.P-MS Garage ?</h2></div></div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AVANTAGES.map((advantage) => <div key={advantage} className="flex min-h-[58px] items-center gap-3 rounded-2xl border border-[#DCE6EE] bg-white px-4 py-3 shadow-sm"><Star size={17} className="shrink-0 text-[#D4AF37]" /><span className="text-sm font-bold text-[#102A43]">{advantage}</span></div>)}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-gradient-to-r from-[#D4AF37] to-[#B8911F] p-5 text-center text-white shadow-[0_12px_30px_rgba(180,145,31,0.25)] sm:p-7">
          <h2 className="text-xl font-black sm:text-2xl">Besoin d’une estimation ?</h2>
          <p className="mt-2 text-sm text-white/85">Décrivez votre besoin et recevez des propositions de garages vérifiés.</p>
          <Link to="/garage/demande-devis" className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-[#102A43] shadow-sm transition hover:bg-[#FFF8DF]">Demander un devis gratuit <ArrowRight size={16} /></Link>
        </section>

        <section className="mt-4 flex flex-col items-center justify-between gap-2 rounded-2xl bg-[#102A43] px-5 py-4 text-center text-white sm:flex-row sm:text-left">
          <div><p className="text-sm font-bold">Besoin d’aide ?</p><p className="mt-1 text-xs text-white/65">Notre équipe vous accompagne 7/7 de 8h à 20h.</p></div>
          <a href="tel:9970705050" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#F4D35E]"><Phone size={16} /> 99 70 70 50 50</a>
        </section>
      </main>
    </div>
  );
}
