/**
 * MKA.P-MS — Landing page mkapms.site
 * Portail International Mondial
 * Même DB · Même Core Engine · Orientation mondiale
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import {
  Globe, MapPin, Languages, CreditCard, ChevronRight,
  Search, Shield, Award, Headphones, CheckCircle,
  Car, Wrench, KeyRound, Tag, ArrowRight, Star,
  Building2, Truck, Zap, Package
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useCurrency } from "../lib/currency";

/* ── PAYS PHARES ── */
const FEATURED_COUNTRIES = [
  { code: "FR", name: "France", flag: "🇫🇷", lang: "Français", currency: "EUR", url: "https://mkapms.fr" },
  { code: "MA", name: "Maroc", flag: "🇲🇦", lang: "Français / Arabe", currency: "MAD", url: "/mk-global-engine" },
  { code: "DZ", name: "Algérie", flag: "🇩🇿", lang: "Français / Arabe", currency: "DZD", url: "/mk-global-engine" },
  { code: "TN", name: "Tunisie", flag: "🇹🇳", lang: "Français / Arabe", currency: "TND", url: "/mk-global-engine" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", lang: "Français", currency: "XOF", url: "/mk-global-engine" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", lang: "Français", currency: "XOF", url: "/mk-global-engine" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", lang: "Français", currency: "XAF", url: "/mk-global-engine" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", lang: "English", currency: "GBP", url: "/mk-global-engine" },
  { code: "DE", name: "Deutschland", flag: "🇩🇪", lang: "Deutsch", currency: "EUR", url: "/mk-global-engine" },
  { code: "ES", name: "España", flag: "🇪🇸", lang: "Español", currency: "EUR", url: "/mk-global-engine" },
  { code: "AE", name: "الإمارات", flag: "🇦🇪", lang: "العربية", currency: "AED", url: "/mk-global-engine" },
  { code: "SA", name: "المملكة العربية", flag: "🇸🇦", lang: "العربية", currency: "SAR", url: "/mk-global-engine" },
];

/* ── RÉGIONS ── */
const REGIONS = [
  { name: "Europe", icon: "🌍", count: "12 pays", to: "/expansion/phase-europe" },
  { name: "Afrique du Nord", icon: "🌍", count: "6 pays", to: "/expansion/phase-afrique-nord" },
  { name: "Afrique de l'Ouest", icon: "🌍", count: "15 pays", to: "/expansion/phase-afrique-ouest" },
  { name: "Moyen-Orient", icon: "🌏", count: "8 pays", to: "/expansion/phase-moyen-orient" },
  { name: "Amérique du Nord", icon: "🌎", count: "3 pays", to: "/expansion/phase-amerique-nord" },
  { name: "Asie", icon: "🌏", count: "10 pays", to: "/expansion/phase-asie" },
];

/* ── SERVICES MONDIAUX ── */
const WORLD_SERVICES = [
  { icon: Car, label: "Acheter", sub: "Partout dans le monde", to: "/acheter", color: "bg-[#D4AF37]" },
  { icon: Tag, label: "Vendre", sub: "À l'international", to: "/vendre", color: "bg-[#111]" },
  { icon: KeyRound, label: "Louer", sub: "Tous pays", to: "/louer", color: "bg-blue-700" },
  { icon: Wrench, label: "Réparer", sub: "Réseau mondial", to: "/garages", color: "bg-emerald-700" },
  { icon: Truck, label: "Livraison", sub: "Export & import", to: "/livraison", color: "bg-orange-600" },
  { icon: Building2, label: "Pros", sub: "B2B international", to: "/espace-pro", color: "bg-purple-700" },
];

/* ── CHIFFRES MONDIAUX ── */
const WORLD_STATS = [
  { value: "47", label: "Pays actifs" },
  { value: "+120 000", label: "Annonces mondiales" },
  { value: "18", label: "Devises supportées" },
  { value: "6", label: "Langues disponibles" },
];

export default function HomeSite() {
  const navigate = useNavigate();
  const { currency, country } = useCurrency();
  const [searchCountry, setSearchCountry] = useState("");

  const { data: recentes } = trpc.annonces.list.useQuery({ pays: country ?? undefined, limit: 8 });

  const filteredCountries = searchCountry
    ? FEATURED_COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
        c.lang.toLowerCase().includes(searchCountry.toLowerCase())
      )
    : FEATURED_COUNTRIES;

  return (
    <div className="bg-[#F5F3EF] min-h-screen">

      {/* ═══════════════════════════════════════════════════════════════
          HERO INTERNATIONAL
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#0D1B2A] to-[#111]">
        {/* Globe décoratif */}
        <div className="absolute right-0 top-0 w-[400px] h-[400px] opacity-10"
          style={{ background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-14 md:py-20 lg:py-28">
          <div className="max-w-3xl">
            {/* Badge domaine */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 mb-6">
              <Globe size={14} className="text-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">MKA.P-MS WORLD — PORTAIL INTERNATIONAL</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase leading-tight text-white">
              LA MARKETPLACE<br />
              AUTOMOBILE<br />
              <span className="text-[#D4AF37]">MONDIALE</span>
            </h1>

            <p className="mt-4 text-base md:text-lg text-white/70 max-w-xl">
              Achetez, vendez, louez et réparez votre véhicule partout dans le monde.
              Dans votre langue, avec votre devise, selon les lois de votre pays.
            </p>

            <p className="mt-2 text-sm text-[#D4AF37]/80 font-medium">
              Pas de .com ? Pas de problème. <strong className="text-[#D4AF37]">mkapms.site</strong> est votre portail mondial.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/mk-global-engine")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#111] hover:bg-[#C9A227] transition"
              >
                <Globe size={16} />
                Choisir mon pays
              </button>
              <Link
                to="/acheter"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
              >
                <Search size={16} />
                Rechercher un véhicule
              </Link>
            </div>

            {/* Stats mondiales */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
              {WORLD_STATS.map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-xl md:text-2xl font-black text-[#D4AF37]">{s.value}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SÉLECTEUR DE PAYS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-b border-[#E5E7EB] py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">ACCÈS MONDIAL</p>
            <h2 className="text-xl md:text-2xl font-black uppercase text-[#111] mt-0.5">Choisissez votre pays</h2>
            <p className="text-sm text-[#6B7280] mt-1">Langue, devise et réglementations adaptées automatiquement</p>
          </div>

          {/* Recherche pays */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex items-center gap-2 rounded-xl border-2 border-[#D4AF37]/30 bg-[#F5F3EF] px-4 py-2.5">
              <Search size={14} className="text-[#D4AF37]" />
              <input
                type="text"
                placeholder="Rechercher un pays..."
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#111] placeholder-[#9CA3AF] outline-none"
              />
            </div>
          </div>

          {/* Grille pays */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredCountries.map((country) => (
              <a
                key={country.code}
                href={country.url}
                className="group rounded-xl border border-[#E5E7EB] bg-white p-3 text-center hover:border-[#D4AF37] hover:shadow-md transition cursor-pointer"
              >
                <span className="text-2xl">{country.flag}</span>
                <p className="text-xs font-bold text-[#111] mt-1.5 group-hover:text-[#D4AF37] transition">{country.name}</p>
                <p className="text-[9px] text-[#9CA3AF] mt-0.5">{country.lang}</p>
                <span className="mt-1 inline-block rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[8px] font-bold text-[#D4AF37]">{country.currency}</span>
              </a>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link
              to="/mk-global-engine"
              className="inline-flex items-center gap-2 text-sm text-[#D4AF37] font-semibold hover:underline"
            >
              Voir tous les pays <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SERVICES MONDIAUX
          ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">SERVICES</p>
          <h2 className="text-xl md:text-2xl font-black uppercase text-[#111] mt-0.5">Tous les services, partout</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {WORLD_SERVICES.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group rounded-xl border border-[#E5E7EB] bg-white p-4 text-center hover:border-[#D4AF37] hover:shadow-md transition"
            >
              <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center mx-auto mb-2`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-xs font-bold text-[#111] group-hover:text-[#D4AF37] transition">{s.label}</p>
              <p className="text-[9px] text-[#9CA3AF] mt-0.5">{s.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          RÉGIONS D'EXPANSION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#111] py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">EXPANSION MONDIALE</p>
            <h2 className="text-xl md:text-2xl font-black uppercase text-white mt-0.5">Nos régions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {REGIONS.map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:border-[#D4AF37]/50 hover:bg-white/10 transition"
              >
                <span className="text-2xl">{r.icon}</span>
                <p className="text-sm font-bold text-white mt-2 group-hover:text-[#D4AF37] transition">{r.name}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{r.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ANNONCES RÉCENTES (mondiales)
          ═══════════════════════════════════════════════════════════════ */}
      {recentes && recentes.items.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">ANNONCES</p>
              <h2 className="text-xl md:text-2xl font-black uppercase text-[#111] mt-0.5">Dernières annonces mondiales</h2>
            </div>
            <Link to="/acheter" className="flex items-center gap-1 text-xs text-[#D4AF37] hover:underline">
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {recentes.items.map((a: any) => (
              <Link
                key={a.id}
                to={getAnnonceUrl(a.id, a.categorieAnnonce, a.vendeurType)}
                className="shrink-0 w-[220px] rounded-xl border border-[#E5E7EB] bg-white overflow-hidden hover:shadow-lg transition group"
              >
                <div className="h-[130px] relative overflow-hidden">
                  <img
                    src={a.photoPrincipale || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=280&fit=crop"}
                    alt={a.titre}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  {a.ville && (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[8px] text-white">
                      <MapPin size={7} /> {a.ville}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-[#111] truncate">{a.titre}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{a.marque} · {a.annee}</p>
                  <p className="text-base font-black text-[#111] mt-1">
                    {a.prix ? `${Number(a.prix).toLocaleString("fr-FR")} €` : "—"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CONFIANCE MONDIALE
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white border-t border-[#E5E7EB] py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Shield, label: "100% Sécurisé", desc: "Transactions protégées" },
              { icon: Globe, label: "47 pays", desc: "Réseau mondial" },
              { icon: Languages, label: "6 langues", desc: "Interface multilingue" },
              { icon: CreditCard, label: "18 devises", desc: "Paiement local" },
              { icon: Headphones, label: "Support 7J/7", desc: "Assistance mondiale" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <b.icon size={18} className="text-[#D4AF37] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#111]">{b.label}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-[#9CA3AF] mt-6">
            mkapms.site — Portail international mondial · Même base de données · Même Core Engine que mkapms.fr et mkapms.pro
          </p>
        </div>
      </section>
    </div>
  );
}
