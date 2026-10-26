import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ClipboardCheck,
  Globe2,
  Handshake,
  Landmark,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import MetaSEO from "../../components/MetaSEO";

const TYPES = [
  { icon: Landmark, title: "Investisseur passif", text: "Un profil qui souhaite étudier un droit économique temporaire sur un univers, un pays et une durée définis au contrat." },
  { icon: BriefcaseBusiness, title: "Investisseur opérateur", text: "Un professionnel qui apporte aussi son expérience, ses moyens ou sa capacité d’exécution sur un périmètre précis." },
  { icon: Handshake, title: "Partenaire stratégique", text: "Une entreprise, un groupe ou une institution qui peut contribuer au développement, à la distribution, à la logistique ou à l’ouverture d’un marché." },
];

const PERIMETRES = [
  { icon: Network, title: "Automobile & mobilité", text: "Vente, location, transport, VTC, garages et services autour des véhicules." },
  { icon: Building2, title: "Fournisseurs & pièces", text: "Véhicules, pièces, catalogues, sourcing et relations fournisseurs à l’international." },
  { icon: Globe2, title: "Pays & territoires", text: "Développement local, présence régionale et déploiement progressif dans plusieurs pays." },
  { icon: Sparkles, title: "Technologie & intelligence", text: "Outils numériques, visibilité, données, automatisation et services professionnels." },
];

const ETAPES = [
  { number: "01", title: "Présenter votre profil", text: "Indiquez votre pays, votre structure, votre expérience et le type de collaboration recherché." },
  { number: "02", title: "Définir le périmètre", text: "L’équipe étudie l’univers, le pays, la durée et le rôle qui correspondent à votre projet." },
  { number: "03", title: "Vérifier le dossier", text: "Les éléments d’identité et, si nécessaire, de société sont examinés avant toute décision." },
  { number: "04", title: "Recevoir une proposition", text: "Aucun engagement automatique : un contrat clair est présenté uniquement après examen et accord." },
];

export default function EspaceInvestisseurs() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 text-[#09152C]">
      <MetaSEO title="Investir dans les univers MKA.P-MS" description="Découvrez les profils d’investisseurs, les périmètres de développement et le parcours de candidature MKA.P-MS." url="https://mkapms.com/investisseurs/espace-investisseurs" />
      <header className="bg-[#111] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-5 sm:px-8 sm:pb-16">
          <Link to="/univers" className="inline-flex items-center gap-1 text-sm font-bold text-white/65 transition hover:text-white"><ChevronLeft className="h-4 w-4" /> Retour aux univers</Link>
          <div className="mt-10 grid items-end gap-10 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-[#D4AF37]"><TrendingUp className="h-4 w-4" /> Portail investisseurs mondial</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">Investir dans les univers MKA.P-MS.</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">Un point d’entrée clair pour les personnes, entreprises et partenaires qui souhaitent étudier une collaboration de développement avec l’écosystème MKA.P-MS.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Link to="/investissement/devenir-investisseur" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-5 text-sm font-black text-[#111]">Présenter mon projet <ArrowRight className="h-4 w-4" /></Link><Link to="/investisseurs/objectif-global" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 px-5 text-sm font-black text-white">Voir l’objectif global <Target className="h-4 w-4 text-[#D4AF37]" /></Link></div>
            </div>
            <div className="relative min-h-64 overflow-hidden rounded-[30px] border border-white/10 bg-[#1B2942]"><img src="/pubs/hero5-pro.jpg" alt="Professionnels et développement MKA.P-MS" className="absolute inset-0 h-full w-full object-cover opacity-55" /><div className="absolute inset-0 bg-gradient-to-tr from-[#07111F] via-[#07111F]/55 to-transparent" /><div className="relative flex h-full min-h-64 flex-col justify-end p-6 sm:p-8"><BadgeCheck className="h-9 w-9 text-[#D4AF37]" /><p className="mt-4 max-w-sm text-lg font-black leading-tight">Un cadre lisible, documenté et étudié au cas par cas.</p></div></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-3">{[[Globe2, "International", "Un parcours pensé pour plusieurs pays et marchés."], [ShieldCheck, "Cadre contractuel", "Un périmètre défini : univers, pays et durée."], [ClipboardCheck, "Examen préalable", "La candidature est étudiée avant toute activation."]].map(([Icon, title, text]) => { const ItemIcon = Icon as typeof Globe2; return <div key={title as string} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm"><ItemIcon className="h-6 w-6 text-[#B28B09]" /><h2 className="mt-4 text-base font-black">{title as string}</h2><p className="mt-2 text-sm leading-relaxed text-black/55">{text as string}</p></div>; })}</section>

        <section className="rounded-[32px] bg-white p-6 shadow-sm sm:p-10"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-[#B28B09]">Le fonctionnement</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Un investissement présenté avec des limites claires.</h2><p className="mt-4 text-sm leading-relaxed text-black/60 sm:text-base">Le modèle MKA.P-MS ne promet pas un rendement et ne crée pas automatiquement une propriété de l’entreprise. Le dossier sert à étudier un droit économique temporaire, borné par un univers d’activité, un pays, une durée et des conditions écrites.</p></div><div className="mt-8 grid gap-4 md:grid-cols-3">{[["Univers", "Le domaine précis concerné par la collaboration."], ["Territoire", "Le pays ou la zone géographique définie au dossier."], ["Durée", "La période prévue dans le contrat, avec ses conditions."]].map(([title, text]) => <div key={title} className="rounded-2xl bg-[#F5F3EF] p-5"><p className="text-sm font-black text-[#09152C]">{title}</p><p className="mt-2 text-sm leading-relaxed text-black/55">{text}</p></div>)}</div></section>

        <section><div className="mb-5"><p className="text-xs font-black uppercase tracking-[.2em] text-[#B28B09]">Profils accueillis</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Quel type d’investisseur êtes-vous ?</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-black/60 sm:text-base">Chaque profil peut être étudié selon ses moyens, son expérience, son pays et la valeur qu’il apporte au projet.</p></div><div className="grid gap-5 lg:grid-cols-3">{TYPES.map((type) => { const Icon = type.icon; return <article key={type.title} className="rounded-[28px] bg-[#0A1630] p-6 text-white shadow-sm"><Icon className="h-8 w-8 text-[#D4AF37]" /><h3 className="mt-6 text-xl font-black">{type.title}</h3><p className="mt-3 text-sm leading-relaxed text-white/65">{type.text}</p><Link to="/investissement/devenir-investisseur" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#D4AF37]">Présenter ce profil <ArrowRight className="h-4 w-4" /></Link></article>; })}</div></section>

        <section className="rounded-[32px] bg-[#101F3D] p-6 text-white sm:p-10"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-[#D4AF37]">Périmètres à étudier</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Des projets reliés à l’écosystème réel.</h2><p className="mt-4 text-sm leading-relaxed text-white/65 sm:text-base">Le portail peut accueillir plusieurs familles de projets. La disponibilité et les conditions sont toujours confirmées après étude.</p></div><div className="mt-8 grid gap-4 sm:grid-cols-2">{PERIMETRES.map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className="h-6 w-6 text-[#D4AF37]" /><h3 className="mt-4 font-black">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p></div>; })}</div></section>

        <section className="rounded-[32px] bg-white p-6 shadow-sm sm:p-10"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-[#B28B09]">Le parcours</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">De la première prise de contact au dossier étudié.</h2></div><div className="mt-8 grid gap-5 md:grid-cols-4">{ETAPES.map((step) => <div key={step.number} className="relative border-l-2 border-[#D4AF37] pl-4"><span className="text-xs font-black tracking-[.2em] text-[#B28B09]">{step.number}</span><h3 className="mt-3 font-black">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-black/55">{step.text}</p></div>)}</div></section>

        <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-[30px] bg-white p-6 shadow-sm sm:p-8"><Users className="h-8 w-8 text-[#B28B09]" /><h2 className="mt-5 text-2xl font-black">Les informations utiles</h2><p className="mt-3 text-sm leading-relaxed text-black/60">Pour étudier votre demande, préparez votre identité ou raison sociale, votre pays, vos coordonnées, votre profil d’investisseur, l’univers qui vous intéresse et les moyens ou compétences que vous souhaitez apporter.</p><Link to="/investissement/devenir-investisseur" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0A1630] px-5 text-sm font-black text-white">Commencer le dossier <ArrowRight className="h-4 w-4" /></Link></div><div className="rounded-[30px] bg-[#E9E2CA] p-6 sm:p-8"><ShieldCheck className="h-8 w-8 text-[#8A6900]" /><h2 className="mt-5 text-2xl font-black">Ce qui n’est pas promis</h2><p className="mt-3 text-sm leading-relaxed text-black/65">Aucun rendement, aucune propriété automatique et aucun paiement avant l’examen du dossier ne sont promis sur cette page. Les conditions définitives ne peuvent venir que d’une proposition et d’un contrat validés par MKA.P-MS.</p><Link to="/investissement" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/15 px-5 text-sm font-black">Accéder à mon espace <ArrowRight className="h-4 w-4" /></Link></div></section>
      </main>
    </div>
  );
}
