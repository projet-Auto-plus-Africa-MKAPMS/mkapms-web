import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Tag, KeyRound, Wrench, Car, Star, ArrowRight, ShieldCheck,
  Users, Gauge, Heart, ChevronRight, ChevronLeft, ChevronDown,
  CheckCircle, Clock, Package, MapPin, Globe, Headphones, Award, Shield,
  Truck, Zap, FileText, CreditCard, Phone, Settings, Eye, Navigation,
  Briefcase, Building2, Stethoscope, BadgeCheck, CarFront, Bus, HardHat,
  Fuel, History, Lock, Hammer, Receipt, Scale, Banknote, CircleDollarSign,
  BookOpen, Cog, Sparkles, Play
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   PAGE D'ACCUEIL MKA.P-MS — VERSION DÉFINITIVE V1
   16 sections dans l'ordre exact spécifié.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── DONNÉES ANNONCES ── */

const ANNONCES_OFFICIELLES = [
  { id: 9001, titre: "Peugeot 3008 GT", badge: "MKA.P-MS OFFICIEL", annee: 2023, km: 12000, carburant: "Essence", prix: 28900, ville: "Bois-en-France", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=280&fit=crop" },
  { id: 9002, titre: "Renault Austral", badge: "MKA.P-MS OFFICIEL", annee: 2024, km: 5000, carburant: "Hybride", prix: 34500, ville: "Bois-en-France", photo: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&h=280&fit=crop" },
  { id: 9003, titre: "BMW Série 3 320d", badge: "MKA.P-MS OFFICIEL", annee: 2022, km: 25000, carburant: "Diesel", prix: 32900, ville: "Bois-en-France", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=280&fit=crop" },
  { id: 9004, titre: "Mercedes Classe A", badge: "MKA.P-MS OFFICIEL", annee: 2022, km: 18000, carburant: "Essence", prix: 29900, ville: "Bois-en-France", photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=280&fit=crop" },
  { id: 9050, titre: "Audi A3 Sportback", badge: "MKA.P-MS OFFICIEL", annee: 2023, km: 10000, carburant: "Essence", prix: 31200, ville: "Paris", photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=280&fit=crop" },
];

const ANNONCES_BOOSTEES = [
  { id: 9010, titre: "Audi A3 Sportback", badge: "ELITE", type: "BOOSTÉ", annee: 2021, km: 38000, prix: 27900, ville: "Paris", photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=280&fit=crop" },
  { id: 9011, titre: "BMW Série 3 320i", badge: "ELITE", type: "BOOSTÉ", annee: 2020, km: 42000, prix: 29500, ville: "Lyon", photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=280&fit=crop" },
  { id: 9012, titre: "Mercedes Classe C", badge: "ELITE", type: "BOOSTÉ", annee: 2021, km: 35000, prix: 31900, ville: "Marseille", photo: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=280&fit=crop" },
  { id: 9013, titre: "Volkswagen Golf 8", badge: "ELITE", type: "BOOSTÉ", annee: 2023, km: 15000, prix: 24900, ville: "Nice", photo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=280&fit=crop" },
  { id: 9014, titre: "Toyota Corolla", badge: "ELITE", type: "BOOSTÉ", annee: 2022, km: 20000, prix: 23500, ville: "Toulouse", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=280&fit=crop" },
];

const ANNONCES_PREMIUM = [
  { id: 9020, titre: "Peugeot 508 GT", badge: "PREMIUM", annee: 2022, km: 22000, prix: 25900, ville: "Bordeaux", photo: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=280&fit=crop" },
  { id: 9021, titre: "Renault Clio V", badge: "PREMIUM", annee: 2021, km: 28000, prix: 15900, ville: "Lyon", photo: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&h=280&fit=crop" },
  { id: 9022, titre: "Toyota C-HR", badge: "PREMIUM", annee: 2022, km: 20000, prix: 23900, ville: "Nantes", photo: "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=400&h=280&fit=crop" },
  { id: 9023, titre: "Kia Sportage", badge: "PREMIUM", annee: 2021, km: 30000, prix: 22500, ville: "Lille", photo: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=280&fit=crop" },
  { id: 9024, titre: "Hyundai Tucson", badge: "PREMIUM", annee: 2023, km: 8000, prix: 29800, ville: "Paris", photo: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=280&fit=crop" },
];

const VEHICULES_PROCHES = [
  { id: 9030, titre: "Peugeot 308", distance: "2 km", annee: 2021, km: 25000, prix: 16900, ville: "Paris", photo: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=280&fit=crop" },
  { id: 9031, titre: "Renault Captur", distance: "5 km", annee: 2020, km: 32000, prix: 14500, ville: "Paris", photo: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=400&h=280&fit=crop" },
  { id: 9032, titre: "Toyota Yaris", distance: "8 km", annee: 2021, km: 18000, prix: 13900, ville: "Paris", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=280&fit=crop" },
  { id: 9033, titre: "Volkswagen Polo", distance: "12 km", annee: 2022, km: 20000, prix: 15500, ville: "Paris", photo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=280&fit=crop" },
  { id: 9034, titre: "Citroën C3", distance: "15 km", annee: 2021, km: 28000, prix: 11900, ville: "Paris", photo: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=280&fit=crop" },
];

const LOCATION_MIXTE = [
  { id: 9040, titre: "Renault Clio", type: "Particulier", prixJour: 29, annee: 2022, carburant: "Essence", ville: "Paris", photo: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&h=280&fit=crop" },
  { id: 9041, titre: "Peugeot 208", type: "Particulier", prixJour: 32, annee: 2023, carburant: "Essence", ville: "Lyon", photo: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=280&fit=crop" },
  { id: 9042, titre: "Mercedes Classe A", type: "Pro", prixJour: 55, annee: 2023, carburant: "Essence", ville: "Nice", photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=280&fit=crop" },
  { id: 9043, titre: "Tesla Model 3", type: "VTC", prixJour: 75, annee: 2024, carburant: "Électrique", ville: "Paris", photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=280&fit=crop" },
  { id: 9044, titre: "Toyota Corolla", type: "Taxi", prixJour: 45, annee: 2022, carburant: "Hybride", ville: "Marseille", photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=280&fit=crop" },
];

const ANNONCES_PARTICULIERS = [
  { id: 9060, titre: "Citroën C4", badge: "PARTICULIER", annee: 2020, km: 45000, prix: 12900, ville: "Lyon", photo: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=280&fit=crop" },
  { id: 9061, titre: "Opel Corsa", badge: "PARTICULIER", annee: 2019, km: 52000, prix: 9500, ville: "Toulouse", photo: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=280&fit=crop" },
  { id: 9062, titre: "Ford Focus", badge: "PROFESSIONNEL", annee: 2018, km: 60000, prix: 8900, ville: "Nantes", photo: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=280&fit=crop" },
  { id: 9063, titre: "Dacia Sandero", badge: "PRO ÉTUDIANT", annee: 2020, km: 40000, prix: 7900, ville: "Lille", photo: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=280&fit=crop" },
  { id: 9064, titre: "Toyota RAV4", badge: "PROFESSIONNEL", annee: 2021, km: 22000, prix: 28900, ville: "Lille", photo: "https://images.unsplash.com/photo-1568844293986-8d0400f4745b?w=400&h=280&fit=crop" },
];

/* ── PUBS LATÉRALES ── */
const ADS_LEFT = [
  { titre: "LOA", sous: "À PARTIR DE", prix: "199 €/MOIS", cta: "EN SAVOIR PLUS", color: "bg-[#D4AF37]", to: "/finance" },
  { titre: "ASSURANCE AUTO", sous: "PROFITEZ DE", prix: "-30%", cta: "DÉCOUVRIR", color: "bg-red-600", to: "/assurance" },
  { titre: "PIÈCES AUTO D'ORIGINE", sous: "QUALITÉ PREMIUM", prix: "", cta: "DÉCOUVRIR", color: "bg-[#D4AF37]", to: "/pieces" },
  { titre: "REPRISE CASH", sous: "ESTIMATION IMMÉDIATE", prix: "", cta: "FAIRE ESTIMER", color: "bg-[#111]", to: "/vendre" },
  { titre: "VÉHICULES UTILITAIRES", sous: "POUR PROS", prix: "", cta: "VOIR NOS OFFRES", color: "bg-orange-600", to: "/louer/utilitaires" },
];

const ADS_RIGHT = [
  { titre: "CRÉDIT AUTO", sous: "RAPIDE & FACILE", prix: "RÉPONSE EN 24H", cta: "SIMULER", color: "bg-[#111]", to: "/finance" },
  { titre: "GARANTIE MÉCANIQUE", sous: "JUSQU'À 60 MOIS", prix: "", cta: "EN SAVOIR PLUS", color: "bg-[#D4AF37]", to: "/garantie" },
  { titre: "NETTOYAGE AUTO", sous: "INTÉRIEUR / EXTÉRIEUR", prix: "", cta: "PRENDRE RDV", color: "bg-blue-600", to: "/services" },
  { titre: "PNEUS", sous: "TOUTES MARQUES", prix: "PRIX IMBATTABLES", cta: "VOIR LES OFFRES", color: "bg-[#333]", to: "/pieces" },
  { titre: "CONTRÔLE TECHNIQUE", sous: "PRIS EN CHARGE", prix: "", cta: "EN SAVOIR PLUS", color: "bg-green-700", to: "/controle-technique" },
];

/* ── CARROUSEL PRINCIPAL ── */
const SLIDES = [
  { label: "Vente", img: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&h=400&fit=crop", desc: "Achetez et vendez en toute confiance" },
  { label: "Location", img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=400&fit=crop", desc: "Louez le véhicule idéal" },
  { label: "Garage", img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=400&fit=crop", desc: "Réparation et entretien par des experts" },
  { label: "Finance+", img: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=400&fit=crop", desc: "Financement et leasing sur mesure" },
  { label: "Partenaires", img: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=400&fit=crop", desc: "Rejoignez notre réseau de professionnels" },
];

/* ── COMPOSANT SCROLL HORIZONTAL ── */
function HScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };
  return (
    <div className={`relative group ${className}`}>
      <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 border border-[#E5E7EB] shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><ChevronLeft size={16} /></button>
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">{children}</div>
      <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 border border-[#E5E7EB] shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><ChevronRight size={16} /></button>
    </div>
  );
}

/* ── CARTE ANNONCE STANDARD ── */
function AnnonceCard({ a, badgeColor = "bg-[#D4AF37]" }: { a: any; badgeColor?: string }) {
  return (
    <Link to={`/vehicule/${a.id}`} className="shrink-0 w-[200px] md:w-[220px] rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition group">
      <div className="relative h-[130px]">
        <img src={a.photo} alt={a.titre} className="w-full h-full object-cover" loading="lazy" />
        {a.badge && <span className={`absolute top-2 left-2 rounded-sm ${badgeColor} px-2 py-0.5 text-[8px] font-extrabold text-white uppercase tracking-wide`}>{a.badge}</span>}
        {a.type && <span className="absolute top-2 right-2 rounded-sm bg-[#D4AF37] px-2 py-0.5 text-[8px] font-extrabold text-white uppercase">{a.type}</span>}
        {a.distance && <span className="absolute top-2 left-2 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[9px] font-bold text-white">{a.distance}</span>}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-[#111] truncate">{a.titre}</h3>
        <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-[#6B7280]">
          {a.annee && <span>{a.annee}</span>}
          {a.km !== undefined && <span>· {a.km.toLocaleString("fr-FR")} km</span>}
          {a.carburant && <span>· {a.carburant}</span>}
        </div>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-base font-black text-[#111]">
            {a.prix ? `${a.prix.toLocaleString("fr-FR")} €` : a.prixJour ? `${a.prixJour} €/jour` : ""}
          </p>
          {a.ville && <span className="text-[10px] text-[#9CA3AF] flex items-center gap-0.5"><MapPin size={8} />{a.ville}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* Carrousel principal */
  const [slideIdx, setSlideIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlideIdx((p) => (p + 1) % SLIDES.length), 8000);
    return () => clearInterval(t);
  }, []);

  /* Pubs latérales rotation */
  const [adLeftIdx, setAdLeftIdx] = useState(0);
  const [adRightIdx, setAdRightIdx] = useState(0);
  useEffect(() => {
    const t1 = setInterval(() => setAdLeftIdx((p) => (p + 1) % ADS_LEFT.length), 6000);
    const t2 = setInterval(() => setAdRightIdx((p) => (p + 1) % ADS_RIGHT.length), 7000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  /* Recherche */
  const [sCategorie, setSCategorie] = useState("");
  const [sMarque, setSMarque] = useState("");
  const [sModele, setSModele] = useState("");
  const [sPrix, setSPrix] = useState("");
  const [sLocalisation, setSLocalisation] = useState("");

  function doSearch() {
    const params = new URLSearchParams();
    if (sCategorie) params.set("categorie", sCategorie);
    if (sMarque) params.set("marque", sMarque);
    if (sModele) params.set("modele", sModele);
    if (sPrix) params.set("prixMax", sPrix);
    if (sLocalisation) params.set("ville", sLocalisation);
    navigate(`/acheter?${params.toString()}`);
  }

  return (
    <div className="bg-[#F5F3EF] min-h-screen">

      {/* ═══════════════════════════════════════════════════════════════════
          LAYOUT 3 COLONNES : PUB GAUCHE | CONTENU | PUB DROITE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto flex">

        {/* ── PUB GAUCHE (desktop seulement) ── */}
        <aside className="hidden xl:flex flex-col gap-4 w-[160px] shrink-0 pt-4 pl-2 sticky top-20 self-start h-fit">
          {ADS_LEFT.map((ad, i) => (
            <Link key={i} to={ad.to} className={`${ad.color} rounded-xl p-3 text-white text-center hover:opacity-90 transition`}>
              <p className="text-[9px] uppercase tracking-wide opacity-80">PUBLICITÉS SPONSORISÉES</p>
              <p className="mt-2 text-lg font-black leading-tight">{ad.titre}</p>
              <p className="text-[10px] mt-1 opacity-90">{ad.sous}</p>
              {ad.prix && <p className="text-xl font-black mt-1">{ad.prix}</p>}
              <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">{ad.cta}</span>
            </Link>
          ))}
        </aside>

        {/* ── CONTENU PRINCIPAL ── */}
        <main className="flex-1 min-w-0">

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 2 — CARROUSEL PRINCIPAL (5 slides)
              ═══════════════════════════════════════════════════════════════ */}
          <section className="relative overflow-hidden">
            <div className="relative h-[220px] md:h-[340px]">
              {SLIDES.map((s, i) => (
                <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === slideIdx ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                  <img src={s.img} alt={s.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>
              ))}
              {/* Contenu overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-8">
                <p className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">LA MARKETPLACE AUTOMOBILE</p>
                <h1 className="mt-1 text-xl md:text-3xl font-black text-white uppercase leading-tight">
                  ACHETEZ, VENDEZ, LOUEZ, RÉPAREZ
                </h1>
                <p className="text-xs md:text-sm text-white/80 mt-1">EN TOUTE CONFIANCE, PARTOUT, À TOUT MOMENT.</p>
                <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Tout l'univers automobile réuni au même endroit.</p>
                {/* Badges confiance */}
                <div className="mt-3 flex gap-4 md:gap-6">
                  {[
                    { icon: Shield, label: "100% Sécurisé", desc: "Transactions protégées" },
                    { icon: Award, label: "Meilleurs prix", desc: "Des offres compétitives" },
                    { icon: Headphones, label: "Support 7J/7", desc: "Une équipe à votre écoute" },
                    { icon: CheckCircle, label: "Rapide & Facile", desc: "Publiez ou trouvez en quelques clics" },
                  ].map((b) => (
                    <div key={b.label} className="flex items-center gap-1.5">
                      <b.icon size={14} className="text-[#D4AF37] shrink-0" />
                      <div>
                        <p className="text-[8px] md:text-[10px] font-bold text-white">{b.label}</p>
                        <p className="text-[7px] md:text-[9px] text-white/60 hidden md:block">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Flèches */}
              <button onClick={() => setSlideIdx((p) => (p - 1 + SLIDES.length) % SLIDES.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 backdrop-blur flex items-center justify-center hover:bg-white/50 transition"><ChevronLeft size={18} className="text-white" /></button>
              <button onClick={() => setSlideIdx((p) => (p + 1) % SLIDES.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 backdrop-blur flex items-center justify-center hover:bg-white/50 transition"><ChevronRight size={18} className="text-white" /></button>
            </div>
            {/* Points indicateurs */}
            <div className="flex items-center justify-center gap-1.5 py-2 bg-white">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlideIdx(i)} className={`h-2 rounded-full transition-all ${i === slideIdx ? "w-5 bg-[#D4AF37]" : "w-2 bg-[#E5E7EB]"}`} />
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 3 — UNIVERS MKA.P-MS (Acheter, Vendre, Louer, Réparer)
              ═══════════════════════════════════════════════════════════════ */}
          <section className="bg-white px-4 py-3 md:py-5">
            <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-2xl mx-auto">
              {[
                { icon: Search, label: "ACHETER", sub: "Un véhicule", to: "/acheter" },
                { icon: Tag, label: "VENDRE", sub: "Mon véhicule", to: "/vendre" },
                { icon: KeyRound, label: "LOUER", sub: "Un véhicule", to: "/louer" },
                { icon: Wrench, label: "RÉPARER", sub: "Mon véhicule", to: "/garages" },
              ].map((a) => (
                <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white p-3 md:p-4 text-center hover:border-[#D4AF37] hover:shadow-md transition">
                  <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                    <a.icon size={20} className="text-[#D4AF37]" />
                  </div>
                  <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-wide text-[#111]">{a.label}</span>
                  <span className="text-[8px] md:text-[10px] text-[#6B7280]">{a.sub}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 4 — RECHERCHE AVANCÉE
              ═══════════════════════════════════════════════════════════════ */}
          <section className="bg-white px-4 pb-4">
            <div className="max-w-3xl mx-auto rounded-2xl border border-[#E5E7EB] bg-[#FAFAF8] p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Search size={18} className="text-[#D4AF37]" />
                <h2 className="text-sm md:text-base font-bold text-[#111]">Rechercher un véhicule</h2>
              </div>
              <p className="text-[10px] text-[#6B7280] mb-3">Voitures, motos, utilitaires — trouvez votre véhicule idéal</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                <select value={sCategorie} onChange={(e) => setSCategorie(e.target.value)} className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs text-[#111] outline-none">
                  <option value="">Toutes catégories</option>
                  <option>Citadine</option><option>Berline</option><option>SUV</option><option>Coupé</option><option>Break</option><option>Utilitaire</option><option>Moto</option>
                </select>
                <select value={sMarque} onChange={(e) => setSMarque(e.target.value)} className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs text-[#111] outline-none">
                  <option value="">Marque</option>
                  <option>Peugeot</option><option>Renault</option><option>Citroën</option><option>BMW</option><option>Mercedes</option><option>Audi</option><option>Volkswagen</option><option>Toyota</option><option>Ford</option><option>Fiat</option>
                </select>
                <select value={sModele} onChange={(e) => setSModele(e.target.value)} className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs text-[#111] outline-none">
                  <option value="">Modèle</option>
                </select>
                <select value={sPrix} onChange={(e) => setSPrix(e.target.value)} className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs text-[#111] outline-none">
                  <option value="">Prix max</option>
                  <option value="5000">5 000 €</option><option value="10000">10 000 €</option><option value="15000">15 000 €</option><option value="20000">20 000 €</option><option value="30000">30 000 €</option><option value="50000">50 000 €</option>
                </select>
                <select value={sLocalisation} onChange={(e) => setSLocalisation(e.target.value)} className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs text-[#111] outline-none">
                  <option value="">Localisation</option>
                  <option>Paris</option><option>Lyon</option><option>Marseille</option><option>Toulouse</option><option>Bordeaux</option><option>Nantes</option><option>Lille</option><option>Nice</option>
                </select>
                <button onClick={doSearch} className="rounded-lg bg-[#111] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#333] transition flex items-center justify-center gap-1">
                  <Search size={14} /> Rechercher
                </button>
              </div>
              <div className="mt-2 flex justify-end">
                <Link to="/acheter" className="rounded-full bg-[#D4AF37] px-4 py-1.5 text-[10px] font-bold text-white hover:bg-[#c9a430] transition">SIMULER</Link>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 5 — VÉHICULES MKA.P-MS OFFICIELS
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-4 bg-white border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-[#111]">MKA.P-MS OFFICIEL</h2>
                <span className="rounded-sm bg-[#D4AF37] px-2 py-0.5 text-[8px] font-extrabold text-white uppercase">STOCK OFFICIEL</span>
              </div>
              <Link to="/acheter?source=officiel" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} /></Link>
            </div>
            <HScroll>
              {ANNONCES_OFFICIELLES.map((a) => (
                <AnnonceCard key={a.id} a={a} badgeColor="bg-[#D4AF37]" />
              ))}
            </HScroll>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 6 — ANNONCES BOOSTÉES / ELITE
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-4 bg-white border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-[#D4AF37]" />
                <h2 className="text-sm md:text-base font-bold text-[#111]">ANNONCES BOOSTÉES / ELITE</h2>
              </div>
              <Link to="/acheter?boost=true" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} /></Link>
            </div>
            <HScroll>
              {ANNONCES_BOOSTEES.map((a) => (
                <AnnonceCard key={a.id} a={a} badgeColor="bg-[#111]" />
              ))}
            </HScroll>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 7 — ANNONCES PREMIUM
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-4 bg-white border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart size={14} className="text-[#D4AF37]" />
                <h2 className="text-sm md:text-base font-bold text-[#111]">ANNONCES PREMIUM</h2>
              </div>
              <Link to="/acheter?premium=true" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} /></Link>
            </div>
            <HScroll>
              {ANNONCES_PREMIUM.map((a) => (
                <AnnonceCard key={a.id} a={a} badgeColor="bg-blue-600" />
              ))}
            </HScroll>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 8 — PUBLICITÉ PREMIUM #1
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-3 bg-white border-t border-[#F3F4F6]">
            <div className="rounded-xl bg-[#111] p-4 md:p-6 flex items-center justify-between overflow-hidden relative">
              <span className="absolute top-2 left-2 text-[8px] font-semibold uppercase tracking-wider text-white/50">PUBLICITÉ</span>
              <div>
                <h3 className="text-lg md:text-xl font-black text-white uppercase">BOOSTEZ VOTRE VISIBILITÉ</h3>
                <p className="text-xs text-white/70 mt-1">AVEC MKA.P-MS</p>
              </div>
              <Link to="/publicite" className="shrink-0 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white hover:bg-[#c9a430] transition">EN SAVOIR PLUS</Link>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 9 — VÉHICULES AUTOUR DE VOUS
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-4 bg-white border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#D4AF37]" />
                <h2 className="text-sm md:text-base font-bold text-[#111]">VÉHICULES AUTOUR DE VOUS</h2>
              </div>
              <Link to="/recherche" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} /></Link>
            </div>
            <HScroll>
              {VEHICULES_PROCHES.map((a) => (
                <AnnonceCard key={a.id} a={a} badgeColor="bg-[#D4AF37]" />
              ))}
            </HScroll>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 10 — LOCATION (Particulier, Pro, VTC, Taxi mélangé)
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-4 bg-white border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={14} className="text-[#D4AF37]" />
                <h2 className="text-sm md:text-base font-bold text-[#111]">LOCATION TOUT COMPRIS (PARTICULIER, PRO, VTC, TAXI)</h2>
              </div>
              <Link to="/louer" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} /></Link>
            </div>
            <HScroll>
              {LOCATION_MIXTE.map((a) => (
                <Link key={a.id} to={`/louer/particulier/vehicule/${a.id}`} className="shrink-0 w-[200px] md:w-[220px] rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition group">
                  <div className="relative h-[130px]">
                    <img src={a.photo} alt={a.titre} className="w-full h-full object-cover" loading="lazy" />
                    <span className={`absolute top-2 left-2 rounded-sm px-2 py-0.5 text-[8px] font-extrabold text-white uppercase ${a.type === "VTC" ? "bg-[#111] border border-[#D4AF37]" : a.type === "Pro" ? "bg-blue-800" : a.type === "Taxi" ? "bg-yellow-600" : "bg-[#D4AF37]"}`}>{a.prixJour} €/jour</span>
                    <span className="absolute top-2 right-2 rounded-sm bg-white/90 px-1.5 py-0.5 text-[8px] font-bold text-[#111]">{a.type}</span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-[#111] truncate">{a.titre}</h3>
                    <div className="mt-1 flex gap-2 text-[10px] text-[#6B7280]">
                      <span>{a.carburant}</span>
                      <span>· {a.annee}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-base font-black text-[#D4AF37]">{a.prixJour} €<span className="text-[10px] font-normal text-[#6B7280]">/jour</span></p>
                      <span className="text-[10px] text-[#9CA3AF] flex items-center gap-0.5"><MapPin size={8} />{a.ville}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </HScroll>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 11 — ANNONCES PARTICULIERS
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-4 bg-white border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-[#D4AF37]" />
                <h2 className="text-sm md:text-base font-bold text-[#111]">ANNONCES PARTICULIERS</h2>
              </div>
              <Link to="/acheter?vendeur=particulier" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} /></Link>
            </div>
            <HScroll>
              {ANNONCES_PARTICULIERS.map((a) => (
                <AnnonceCard key={a.id} a={a} badgeColor="bg-green-600" />
              ))}
            </HScroll>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 12 — NOS SERVICES (TRÈS IMPORTANT)
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-6 bg-[#F5F3EF] border-t border-[#E5E7EB]">
            <h2 className="text-base md:text-lg font-black text-[#111] text-center uppercase mb-1">Nos Services</h2>
            <p className="text-[10px] md:text-xs text-[#6B7280] text-center mb-4">MKA.P-MS — L'écosystème automobile complet</p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
              {[
                { icon: Car, label: "Achat / Vente", desc: "Véhicules neufs et d'occasion", to: "/acheter", color: "text-[#D4AF37]" },
                { icon: KeyRound, label: "Location", desc: "Particulier, Pro, VTC, Taxi", to: "/louer", color: "text-blue-600" },
                { icon: Wrench, label: "Garage", desc: "Réparation et entretien", to: "/garages", color: "text-orange-600" },
                { icon: Truck, label: "Dépannage", desc: "Assistance 24h/24 7j/7", to: "/depannage", color: "text-red-600" },
                { icon: ShieldCheck, label: "Contrôle Technique", desc: "Prise en charge et suivi", to: "/controle-technique", color: "text-green-600" },
                { icon: FileText, label: "Carte Grise", desc: "Démarches administratives", to: "/demarches", color: "text-purple-600" },
                { icon: Package, label: "Livraison", desc: "Partout en France et à l'international", to: "/livraison", color: "text-[#D4AF37]" },
                { icon: CreditCard, label: "Finance+", desc: "LOA, crédit, paiement jusqu'à 10x", to: "/finance", color: "text-emerald-600" },
                { icon: History, label: "Historique Véhicule", desc: "Rapports officiels & Analyse IA", to: "/historique", color: "text-indigo-600" },
                { icon: Cog, label: "Pièces Auto", desc: "Pièces d'origine au meilleur prix", to: "/pieces", color: "text-gray-700" },
                { icon: Shield, label: "Assurance", desc: "Assurance auto compétitive", to: "/assurance", color: "text-sky-600" },
                { icon: BadgeCheck, label: "VTC / Taxi", desc: "Solutions professionnelles VTC", to: "/louer/vtc-taxi", color: "text-[#111]" },
              ].map((s) => (
                <Link key={s.label} to={s.to} className="flex flex-col items-center text-center rounded-xl bg-white border border-[#E5E7EB] p-3 hover:border-[#D4AF37] hover:shadow-md transition group">
                  <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-[#F5F3EF] group-hover:bg-[#D4AF37]/10 transition">
                    <s.icon size={20} className={s.color} />
                  </div>
                  <h3 className="mt-2 text-[10px] md:text-xs font-bold text-[#111]">{s.label}</h3>
                  <p className="mt-0.5 text-[8px] md:text-[9px] text-[#6B7280] leading-tight">{s.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 13 — PUBLICITÉ PREMIUM #2
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-3 bg-white border-t border-[#F3F4F6]">
            <div className="rounded-xl bg-[#D4AF37] p-4 md:p-6 flex items-center justify-between overflow-hidden relative">
              <span className="absolute top-2 left-2 text-[8px] font-semibold uppercase tracking-wider text-white/50">PUBLICITÉ</span>
              <div>
                <h3 className="text-lg md:text-xl font-black text-white uppercase">VOUS ÊTES UN PROFESSIONNEL ?</h3>
                <p className="text-xs text-white/80 mt-1">REJOIGNEZ MKA.P-MS ET DÉVELOPPEZ VOTRE ACTIVITÉ</p>
              </div>
              <Link to="/espace-pro" className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#D4AF37] hover:bg-[#F5F3EF] transition">DEVENIR PARTENAIRE</Link>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 14 — BLOC PROFESSIONNELS
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-6 bg-white border-t border-[#F3F4F6]">
            <h2 className="text-base md:text-lg font-black text-[#111] text-center uppercase mb-1">Vous êtes professionnel ?</h2>
            <p className="text-[10px] md:text-xs text-[#6B7280] text-center mb-4">Rejoignez MKA.P-MS et développez votre activité automobile</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {[
                { icon: Wrench, label: "Garages", desc: "Gérez vos ateliers et devis", to: "/garage-plus" },
                { icon: Car, label: "Marchands", desc: "Vendez vos véhicules", to: "/espace-pro" },
                { icon: KeyRound, label: "Loueurs", desc: "Gérez votre flotte", to: "/louer/pro" },
                { icon: Truck, label: "Dépanneurs", desc: "Recevez des interventions", to: "/depannage" },
                { icon: ShieldCheck, label: "Contrôleurs techniques", desc: "Prises en charge en ligne", to: "/controle-technique" },
                { icon: BadgeCheck, label: "Sociétés VTC", desc: "Location VTC & Taxi", to: "/louer/vtc-taxi" },
                { icon: Package, label: "Transporteurs", desc: "Livraison et logistique", to: "/livraison" },
              ].map((p) => (
                <Link key={p.label} to={p.to} className="flex items-center gap-3 rounded-xl bg-[#F5F3EF] border border-[#E5E7EB] p-3 hover:border-[#D4AF37] hover:shadow-sm transition">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10">
                    <p.icon size={18} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#111]">{p.label}</h3>
                    <p className="text-[9px] text-[#6B7280]">{p.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link to="/espace-pro" className="inline-block rounded-full bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#c9a430] transition">
                Devenir partenaire
              </Link>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 15 — SERVICES PREMIUM MKA.P-MS
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-5 bg-[#F5F3EF] border-t border-[#E5E7EB]">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide max-w-4xl mx-auto">
              {[
                { icon: CreditCard, label: "Finance+", desc: "LOA, Crédit, Paiement jusqu'à 10x" },
                { icon: History, label: "Historique véhicule", desc: "Rapports officiels & Analyse IA" },
                { icon: Package, label: "Livraison", desc: "Partout en France et à l'International" },
                { icon: Shield, label: "Garantie", desc: "Jusqu'à 60 mois offerte" },
                { icon: ShieldCheck, label: "Contrôle technique", desc: "Prise de rendez-vous en ligne" },
                { icon: Cog, label: "Pièces auto", desc: "Pièces d'origine au meilleur prix" },
                { icon: Headphones, label: "Assistance", desc: "Disponible 7/7 24h/24" },
              ].map((s) => (
                <div key={s.label} className="shrink-0 flex flex-col items-center text-center min-w-[110px] md:min-w-[130px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-white">
                    <s.icon size={20} className="text-[#D4AF37]" />
                  </div>
                  <h3 className="mt-2 text-[10px] md:text-xs font-bold text-[#111]">{s.label}</h3>
                  <p className="mt-0.5 text-[8px] md:text-[9px] text-[#6B7280] leading-tight">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 16 — FOOTER (dans Layout, mais on ajoute newsletter + liens)
              ═══════════════════════════════════════════════════════════════ */}
          <footer className="bg-[#111] text-white">
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {/* Newsletter */}
                <div className="col-span-2 md:col-span-1">
                  <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-bold">RESTEZ INFORMÉ</p>
                  <p className="text-xs text-white/60 mt-1">Recevez nos meilleures offres</p>
                  <div className="mt-2 flex gap-1">
                    <input type="email" placeholder="Votre email" className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-xs text-white placeholder-white/40 outline-none" />
                    <button className="rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-bold text-white">S'abonner</button>
                  </div>
                </div>
                {/* Logo */}
                <div>
                  <p className="text-lg font-extrabold">MK<span className="text-[#D4AF37]">A</span>.P-MS</p>
                  <p className="text-[9px] text-white/50 uppercase tracking-wider mt-0.5">LA MARKETPLACE AUTOMOBILE</p>
                  <div className="flex gap-2 mt-3">
                    {["f", "📷", "▶", "in", "♪"].map((s, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60 hover:bg-[#D4AF37]/20 transition cursor-pointer">{s}</div>
                    ))}
                  </div>
                </div>
                {/* Explorer */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-bold mb-2">EXPLORER</p>
                  {["Acheter", "Vendre", "Louer", "Réparer / Garage", "Finance+", "Services"].map((l) => (
                    <p key={l} className="text-xs text-white/60 hover:text-white py-0.5 cursor-pointer">{l}</p>
                  ))}
                </div>
                {/* Aide */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-bold mb-2">AIDE & SUPPORT</p>
                  {["Centre d'aide", "Contact", "Conditions générales", "Politique de confidentialité"].map((l) => (
                    <p key={l} className="text-xs text-white/60 hover:text-white py-0.5 cursor-pointer">{l}</p>
                  ))}
                </div>
                {/* App */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-bold mb-2">TÉLÉCHARGEZ L'APPLICATION</p>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80 cursor-pointer hover:bg-white/20 transition">
                      <p className="text-[8px] text-white/50">Disponible sur</p>
                      <p className="font-bold">App Store</p>
                    </div>
                    <div className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80 cursor-pointer hover:bg-white/20 transition">
                      <p className="text-[8px] text-white/50">DISPONIBLE SUR</p>
                      <p className="font-bold">Google Play</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10 text-center">
                <p className="text-[10px] text-white/40">© 2024 MKA.P-MS — Tous droits réservés.</p>
              </div>
            </div>
          </footer>

        </main>

        {/* ── PUB DROITE (desktop seulement) ── */}
        <aside className="hidden xl:flex flex-col gap-4 w-[160px] shrink-0 pt-4 pr-2 sticky top-20 self-start h-fit">
          {ADS_RIGHT.map((ad, i) => (
            <Link key={i} to={ad.to} className={`${ad.color} rounded-xl p-3 text-white text-center hover:opacity-90 transition`}>
              <p className="text-[9px] uppercase tracking-wide opacity-80">PUBLICITÉS SPONSORISÉES</p>
              <p className="mt-2 text-lg font-black leading-tight">{ad.titre}</p>
              <p className="text-[10px] mt-1 opacity-90">{ad.sous}</p>
              {ad.prix && <p className="text-sm font-black mt-1">{ad.prix}</p>}
              <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">{ad.cta}</span>
            </Link>
          ))}
        </aside>

      </div>
    </div>
  );
}
