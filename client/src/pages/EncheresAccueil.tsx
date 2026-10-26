import { Link } from "react-router-dom";
import { ArrowRight, Award, Car, CheckCircle, FileText, Gavel, Globe2, Lock, Shield, Truck, Users } from "lucide-react";
import { useAuth } from "../lib/auth";
import { trpc } from "../lib/trpc";
import MetaSEO from "../components/MetaSEO";

const categories = [
  ["Reprise client", "Véhicules repris auprès de clients.", "bg-amber-500"],
  ["Stock MKA.P-MS", "Stock officiel de la plateforme.", "bg-[#D4AF37]"],
  ["Flotte", "Lots de flottes et renouvellements.", "bg-blue-500"],
  ["Accidenté", "Roulant ou non roulant, état documenté.", "bg-red-500"],
  ["Mécanique", "Véhicules avec travaux mécaniques.", "bg-orange-500"],
  ["Carrosserie", "Travaux extérieurs à prévoir.", "bg-pink-500"],
  ["Export", "Lots pour acheteurs internationaux.", "bg-emerald-500"],
  ["Lot professionnel", "Lots groupés réservés aux pros.", "bg-purple-600"],
];

const profiles = [
  "Garages et ateliers automobiles",
  "Marchands et négociants automobiles",
  "Exportateurs et importateurs",
  "Carrossiers et centres de réparation",
  "Loueurs, concessionnaires et gestionnaires de flottes",
  "Centres de recyclage automobile agréés",
];

export default function EncheresAccueil() {
  const { user } = useAuth();
  const enCours = trpc.auctionEngine.list.useQuery({ audience: "professionnel", status: "en_cours" });
  const prochaines = trpc.auctionEngine.list.useQuery({ audience: "professionnel", status: "programmee" });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080811] pb-24 text-white">
      <MetaSEO
        title="Enchères automobiles internationales pour professionnels"
        description="Portail MKA.P-MS pour enchères automobiles, reprises, flottes, lots export et véhicules sur commande. Consultation ouverte, accès aux offres réservé aux professionnels vérifiés."
        url="https://mkapms.com/acheter/encheres"
        image="https://mkapms.com/pubs/hero5-pro.jpg"
        schema={{ "@context": "https://schema.org", "@type": "Service", name: "Enchères automobiles MKA.P-MS", serviceType: "Marketplace automobile internationale", areaServed: "Worldwide", url: "https://mkapms.com/acheter/encheres", provider: { "@type": "Organization", name: "MKA.P-MS", url: "https://mkapms.com" } }}
      />
      <section className="relative isolate overflow-hidden bg-[#09051B]">
        <img src="/pubs/hero5-pro.jpg" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(164,79,255,.32),transparent_42%),linear-gradient(180deg,rgba(10,5,28,.38),#080811_92%)]" />
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 text-center sm:px-8 sm:pb-20 sm:pt-16">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-purple-400/35 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.16em] text-purple-200"><Globe2 size={13} /> Consultation ouverte dans le monde entier</div>
          <img src={user ? "/logo-closed.png" : "/logo-open.png"} alt={user ? "MKA.P-MS — membre connecté" : "MKA.P-MS — visiteur"} className="mx-auto mt-8 h-16 w-auto drop-shadow-[0_8px_22px_rgba(212,175,55,.45)] sm:h-24" draggable={false} />
          <h1 className="mt-7 text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">Enchères automobiles<span className="mt-2 block text-purple-300">pour les professionnels du monde entier</span></h1>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-white/70 sm:text-lg">Reprises clients, stock MKA.P-MS, flottes, véhicules roulants ou non roulants, lots export et véhicules nécessitant des travaux. Consultez les informations sans compte ; la connexion intervient uniquement pour enchérir ou gérer un dossier.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/encheres/live" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 text-sm font-black shadow-lg hover:bg-purple-500">Voir les enchères en cours <ArrowRight size={16} /></Link><Link to="/vehicule-sur-commande" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 text-sm font-black hover:bg-white/10">Véhicules sur commande <Car size={16} /></Link></div>
          <p className="mt-4 text-xs text-white/45">Les particuliers peuvent consulter le portail ; leur parcours d’achat est séparé et concerne uniquement les véhicules portant la mention « disponible sur commande ».</p>
        </div>
      </section>
      <main className="mx-auto max-w-6xl px-4 sm:px-8">
        <section className="-mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link to="/encheres/live" className="rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 p-4 shadow-lg"><Gavel size={22} className="mb-3" /><span className="block text-sm font-black">Enchères en cours</span><span className="mt-2 block text-[10px] text-white/65">{enCours.data?.length ?? "—"} lot(s) affiché(s)</span></Link>
          <Link to="/acheter/encheres/operations" className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-4 shadow-lg"><FileText size={22} className="mb-3" /><span className="block text-sm font-black">Prochaines ventes</span><span className="mt-2 block text-[10px] text-white/65">{prochaines.data?.length ?? "—"} vente(s) programmée(s)</span></Link>
          <Link to={user ? "/acheter/encheres/operations" : "/connexion"} className="rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 p-4 shadow-lg"><Award size={22} className="mb-3" /><span className="block text-sm font-black">Mes enchères</span><span className="mt-2 block text-[10px] text-white/65">Compte professionnel</span></Link>
          <Link to="/acheter/encheres/operations" className="rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 p-4 shadow-lg"><Shield size={22} className="mb-3" /><span className="block text-sm font-black">Conditions d’accès</span><span className="mt-2 block text-[10px] text-white/65">Documents et règles</span></Link>
        </section>
        <section className="mt-12 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <article className="rounded-3xl border border-purple-400/20 bg-[#121022] p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.2em] text-purple-300">Acheteurs internationaux</p><h2 className="mt-3 text-2xl font-black sm:text-3xl">Un portail ouvert à tous les professionnels qualifiés.</h2><p className="mt-4 text-sm leading-relaxed text-white/65">Un acheteur peut consulter les catégories, comprendre le parcours, préparer son dossier et demander l’accès depuis n’importe quel pays. La validation tient compte de l’identité, de l’entreprise, de l’activité et des documents applicables.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{profiles.map((profile) => <div key={profile} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 text-sm text-white/80"><Users size={18} className="shrink-0 text-purple-300" />{profile}</div>)}</div><div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100"><strong>Parcours particuliers :</strong> les enchères professionnelles restent séparées. Pour un particulier, seuls les véhicules MKA.P-MS identifiés « disponible sur commande » sont proposés.</div></article>
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.2em] text-[#D4AF37]">Avant de participer</p><h2 className="mt-3 text-2xl font-black">Ce qui est réel et vérifié.</h2><ul className="mt-5 space-y-3 text-sm leading-relaxed text-white/65"><li className="flex gap-2"><CheckCircle size={16} className="mt-1 shrink-0 text-emerald-300" />Lots, prix, offres et statuts viennent du moteur d’enchères.</li><li className="flex gap-2"><CheckCircle size={16} className="mt-1 shrink-0 text-emerald-300" />Aucun véhicule ou volume n’est inventé pour remplir l’écran.</li><li className="flex gap-2"><CheckCircle size={16} className="mt-1 shrink-0 text-emerald-300" />La connexion est demandée uniquement pour enchérir et gérer un dossier.</li><li className="flex gap-2"><Lock size={16} className="mt-1 shrink-0 text-amber-300" />Logo fermé : membre connecté. Logo ouvert : visiteur.</li></ul></article>
        </section>
        <section className="mt-12"><p className="text-xs font-black uppercase tracking-[.2em] text-purple-300">Catalogue organisé</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Catégories de véhicules</h2><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{categories.map(([label, description, color]) => <Link key={label} to="/encheres/live" className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-300/40 hover:bg-white/10"><span className={"inline-block rounded-full " + color + " px-3 py-1 text-[9px] font-black"}>{label.toUpperCase()}</span><p className="mt-3 text-sm font-bold">{label}</p><p className="mt-1 text-[11px] leading-relaxed text-white/45">{description}</p></Link>)}</div></section>
        <section className="mt-12 grid gap-5 md:grid-cols-3">{[{ title: "1. Vérification", icon: Shield, text: "Le professionnel crée son compte et transmet les justificatifs demandés selon son pays : identité, entreprise, activité automobile et coordonnées de paiement." }, { title: "2. Achat", icon: Gavel, text: "Après validation, il consulte les informations disponibles, examine le lot et place une offre selon les règles et le palier affichés." }, { title: "3. Livraison", icon: Truck, text: "Après adjudication et paiement confirmé, le retrait, le transport ou la livraison sont organisés selon la localisation, l’état et la destination." }].map((item) => <article key={item.title} className="rounded-3xl border border-white/10 bg-[#121022] p-6"><item.icon className="text-purple-300" size={24} /><h3 className="mt-4 text-lg font-black">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p></article>)}</section>
        <section className="mt-12 grid gap-5 lg:grid-cols-2"><article className="rounded-3xl border border-blue-300/15 bg-blue-400/5 p-6 sm:p-8"><div className="flex items-center gap-3"><Truck className="text-blue-300" /><h2 className="text-xl font-black">Comment les véhicules sont livrés</h2></div><ul className="mt-5 space-y-3 text-sm leading-relaxed text-white/65">{["Transport organisé par MKA.P-MS, enlèvement par un transporteur mandaté ou retrait lorsque l’option est disponible.", "Devis selon pays, hub, destination, gabarit et état roulant ou non roulant.", "Paiement confirmé, autorisation de retrait, documents et accessibilité contrôlés avant l’enlèvement.", "Pour l’export, les formalités dépendent du pays de destination et des documents réellement disponibles."].map((x) => <li key={x} className="flex gap-2"><CheckCircle size={15} className="mt-1 shrink-0 text-blue-300" />{x}</li>)}</ul></article><article className="rounded-3xl border border-emerald-300/15 bg-emerald-400/5 p-6 sm:p-8"><div className="flex items-center gap-3"><Shield className="text-emerald-300" /><h2 className="text-xl font-black">Après-vente et suivi</h2></div><ul className="mt-5 space-y-3 text-sm leading-relaxed text-white/65">{["Le dossier reprend uniquement les informations fournies et vérifiées : photos, état, documents et mentions du vendeur.", "Les frais, délais, conditions de vente et recours sont affichés dans le dossier et les documents contractuels.", "Une question ou un incident passe par le canal d’assistance prévu ; aucune garantie générale n’est promise pour un véhicule vendu en l’état.", "Le suivi de paiement, retrait et livraison est communiqué à mesure que chaque étape est confirmée."].map((x) => <li key={x} className="flex gap-2"><CheckCircle size={15} className="mt-1 shrink-0 text-emerald-300" />{x}</li>)}</ul></article></section>
        <section className="mt-12 rounded-3xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#1B1530] to-[#11101D] p-6 sm:p-8"><div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#D4AF37]">Professionnels vendeurs et acheteurs</p><h2 className="mt-2 text-2xl font-black">Comprendre avant de créer un compte.</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">La consultation est ouverte. La connexion est demandée uniquement pour enchérir, gérer vos offres, déposer un dossier professionnel ou accéder à vos véhicules remportés.</p></div><Link to="/connexion?tab=register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-5 text-sm font-black text-[#080811]">Créer mon compte pro <ArrowRight size={16} /></Link></div></section>
      </main>
    </div>
  );
}
