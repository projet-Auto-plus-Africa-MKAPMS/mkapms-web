import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Plus, PlusCircle, FileText, Wrench, Car, KeyRound, Truck, Star,
  ArrowRight, ShieldCheck, Users, User, Gauge, Heart, ChevronRight, ChevronDown,
  CheckCircle, Check, Clock, Package, Phone, Mail, MapPin, Globe, Headphones, Tag, Zap,
  Award, Shield,
} from "lucide-react";

/* ── Icône moto (SVG custom) ── */
const MotoIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="5" cy="17" r="3" />
    <circle cx="19" cy="17" r="3" />
    <path d="M5 14l4-9h3" />
    <path d="M12 5l3 9h4" />
    <path d="M15 6h4l-1 3" />
    <path d="M9 5L8 2" />
  </svg>
);
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import VehicleCard from "../components/VehicleCard";

/* ── catégories ── */
const CATEGORIES: { label: string; count: string; to: string; icon: "car" | "truck" | "gauge" | "moto" }[] = [
  { label: "Citadines", count: "+2 350", to: "/acheter?categorie=citadine", icon: "car" },
  { label: "Berlines", count: "+4 152", to: "/acheter?categorie=berline", icon: "car" },
  { label: "SUV & 4x4", count: "+3 782", to: "/acheter?categorie=suv", icon: "truck" },
  { label: "Utilitaires", count: "+1 256", to: "/acheter?categorie=utilitaire", icon: "truck" },
  { label: "Coupés", count: "+1 842", to: "/acheter?categorie=coupe", icon: "gauge" },
  { label: "Motos", count: "+2 620", to: "/acheter?famille=moto", icon: "moto" },
  { label: "Scooters", count: "+1 125", to: "/acheter?famille=moto&categorie=scooter", icon: "moto" },
];
const CAT_ICONS: Record<string, React.FC<{ size: number; className: string }>> = {
  car: Car, truck: Truck, gauge: Gauge, moto: MotoIcon,
};

/* ── annonces démo ── */
const DEMO_ANNONCES = [
  { id: 9001, titre: "Peugeot 3008 GT Line", marque: "Peugeot", modele: "3008", annee: 2022, kilometrage: 35000, carburant: "Diesel", prix: 28900, type: "vente", ville: "Paris", vendeurType: "professionnel", photoPrincipale: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=280&fit=crop" },
  { id: 9002, titre: "Renault Clio V Intens", marque: "Renault", modele: "Clio", annee: 2023, kilometrage: 18000, carburant: "Essence", prix: 16500, type: "vente", ville: "Lyon", vendeurType: "particulier", photoPrincipale: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&h=280&fit=crop" },
  { id: 9003, titre: "BMW Série 3 320d M Sport", marque: "BMW", modele: "Série 3", annee: 2021, kilometrage: 42000, carburant: "Diesel", prix: 35900, type: "vente", ville: "Marseille", vendeurType: "professionnel", boosted: true, photoPrincipale: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=280&fit=crop" },
  { id: 9004, titre: "Mercedes Classe A 200", marque: "Mercedes", modele: "Classe A", annee: 2022, kilometrage: 25000, carburant: "Essence", prix: 32000, type: "vente", ville: "Toulouse", vendeurType: "professionnel", boosted: true, photoPrincipale: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=280&fit=crop" },
  { id: 9005, titre: "Citroën C3 Aircross", marque: "Citroën", modele: "C3 Aircross", annee: 2023, kilometrage: 12000, carburant: "Essence", prix: 19900, type: "vente", ville: "Bordeaux", vendeurType: "particulier", photoPrincipale: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=280&fit=crop" },
  { id: 9006, titre: "Volkswagen Golf 8 R-Line", marque: "Volkswagen", modele: "Golf", annee: 2022, kilometrage: 30000, carburant: "Essence", prix: 27500, type: "vente", ville: "Nice", vendeurType: "professionnel", boosted: true, photoPrincipale: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=280&fit=crop" },
  { id: 9007, titre: "Toyota Yaris Hybride", marque: "Toyota", modele: "Yaris", annee: 2023, kilometrage: 8000, carburant: "Hybride", prix: 21500, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 45, photoPrincipale: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=280&fit=crop" },
  { id: 9008, titre: "Audi A4 Avant S-Line", marque: "Audi", modele: "A4", annee: 2021, kilometrage: 55000, carburant: "Diesel", prix: 31900, type: "vente", ville: "Lille", vendeurType: "professionnel", boosted: true, photoPrincipale: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=280&fit=crop" },
  { id: 9009, titre: "Dacia Sandero Stepway", marque: "Dacia", modele: "Sandero", annee: 2022, kilometrage: 22000, carburant: "Essence", prix: 14500, type: "vente", ville: "Nantes", vendeurType: "particulier", photoPrincipale: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=280&fit=crop" },
  { id: 9010, titre: "Fiat 500 Lounge", marque: "Fiat", modele: "500", annee: 2021, kilometrage: 32000, carburant: "Essence", prix: 13900, type: "vente", ville: "Strasbourg", vendeurType: "particulier", photoPrincipale: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=280&fit=crop" },
];

/* ── annonces location démo ── */
const DEMO_LOCATION = [
  { id: 9101, titre: "Peugeot 208 GT", marque: "Peugeot", modele: "208", annee: 2023, kilometrage: 5000, carburant: "Essence", prix: 35, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 35, photoPrincipale: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=280&fit=crop" },
  { id: 9102, titre: "Renault Captur Intens", marque: "Renault", modele: "Captur", annee: 2022, kilometrage: 15000, carburant: "Diesel", prix: 42, type: "location", ville: "Lyon", vendeurType: "professionnel", prixJour: 42, photoPrincipale: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=400&h=280&fit=crop" },
  { id: 9103, titre: "Citroën C4 Feel", marque: "Citroën", modele: "C4", annee: 2023, kilometrage: 8000, carburant: "Hybride", prix: 48, type: "location", ville: "Marseille", vendeurType: "professionnel", prixJour: 48, photoPrincipale: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=280&fit=crop" },
  { id: 9104, titre: "Mercedes Classe C", marque: "Mercedes", modele: "Classe C", annee: 2022, kilometrage: 20000, carburant: "Diesel", prix: 75, type: "location", ville: "Paris", vendeurType: "professionnel", prixJour: 75, boosted: true, photoPrincipale: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=280&fit=crop" },
  { id: 9105, titre: "Toyota RAV4 Hybride", marque: "Toyota", modele: "RAV4", annee: 2023, kilometrage: 10000, carburant: "Hybride", prix: 55, type: "location", ville: "Toulouse", vendeurType: "professionnel", prixJour: 55, photoPrincipale: "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=400&h=280&fit=crop" },
  { id: 9106, titre: "BMW Série 1 118i", marque: "BMW", modele: "Série 1", annee: 2022, kilometrage: 18000, carburant: "Essence", prix: 60, type: "location", ville: "Bordeaux", vendeurType: "professionnel", prixJour: 60, boosted: true, photoPrincipale: "https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=400&h=280&fit=crop" },
];

/* ── partenaires ── */
const PARTENAIRES = [
  { title: "Top Garages", desc: "Des garages certifiés proches de chez vous.", cta: "Voir les garages", to: "/garages", color: "bg-[#D4AF37]" },
  { title: "Experts en pièces", desc: "Trouvez vos pièces auto, au meilleur prix.", cta: "Voir les pièces", to: "/pieces", color: "bg-[#D4AF37]" },
  { title: "VTC & Taxis", desc: "Location de véhicules conformes VTC & Taxi pour professionnels.", cta: "Voir les flottes", to: "/vtc-taxi", color: "bg-[#D4AF37]" },
  { title: "Dépanneurs", desc: "Une assistance rapide 24h/24 et 7j/7.", cta: "Demander", to: "/depannage", color: "bg-[#D4AF37]" },
];

/* ── activités pro ── */
const PRO_ACTIVITIES = [
  { label: "Vente Pro", to: "/espace-pro" },
  { label: "Garage Pro", to: "/garage-plus" },
  { label: "Location Pro", to: "/espace-pro" },
  { label: "VTC / Taxi", to: "/vtc-taxi" },
  { label: "Livraison Pro", to: "/livraison" },
  { label: "Pièces Auto", to: "/pieces" },
  { label: "Dépannage Pro", to: "/depannage" },
  { label: "Comptabilité Pro", to: "/comptabilite" },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stats = trpc.meta.homeStats.useQuery();
  const featured = trpc.annonces.list.useQuery({ type: "vente", limit: 8 });
  const trpcUtils = trpc.useUtils();

  /* recherche */
  const [searchTab, setSearchTab] = useState<"toutes" | "voitures" | "motos" | "utilitaires">("toutes");
  const [sMarque, setSMarque] = useState("");
  const [sModele, setSModele] = useState("");
  const [sLoc, setSLoc] = useState("");
  const [sPrix, setSPrix] = useState("");

  /* estimation */
  const [estimPlaque, setEstimPlaque] = useState("");
  const [estimVin, setEstimVin] = useState("");
  const [estimMarque, setEstimMarque] = useState("");
  const [estimModele, setEstimModele] = useState("");
  const [estimAnnee, setEstimAnnee] = useState("2020");
  const [estimCarburant, setEstimCarburant] = useState("diesel");
  const [estimKm, setEstimKm] = useState("");
  const [estimBoite, setEstimBoite] = useState("manuelle");
  const [estimEtat, setEstimEtat] = useState("Bon");
  const [estimLoading, setEstimLoading] = useState(false);
  const [estimLookupLoading, setEstimLookupLoading] = useState(false);
  const [estimResult, setEstimResult] = useState<{ low: number; mid: number; high: number } | null>(null);
  const [estimPlateResult, setEstimPlateResult] = useState<any>(null);

  /* historique */
  const [histPlaque, setHistPlaque] = useState("");
  const [histResult, setHistResult] = useState(false);

  /* carousel accueil */
  const [carouselIdx, setCarouselIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  /* newsletter */
  const [newsEmail, setNewsEmail] = useState("");

  function doSearch() {
    navigate("/rechercher");
  }

  return (
    <div className="overflow-x-hidden bg-white">

      {/* ═══════════════════════════════════════════════════════════
          HOMEPAGE — tout visible sur 1 écran mobile
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F5F3EF]">
        <div className="container-page text-center pt-3 pb-1 md:pt-6 md:pb-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37] md:text-xs">LA MARKETPLACE AUTOMOBILE</p>
          <h1 className="mt-1.5 text-[20px] font-black uppercase leading-[1.12] md:mt-3 md:text-3xl lg:text-4xl">
            <span className="text-[#111]">ACHETEZ, VENDEZ,</span><br />
            <span className="text-[#D4AF37]">LOUEZ, RÉPAREZ,</span><br />
            <span className="text-[#D4AF37]">ENTRETENEZ EN TOUTE CONFIANCE,</span><br />
            <span className="text-[#111]">PARTOUT, À TOUT MOMENT.</span>
          </h1>
          <div className="mx-auto my-2 flex items-center justify-center gap-2 md:my-4 md:gap-3">
            <div className="h-px w-10 bg-[#D4AF37] md:w-12" />
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#D4AF37] md:h-9 md:w-9">
              <span className="text-[11px] font-extrabold text-[#D4AF37] md:text-sm">M</span>
            </div>
            <div className="h-px w-10 bg-[#D4AF37] md:w-12" />
          </div>
          <p className="mx-auto max-w-md text-xs text-[#6B7280] leading-snug md:text-sm md:leading-relaxed">
            Achat, vente, location, entretien, livraison et bien plus encore.<br />
            Tout l'univers automobile réuni au même endroit.
          </p>
        </div>

        {/* ── CAROUSEL + 4 ACTIONS (même conteneur = zéro espace) ── */}
        <div className="px-4 pt-1 pb-4 md:px-6 md:pt-4 md:pb-6">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl md:rounded-2xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
            >
              {[
                "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&h=450&fit=crop",
                "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=450&fit=crop",
                "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=450&fit=crop",
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=450&fit=crop",
                "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=450&fit=crop",
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Véhicule ${i + 1}`}
                  className="w-full shrink-0 aspect-[4/3] object-cover"
                />
              ))}
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCarouselIdx(i)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    carouselIdx === i ? "bg-[#D4AF37] scale-110" : "bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="mx-auto mt-2 grid max-w-3xl grid-cols-4 gap-1.5 md:max-w-2xl md:mt-3 md:gap-3">
            {[
              { icon: Tag, label: "VENDRE", sub: "Mon véhicule", to: "/vendre" },
              { icon: Search, label: "ACHETER", sub: "Un véhicule", to: "/acheter" },
              { icon: KeyRound, label: "LOUER", sub: "Un véhicule", to: "/louer" },
              { icon: Wrench, label: "RÉPARER", sub: "Mon véhicule", to: "/garages" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.to}
                  to={a.to}
                  className="group flex flex-col items-center gap-1 rounded-xl border border-[#D4AF37]/40 bg-white px-1 pb-2 pt-2.5 text-center transition hover:shadow-md md:gap-2 md:rounded-2xl md:px-3 md:pb-4 md:pt-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-white md:h-16 md:w-16">
                    <Icon size={20} className="text-[#D4AF37] md:hidden" />
                    <Icon size={32} className="hidden text-[#D4AF37] md:block" />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wide text-[#111] md:text-xs">{a.label}</span>
                  <span className="text-[7px] text-[#6B7280] md:text-[10px]">{a.sub}</span>
                  <div className="flex h-6 w-full items-center justify-center rounded-full bg-[#D4AF37] transition group-hover:bg-[#C5A028] md:h-9">
                    <ArrowRight size={12} className="text-white md:hidden" />
                    <ArrowRight size={16} className="hidden text-white md:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4 BADGES CONFIANCE ── */}
      <section className="bg-white py-3 border-t border-[#E5E7EB] md:py-6">
        <div className="container-page">
          <div className="mx-auto flex max-w-lg md:max-w-2xl">
            {[
              { icon: Shield, title: "100% SÉCURISÉ", desc: "Transactions protégées" },
              { icon: Award, title: "MEILLEURS PRIX", desc: "Des offres compétitives" },
              { icon: Headphones, title: "SUPPORT 7J/7", desc: "Une équipe à votre écoute" },
              { icon: CheckCircle, title: "FACILE & RAPIDE", desc: "Publiez ou trouvez en quelques clics" },
            ].map((b, idx) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className={`flex flex-1 flex-col items-center gap-0.5 text-center px-1 md:gap-1.5 ${idx < 3 ? "border-r border-[#E5E7EB]" : ""}`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 md:h-14 md:w-14">
                    <Icon size={16} className="text-[#D4AF37] md:hidden" />
                    <Icon size={24} className="hidden text-[#D4AF37] md:block" />
                  </div>
                  <h3 className="text-[7px] font-extrabold uppercase leading-tight tracking-wide text-[#111] md:text-[10px]">{b.title}</h3>
                  <p className="text-[7px] text-[#6B7280] leading-tight md:text-[9px]">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. RECHERCHE + ESTIMATION — CÔTE À CÔTE
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-4">
        <div className="container-page space-y-6">
          {/* Recherche — gros bouton style La Centrale */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col items-center justify-center gap-4">
            <Search size={28} className="text-[#D4AF37]" />
            <h3 className="text-lg font-bold text-[#111] text-center">Rechercher un véhicule</h3>
            <p className="text-xs text-[#6B7280] text-center">Voitures, motos, utilitaires — trouvez votre véhicule idéal</p>
            <button onClick={doSearch} className="w-full flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] py-4 text-base font-bold text-white hover:bg-[#C5A028] transition shadow-md">
              <Search size={18} /> Nouvelle recherche
            </button>
          </div>

          {/* Carrousel Nos véhicules MKA.P-MS */}
          <div>
            <h3 className="text-base font-bold text-[#111]">Nos véhicules MKA.P-MS</h3>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
              {[
                { id: 8001, titre: "Peugeot 308 GT", marque: "Peugeot", modele: "308", annee: 2023, kilometrage: 12000, carburant: "Essence", prix: 26900, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", photoPrincipale: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=280&fit=crop" },
                { id: 8002, titre: "Renault Austral Iconic", marque: "Renault", modele: "Austral", annee: 2024, kilometrage: 5000, carburant: "Hybride", prix: 34500, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", photoPrincipale: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=400&h=280&fit=crop" },
                { id: 8003, titre: "Citroën C5 X Shine", marque: "Citroën", modele: "C5 X", annee: 2023, kilometrage: 18000, carburant: "Diesel", prix: 31900, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", photoPrincipale: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=280&fit=crop" },
                { id: 8004, titre: "Mercedes GLA 200", marque: "Mercedes", modele: "GLA", annee: 2022, kilometrage: 22000, carburant: "Essence", prix: 38900, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", photoPrincipale: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=280&fit=crop" },
                { id: 8005, titre: "BMW X1 sDrive18i", marque: "BMW", modele: "X1", annee: 2023, kilometrage: 15000, carburant: "Essence", prix: 35500, type: "vente", ville: "Belloy-en-France", vendeurType: "professionnel", photoPrincipale: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=280&fit=crop" },
              ].map((v: any) => (
                <div key={v.id} className="carousel-card">
                  <VehicleCard v={v} />
                </div>
              ))}
            </div>
          </div>

          {/* Estimation de voiture — formulaire complet */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-extrabold text-[#111]">Estimation de voiture</h3>
            <p className="mt-1 text-xs text-[#6B7280]">Obtenez une estimation gratuite en quelques secondes</p>

            {/* Plaque + VIN */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Plaque</label>
                <input className="input text-sm" placeholder="AB-123-CD" value={estimPlaque} onChange={(e) => setEstimPlaque(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">VIN</label>
                <input className="input text-sm" placeholder="VF1XXXXX..." value={estimVin} onChange={(e) => setEstimVin(e.target.value.toUpperCase())} maxLength={17} />
              </div>
            </div>
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={(!estimPlaque.trim() && !estimVin.trim()) || estimLookupLoading}
              onClick={async () => {
                const query = estimPlaque.trim() || estimVin.trim();
                const type = estimPlaque.trim() ? "plaque" : "vin";
                if (!query) return;
                setEstimLookupLoading(true);
                try {
                  const r = await trpcUtils.annonces.lookupPlate.fetch({ type, query });
                  if (r) {
                    setEstimPlateResult(r);
                    if (r.marque) setEstimMarque(r.marque);
                    if (r.modele) setEstimModele(r.modele);
                    if (r.annee) setEstimAnnee(String(r.annee));
                    if (r.carburant) setEstimCarburant(r.carburant);
                    if (r.boite) setEstimBoite(r.boite);
                  }
                } catch {} finally { setEstimLookupLoading(false); }
              }}
            >
              <Search size={16} />
              {estimLookupLoading ? "Recherche..." : "Rechercher et remplir automatiquement"}
            </button>

            {estimPlateResult && (
              <div className="mt-2 rounded-lg bg-green-50 border border-green-200 p-2 text-xs text-green-700 font-medium">
                {estimPlateResult.marque} {estimPlateResult.modele} {estimPlateResult.annee && `(${estimPlateResult.annee})`}
              </div>
            )}

            {/* Marque + Modèle */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Marque *</label>
                <select className="input text-sm" value={estimMarque} onChange={(e) => setEstimMarque(e.target.value)}>
                  <option value="">Choisir</option>
                  {["Renault","Peugeot","Citroën","Volkswagen","BMW","Mercedes","Audi","Toyota","Nissan","Ford","Opel","Fiat","Hyundai","Kia","Dacia","Skoda","Seat","Volvo","Mazda","Honda","Suzuki","Mitsubishi","Jeep","Land Rover","Porsche","Tesla","Mini","Alfa Romeo","DS","Jaguar","Lexus","Autre"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Modèle *</label>
                <input className="input text-sm" placeholder="308, Clio..." value={estimModele} onChange={(e) => setEstimModele(e.target.value)} />
              </div>
            </div>

            {/* Année + Carburant */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Année</label>
                <select className="input text-sm" value={estimAnnee} onChange={(e) => setEstimAnnee(e.target.value)}>
                  {Array.from({ length: 30 }, (_, i) => 2025 - i).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Carburant</label>
                <select className="input text-sm" value={estimCarburant} onChange={(e) => setEstimCarburant(e.target.value)}>
                  <option value="diesel">Diesel</option>
                  <option value="essence">Essence</option>
                  <option value="electrique">Électrique</option>
                  <option value="hybride">Hybride</option>
                  <option value="gpl">GPL</option>
                </select>
              </div>
            </div>

            {/* Km (slider) */}
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">
                Kilométrage : {estimKm ? Number(estimKm).toLocaleString() : "0"} km
              </label>
              <input
                type="range"
                min="0"
                max="300000"
                step="1000"
                value={estimKm || "0"}
                onChange={(e) => setEstimKm(e.target.value)}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #D4AF37 ${(Number(estimKm || 0) / 300000) * 100}%, #E5E7EB ${(Number(estimKm || 0) / 300000) * 100}%)` }}
              />
              <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
                <span>0 km</span>
                <span>150 000 km</span>
                <span>300 000 km</span>
              </div>
            </div>

            {/* Boîte */}
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Boîte</label>
              <select className="input text-sm" value={estimBoite} onChange={(e) => setEstimBoite(e.target.value)}>
                <option value="manuelle">Manuelle</option>
                <option value="automatique">Automatique</option>
              </select>
            </div>

            {/* État */}
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">État général</label>
              <div className="flex flex-wrap gap-1.5">
                {["Excellent", "Très bon", "Bon", "Correct", "À rénover"].map((e) => (
                  <button key={e} type="button" onClick={() => setEstimEtat(e)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${estimEtat === e ? "border-[#D4AF37] bg-[#D4AF37] text-white" : "border-[#D1D5DB] text-[#374151]"}`}
                  >{e}</button>
                ))}
              </div>
            </div>

            {/* Bouton estimer */}
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white hover:bg-[#333] disabled:opacity-50"
              disabled={!estimMarque || estimLoading}
              onClick={async () => {
                setEstimLoading(true);
                try {
                  const r = await trpcUtils.annonces.estimate.fetch({
                    marque: estimMarque,
                    modele: estimModele || "standard",
                    annee: estimAnnee ? Number(estimAnnee) : undefined,
                    kilometrage: estimKm ? Number(estimKm) : undefined,
                    carburant: estimCarburant,
                    boite: estimBoite,
                    etat: estimEtat,
                  });
                  setEstimResult(r);
                } finally { setEstimLoading(false); }
              }}
            >
              {estimLoading ? "Calcul..." : "Obtenir mon estimation gratuite"}
            </button>

            {/* Résultat — Analyse IA MKA.P-MS */}
            {estimResult && (
              <div className="mt-4 rounded-xl border-2 border-[#D4AF37] bg-[#FFFBEB] p-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37]"><span className="text-[8px] font-bold text-white">IA</span></div>
                  <p className="text-xs font-bold text-[#92400E]">Estimation IA MKA.P-MS</p>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-[#D4AF37]">
                  {estimResult.low.toLocaleString()} € – {estimResult.high.toLocaleString()} €
                </p>
                <p className="mt-1 text-sm text-[#111]">Prix conseillé : <strong>{estimResult.mid.toLocaleString()} €</strong></p>
                <p className="mt-1 text-[10px] text-[#6B7280]">
                  {estimResult.method === "comparables"
                    ? `Basée sur ${estimResult.sampleSize} véhicules similaires en vente`
                    : "Analyse IA basée sur la cote du marché français, ajustée selon marque, modèle, année, km, état et carburant"}
                </p>
                <div className="mt-2 flex items-center justify-center gap-3 text-[9px] text-green-700">
                  <span>✓ Analyse IA</span>
                  <span>✓ Données marché</span>
                  <span>✓ Mise à jour en temps réel</span>
                </div>
                <Link to="/vendre" className="mt-3 inline-block rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white hover:bg-[#C5A028]">
                  Déposer une annonce →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. CATÉGORIES POPULAIRES
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#111] sm:text-xl">Catégories populaires</h2>
            <Link to="/acheter" className="flex items-center gap-1 text-sm font-semibold text-[#D4AF37] hover:underline">Voir toutes <ArrowRight size={14} /></Link>
          </div>
          <div className="mt-6 flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {CATEGORIES.map((c) => (
              <Link key={c.label} to={c.to} className="group flex w-[120px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-3 py-4 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] transition group-hover:bg-[#D4AF37]/10">
                  {(() => { const Icon = CAT_ICONS[c.icon]; return <Icon size={22} className="text-[#6B7280] group-hover:text-[#D4AF37]" />; })()}
                </div>
                <span className="text-xs font-bold text-[#111]">{c.label}</span>
                <span className="text-[10px] text-[#9CA3AF]">{c.count} annonces</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3b. ANNONCES PREMIUM (entre Catégories et Se connecter)
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-8">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#111]">
              <Star size={18} className="text-[#D4AF37]" fill="#D4AF37" /> Annonces Premium
            </h2>
            <Link to="/acheter" className="text-sm font-semibold text-[#6B7280] hover:text-[#D4AF37]">Voir toutes →</Link>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {featured.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="carousel-card">
                    <div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#E5E7EB]" />
                  </div>
                ))
              : (featured.data?.items && featured.data.items.length > 0
                  ? featured.data.items.slice(0, 10)
                  : DEMO_ANNONCES.filter(a => a.boosted)
                ).map((v: any) => (
                  <div key={v.id} className="carousel-card">
                    <VehicleCard v={v} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3c. SE CONNECTER / CRÉER UN COMPTE
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-6">
        <div className="container-page">
          <div className="mx-auto max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <Link to="/connexion" className="flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10">
                  <User size={22} className="text-[#D4AF37]" />
                </div>
                <p className="text-sm font-bold text-[#111]">Se connecter</p>
                <p className="text-[10px] text-[#6B7280]">Accédez à votre espace</p>
              </Link>
              <Link to="/connexion?tab=register" className="flex flex-col items-center gap-2 rounded-xl border border-[#D4AF37] bg-[#D4AF37]/5 p-4 text-center transition hover:bg-[#D4AF37]/10 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]">
                  <PlusCircle size={22} className="text-white" />
                </div>
                <p className="text-sm font-bold text-[#D4AF37]">Créer un compte</p>
                <p className="text-[10px] text-[#6B7280]">Particulier ou Professionnel</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. HISTORIQUE VÉHICULE — Carte compacte (page complète sur /historique)
         ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-[#D4AF37]/20 bg-[#FFFDF5] py-8">
        <div className="container-page">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111]">
                <span className="text-xs font-extrabold text-[#D4AF37]">M</span>
              </div>
              <h2 className="text-base font-extrabold text-[#111]">Historique <span className="text-[#D4AF37]">Véhicule</span></h2>
            </div>
            <p className="mt-2 max-w-md text-xs text-[#6B7280]">Vérifiez l'historique complet de votre futur véhicule avant d'acheter. Rapports officiels, score de confiance, analyse IA.</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#111]"><CheckCircle size={10} className="text-[#D4AF37]" /> Rapport Express 4,99 € · Complet 7,99 € · Premium 12,99 €</div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#111]"><CheckCircle size={10} className="text-[#D4AF37]" /> Score de confiance MKA.P-MS /100</div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#111]"><CheckCircle size={10} className="text-[#D4AF37]" /> Données officielles vérifiées</div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#111]"><CheckCircle size={10} className="text-[#D4AF37]" /> Rapport instantané + Analyse IA</div>
            </div>
            <div className="mt-5 flex flex-col items-center gap-3">
              <Link to="/historique" className="inline-flex items-center gap-1 rounded-full border-2 border-[#D4AF37] px-6 py-2.5 text-xs font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition">
                Vérifier un véhicule <ArrowRight size={12} />
              </Link>
              <Link to="/historique" className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#C5A028]">
                Découvrir l'Historique Véhicule <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          5. SERVICES PRINCIPAUX
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10">
        <div className="container-page">
          <h2 className="text-center text-xl font-bold text-[#111]">Nos services principaux</h2>
          <p className="mt-1 text-center text-sm text-[#6B7280]">Tout ce dont vous avez besoin, au même endroit</p>
          {(() => {
            const services = [
              { icon: Car, title: "Achat / Vente", desc: "Trouvez ou vendez votre véhicule.", cta: "Voir les annonces", to: "/acheter" },
              { icon: KeyRound, title: "Location", desc: "Louez en toute confiance.", cta: "Voir les offres", to: "/louer" },
              { icon: Gauge, title: "VO Interne", desc: "Gestion complète véhicules d'occasion.", cta: "Accéder au VO", to: "/vo" },
              { icon: FileText, title: "Devis & Garages", desc: "Devis rapide + réseau de garages.", cta: "Demander un devis", to: "/garages" },
              { icon: Wrench, title: "Dépannage", desc: "Assistance routière 24h/24, 7j/7.", cta: "Demander", to: "/depannage", accent: true },
              { icon: Truck, title: "Livraison & Pièces", desc: "Pièces et livraison rapide.", cta: "Découvrir", to: "/pieces" },
              { icon: Star, title: "Finance+", desc: "LOA & paiement fractionné.", cta: "Simuler", to: "/finance", gold: true },
            ];
            return (
              <div className="mt-6 flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
                {services.map((s) => {
                  const Icon = s.icon;
                  const isAccent = (s as any).accent;
                  return (
                    <Link key={s.to} to={s.to} className={`group flex w-[140px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border px-3 py-5 text-center transition hover:shadow-md ${isAccent ? "border-red-200 bg-red-50 hover:border-red-400" : "border-[#E5E7EB] bg-white hover:border-[#D4AF37]"}`}>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full transition ${isAccent ? "bg-red-100 group-hover:bg-red-200" : "bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20"}`}>
                        <Icon size={22} className={isAccent ? "text-red-600" : "text-[#D4AF37]"} />
                      </div>
                      <h3 className="text-xs font-bold text-[#111]">{s.title}</h3>
                      <p className="text-[10px] text-[#6B7280] leading-tight">{s.desc}</p>
                      <span className={`mt-auto rounded-lg px-3 py-1.5 text-[10px] font-bold text-white ${isAccent ? "bg-red-600" : "bg-[#D4AF37]"}`}>{s.cta}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION FINANCE+
         ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-[#D4AF37]/20 bg-[#FFFDF5] py-8">
        <div className="container-page">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <Star size={18} className="text-[#D4AF37]" fill="#D4AF37" />
              <h2 className="text-base font-extrabold text-[#111]">Finance+ MKA.P-MS</h2>
            </div>
            <p className="mt-2 max-w-md text-xs text-[#6B7280]">LOA, paiement fractionné — des solutions pour financer votre véhicule directement sur la plateforme.</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#111]"><CheckCircle size={10} className="text-[#D4AF37]" /> Location avec Option d'Achat</div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#111]"><CheckCircle size={10} className="text-[#D4AF37]" /> Paiement fractionné jusqu'à 10x</div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#111]"><CheckCircle size={10} className="text-[#D4AF37]" /> Simulation instantanée</div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#111]"><CheckCircle size={10} className="text-[#D4AF37]" /> Tout reste dans MKA.P-MS</div>
            </div>
            <Link to="/finance" className="mt-4 inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#C5A028]">
              Découvrir Finance+ <ArrowRight size={12} />
            </Link>
            <div className="mt-4 rounded-full border border-[#D4AF37]/30 bg-white px-8 py-3 text-center shadow-sm">
              <p className="text-[8px] font-semibold text-[#D4AF37]">EXEMPLE LOA · À partir de</p>
              <p className="text-xl font-extrabold text-[#D4AF37]">199 €<span className="text-xs text-slate-400">/mois</span></p>
              <p className="text-[8px] text-slate-500">sur 48 mois • Option d'achat disponible</p>
            </div>
            <Link to="/finance" className="mt-3 inline-flex items-center gap-1 rounded-full border-2 border-[#D4AF37] px-6 py-2.5 text-xs font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition">
              Simuler ma LOA <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ESPACE PUBLICITAIRE #1
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-r from-[#111] to-[#1a1a1a]">
        <div className="container-page">
          <div className="flex h-[160px] items-center justify-between rounded-2xl border border-[#D4AF37]/30 bg-[#111] p-5 lg:h-[250px]">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[#D4AF37]">Publicité partenaire</p>
              <h3 className="mt-1 text-lg font-extrabold text-white lg:text-2xl">Votre publicité ici</h3>
              <p className="mt-1 text-xs text-slate-400 lg:text-sm">Espace réservé aux partenaires MKA.P-MS — Contactez-nous pour apparaître ici</p>
            </div>
            <Link to="/aide" className="shrink-0 rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-bold text-white hover:bg-[#C5A028] lg:px-8 lg:py-3 lg:text-sm">
              Annoncer →
            </Link>
          </div>
        </div>
      </section>

      {/* (Annonces Premium déplacée en section 3b, après Catégories) */}

      {/* ═══════════════════════════════════════════════════════════
          7. ANNONCES PARTICULIERS — carrousel horizontal
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white pb-10">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#111]">
              Annonces Particuliers
            </h2>
            <Link to="/acheter?vendeurType=particulier" className="text-sm font-semibold text-[#6B7280] hover:text-[#D4AF37]">Voir toutes →</Link>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {DEMO_ANNONCES.filter(a => a.vendeurType === "particulier").map((v: any) => (
              <div key={v.id} className="carousel-card">
                <VehicleCard v={v} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7b. ANNONCES LOCATION — carrousel horizontal
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F9F9F9] py-10">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#111]">
              <KeyRound size={18} className="text-[#D4AF37]" /> Annonces Location
            </h2>
            <Link to="/louer" className="text-sm font-semibold text-[#6B7280] hover:text-[#D4AF37]">Voir toutes →</Link>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {DEMO_LOCATION.map((v: any) => (
              <div key={v.id} className="carousel-card">
                <VehicleCard v={v} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ESPACE PUBLICITAIRE #2
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#FFFDF5]">
        <div className="container-page">
          <div className="flex h-[160px] items-center justify-between rounded-2xl border border-[#D4AF37]/20 bg-white p-5 shadow-sm lg:h-[250px]">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[#D4AF37]">Publicité</p>
              <h3 className="mt-1 text-base font-extrabold text-[#111] lg:text-xl">Boostez votre visibilité sur MKA.P-MS</h3>
              <p className="mt-1 text-xs text-slate-500 lg:text-sm">Professionnels, particuliers — mettez en avant vos annonces et services</p>
            </div>
            <Link to="/abonnements" className="shrink-0 rounded-full border-2 border-[#D4AF37] px-5 py-2 text-xs font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition lg:px-8 lg:py-3 lg:text-sm">
              Voir les offres →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          8. POURQUOI CHOISIR MKA.P-MS
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10">
        <div className="container-page">
          <h2 className="text-center text-xl font-bold text-[#111]">Pourquoi choisir MKA-P-MS ?</h2>
          {(() => {
            const items = [
              { icon: ShieldCheck, title: "Sécurisé", desc: "Vos transactions sont protégées à 100%.", details: "Paiement sécurisé, vérification des annonces, protection acheteur/vendeur, données chiffrées et conformité RGPD." },
              { icon: Users, title: "Fiable", desc: "Des milliers d'utilisateurs nous font confiance.", details: "Plus de 50 000 utilisateurs actifs, avis vérifiés, vendeurs certifiés et support réactif 7j/7." },
              { icon: Gauge, title: "Rapide", desc: "Trouvez ce que vous cherchez en quelques clics.", details: "Recherche intelligente, filtres avancés, estimation instantanée par plaque et dépôt d'annonce en moins d'1 minute." },
              { icon: CheckCircle, title: "Complet", desc: "Tous les services auto réunis au même endroit.", details: "Achat, vente, location, pièces détachées, carte grise, assurance, livraison, financement — tout en un." },
              { icon: Heart, title: "Accompagnement", desc: "Une équipe à votre écoute à chaque étape.", details: "Assistance personnalisée, chat en direct, aide à la négociation et suivi de votre dossier de A à Z." },
            ];
            return (
              <div className="mt-6 flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
                {items.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.title}
                      type="button"
                      onClick={(e) => {
                        const el = e.currentTarget.querySelector("[data-details]") as HTMLElement;
                        if (el) el.classList.toggle("hidden");
                      }}
                      className="flex w-[150px] shrink-0 snap-start flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-4 text-center transition hover:shadow-md hover:border-[#D4AF37] cursor-pointer"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10">
                        <Icon size={22} className="text-[#D4AF37]" />
                      </div>
                      <h3 className="text-sm font-bold text-[#111]">{r.title}</h3>
                      <p className="text-[10px] text-[#6B7280] leading-tight">{r.desc}</p>
                      <p data-details className="hidden mt-2 text-[10px] text-[#374151] leading-tight border-t border-[#E5E7EB] pt-2">{r.details}</p>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          9. STATISTIQUES — BANDE OR
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#D4AF37] py-6">
        <div className="container-page grid grid-cols-2 gap-4 text-center sm:grid-cols-3 md:grid-cols-6">
          {[
            { v: "+100 000", l: "Utilisateurs" },
            { v: "+30 000", l: "Véhicules disponibles" },
            { v: "+5 000", l: "Professionnels" },
            { v: "4,8/5", l: "Avis clients" },
            { v: "100%", l: "Paiements sécurisés" },
            { v: "Support 7/7", l: "À votre écoute" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-xl font-extrabold text-white md:text-2xl">{s.v}</div>
              <div className="mt-0.5 text-xs font-medium text-white/80">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          10. CARROUSEL ANNONCES (swipe gauche/droite)
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#111]">Découvrez nos annonces</h2>
            <Link to="/acheter" className="text-sm font-semibold text-[#6B7280] hover:text-[#D4AF37]">Voir tout →</Link>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {featured.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="carousel-card">
                    <div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#E5E7EB]" />
                  </div>
                ))
              : (featured.data?.items && featured.data.items.length > 0
                  ? featured.data.items.slice(0, 10)
                  : DEMO_ANNONCES
                ).map((v: any) => (
                  <div key={v.id} className="carousel-card">
                    <VehicleCard v={v} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          ESPACE PUBLICITAIRE #3
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F5F5F5]">
        <div className="container-page">
          <div className="flex h-[160px] items-center justify-between rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A028] p-5 shadow-sm lg:h-[250px]">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-white/80">Publicité premium</p>
              <h3 className="mt-1 text-base font-extrabold text-white lg:text-xl">Devenez partenaire MKA.P-MS</h3>
              <p className="mt-1 text-xs text-white/80 lg:text-sm">Gagnez en visibilité auprès de milliers d'acheteurs et de professionnels</p>
            </div>
            <Link to="/espace-pro" className="shrink-0 rounded-full bg-white px-5 py-2 text-xs font-bold text-[#111] hover:bg-[#F5F5F5] lg:px-8 lg:py-3 lg:text-sm">
              En savoir plus →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          11. ESPACE PRO — BANDE NOIRE
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10 border-t border-[#E5E7EB]">
        <div className="container-page">
          <div className="flex flex-col items-center gap-4 text-center lg:flex-row lg:justify-between lg:text-left">
            <div>
              <h2 className="text-xl font-bold text-[#111]">Espace Pro : développez votre activité</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Accédez à tous nos outils et services dédiés aux professionnels.</p>
            </div>
            <Link to="/espace-pro" className="shrink-0 rounded-xl border-2 border-[#D4AF37] px-6 py-3 text-sm font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
              Découvrir l'espace Pro
            </Link>
          </div>
          {/* Carrousel 2 lignes — swipe gauche/droite */}
          <div className="mt-8 flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {Array.from({ length: Math.ceil(PRO_ACTIVITIES.length / 2) }).map((_, col) => {
              const top = PRO_ACTIVITIES[col * 2];
              const bot = PRO_ACTIVITIES[col * 2 + 1];
              return (
                <div key={col} className="flex w-[160px] shrink-0 snap-start flex-col gap-3">
                  {top && (
                    <Link to={top.to} className="group flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/10 transition group-hover:bg-[#D4AF37]/20">
                        <Wrench size={18} className="text-[#D4AF37]" />
                      </div>
                      <span className="text-xs font-medium text-[#374151]">{top.label}</span>
                    </Link>
                  )}
                  {bot && (
                    <Link to={bot.to} className="group flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/10 transition group-hover:bg-[#D4AF37]/20">
                        <Wrench size={18} className="text-[#D4AF37]" />
                      </div>
                      <span className="text-xs font-medium text-[#374151]">{bot.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-xs text-[#9CA3AF]">Gérez votre activité, vos véhicules, vos équipes et vos documents.</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          12–13. FOOTER COMPLET (Desktop 6 colonnes / Mobile accordéon)
         ═══════════════════════════════════════════════════════════ */}
      <HomeFooter newsEmail={newsEmail} setNewsEmail={setNewsEmail} />
    </div>
  );
}

/* ── Footer sections data ── */
const FOOTER_SECTIONS = [
  {
    title: "Nos Services", links: [
      { label: "Achat / Vente", to: "/acheter" },
      { label: "Location", to: "/louer" },
      { label: "VO Interne", to: "/vo" },
      { label: "Devis", to: "/devis" },
      { label: "Livraison", to: "/livraison" },
      { label: "Garage", to: "/garages" },
      { label: "Pièces Auto", to: "/pieces" },
      { label: "Dépannage", to: "/depannage" },
      { label: "Finance+", to: "/finance" },
    ],
  },
  {
    title: "Plateforme", links: [
      { label: "Acheter", to: "/acheter" },
      { label: "Louer", to: "/louer" },
      { label: "Devis Garage", to: "/devis" },
      { label: "Réseau de garages", to: "/garages" },
      { label: "Abonnements", to: "/abonnements" },
      { label: "Notre Mission", to: "/mission" },
    ],
  },
  {
    title: "Espace Pro", links: [
      { label: "Devenir partenaire", to: "/espace-pro" },
      { label: "Gestion de flotte", to: "/espace-pro" },
      { label: "Solutions pro", to: "/espace-pro" },
      { label: "Abonnements", to: "/abonnements" },
      { label: "Vente Pro", to: "/espace-pro" },
      { label: "Garage Pro", to: "/garage-plus" },
      { label: "Location Pro", to: "/espace-pro" },
      { label: "VTC / Taxi Pro", to: "/vtc-taxi" },
      { label: "Livraison Pro", to: "/livraison" },
      { label: "Pièces Auto Pro", to: "/pieces" },
      { label: "Dépannage Pro", to: "/depannage" },
      { label: "Compatibilité Pro", to: "/espace-pro" },
      { label: "Comptabilité Pro", to: "/comptabilite" },
    ],
  },
  {
    title: "Informations", links: [
      { label: "À propos", to: "/mission" },
      { label: "CGU", to: "/aide#cgv" },
      { label: "Confidentialité", to: "/aide#rgpd" },
      { label: "Aide & FAQ", to: "/aide" },
      { label: "Contact", to: "/aide" },
    ],
  },
  {
    title: "Aide & Légal", links: [
      { label: "Centre d'aide / FAQ", to: "/aide" },
      { label: "Centre de confiance", to: "/confiance" },
      { label: "CGV / CGU", to: "/aide#cgv" },
      { label: "Confidentialité (RGPD)", to: "/aide#rgpd" },
      { label: "Mentions légales", to: "/aide#mentions" },
    ],
  },
];

const AJOUTS = [
  { label: "Deux sessions d'annonces (Premium & Classiques)", details: "Les annonces Premium sont mises en avant dans un carrousel dédié en haut de page, tandis que les annonces classiques apparaissent dans la grille en dessous. Plus l'abonnement est élevé, plus la visibilité est importante." },
  { label: "Espace Pro complet et visible", details: "Un tableau de bord dédié pour les professionnels : gestion des annonces, statistiques de vues, messagerie clients, réservations, acomptes, suivi des ventes et gestion d'équipe selon l'abonnement." },
  { label: "Historique véhicule mis en avant", details: "Chaque véhicule peut avoir un historique complet visible : contrôle technique, kilométrage certifié, entretiens passés, sinistres éventuels. Ça donne confiance aux acheteurs." },
  { label: "Catégories + services + partenaires", details: "Organisation par catégories (voitures, motos, utilitaires, scooters), services intégrés (devis, livraison, carte grise) et réseau de partenaires garages certifiés MKA.P-MS." },
  { label: "Publicité intégrée", details: "Les professionnels avec un abonnement Premium ou supérieur bénéficient d'espaces publicitaires dédiés sur la plateforme pour maximiser leur visibilité." },
  { label: "Statistiques & preuves sociales", details: "Nombre de vues, nombre de contacts, avis clients, notes garages, badges de confiance — tout est affiché pour créer la confiance et aider à la décision." },
  { label: "Parcours utilisateur fluide et logique", details: "Chaque action est guidée étape par étape : déposer une annonce en 6 étapes, faire un devis en 8 étapes, s'inscrire en tant que pro VO en 5 étapes. Tout est pensé pour la rapidité." },
  { label: "Paiement sécurisé", details: "Intégration Stripe complète avec 3D Secure, wallet interne sécurisé, virements automatiques, facturation automatique et protection acheteur/vendeur." },
  { label: "Support réactif 7/7", details: "Équipe de support disponible 7 jours sur 7 par téléphone, email et chat intégré. Les professionnels avec abonnement Elite+ ont un support prioritaire." },
  { label: "Mises à jour régulières", details: "La plateforme évolue en permanence avec de nouvelles fonctionnalités, améliorations UX et corrections. Les retours utilisateurs sont pris en compte rapidement." },
];

const SOCIAL_LINKS = [
  { label: "f", name: "Facebook", url: "https://facebook.com/mkapms", color: "hover:bg-[#1877F2]" },
  { label: "i", name: "Instagram", url: "https://instagram.com/mkapms", color: "hover:bg-[#E4405F]" },
  { label: "Y", name: "YouTube", url: "https://youtube.com/@mkapms", color: "hover:bg-[#FF0000]" },
  { label: "t", name: "TikTok", url: "https://tiktok.com/@mkapms", color: "hover:bg-[#000000]" },
];

function FooterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-3 text-left">
        <span className="text-sm font-bold text-[#111]">{title}</span>
        <ChevronDown size={16} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function AjoutItem({ label, details }: { label: string; details: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg transition ${open ? "bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/15 border border-[#D4AF37]/30" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-2 py-2.5 text-left"
      >
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${open ? "bg-[#D4AF37] shadow-sm" : "bg-[#D4AF37]/40"}`}>
          <CheckCircle size={13} className={open ? "text-white" : "text-[#8B7A1A]"} />
        </div>
        <span className={`flex-1 text-xs font-semibold ${open ? "font-bold text-[#000]" : "text-[#1A1A1A]"}`}>{label}</span>
        <ChevronDown size={12} className={`shrink-0 text-[#8B7A1A] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-10 pb-3">
          <p className="text-[11px] leading-relaxed text-[#444444]">{details}</p>
        </div>
      )}
    </div>
  );
}

function HomeFooter({ newsEmail, setNewsEmail }: { newsEmail: string; setNewsEmail: (v: string) => void }) {
  return (
    <>
      {/* ═══ DESKTOP FOOTER ═══ */}
      <footer className="hidden border-t border-slate-200 bg-white md:block">
        {/* Top : Logo + description + Newsletter */}
        <div className="container-page flex flex-wrap items-start justify-between gap-8 py-10">
          <div className="max-w-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111]">
                <span className="text-lg font-extrabold text-[#D4AF37]">M</span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#111]">MK<span className="text-[#D4AF37]">A</span>.P-MS</h3>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Prestation Multi-Services</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">La plateforme auto qui simplifie toutes vos démarches.</p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-[#D4AF37]" />
              <h4 className="text-sm font-bold text-[#111]">Newsletter & Réseaux</h4>
            </div>
            <p className="mt-1 text-xs text-slate-500">Recevez nos meilleures offres et nouveautés !</p>
            <div className="mt-3 flex gap-2">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
                placeholder="Votre adresse email"
                type="email"
                value={newsEmail}
                onChange={(e) => setNewsEmail(e.target.value)}
              />
              <button className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-white hover:bg-[#C5A028]">S'abonner</button>
            </div>
            <div className="mt-3 flex gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" title={s.name} className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-600 transition ${s.color} hover:text-white hover:border-transparent`}>{s.label}</a>
              ))}
            </div>
          </div>
        </div>

        {/* 6 colonnes de liens */}
        <div className="border-t border-slate-200">
          <div className="container-page grid grid-cols-6 gap-6 py-8">
            {FOOTER_SECTIONS.map((sec) => (
              <div key={sec.title}>
                <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#111]">
                  <Package size={14} className="text-[#D4AF37]" />
                  {sec.title}
                </h4>
                <div className="space-y-1.5">
                  {sec.links.map((l) => (
                    <Link key={l.label} to={l.to} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#D4AF37]">
                      <ChevronRight size={10} className="text-slate-300" />{l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#111]">
                <Phone size={14} className="text-[#D4AF37]" />
                Nous Contacter
              </h4>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /> 01 23 45 67 89</div>
                <div className="flex items-center gap-2"><Mail size={12} className="text-slate-400" /> contact@mkapms.com</div>
                <div className="flex items-center gap-2"><Clock size={12} className="text-slate-400" /> Lun – Dim : 8h – 20h</div>
                <div className="flex items-center gap-2"><MapPin size={12} className="text-slate-400" /> Support 7/7</div>
                <div className="flex items-start gap-2"><Globe size={12} className="mt-0.5 shrink-0 text-slate-400" /> 14 Rue du petit Viarmes, 95270 Belloy-en-France, France</div>
              </div>
            </div>
          </div>
        </div>

        {/* Autres Ajouts Intégrés + cartes */}
        <div className="border-t border-slate-200 bg-[#FAFAFA]">
          <div className="container-page py-8">
            <h4 className="flex items-center gap-2 text-sm font-bold text-[#111]">
              <Star size={16} className="text-[#D4AF37]" /> Autres Ajouts Intégrés
            </h4>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 lg:grid-cols-5">
              {AJOUTS.map((a) => (
                <AjoutItem key={a.label} label={a.label} details={a.details} />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:max-w-2xl lg:mx-auto">
              <div className="rounded-xl border border-[#D4AF37]/30 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-[#D4AF37]" />
                  <h5 className="text-sm font-bold text-[#111]">Deux Sessions d'Annonces</h5>
                </div>
                <p className="mt-2 text-xs text-slate-500">Premium (abonnés, boostées) en haut de page. Classiques en dessous.</p>
              </div>
              <div className="rounded-xl border border-[#D4AF37]/30 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-[#D4AF37]" />
                  <h5 className="text-sm font-bold text-[#111]">Espace Pro Complet</h5>
                </div>
                <p className="mt-2 text-xs text-slate-500">Accès direct à tous les outils et services dédiés aux professionnels.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bas : copyright + paiement */}
        <div className="border-t border-slate-200 bg-white">
          <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
            <p className="text-xs text-slate-400">© 2026 MKA.P-MS — Auto Plus Africa — SASU, capital 2 500 €. SIREN 932 217 896 · TVA FR43932217896.</p>
            <div className="flex gap-2">
              <span className="rounded bg-blue-800 px-3 py-1 text-xs font-bold text-white">VISA</span>
              <span className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white">MasterCard</span>
              <span className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white">PayPal</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ MOBILE FOOTER (accordéon) ═══ */}
      <footer className="border-t border-slate-200 bg-white md:hidden">
        {/* Logo + menu */}
        <div className="container-page flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111]">
              <span className="text-sm font-extrabold text-[#D4AF37]">M</span>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#111]">MK<span className="text-[#D4AF37]">A</span>.P-MS</h3>
              <p className="text-[7px] font-semibold uppercase tracking-widest text-slate-400">Prestation Multi-Services</p>
            </div>
          </div>
        </div>

        {/* Sections en grille 2 colonnes */}
        <div className="container-page">
          <div className="grid grid-cols-2 gap-3">
            {FOOTER_SECTIONS.map((sec) => (
              <FooterAccordion key={sec.title} title={sec.title}>
                <div className="space-y-2 pl-1">
                  {sec.links.map((l) => (
                    <Link key={l.label} to={l.to} className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#D4AF37]">
                      <ChevronRight size={10} className="text-slate-300" />{l.label}
                    </Link>
                  ))}
                </div>
              </FooterAccordion>
            ))}
            <FooterAccordion title="Nous Contacter">
              <div className="space-y-2 pl-1 text-xs text-slate-500">
                <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /> 01 23 45 67 89</div>
                <div className="flex items-center gap-2"><Mail size={12} className="text-slate-400" /> contact@mkapms.com</div>
                <div className="flex items-center gap-2"><Clock size={12} className="text-slate-400" /> Lun – Dim : 8h – 20h</div>
                <div className="flex items-center gap-2"><MapPin size={12} className="text-slate-400" /> Support 7/7</div>
              </div>
            </FooterAccordion>
          </div>
        </div>

        {/* Newsletter & Réseaux */}
        <div className="container-page border-t border-slate-200 py-6">
          <div className="flex items-center justify-center gap-2">
            <Mail size={14} className="text-[#D4AF37]" />
            <h4 className="text-sm font-bold text-[#111] text-center">Abonnez-vous & suivez-nous</h4>
          </div>
          <input
            className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
            placeholder="Votre adresse email"
            type="email"
            value={newsEmail}
            onChange={(e) => setNewsEmail(e.target.value)}
          />
          <button className="mt-2 w-full rounded-lg bg-[#D4AF37] py-2.5 text-sm font-bold text-white hover:bg-[#C5A028]">S'abonner</button>
          <div className="mt-4 flex justify-center gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" title={s.name} className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-600 transition ${s.color} hover:text-white hover:border-transparent`}>{s.label}</a>
            ))}
          </div>
          <p className="mt-2 text-center text-[9px] text-slate-400">Suivez-nous sur les réseaux sociaux</p>
        </div>

        {/* Autres Ajouts — grille 2 colonnes */}
        <div className="container-page border-t border-slate-200 py-6">
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#111]">
            <Star size={14} className="text-[#D4AF37]" /> Autres Ajouts Intégrés
          </h4>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
            {AJOUTS.map((a) => (
              <AjoutItem key={a.label} label={a.label} details={a.details} />
            ))}
          </div>
        </div>

        {/* Copyright + paiement */}
        <div className="border-t border-slate-200 bg-white">
          <div className="container-page py-4 text-center">
            <p className="text-[10px] text-slate-400">© 2026 MKA.P-MS — Auto Plus Africa — SASU, capital 2 500 €. SIREN 932 217 896 · TVA FR43932217896.</p>
            <div className="mt-3 flex justify-center gap-2">
              <span className="rounded bg-blue-800 px-3 py-1 text-xs font-bold text-white">VISA</span>
              <span className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white">MasterCard</span>
              <span className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white">PayPal</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
