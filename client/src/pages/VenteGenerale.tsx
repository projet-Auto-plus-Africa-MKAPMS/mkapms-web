import { useState, useEffect, useRef } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft, Search, Truck, Shield, Tag, Gavel,
  Calculator, History, ArrowRightLeft, PlusCircle, Building2,
  ChevronRight, Star, ChevronDown, Phone, Car, Bike,
  CheckCircle2, Lock, Zap, Users, Award, TrendingUp, MapPin
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   VENTE GÉNÉRALE — PORTE D'ENTRÉE PREMIUM
   Le client ne voit PAS les véhicules. Il voit les univers.
   ══════════════════════════════════════════════════════════════════════════ */

const UNIVERS = [
  { id: "mkapms", label: "Acheter un véhicule certifié MKA.P-MS", desc: "Véhicules MKA.P-MS : contrôle qualité, historique complet, Finance+, garantie.", photo: "/categories/cover_mkapms.jpg", to: "/acheter/mkapms-officiel", badge: "MKA.P-MS Officiel", badgeColor: "bg-[#111] text-[#D4AF37] border border-[#D4AF37]", icon: Star },
  { id: "pro", label: "Acheter un véhicule professionnel", desc: "Garages, marchands, concessionnaires. Garantie, historique, factures.", photo: "/categories/cover_pro.jpg", to: "/acheter/professionnel", badge: "Professionnel", badgeColor: "bg-blue-800 text-white border-transparent", icon: Building2 },
  { id: "particulier", label: "Acheter un véhicule", desc: "Citadines, berlines, SUV, monospaces entre particuliers et pros.", photo: "/categories/cover_particulier.jpg", to: "/acheter/particulier", badge: "Particulier", badgeColor: "bg-[#D4AF37] text-white border-transparent", icon: Car },
  { id: "moto", label: "Acheter une moto", desc: "Scooters, 125, routières, trail, sportives, cross.", photo: "/categories/cover_moto.jpg", to: "/acheter/moto", badge: "Moto", badgeColor: "bg-red-600 text-white border-transparent", icon: Bike },
  { id: "utilitaires", label: "Acheter un utilitaire", desc: "Kangoo, Berlingo, Partner, Trafic, Master, Boxer.", photo: "/categories/cover_utilitaires.jpg", to: "/acheter/utilitaires", badge: "Utilitaires", badgeColor: "bg-orange-600 text-white border-transparent", icon: Truck },
  { id: "camions", label: "Acheter un camion", desc: "Porte-voitures, bennes, frigorifiques, poids lourds.", photo: "/categories/cover_camions.jpg", to: "/acheter/camions", badge: "Camions", badgeColor: "bg-gray-700 text-white border-transparent", icon: Truck },
  { id: "vtc", label: "Acheter un véhicule VTC / Taxi", desc: "Véhicules adaptés à l'activité VTC et Taxi avec revenus estimés.", photo: "/categories/cover_vtc_taxi.jpg", to: "/acheter/vtc-taxi", badge: "VTC & Taxi", badgeColor: "bg-[#111] text-[#D4AF37] border border-[#D4AF37]", icon: Shield },
  { id: "promo", label: "Promotions & Déstockage", desc: "Offres limitées, fins de série, déstockage, prix réduits.", photo: "/categories/cover_promo.jpg", to: "/acheter/promotions", badge: "Promo", badgeColor: "bg-green-600 text-white border-transparent", icon: Tag },
  { id: "encheres", label: "Vente aux enchères", desc: "Réservé aux professionnels validés. Lots, reprises, vente rapide.", photo: "/categories/cover_encheres.jpg", to: "/acheter/encheres", badge: "Enchères", badgeColor: "bg-purple-700 text-white border-transparent", icon: Gavel },
];

const SERVICES = [
  { label: "Estimation automobile", desc: "Estimez la valeur de votre véhicule en 30 secondes.", icon: Calculator, to: "/acheter/estimation" },
  { label: "Historique véhicule", desc: "VIN ou immatriculation : km, CT, sinistres, gage.", icon: History, to: "/acheter/historique-vehicule" },
  { label: "Reprise véhicule", desc: "Déposez votre véhicule, recevez une proposition.", icon: ArrowRightLeft, to: "/acheter/reprise" },
  { label: "Déposer une annonce", desc: "Vendez votre véhicule sur MKA.P-MS.", icon: PlusCircle, to: "/acheter/depot-annonce" },
  { label: "Espace professionnels", desc: "Garages, marchands : abonnements et gestion.", icon: Building2, to: "/acheter/espace-pro" },
];

const FAQ_VENTE = [
  { q: "Comment acheter un véhicule sur MKA.P-MS ?", r: "Choisissez votre univers, trouvez le véhicule, consultez le rapport complet, contactez le vendeur et finalisez la transaction en toute sécurité dans MKA.P-MS." },
  { q: "Comment vérifier l'historique d'un véhicule ?", r: "Utilisez notre outil Historique Véhicule avec le VIN ou l'immatriculation. Vous obtiendrez km, CT, sinistres, gage et propriétaires." },
  { q: "Puis-je financer mon achat ?", r: "Oui, MKA.P-MS propose Finance+ avec simulation de crédit, LOA et paiement fractionné directement dans la plateforme." },
  { q: "Comment fonctionne la garantie ?", r: "Les véhicules professionnels et certifiés MKA.P-MS sont couverts par une garantie. Les ventes entre particuliers dépendent du vendeur." },
  { q: "Comment vendre mon véhicule ?", r: "Déposez votre annonce gratuitement ou utilisez notre service de reprise pour une vente rapide et sécurisée." },
];

const CATEGORIE_REDIRECT: Record<string, string> = {
  officielle: "/acheter/mkapms-officiel",
  professionnelle: "/acheter/professionnel",
  particulier: "/acheter/particulier",
};

const STATS = [
  { val: "+120 000", label: "véhicules disponibles" },
  { val: "4,8/5", label: "satisfaction client" },
  { val: "100%", label: "paiement sécurisé" },
];

const GARANTIES = [
  { icon: CheckCircle2, label: "Véhicules vérifiés", desc: "Contrôle qualité sur chaque annonce certifiée" },
  { icon: Lock, label: "Transaction sécurisée", desc: "Paiement protégé Stripe & SSL 256 bits" },
  { icon: Zap, label: "Rapport instantané", desc: "Historique complet en quelques secondes" },
  { icon: Award, label: "Garantie satisfait", desc: "Ou remboursé sous 14 jours" },
];

const HERO_VIDEOS = [
  { src: "/videos/achat/achat_hero1.mp4", label: "Showroom" },
  { src: "/videos/achat/achat_hero2.mp4", label: "Route" },
  { src: "/videos/achat/achat_hero3.mp4", label: "Inspection" },
  { src: "/videos/achat/achat_hero4.mp4", label: "Remise" },
  { src: "/videos/achat/achat_hero5.mp4", label: "Paiement" },
];
export default function VenteGenerale() {
  const [sp] = useSearchParams();
  const cat = sp.get("categorieAnnonce");

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const [budget, setBudget] = useState("");
  const [typeVeh, setTypeVeh] = useState("");
  const [zone, setZone] = useState("");
  const [q, setQ] = useState("");
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    setHeroProgress(0);
    const step = 100 / (8000 / 50);
    progressRef.current = setInterval(() => {
      setHeroProgress((p) => {
        if (p + step >= 100) {
          setHeroIdx((i) => (i + 1) % HERO_VIDEOS.length);
          return 0;
        }
        return p + step;
      });
    }, 50);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [heroIdx]);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === heroIdx) { v.currentTime = 0; v.play().catch(() => {}); }
      else { v.pause(); }
    });
  }, [heroIdx]);

  if (cat && CATEGORIE_REDIRECT[cat]) {
    return <Navigate to={CATEGORIE_REDIRECT[cat]} replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24 max-w-6xl mx-auto">

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO PREMIUM VIDÉO CAROUSEL
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-[#111]" style={{ height: "72vw", maxHeight: 420, minHeight: 280 }}>
        {/* Vidéos préchargées */}
        {HERO_VIDEOS.map((v, i) => (
          <video
            key={i}
            ref={(el) => { videoRefs.current[i] = el; }}
            src={v.src}
            muted
            playsInline
            loop
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: i === heroIdx ? 1 : 0 }}
          />
        ))}
        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-black/55" />
        {/* Bouton retour */}
        <Link to="/" className="absolute top-4 left-4 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur">
          <ChevronLeft size={20} className="text-white" />
        </Link>
        {/* Badge */}
        <div className="absolute top-4 left-0 right-0 z-10 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider backdrop-blur">
            <Car size={12} /> Achat & Vente de véhicules
          </span>
        </div>
        {/* Titre + Stats */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pt-10">
          <h1 className="text-[26px] md:text-3xl font-black text-white leading-tight text-center">
            Achat de véhicules<br />
            <span className="text-[#D4AF37]">MKA.P-MS</span>
          </h1>
          <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-sm mx-auto text-center">
            Choisissez votre univers et trouvez le véhicule adapté à votre besoin.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            {STATS.map((s) => (
              <div key={s.val} className="flex flex-col items-center rounded-xl bg-white/10 backdrop-blur px-4 py-2 border border-white/10">
                <span className="text-base font-black text-[#D4AF37]">{s.val}</span>
                <span className="text-[9px] text-white/60 mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Indicateurs barre de progression */}
        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5 px-4">
          {HERO_VIDEOS.map((v, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className="relative h-[3px] rounded-full overflow-hidden bg-white/30 flex-1 max-w-[60px]"
              title={v.label}
            >
              <div
                className="absolute left-0 top-0 h-full bg-[#D4AF37] transition-none"
                style={{ width: i === heroIdx ? `${heroProgress}%` : i < heroIdx ? "100%" : "0%" }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — BARRE DE RECHERCHE RAPIDE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 -mt-6 relative z-10 rounded-2xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <div className="space-y-3">
          {/* Recherche texte */}
          <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-3 py-2.5 bg-[#FAFAF8]">
            <Search size={14} className="text-[#6B7280] shrink-0" />
            <input
              type="text"
              placeholder="Marque, modèle, référence…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-transparent text-sm text-[#111] placeholder:text-[#9CA3AF] outline-none"
            />
          </div>
          {/* Filtres */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Budget</label>
              <select value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm bg-[#FAFAF8] text-[#111] outline-none">
                <option value="">Tous budgets</option>
                <option value="5000">Moins de 5 000 €</option>
                <option value="10000">5 000 – 10 000 €</option>
                <option value="20000">10 000 – 20 000 €</option>
                <option value="50000">20 000 – 50 000 €</option>
                <option value="999999">50 000 € et +</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Type</label>
              <select value={typeVeh} onChange={(e) => setTypeVeh(e.target.value)} className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm bg-[#FAFAF8] text-[#111] outline-none">
                <option value="">Tous types</option>
                <option value="voiture">Voiture</option>
                <option value="moto">Moto</option>
                <option value="utilitaire">Utilitaire</option>
                <option value="camion">Camion</option>
                <option value="vtc">VTC & Taxi</option>
              </select>
            </div>
          </div>
          {/* Zone */}
          <div>
            <label className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide flex items-center gap-1"><MapPin size={10} /> Zone</label>
            <select value={zone} onChange={(e) => setZone(e.target.value)} className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm bg-[#FAFAF8] text-[#111] outline-none">
              <option value="">Toute la France</option>
              <option value="75">75 — Paris</option>
              <option value="13">13 — Bouches-du-Rhône</option>
              <option value="69">69 — Rhône (Lyon)</option>
              <option value="31">31 — Haute-Garonne (Toulouse)</option>
              <option value="33">33 — Gironde (Bordeaux)</option>
              <option value="06">06 — Alpes-Maritimes (Nice)</option>
              <option value="59">59 — Nord (Lille)</option>
              <option value="67">67 — Bas-Rhin (Strasbourg)</option>
              <option value="44">44 — Loire-Atlantique (Nantes)</option>
              <option value="34">34 — Hérault (Montpellier)</option>
            </select>
          </div>
          {/* Bouton */}
          <Link
            to={`/acheter${q ? `?q=${encodeURIComponent(q)}` : ""}${budget ? `&prixMax=${budget}` : ""}${typeVeh ? `&categorie=${typeVeh}` : ""}${zone ? `&zone=${zone}` : ""}`}
            className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-extrabold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-md"
          >
            <Search size={16} /> Rechercher un véhicule
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — UNIVERS VENTE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-bold text-[#111] text-center">Choisissez votre univers</h2>
        <p className="text-xs text-[#6B7280] mt-0.5 text-center">Chaque univers a ses propres véhicules, filtres et parcours.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {UNIVERS.map((u) => {
            const Icon = u.icon;
            return (
              <Link
                key={u.id}
                to={u.to}
                className="group block rounded-2xl bg-white overflow-hidden border border-[#E5E7EB] transition hover:shadow-lg active:scale-[0.99]"
              >
                {/* Photo */}
                <div className="relative h-[180px] md:h-[200px] overflow-hidden">
                  <img
                    src={u.photo}
                    alt={u.label}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Badge */}
                  <span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${u.badgeColor}`}>
                    <Icon size={11} /> {u.badge}
                  </span>
                  {/* Titre sur photo */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-base font-extrabold text-white drop-shadow-lg leading-tight">{u.label}</h3>
                    <p className="text-[10px] text-white/80 mt-0.5">{u.desc}</p>
                  </div>
                </div>
                {/* Bouton */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold text-[#D4AF37]">Voir les véhicules</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/10">
                    <ChevronRight size={16} className="text-[#D4AF37]" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — GARANTIES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-8 rounded-2xl bg-[#111] p-5">
        <h2 className="text-base font-bold text-white text-center mb-4">Pourquoi acheter sur MKA.P-MS ?</h2>
        <div className="grid grid-cols-2 gap-3">
          {GARANTIES.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.label} className="flex flex-col items-center text-center rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37]/20 mb-2">
                  <Icon size={16} className="text-[#D4AF37]" />
                </div>
                <span className="text-xs font-bold text-white">{g.label}</span>
                <span className="text-[9px] text-white/50 mt-0.5 leading-tight">{g.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — COMMENT ÇA MARCHE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-6 rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden">
        <div className="bg-[#111] px-4 py-3">
          <h2 className="text-base font-bold text-white">Comment ça marche ?</h2>
        </div>
        <div className="px-4 py-4 space-y-0">
          {[
            { n: "1", title: "Choisissez votre univers", desc: "MKA.P-MS Officiel, Particulier, Pro, Moto, Utilitaire…" },
            { n: "2", title: "Trouvez votre véhicule", desc: "Filtrez par budget, type, zone et consultez les annonces." },
            { n: "3", title: "Vérifiez l'historique", desc: "Rapport complet : km, CT, sinistres, gage, propriétaires." },
            { n: "4", title: "Contactez le vendeur", desc: "Messagerie sécurisée directement dans MKA.P-MS." },
            { n: "5", title: "Finalisez en toute sécurité", desc: "Finance+, LOA, crédit ou paiement fractionné disponibles." },
          ].map((step, i, arr) => (
            <div key={step.n} className={`flex gap-3 py-3 ${i < arr.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-sm font-black text-white">{step.n}</div>
              <div>
                <p className="text-sm font-bold text-[#111]">{step.title}</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — SERVICES
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-bold text-[#111]">Services</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">Tous les outils pour acheter et vendre en toute confiance.</p>
        <div className="mt-3 space-y-2">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} to={s.to} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 active:scale-[0.99] transition hover:shadow-sm hover:border-[#D4AF37]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                  <Icon size={18} className="text-[#D4AF37]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#111]">{s.label}</h3>
                  <p className="text-[10px] text-[#6B7280]">{s.desc}</p>
                </div>
                <ChevronRight size={16} className="text-[#D4AF37] shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7 — BLOC PROFESSIONNELS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-8 rounded-2xl overflow-hidden border border-[#E5E7EB]">
        <div className="relative h-[120px] overflow-hidden">
          <img src="/categories/cover_pro.jpg" alt="Professionnels" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111]/90 to-[#111]/40" />
          <div className="absolute inset-0 flex flex-col justify-center px-5">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider mb-1">Espace Pro</span>
            <h3 className="text-base font-black text-white leading-tight">Vous êtes professionnel ?</h3>
            <p className="text-[11px] text-white/70 mt-0.5">Garages, marchands, concessionnaires — gérez votre stock.</p>
          </div>
        </div>
        <div className="bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={16} className="text-[#D4AF37]" />
            <span className="text-sm font-bold text-[#111]">Rejoindre l'espace pro</span>
          </div>
          <Link to="/acheter/espace-pro" className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white">
            Accéder
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8 — FAQ
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-black text-[#111] text-center">Questions fréquentes</h2>
        <div className="mt-3 space-y-2">
          {FAQ_VENTE.map((f, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-[#111] pr-2">{f.q}</span>
                <ChevronDown size={14} className={`text-[#D4AF37] shrink-0 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-[#6B7280] leading-relaxed">{f.r}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 9 — AIDE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-8 rounded-2xl bg-[#111] p-5 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/20 mx-auto mb-3">
          <Phone size={22} className="text-[#D4AF37]" />
        </div>
        <h3 className="text-sm font-bold text-white">Besoin d'aide ?</h3>
        <p className="text-xs text-white/60 mt-1">09 70 70 50 50 · 7j/7 de 8h à 20h</p>
        <div className="mt-3 flex justify-center gap-3">
          <a href="tel:0970705050" className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-white">
            Appeler
          </a>
          <Link to="/messages" className="rounded-xl bg-white/10 border border-white/20 px-5 py-2.5 text-xs font-bold text-white">
            Messagerie
          </Link>
        </div>
      </div>

    </div>
  );
}
