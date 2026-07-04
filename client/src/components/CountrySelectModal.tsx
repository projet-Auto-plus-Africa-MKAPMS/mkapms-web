/**
 * MKA.P-MS — Modal de sélection pays / langue / devise (Règle 4)
 *
 * S'affiche automatiquement sur mkapms.site si l'utilisateur n'a pas encore
 * choisi son pays. Le choix est persisté dans localStorage.
 * Adapte automatiquement toute l'expérience (langue, devise, contenu).
 */

import { useState, useEffect } from "react";
import { Globe, Search, X, ChevronRight } from "lucide-react";
import { useDomain } from "../lib/domain";
import { useCurrency } from "../lib/currency";

interface CountryConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  lang: string;
  langCode: string;
  currency: string;
  region: string;
}

const COUNTRIES: CountryConfig[] = [
  // Europe
  { code: "FR", name: "France", nativeName: "France", flag: "🇫🇷", lang: "Français", langCode: "fr", currency: "EUR", region: "Europe" },
  { code: "DE", name: "Allemagne", nativeName: "Deutschland", flag: "🇩🇪", lang: "Deutsch", langCode: "de", currency: "EUR", region: "Europe" },
  { code: "ES", name: "Espagne", nativeName: "España", flag: "🇪🇸", lang: "Español", langCode: "es", currency: "EUR", region: "Europe" },
  { code: "IT", name: "Italie", nativeName: "Italia", flag: "🇮🇹", lang: "Italiano", langCode: "it", currency: "EUR", region: "Europe" },
  { code: "GB", name: "Royaume-Uni", nativeName: "United Kingdom", flag: "🇬🇧", lang: "English", langCode: "en", currency: "GBP", region: "Europe" },
  { code: "BE", name: "Belgique", nativeName: "België", flag: "🇧🇪", lang: "Français", langCode: "fr", currency: "EUR", region: "Europe" },
  { code: "CH", name: "Suisse", nativeName: "Schweiz", flag: "🇨🇭", lang: "Français", langCode: "fr", currency: "CHF", region: "Europe" },
  { code: "PT", name: "Portugal", nativeName: "Portugal", flag: "🇵🇹", lang: "Português", langCode: "pt", currency: "EUR", region: "Europe" },
  { code: "NL", name: "Pays-Bas", nativeName: "Nederland", flag: "🇳🇱", lang: "Nederlands", langCode: "nl", currency: "EUR", region: "Europe" },
  // Afrique du Nord
  { code: "MA", name: "Maroc", nativeName: "المغرب", flag: "🇲🇦", lang: "Français / Arabe", langCode: "fr", currency: "MAD", region: "Afrique du Nord" },
  { code: "DZ", name: "Algérie", nativeName: "الجزائر", flag: "🇩🇿", lang: "Français / Arabe", langCode: "fr", currency: "DZD", region: "Afrique du Nord" },
  { code: "TN", name: "Tunisie", nativeName: "تونس", flag: "🇹🇳", lang: "Français / Arabe", langCode: "fr", currency: "TND", region: "Afrique du Nord" },
  { code: "LY", name: "Libye", nativeName: "ليبيا", flag: "🇱🇾", lang: "Arabe", langCode: "ar", currency: "LYD", region: "Afrique du Nord" },
  { code: "EG", name: "Égypte", nativeName: "مصر", flag: "🇪🇬", lang: "Arabe", langCode: "ar", currency: "EGP", region: "Afrique du Nord" },
  // Afrique de l'Ouest
  { code: "SN", name: "Sénégal", nativeName: "Sénégal", flag: "🇸🇳", lang: "Français", langCode: "fr", currency: "XOF", region: "Afrique de l'Ouest" },
  { code: "CI", name: "Côte d'Ivoire", nativeName: "Côte d'Ivoire", flag: "🇨🇮", lang: "Français", langCode: "fr", currency: "XOF", region: "Afrique de l'Ouest" },
  { code: "CM", name: "Cameroun", nativeName: "Cameroun", flag: "🇨🇲", lang: "Français", langCode: "fr", currency: "XAF", region: "Afrique de l'Ouest" },
  { code: "GH", name: "Ghana", nativeName: "Ghana", flag: "🇬🇭", lang: "English", langCode: "en", currency: "GHS", region: "Afrique de l'Ouest" },
  { code: "NG", name: "Nigeria", nativeName: "Nigeria", flag: "🇳🇬", lang: "English", langCode: "en", currency: "NGN", region: "Afrique de l'Ouest" },
  { code: "ML", name: "Mali", nativeName: "Mali", flag: "🇲🇱", lang: "Français", langCode: "fr", currency: "XOF", region: "Afrique de l'Ouest" },
  { code: "BF", name: "Burkina Faso", nativeName: "Burkina Faso", flag: "🇧🇫", lang: "Français", langCode: "fr", currency: "XOF", region: "Afrique de l'Ouest" },
  // Afrique Centrale & Est
  { code: "CD", name: "Congo RDC", nativeName: "Congo RDC", flag: "🇨🇩", lang: "Français", langCode: "fr", currency: "CDF", region: "Afrique Centrale" },
  { code: "GA", name: "Gabon", nativeName: "Gabon", flag: "🇬🇦", lang: "Français", langCode: "fr", currency: "XAF", region: "Afrique Centrale" },
  // Moyen-Orient
  { code: "AE", name: "Émirats Arabes Unis", nativeName: "الإمارات", flag: "🇦🇪", lang: "Arabe / English", langCode: "ar", currency: "AED", region: "Moyen-Orient" },
  { code: "SA", name: "Arabie Saoudite", nativeName: "المملكة العربية", flag: "🇸🇦", lang: "Arabe", langCode: "ar", currency: "SAR", region: "Moyen-Orient" },
  { code: "QA", name: "Qatar", nativeName: "قطر", flag: "🇶🇦", lang: "Arabe / English", langCode: "ar", currency: "QAR", region: "Moyen-Orient" },
  { code: "KW", name: "Koweït", nativeName: "الكويت", flag: "🇰🇼", lang: "Arabe", langCode: "ar", currency: "KWD", region: "Moyen-Orient" },
  // Amérique
  { code: "US", name: "États-Unis", nativeName: "United States", flag: "🇺🇸", lang: "English", langCode: "en", currency: "USD", region: "Amérique" },
  { code: "CA", name: "Canada", nativeName: "Canada", flag: "🇨🇦", lang: "Français / English", langCode: "fr", currency: "CAD", region: "Amérique" },
  { code: "MX", name: "Mexique", nativeName: "México", flag: "🇲🇽", lang: "Español", langCode: "es", currency: "MXN", region: "Amérique" },
  // Asie
  { code: "CN", name: "Chine", nativeName: "中国", flag: "🇨🇳", lang: "中文", langCode: "zh", currency: "CNY", region: "Asie" },
  { code: "JP", name: "Japon", nativeName: "日本", flag: "🇯🇵", lang: "日本語", langCode: "ja", currency: "JPY", region: "Asie" },
  { code: "IN", name: "Inde", nativeName: "India", flag: "🇮🇳", lang: "English / Hindi", langCode: "en", currency: "INR", region: "Asie" },
];

const REGIONS = ["Europe", "Afrique du Nord", "Afrique de l'Ouest", "Afrique Centrale", "Moyen-Orient", "Amérique", "Asie"];

const STORAGE_KEY = "mkapms_country_selection";

export interface CountrySelection {
  countryCode: string;
  countryName: string;
  flag: string;
  lang: string;
  langCode: string;
  currency: string;
  region: string;
}

export function getStoredCountrySelection(): CountrySelection | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CountrySelection;
  } catch {
    return null;
  }
}

export function storeCountrySelection(sel: CountrySelection): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
}

interface Props {
  onClose?: () => void;
}

export default function CountrySelectModal({ onClose }: Props) {
  const { isSite } = useDomain();
  const { setCurrency } = useCurrency();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  useEffect(() => {
    if (!isSite) return;
    const stored = getStoredCountrySelection();
    if (!stored) {
      // Afficher le modal après 800ms pour laisser la page se charger
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    // Appliquer la devise stockée
    setCurrency(stored.currency);
  }, [isSite, setCurrency]);

  function handleSelect(country: CountryConfig) {
    const sel: CountrySelection = {
      countryCode: country.code,
      countryName: country.name,
      flag: country.flag,
      lang: country.lang,
      langCode: country.langCode,
      currency: country.currency,
      region: country.region,
    };
    storeCountrySelection(sel);
    setCurrency(country.currency);
    setVisible(false);
    onClose?.();
  }

  function handleClose() {
    // Fermer sans sélection → on garde France par défaut
    const france = COUNTRIES.find((c) => c.code === "FR")!;
    handleSelect(france);
  }

  const filtered = COUNTRIES.filter((c) => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      c.lang.toLowerCase().includes(search.toLowerCase());
    const matchRegion = !activeRegion || c.region === activeRegion;
    return matchSearch && matchRegion;
  });

  if (!isSite || !visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* En-tête */}
        <div className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] px-5 py-5 text-white shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <Globe size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase">Bienvenue sur MKA.P-MS World</h2>
              <p className="text-xs text-white/60 mt-0.5">Choisissez votre pays pour adapter l'expérience</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
            {[
              { icon: "🌍", label: "Langue adaptée" },
              { icon: "💱", label: "Devise locale" },
              { icon: "📋", label: "Réglementation locale" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-white/10 py-1.5">
                <span className="text-base">{item.icon}</span>
                <p className="text-white/70 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recherche */}
        <div className="px-4 py-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#F5F3EF] px-3 py-2">
            <Search size={14} className="text-[#D4AF37]" />
            <input
              type="text"
              placeholder="Rechercher un pays..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#111] placeholder-slate-400 outline-none"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Filtres régions */}
        {!search && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 border-b border-slate-100">
            <button
              onClick={() => setActiveRegion(null)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                !activeRegion ? "bg-[#D4AF37] text-[#111]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tous
            </button>
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRegion(r === activeRegion ? null : r)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeRegion === r ? "bg-[#D4AF37] text-[#111]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Liste pays */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">Aucun pays trouvé</p>
          )}
          {filtered.map((country) => (
            <button
              key={country.code}
              onClick={() => handleSelect(country)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F3EF] transition border-b border-slate-50 text-left"
            >
              <span className="text-2xl w-8 text-center shrink-0">{country.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111]">{country.name}</p>
                <p className="text-[10px] text-slate-400">{country.nativeName} · {country.lang}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-block rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                  {country.currency}
                </span>
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#F5F3EF] border-t border-slate-100 shrink-0">
          <p className="text-[10px] text-slate-400 text-center">
            Votre choix est mémorisé · Vous pouvez le modifier à tout moment depuis le sélecteur de domaine
          </p>
        </div>
      </div>
    </div>
  );
}
