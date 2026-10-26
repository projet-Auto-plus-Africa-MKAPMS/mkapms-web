import { ArrowRight, Boxes, Building2, Car, CheckCircle2, ClipboardCheck, Globe2, Handshake, Layers3, Mail, MapPinned, PackageCheck, Send, ShieldCheck, Store, Truck, UsersRound, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import MetaSEO from "../components/MetaSEO";

const PLATFORM_PROFILES = [
  { label: "Publier des véhicules", detail: "Ajoutez vos voitures, motos, utilitaires, camions, engins ou machines à vendre.", icon: Car, href: "/partenaires/inscription-partenaire?profil=vendeur-vehicules" },
  { label: "Véhicules sur commande", detail: "Présentez vos stocks, vos arrivages et vos véhicules recherchés par les clients.", icon: Building2, href: "/partenaires/inscription-partenaire?profil=vendeur-vehicules" },
  { label: "Fournisseurs & équipementiers", detail: "Véhicules, pièces, accessoires, pneus, outillage, batteries et catalogues professionnels.", icon: Boxes, href: "/partenaires/inscription-partenaire?profil=fournisseur" },
  { label: "Transporteurs & logisticiens", detail: "Convoyage, transport de véhicules, livraison de pièces et acheminement international.", icon: Truck, href: "/partenaires/inscription-partenaire?profil=transporteur" },
  { label: "Garages & services", detail: "Réparation, diagnostic, carrosserie, contrôle technique, dépannage et assistance.", icon: ShieldCheck, href: "/partenaires/inscription-partenaire?profil=service-automobile" },
  { label: "Location, VTC & entreprises", detail: "Flottes, location, transport de personnes, services aux entreprises et mobilité.", icon: UsersRound, href: "/partenaires/inscription-partenaire?profil=location-mobilite" },
];

const PLATFORM_CAPABILITIES = [
  "Publier des annonces de véhicules et de pièces",
  "Présenter un stock réel ou des véhicules sur commande",
  "Recevoir des demandes correspondant à votre pays et votre zone",
  "Développer une fiche professionnelle visible dans l’écosystème MKA.P-MS",
  "Être orienté vers les bons modules : vente, location, garage, livraison, pièces ou visibilité",
  "Construire ensuite une relation commerciale adaptée après vérification",
];

const SHOP_PROFILES = [
  "Marchands et vendeurs de produits",
  "Fournisseurs, grossistes et fabricants",
  "Marques et distributeurs",
  "Partenaires dropshipping et catalogue",
  "Produits automobile, lifestyle, maison et mobilité",
];

const DATA_COLLECTED = [
  ["Identité professionnelle", "Entreprise, représentant et coordonnées de contact"],
  ["Implantation mondiale", "Pays, ville, zone couverte et capacité d’intervention"],
  ["Activité réelle", "Métier, type d’offre et services proposés"],
  ["Catalogue ou capacité", "Véhicules, pièces, transport, réparation, location ou produits"],
  ["Orientation souhaitée", "Ce que vous voulez publier, recevoir ou développer avec MKA.P-MS"],
];

const STEPS = [
  ["01", "Vous présentez votre activité", "Le formulaire public recueille les informations nécessaires, sans créer une fausse activation automatique."],
  ["02", "Le dossier est analysé", "La candidature est examinée selon le pays, le métier, la zone et les services sélectionnés."],
  ["03", "Le bon espace est préparé", "L’équipe peut orienter votre dossier vers les annonces, véhicules, pièces, transport, services ou futurs modules adaptés."],
  ["04", "Votre présence se construit", "Après validation, les informations utiles servent à préparer votre fiche, vos offres, vos demandes et votre visibilité."],
];

const TRUST_POINTS: { title: string; detail: string; icon: LucideIcon }[] = [
  { title: "Mon activité est mondiale", detail: "Sélectionnez votre pays et votre zone réelle dans le formulaire. Le parcours n’est pas limité à la France.", icon: Globe2 },
  { title: "Je veux publier une offre", detail: "Véhicules, annonces, pièces, services, transport ou produits : votre activité est décrite avant l’orientation.", icon: Layers3 },
  { title: "Je veux travailler avec MKA.P-MS", detail: "Votre candidature sert à préparer un échange et une configuration adaptée, sans promesse automatique avant examen.", icon: Handshake },
];

function ProfileCard({ label, detail, icon: Icon, href }: { label: string; detail: string; icon: LucideIcon; href: string }) {
  return (
    <article className="flex h-full flex-col rounded-[24px] border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0A1630] text-[#E2B82D]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-black leading-tight text-[#09152C]">{label}</h3>
          <p className="mt-2 text-sm leading-relaxed text-black/60">{detail}</p>
        </div>
      </div>
      <Link
        to={href}
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#0A1630]/15 px-4 py-3 text-sm font-black text-[#0A1630] hover:bg-[#F5F3EE] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#D4AF37]/40"
      >
        Présenter cette activité <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

export default function Rejoindre() {
  return (
    <div className="min-h-screen bg-[#F5F3EE] pb-24 text-[#09152C]">
      <MetaSEO
        title="Rejoindre MKA.P-MS — partenaires et entreprises du monde entier"
        description="Portail mondial pour rejoindre MKA.P-MS : publier des véhicules, annonces, pièces, services, transport, location et produits Boutique selon votre activité."
        url="https://mkapms.com/rejoindre"
      />

      <header className="relative isolate overflow-hidden bg-[#07111F] px-5 py-16 text-white sm:px-8 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(226,184,45,.22),transparent_38%),linear-gradient(135deg,#07111F,#0A1630)]" />
        <div className="mx-auto max-w-6xl">
          <Link to="/univers" className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
            <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" /> Retour aux univers
          </Link>
          <div className="mt-10 max-w-5xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-[#E2B82D]">
              <Globe2 className="h-4 w-4" aria-hidden="true" /> Un portail mondial pour les professionnels
            </p>
            <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">Rejoindre MKA.P-MS</h1>
            <p className="mt-6 max-w-4xl text-base leading-relaxed text-white/75 sm:text-xl">
              MKA.P-MS est construit pour réunir les entreprises, fournisseurs, vendeurs, transporteurs, garages, créateurs d’offres et marchands qui veulent développer leur activité dans plusieurs pays. La plateforme principale et la Boutique ont des parcours séparés, mais chacune peut accueillir les professionnels qui correspondent à son univers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#plateforme" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#E2B82D] px-6 text-sm font-black text-[#07111F]">
                Découvrir la plateforme <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="#boutique" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/25 px-6 text-sm font-black text-white">
                Découvrir la Boutique <Store className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 pt-10 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          {TRUST_POINTS.map(({ title, detail, icon: Icon }) => (
            <article key={title} className="rounded-[24px] border border-black/10 bg-white p-5">
              <Icon className="h-7 w-7 text-[#B28B09]" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-black">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-black/60">{detail}</p>
            </article>
          ))}
        </section>

        <section id="plateforme" className="scroll-mt-6 rounded-[32px] bg-white p-6 shadow-[0_18px_50px_rgba(9,21,44,.08)] sm:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[.2em] text-[#B28B09]">Univers 01 · plateforme principale</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Remplir la plateforme avec de vraies offres et de vraies entreprises</h2>
              <p className="mt-4 text-base leading-relaxed text-black/60">
                La plateforme principale ne concerne pas seulement les garages. Elle doit pouvoir accueillir les annonces et les véhicules de vendeurs, les catalogues de fournisseurs, les transporteurs capables d’acheminer les véhicules dans le monde entier, les services locaux et les entreprises qui construisent les futures activités de l’univers automobile.
              </p>
            </div>
            <Link to="/partenaires/inscription-partenaire?profil=vendeur-vehicules" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0A1630] px-6 text-sm font-black text-white">
              Commencer une candidature <Send className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_PROFILES.map((profile) => <ProfileCard key={profile.label} {...profile} />)}
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-[24px] border border-[#D4AF37]/30 bg-[#FFFDF5] p-6">
              <h3 className="text-xl font-black">Ce que vous pouvez apporter</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-black/70">
                {PLATFORM_CAPABILITIES.map((item) => <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#B28B09]" aria-hidden="true" />{item}</li>)}
              </ul>
            </div>
            <div className="rounded-[24px] bg-[#0A1630] p-6 text-white">
              <MapPinned className="h-7 w-7 text-[#E2B82D]" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-black">Aucune frontière par défaut</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">Afrique, Europe, Asie, Amériques, Moyen-Orient ou Océanie : indiquez le pays où vous exercez et les zones que vous pouvez réellement servir.</p>
              <Link to="/partenaires/inscription-partenaire?profil=fournisseur" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#E2B82D] px-4 py-3 text-sm font-black text-[#07111F]">Décrire mon périmètre <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section id="boutique" className="scroll-mt-6 overflow-hidden rounded-[32px] bg-[#0A1630] p-6 text-white shadow-[0_18px_50px_rgba(9,21,44,.16)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.2em] text-[#E2B82D]">Univers 02 · MKA.P-MS Boutique</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Une deuxième porte d’entrée pour les marchands et les catalogues</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">
                La Boutique est séparée de la plateforme principale. Elle peut accueillir des produits automobile, lifestyle, maison et mobilité, avec des marchands, marques, grossistes, fabricants et partenaires dropshipping. Les deux univers ne doivent pas mélanger leurs données ni leurs parcours.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {SHOP_PROFILES.map((profile) => <div key={profile} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80"><PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#E2B82D]" aria-hidden="true" /> <span>{profile}</span></div>)}
              </div>
            </div>
            <div className="rounded-[26px] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <Store className="h-9 w-9 text-[#E2B82D]" aria-hidden="true" />
              <h3 className="mt-4 text-xl font-black">Accéder à la Boutique</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">Consultez la vitrine publique ou envoyez votre présentation à l’équipe Boutique. La candidature Boutique reste séparée de la candidature plateforme.</p>
              <div className="mt-6 grid gap-3">
                <a href="https://shop.mkapms.site/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#E2B82D] px-5 text-sm font-black text-[#07111F]">Ouvrir la Boutique <Globe2 className="h-4 w-4" aria-hidden="true" /></a>
                <a href="mailto:boutique.mkapms@gmail.com?subject=Candidature%20partenaire%20MKA.P-MS%20Boutique" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white">Présenter mon activité Boutique <Mail className="h-4 w-4" aria-hidden="true" /></a>
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-white/50"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Contact Boutique : boutique.mkapms@gmail.com</p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-black/10 bg-white p-6 sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#B28B09]">Un dossier utile, pas un formulaire vide</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Les informations qui servent à vous orienter</h2>
            <p className="mt-4 text-base leading-relaxed text-black/60">Les informations sont recueillies pour comprendre votre activité, vérifier la zone que vous couvrez et préparer le bon parcours. Elles ne valent pas activation automatique : la candidature doit être examinée.</p>
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-black/10">
            {DATA_COLLECTED.map(([label, detail], index) => <div key={label} className={`grid gap-2 p-4 sm:grid-cols-[220px_1fr] ${index ? "border-t border-black/10" : ""}`}><strong className="text-sm">{label}</strong><span className="text-sm leading-relaxed text-black/60">{detail}</span></div>)}
          </div>
          <Link to="/partenaires/inscription-partenaire?profil=vendeur-vehicules" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0A1630] px-6 py-3 text-sm font-black text-white">Ouvrir le dossier mondial <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </section>

        <section className="rounded-[32px] bg-[#111B2E] p-6 text-white sm:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#E2B82D]">Après votre envoi</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Une candidature qui peut devenir une configuration</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([number, title, detail]) => <article key={number} className="rounded-2xl border border-white/10 bg-white/5 p-5"><span className="text-sm font-black text-[#E2B82D]">{number}</span><h3 className="mt-3 font-black">{title}</h3><p className="mt-2 text-sm leading-relaxed text-white/65">{detail}</p></article>)}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#D4AF37]/30 bg-[#FFFDF5] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-1 h-6 w-6 shrink-0 text-[#B28B09]" aria-hidden="true" />
              <div><h2 className="text-xl font-black">Vous ne savez pas encore quel parcours choisir ?</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/60">Présentez simplement votre entreprise, votre pays, votre activité et ce que vous souhaitez apporter. L’équipe pourra ensuite vous orienter vers l’espace adapté.</p></div>
            </div>
            <Link to="/partenaires/inscription-partenaire?profil=orientation" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0A1630] px-5 py-3 text-sm font-black text-white">Être orienté <UsersRound className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>

        <nav aria-label="Liens utiles pour rejoindre MKA.P-MS" className="flex flex-wrap gap-3 text-sm font-bold text-[#0A1630]">
          <Link to="/univers" className="rounded-xl border border-black/10 bg-white px-4 py-3">Tous les univers</Link>
          <Link to="/partenaires" className="rounded-xl border border-black/10 bg-white px-4 py-3">Réseau partenaires</Link>
          <Link to="/partenaires/inscription-partenaire?profil=orientation" className="rounded-xl border border-black/10 bg-white px-4 py-3">Candidature plateforme</Link>
          <a href="https://shop.mkapms.site/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-black/10 bg-white px-4 py-3">Boutique MKA.P-MS</a>
        </nav>
      </main>
    </div>
  );
}
