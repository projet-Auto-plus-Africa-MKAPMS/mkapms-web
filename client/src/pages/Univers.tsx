import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeEuro,
  Boxes,
  Car,
  Clock3,
  FileCheck2,
  History,
  Landmark,
  MapPinned,
  PackageCheck,
  Plane,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import MetaSEO from "../components/MetaSEO";
import { trpc } from "../lib/trpc";

const STATUS_LABEL: Record<string, string> = {
  active: "Ouvert",
  masque: "Bientôt",
  maintenance: "Maintenance",
  desactive: "Désactivé",
};

const LINKS: Record<string, string> = {
  vente: "/acheter",
  location: "/louer",
  garage: "/garages",
  devis: "/devis",
  pieces: "/pieces",
  livraison: "/livraison",
  depannage: "/depannage",
  vtc_taxi: "/vtc-taxi",
  import_africa: "/import-africa",
  historique: "/historique",
  wallet: "/wallet",
};

type Presentation = {
  image: string;
  eyebrow: string;
  action: string;
  icon: LucideIcon;
};

const PRESENTATIONS: Record<string, Presentation> = {
  vente: { image: "/pubs/hero1-achetez.jpg", eyebrow: "Acheter & vendre", action: "Explorer les véhicules", icon: Car },
  location: { image: "/pubs/hero4-location.jpg", eyebrow: "Mobilité flexible", action: "Découvrir les locations", icon: Clock3 },
  garage: { image: "/categories/cover_pro.jpg", eyebrow: "Entretien & atelier", action: "Trouver un garage", icon: Wrench },
  devis: { image: "/categories/cover_promo.jpg", eyebrow: "Estimation claire", action: "Créer un devis", icon: FileCheck2 },
  pieces: { image: "/pubs/pub1-pieces.jpg", eyebrow: "Catalogue multivéhicule", action: "Ouvrir les pièces", icon: Boxes },
  livraison: { image: "/categories/camion_porte_voitures.jpg", eyebrow: "Logistique connectée", action: "Organiser une livraison", icon: Truck },
  vtc_taxi: { image: "/pubs/hero3-vtc.jpg", eyebrow: "Chauffeurs & flottes", action: "Entrer dans VTC / Taxi", icon: MapPinned },
  depannage: { image: "/categories/cover_utilitaires.jpg", eyebrow: "Assistance routière", action: "Demander une assistance", icon: ShieldCheck },
  historique: { image: "/categories/premium.jpg", eyebrow: "Plaque & VIN", action: "Consulter un historique", icon: History },
  import_africa: { image: "/categories/camion_porte_voitures.jpg", eyebrow: "Europe vers Afrique", action: "Découvrir l’import", icon: Plane },
  wallet: { image: "/pubs/hero5-pro.jpg", eyebrow: "Services professionnels", action: "Ouvrir le wallet", icon: Landmark },
};

const FALLBACK: Presentation = {
  image: "/categories/cover_mkapms.jpg",
  eyebrow: "Écosystème MKA.P-MS",
  action: "Découvrir cet univers",
  icon: Store,
};

export default function Univers() {
  const modules = trpc.modules.list.useQuery();
  const visibles = modules.data?.filter((module) => module.visiblePublic) ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EE] pb-24 text-[#09152C]">
      <MetaSEO
        title="Les univers MKA.P-MS"
        description="Vente, location, garages, pièces, livraison et services automobiles réunis dans des univers spécialisés."
        url="https://mkapms.com/univers"
      />

      <section className="relative isolate min-h-[440px] overflow-hidden bg-[#07111F] px-5 py-16 text-white sm:px-8 sm:py-24">
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/pubs/hero5-pro.jpg"
          aria-hidden="true"
        >
          <source src="/videos/home/home_services.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#07111F]/55 via-[#07111F]/65 to-[#07111F]" />
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] backdrop-blur">
            <Sparkles className="h-4 w-4 text-[#E2B82D]" /> Un écosystème, plusieurs métiers
          </span>
          <h1 className="mt-7 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">Choisissez votre univers.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-xl">
            Chaque espace possède ses propres outils, ses parcours et ses services — avec le même compte MKA.P-MS.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs font-bold text-white/80">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">Mobilité</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">Automobile</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">Services professionnels</span>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        {modules.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-80 animate-pulse rounded-[30px] bg-white shadow-sm" />)}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((module, index) => {
              const to = LINKS[module.code];
              const presentation = PRESENTATIONS[module.code] ?? FALLBACK;
              const Icon = presentation.icon;
              const active = module.status === "active" && Boolean(to);
              const card = (
                <article className={`group relative isolate flex min-h-[350px] overflow-hidden rounded-[30px] bg-[#0A1630] p-6 text-white shadow-[0_18px_50px_rgba(9,21,44,.16)] transition duration-300 sm:min-h-[390px] ${active ? "hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(9,21,44,.24)]" : "opacity-75"}`}>
                  <img src={presentation.image} alt="" loading={index < 3 ? "eager" : "lazy"} className={`absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 ${active ? "group-hover:scale-105" : "grayscale"}`} />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#061020] via-[#061020]/72 to-[#061020]/10" />
                  <div className="flex w-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur"><Icon className="h-6 w-6 text-[#E2B82D]" /></span>
                      <span className={`rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider backdrop-blur ${active ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100" : "border-white/20 bg-black/20 text-white/70"}`}>{STATUS_LABEL[module.status] ?? module.status}</span>
                    </div>
                    <div className="mt-auto">
                      <p className="text-xs font-black uppercase tracking-[.2em] text-[#E2B82D]">{presentation.eyebrow}</p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight">{module.nom}</h2>
                      {module.description && <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">{module.description}</p>}
                      <div className={`mt-6 flex items-center gap-2 text-sm font-black ${active ? "text-white" : "text-white/55"}`}>
                        {active ? presentation.action : "Ouverture prochaine"}
                        {active && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                      </div>
                    </div>
                  </div>
                </article>
              );
              return active ? <Link key={module.id} to={to} className="block rounded-[30px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#D4AF37]/50">{card}</Link> : <div key={module.id}>{card}</div>;
            })}
          </div>
        )}

        {!modules.isLoading && visibles.length === 0 && (
          <div className="rounded-[30px] bg-white p-10 text-center shadow-sm"><PackageCheck className="mx-auto h-10 w-10 text-[#D4AF37]" /><p className="mt-4 font-bold text-black/60">Les univers sont en cours d’initialisation.</p></div>
        )}

        <section className="mt-10 overflow-hidden rounded-[32px] bg-white shadow-[0_18px_50px_rgba(9,21,44,.08)]">
          <div className="grid lg:grid-cols-[1.2fr_.8fr]">
            <div className="p-7 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[.2em] text-[#B28B09]">Votre compte vous suit partout</p>
              <h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">Passez d’un besoin à l’autre sans quitter la plateforme.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-black/55 sm:text-base">Recherchez un véhicule, trouvez un professionnel, commandez une pièce ou organisez une livraison depuis des espaces conçus pour chaque métier.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/recherche" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0A1630] px-6 text-sm font-black text-white">Commencer une recherche <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/abonnements" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-black/10 px-6 text-sm font-black">Voir les abonnements <BadgeEuro className="h-4 w-4 text-[#B28B09]" /></Link>
              </div>
            </div>
            <div className="relative min-h-64 bg-[#0A1630]"><img src="/pubs/hero5-pro.jpg" alt="Professionnel automobile MKA.P-MS" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-r from-[#0A1630]/50 to-transparent" /></div>
          </div>
        </section>
      </main>
    </div>
  );
}
