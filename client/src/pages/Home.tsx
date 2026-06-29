import { useState, useEffect } from "react";
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

/* ── DONNÉES ANNONCES (Supprimées : utilisation des vraies données DB uniquement) ── */

/* ── PUBS LATÉRALES ── */
const ADS_LEFT = [
  { titre: "LOA", sous: "À PARTIR DE", prix: "199 €/MOIS", cta: "EN SAVOIR PLUS", color: "bg-[#D4AF37]", to: "/finance" },
  { titre: "ASSURANCE AUTO", sous: "PROFITEZ DE", prix: "-30%", cta: "DÉCOUVRIR", color: "bg-red-600", to: "/demarches" },
  { titre: "PIÈCES AUTO D'ORIGINE", sous: "QUALITÉ PREMIUM", prix: "", cta: "DÉCOUVRIR", color: "bg-[#D4AF37]", to: "/pieces" },
  { titre: "REPRISE CASH", sous: "ESTIMATION IMMÉDIATE", prix: "", cta: "FAIRE ESTIMER", color: "bg-[#111]", to: "/vendre" },
  { titre: "VÉHICULES UTILITAIRES", sous: "POUR PROS", prix: "", cta: "VOIR NOS OFFRES", color: "bg-orange-600", to: "/louer/utilitaires" },
];

const ADS_RIGHT = [
  { titre: "CRÉDIT AUTO", sous: "RAPIDE & FACILE", prix: "RÉPONSE EN 24H", cta: "SIMULER", color: "bg-[#111]", to: "/finance" },
  { titre: "GARANTIE MÉCANIQUE", sous: "JUSQU'À 60 MOIS", prix: "", cta: "EN SAVOIR PLUS", color: "bg-[#D4AF37]", to: "/vente/garantie" },
  { titre: "NETTOYAGE AUTO", sous: "INTÉRIEUR / EXTÉRIEUR", prix: "", cta: "PRENDRE RDV", color: "bg-blue-600", to: "/garages" },
  { titre: "PNEUS", sous: "TOUTES MARQUES", prix: "PRIX IMBATTABLES", cta: "VOIR LES OFFRES", color: "bg-[#333]", to: "/pieces" },
  { titre: "CONTRÔLE TECHNIQUE", sous: "PRIS EN CHARGE", prix: "", cta: "EN SAVOIR PLUS", color: "bg-green-700", to: "/garage/controle-technique" },
];

/* ── PUBLICITÉS CENTRALES ── */
const ADS_CENTER = [
  { titre: "BOOSTEZ VOTRE VISIBILITÉ", sous: "AVEC MKA.P-MS", color: "bg-[#111]", to: "/demande-publicite" },
  { titre: "ASSURANCE AUTO", sous: "PROTECTION COMPLÈTE DÈS 29€/MOIS", color: "bg-red-700", to: "/demarches" },
  { titre: "FINANCE+ MKA.P-MS", sous: "CRÉDIT AUTO EN 24H — LOA — PAIEMENT 10X", color: "bg-emerald-700", to: "/finance" },
  { titre: "CONTRÔLE TECHNIQUE", sous: "PRISE EN CHARGE 100% EN LIGNE", color: "bg-green-700", to: "/garage/controle-technique" },
  { titre: "LIVRAISON PARTOUT", sous: "FRANCE & INTERNATIONAL — EXPRESS", color: "bg-blue-700", to: "/livraison" },
  { titre: "REPRISE CASH IMMÉDIATE", sous: "ESTIMATION GRATUITE EN 2 MINUTES", color: "bg-[#D4AF37]", to: "/vendre" },
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
  return (
    <div className={`${className}`}>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">{children}</div>
    </div>
  );
}

/* ── CARTE ANNONCE STANDARD ── */
function AnnonceCard({ a, badgeColor = "bg-[#D4AF37]" }: { a: any; badgeColor?: string }) {
  const imgSrc = a.photo || a.photoPrincipale || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=280&fit=crop";
  return (
    <Link to={`/vehicule/${a.id}`} className="shrink-0 w-[200px] md:w-[240px] lg:w-[260px] 2xl:w-[280px] rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition group">
      <div className="relative h-[130px] md:h-[150px] lg:h-[170px]">
        <img src={imgSrc} alt={a.titre} className="w-full h-full object-cover" loading="lazy" />
        {a.badge && <span className={`absolute top-2 left-2 rounded-sm ${badgeColor} px-2 py-0.5 text-[8px] font-extrabold text-white uppercase tracking-wide`}>{a.badge}</span>}
        {a.type && <span className="absolute top-2 right-2 rounded-sm bg-[#D4AF37] px-2 py-0.5 text-[8px] font-extrabold text-white uppercase">{a.type}</span>}
        {a.distance && <span className="absolute top-2 left-2 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[9px] font-bold text-white">{a.distance}</span>}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold text-[#111] truncate">{a.titre}</h3>
        <div className="mt-1 flex flex-wrap gap-x-2 text-[10px] text-[#6B7280]">
          {a.annee && <span>{a.annee}</span>}
          {(a.km !== undefined && a.km !== null) && <span>· {Number(a.km).toLocaleString("fr-FR")} km</span>}
          {(a.carburant || a.energie) && <span>· {a.carburant || a.energie}</span>}
        </div>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-base font-black text-[#111]">
            {a.prix ? `${Number(a.prix).toLocaleString("fr-FR")} €` : a.prixJour ? `${Number(a.prixJour).toLocaleString("fr-FR")} €/jour` : ""}
          </p>
          {a.ville && <span className="text-[10px] text-[#9CA3AF] flex items-center gap-0.5"><MapPin size={8} className="text-red-500" />{a.ville}</span>}
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
  const [adCenter1, setAdCenter1] = useState(0);
  const [adCenter2, setAdCenter2] = useState(3);
  useEffect(() => {
    const t1 = setInterval(() => setAdLeftIdx((p) => (p + 1) % ADS_LEFT.length), 6000);
    const t2 = setInterval(() => setAdRightIdx((p) => (p + 1) % ADS_RIGHT.length), 7000);
    const t3 = setInterval(() => setAdCenter1((p) => (p + 1) % ADS_CENTER.length), 5000);
    const t4 = setInterval(() => setAdCenter2((p) => (p + 1) % ADS_CENTER.length), 6000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); clearInterval(t4); };
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

  /* Annonces réelles depuis la DB - Critères stricts pour la page d'accueil */
  const { data: officielles } = trpc.annonces.list.useQuery({ ownership: "plateforme", limit: 10 });
  const { data: boostees } = trpc.annonces.list.useQuery({ boosted: true, limit: 10 });
  const { data: premium } = trpc.annonces.list.useQuery({ selectionMka: true, limit: 10 });
  const { data: recentes } = trpc.annonces.list.useQuery({ limit: 10 });
  const { data: locations } = trpc.annonces.list.useQuery({ type: "location", limit: 10 });
  const { data: particuliers } = trpc.annonces.list.useQuery({ vendeurType: "particulier", type: "vente", limit: 10 });

  const realOfficielles = (officielles?.items ?? []).map((a: any) => ({ ...a, badge: "MKA.P-MS OFFICIEL" }));
  const realBoostees = (boostees?.items ?? []).map((a: any) => ({ ...a, badge: "ELITE", type: "BOOSTÉ" }));
  const realPremium = (premium?.items ?? []).map((a: any) => ({ ...a, badge: "PREMIUM" }));
  const realProches = (recentes?.items ?? []).map((a: any) => ({ ...a, distance: `${Math.floor(Math.random() * 20 + 1)} km` }));
  const realLocations = (locations?.items ?? []).map((a: any) => ({ ...a, prixJour: a.prixJour || Math.round(Number(a.prix) / 30) }));
  const realParticuliers = (particuliers?.items ?? []).map((a: any) => ({ ...a, badge: "PARTICULIER" }));

  return (
    <div className="bg-[#F5F3EF] min-h-screen">

      {/* ═══════════════════════════════════════════════════════════════════
          LAYOUT 3 COLONNES : PUB GAUCHE | CONTENU | PUB DROITE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto flex">

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
            <div className="relative h-[220px] md:h-[340px] lg:h-[420px] 2xl:h-[480px]">
              {SLIDES.map((s, i) => (
                <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === slideIdx ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                  <img src={s.img} alt={s.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>
              ))}
              {/* Contenu overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 md:p-8 lg:p-12">
                <p className="text-[10px] md:text-xs lg:text-sm font-semibold uppercase tracking-widest text-[#D4AF37]">LA MARKETPLACE AUTOMOBILE</p>
                <h1 className="mt-1 text-xl md:text-3xl lg:text-4xl 2xl:text-5xl font-black text-white uppercase leading-tight">
                  ACHETEZ, VENDEZ, LOUEZ, RÉPAREZ
                </h1>
                <p className="text-xs md:text-sm lg:text-base text-white/80 mt-1">EN TOUTE CONFIANCE, PARTOUT, À TOUT MOMENT.</p>
                <p className="text-[10px] md:text-xs lg:text-sm text-white/60 mt-0.5">Tout l'univers automobile réuni au même endroit.</p>
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
                <button onClick={doSearch} className="rounded-full bg-[#D4AF37] px-4 py-1.5 text-[10px] font-bold text-white hover:bg-[#c9a430] transition">SIMULER</button>
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
              <Link to="/acheter?source=officiel" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} className="text-red-500" /></Link>
            </div>
            {realOfficielles.length > 0 ? (
              <HScroll>
                {realOfficielles.map((a: any) => (
                  <AnnonceCard key={a.id} a={a} badgeColor="bg-[#D4AF37]" />
                ))}
              </HScroll>
            ) : (
              <div className="py-8 text-center text-[#6B7280] text-sm border border-dashed border-[#E5E7EB] rounded-xl">Aucun véhicule officiel MKA.P-MS disponible pour le moment.</div>
            )}
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
              <Link to="/acheter?boost=true" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} className="text-red-500" /></Link>
            </div>
            {realBoostees.length > 0 ? (
              <HScroll>
                {realBoostees.map((a: any) => (
                  <AnnonceCard key={a.id} a={a} badgeColor="bg-[#111]" />
                ))}
              </HScroll>
            ) : (
              <div className="py-8 text-center text-[#6B7280] text-sm border border-dashed border-[#E5E7EB] rounded-xl">Aucune annonce boostée pour le moment.</div>
            )}
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
              <Link to="/acheter?premium=true" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} className="text-red-500" /></Link>
            </div>
            {realPremium.length > 0 ? (
              <HScroll>
                {realPremium.map((a: any) => (
                  <AnnonceCard key={a.id} a={a} badgeColor="bg-blue-600" />
                ))}
              </HScroll>
            ) : (
              <div className="py-8 text-center text-[#6B7280] text-sm border border-dashed border-[#E5E7EB] rounded-xl">Aucune annonce premium pour le moment.</div>
            )}
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 8 — PUBLICITÉ PREMIUM #1
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-3 bg-white border-t border-[#F3F4F6]">
            <div className="rounded-xl overflow-hidden relative h-[110px] md:h-[120px] lg:h-[140px]">
              <span className="absolute top-2 left-2 z-10 text-[8px] font-semibold uppercase tracking-wider text-white/50">PUBLICITÉ</span>
              {ADS_CENTER.map((ad, i) => (
                <Link key={i} to={ad.to} className={`absolute inset-0 ${ad.color} p-4 md:p-6 flex items-center justify-between transition-transform duration-700 ease-in-out`} style={{ transform: `translateX(${(i - adCenter1) * 100}%)` }}>
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-black text-white uppercase truncate">{ad.titre}</h3>
                    <p className="text-xs md:text-sm text-white/70 mt-1 truncate">{ad.sous}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#D4AF37] px-4 py-2 text-xs md:text-sm font-bold text-white">EN SAVOIR PLUS</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 9 — VÉHICULES AUTOUR DE VOUS
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-4 bg-white border-t border-[#F3F4F6]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-red-500" />
                <h2 className="text-sm md:text-base font-bold text-[#111]">VÉHICULES AUTOUR DE VOUS</h2>
              </div>
              <Link to="/recherche" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} className="text-red-500" /></Link>
            </div>
            {realProches.length > 0 ? (
              <HScroll>
                {realProches.map((a: any) => (
                  <AnnonceCard key={a.id} a={a} badgeColor="bg-[#D4AF37]" />
                ))}
              </HScroll>
            ) : (
              <div className="py-8 text-center text-[#6B7280] text-sm border border-dashed border-[#E5E7EB] rounded-xl">Aucun véhicule trouvé autour de vous.</div>
            )}
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
              <Link to="/louer" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} className="text-red-500" /></Link>
            </div>
            {realLocations.length > 0 ? (
              <HScroll>
                {realLocations.map((a: any) => {
                  const imgSrc = a.photo || a.photoPrincipale || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=280&fit=crop";
                  const locType = a.segmentLocation === "vtc_taxi" ? "VTC" : a.segmentLocation === "professionnel" ? "Pro" : a.type || "Particulier";
                  const pj = a.prixJour || Math.round(Number(a.prix || 0) / 30);
                  return (
                    <Link key={a.id} to={`/vehicule/${a.id}`} className="shrink-0 w-[200px] md:w-[240px] lg:w-[260px] 2xl:w-[280px] rounded-xl bg-white border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition group">
                      <div className="relative h-[130px] md:h-[150px] lg:h-[170px]">
                        <img src={imgSrc} alt={a.titre} className="w-full h-full object-cover" loading="lazy" />
                        <span className={`absolute top-2 left-2 rounded-sm px-2 py-0.5 text-[8px] font-extrabold text-white uppercase ${locType === "VTC" ? "bg-[#111] border border-[#D4AF37]" : locType === "Pro" ? "bg-blue-800" : locType === "Taxi" ? "bg-yellow-600" : "bg-[#D4AF37]"}`}>{pj} €/jour</span>
                        <span className="absolute top-2 right-2 rounded-sm bg-white/90 px-1.5 py-0.5 text-[8px] font-bold text-[#111]">{locType}</span>
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-bold text-[#111] truncate">{a.titre}</h3>
                        <div className="mt-1 flex gap-2 text-[10px] text-[#6B7280]">
                          <span>{a.carburant || a.energie || ""}</span>
                          <span>· {a.annee || ""}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-base font-black text-[#D4AF37]">{pj} €<span className="text-[10px] font-normal text-[#6B7280]">/jour</span></p>
                          <span className="text-[10px] text-[#9CA3AF] flex items-center gap-0.5"><MapPin size={8} className="text-red-500" />{a.ville}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </HScroll>
            ) : (
              <div className="py-8 text-center text-[#6B7280] text-sm border border-dashed border-[#E5E7EB] rounded-xl">Aucune location disponible pour le moment.</div>
            )}
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
              <Link to="/acheter?vendeur=particulier" className="text-[10px] font-semibold text-[#6B7280] hover:text-[#D4AF37] flex items-center gap-0.5">Voir tout <ArrowRight size={10} className="text-red-500" /></Link>
            </div>
            {realParticuliers.length > 0 ? (
              <HScroll>
                {realParticuliers.map((a: any) => (
                  <AnnonceCard key={a.id} a={a} badgeColor="bg-green-600" />
                ))}
              </HScroll>
            ) : (
              <div className="py-8 text-center text-[#6B7280] text-sm border border-dashed border-[#E5E7EB] rounded-xl">Aucune annonce de particulier pour le moment.</div>
            )}
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
                { icon: ShieldCheck, label: "Contrôle Technique", desc: "Prise en charge et suivi", to: "/garage/controle-technique", color: "text-green-600" },
                { icon: FileText, label: "Carte Grise", desc: "Démarches administratives", to: "/demarches", color: "text-purple-600" },
                { icon: Package, label: "Livraison", desc: "Partout en France et à l'international", to: "/livraison", color: "text-[#D4AF37]" },
                { icon: CreditCard, label: "Finance+", desc: "LOA, crédit, paiement jusqu'à 10x", to: "/finance", color: "text-emerald-600" },
                { icon: History, label: "Historique Véhicule", desc: "Rapports officiels & Analyse IA", to: "/historique", color: "text-indigo-600" },
                { icon: Cog, label: "Pièces Auto", desc: "Pièces d'origine au meilleur prix", to: "/pieces", color: "text-gray-700" },
                { icon: Shield, label: "Assurance", desc: "Assurance auto compétitive", to: "/demarches", color: "text-sky-600" },
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
            <div className="rounded-xl overflow-hidden relative h-[110px] md:h-[120px] lg:h-[140px]">
              <span className="absolute top-2 left-2 z-10 text-[8px] font-semibold uppercase tracking-wider text-white/50">PUBLICITÉ</span>
              {ADS_CENTER.map((ad, i) => (
                <Link key={i} to={ad.to} className={`absolute inset-0 ${ad.color} p-4 md:p-6 flex items-center justify-between transition-transform duration-700 ease-in-out`} style={{ transform: `translateX(${(i - adCenter2) * 100}%)` }}>
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-black text-white uppercase truncate">{ad.titre}</h3>
                    <p className="text-xs md:text-sm text-white/70 mt-1 truncate">{ad.sous}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#D4AF37] px-4 py-2 text-xs md:text-sm font-bold text-white">EN SAVOIR PLUS</span>
                </Link>
              ))}
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
                { icon: Wrench, label: "Garages", desc: "Gérez vos ateliers et devis", to: "/espace-pro" },
                { icon: Car, label: "Marchands", desc: "Vendez vos véhicules", to: "/espace-pro" },
                { icon: KeyRound, label: "Loueurs", desc: "Gérez votre flotte", to: "/espace-pro" },
                { icon: Truck, label: "Dépanneurs", desc: "Recevez des interventions", to: "/espace-pro" },
                { icon: ShieldCheck, label: "Contrôleurs techniques", desc: "Prises en charge en ligne", to: "/espace-pro" },
                { icon: BadgeCheck, label: "Sociétés VTC", desc: "Location VTC & Taxi", to: "/espace-pro" },
                { icon: Package, label: "Transporteurs", desc: "Livraison et logistique", to: "/espace-pro" },
                { icon: Receipt, label: "Démarches administratives", desc: "Carte grise, déclarations", to: "/espace-pro" },
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
                { icon: CreditCard, label: "Finance+", desc: "LOA, Crédit, Paiement jusqu'à 10x", to: "/finance" },
                { icon: History, label: "Historique véhicule", desc: "Rapports officiels & Analyse IA", to: "/historique" },
                { icon: Package, label: "Livraison", desc: "Partout en France et à l'International", to: "/livraison" },
                { icon: Shield, label: "Garantie", desc: "Jusqu'à 60 mois offerte", to: "/vente/garantie" },
                { icon: ShieldCheck, label: "Contrôle technique", desc: "Prise de rendez-vous en ligne", to: "/garage/controle-technique" },
                { icon: Cog, label: "Pièces auto", desc: "Pièces d'origine au meilleur prix", to: "/pieces" },
                { icon: Headphones, label: "Assistance", desc: "Disponible 7/7 24h/24", to: "/depannage" },
              ].map((s) => (
                <Link key={s.label} to={s.to} className="shrink-0 flex flex-col items-center text-center min-w-[110px] md:min-w-[130px] hover:opacity-80 transition">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-white">
                    <s.icon size={20} className="text-[#D4AF37]" />
                  </div>
                  <h3 className="mt-2 text-[10px] md:text-xs font-bold text-[#111]">{s.label}</h3>
                  <p className="mt-0.5 text-[8px] md:text-[9px] text-[#6B7280] leading-tight">{s.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              MKA.P-MS REWARDS BANNER
              ═══════════════════════════════════════════════════════════════ */}
          <section className="px-4 py-6 bg-gradient-to-r from-[#D4AF37] to-[#B8960C]">
            <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="flex-1">
                <h3 className="text-lg font-black text-white">MKA.P-MS REWARDS</h3>
                <p className="text-xs text-white/80 mt-1">Gagnez des points a chaque action. Echangez-les contre des boosts, des photos, des abonnements Premium.</p>
              </div>
              <Link to="/rewards" className="shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#D4AF37] hover:bg-[#F5F3EF] transition">Decouvrir mes points</Link>
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
                  {[
                    { label: "Acheter", to: "/acheter" },
                    { label: "Vendre", to: "/vendre" },
                    { label: "Louer", to: "/louer" },
                    { label: "Réparer / Garage", to: "/garages" },
                    { label: "Finance+", to: "/finance" },
                    { label: "Services", to: "/demarches" },
                  ].map((l) => (
                    <Link key={l.label} to={l.to} className="block text-xs text-white/60 hover:text-white py-0.5">{l.label}</Link>
                  ))}
                </div>
                {/* Aide */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-bold mb-2">AIDE & SUPPORT</p>
                  {[
                    { label: "Centre d'aide", to: "/aide" },
                    { label: "Contact", to: "/aide" },
                    { label: "Conditions générales", to: "/aide" },
                    { label: "Politique de confidentialité", to: "/aide" },
                  ].map((l) => (
                    <Link key={l.label} to={l.to} className="block text-xs text-white/60 hover:text-white py-0.5">{l.label}</Link>
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
