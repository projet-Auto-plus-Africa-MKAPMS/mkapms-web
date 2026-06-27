import { useState } from "react";
import {
  Globe, DollarSign, Languages, FileText, Shield, Plus, Trash2,
  ChevronDown, ChevronUp, CheckCircle, Settings, TrendingUp,
  Users, ShoppingCart, MapPin, AlertTriangle, Edit2, Save, X,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   GLOBAL COUNTRY ENGINE — MKA.P-MS
   Module caché — accessible uniquement Super Admin / Directeur Général
   Gère : Pays, Devises, Langues, Taxes, Documents, Réglementations
   ══════════════════════════════════════════════════════════════════════════ */

// ── Types ──────────────────────────────────────────────────────────────────
interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  active: boolean;
  currency: string;
  currencySymbol: string;
  languages: string[];
  timezone: string;
  tvaRate: number;
  taxRules: TaxRule[];
  requiredDocs: RequiredDoc[];
  regulations: Regulation[];
  stats: CountryStats;
}

interface TaxRule {
  id: string;
  name: string;
  type: "tva" | "douane" | "ecotaxe" | "taxe_pro" | "autre";
  rate: number;
  appliesTo: string;
  active: boolean;
}

interface RequiredDoc {
  id: string;
  name: string;
  category: "identite" | "vehicule" | "professionnel" | "fiscal" | "autre";
  mandatory: boolean;
  description: string;
}

interface Regulation {
  id: string;
  title: string;
  category: "vente" | "location" | "garage" | "vtc" | "assurance" | "environnement" | "autre";
  description: string;
  active: boolean;
}

interface CountryStats {
  users: number;
  annonces: number;
  ca: number;
  garages: number;
  transactions: number;
}

// ── Data ───────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GNF", symbol: "GNF", name: "Franc guinéen" },
  { code: "XOF", symbol: "CFA", name: "Franc CFA (BCEAO)" },
  { code: "XAF", symbol: "FCFA", name: "Franc CFA (BEAC)" },
  { code: "MAD", symbol: "DH", name: "Dirham marocain" },
  { code: "TND", symbol: "DT", name: "Dinar tunisien" },
  { code: "DZD", symbol: "DA", name: "Dinar algérien" },
  { code: "USD", symbol: "$", name: "Dollar américain" },
  { code: "GBP", symbol: "£", name: "Livre sterling" },
  { code: "CHF", symbol: "CHF", name: "Franc suisse" },
  { code: "CAD", symbol: "C$", name: "Dollar canadien" },
  { code: "MRU", symbol: "UM", name: "Ouguiya mauritanien" },
];

const ALL_LANGUAGES = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
  { code: "ar", name: "العربية" },
  { code: "pt", name: "Português" },
  { code: "es", name: "Español" },
  { code: "wo", name: "Wolof" },
  { code: "bm", name: "Bambara" },
  { code: "ff", name: "Peul / Fulfulde" },
  { code: "ha", name: "Hausa" },
  { code: "sw", name: "Kiswahili" },
];

const INITIAL_COUNTRIES: CountryConfig[] = [
  {
    code: "FR", name: "France", flag: "🇫🇷", active: true,
    currency: "EUR", currencySymbol: "€", languages: ["fr"],
    timezone: "Europe/Paris", tvaRate: 20,
    taxRules: [
      { id: "fr-tva-20", name: "TVA standard", type: "tva", rate: 20, appliesTo: "Tous les services et produits", active: true },
      { id: "fr-tva-10", name: "TVA intermédiaire", type: "tva", rate: 10, appliesTo: "Réparations automobiles", active: true },
      { id: "fr-tva-5.5", name: "TVA réduite", type: "tva", rate: 5.5, appliesTo: "Pièces de première nécessité", active: true },
      { id: "fr-ecotaxe", name: "Écotaxe véhicules", type: "ecotaxe", rate: 0, appliesTo: "Malus écologique selon CO₂ (barème annuel)", active: true },
      { id: "fr-taxe-pro", name: "CFE professionnels", type: "taxe_pro", rate: 0, appliesTo: "Cotisation foncière des entreprises", active: true },
    ],
    requiredDocs: [
      { id: "fr-cni", name: "Carte nationale d'identité / Passeport", category: "identite", mandatory: true, description: "Pièce d'identité valide pour tout utilisateur" },
      { id: "fr-cg", name: "Carte grise (certificat d'immatriculation)", category: "vehicule", mandatory: true, description: "Obligatoire pour toute vente ou location de véhicule" },
      { id: "fr-ct", name: "Contrôle technique", category: "vehicule", mandatory: true, description: "Moins de 6 mois pour véhicule de plus de 4 ans" },
      { id: "fr-kbis", name: "Extrait Kbis", category: "professionnel", mandatory: true, description: "Obligatoire pour tout compte professionnel" },
      { id: "fr-siret", name: "Numéro SIRET", category: "professionnel", mandatory: true, description: "Identifiant établissement professionnel" },
      { id: "fr-assurance", name: "Attestation d'assurance", category: "vehicule", mandatory: true, description: "Assurance responsabilité civile obligatoire" },
      { id: "fr-rib", name: "RIB / IBAN", category: "fiscal", mandatory: true, description: "Pour les paiements et remboursements" },
    ],
    regulations: [
      { id: "fr-reg-1", title: "Garantie légale de conformité", category: "vente", description: "2 ans pour les véhicules vendus par des professionnels (Code de la consommation)", active: true },
      { id: "fr-reg-2", title: "Garantie des vices cachés", category: "vente", description: "Applicable à toute vente, le vendeur doit garantir l'absence de vices cachés (art. 1641 Code civil)", active: true },
      { id: "fr-reg-3", title: "Contrôle technique obligatoire", category: "vente", description: "CT de moins de 6 mois pour tout véhicule de plus de 4 ans lors de la vente", active: true },
      { id: "fr-reg-4", title: "Réglementation VTC", category: "vtc", description: "Carte professionnelle VTC obligatoire, véhicule < 6 ans, assurance RC pro", active: true },
      { id: "fr-reg-5", title: "Normes environnementales", category: "environnement", description: "Vignette Crit'Air, ZFE (zones à faibles émissions), malus écologique", active: true },
      { id: "fr-reg-6", title: "Obligations garage agréé", category: "garage", description: "Affichage des prix, ordre de réparation signé, restitution pièces remplacées", active: true },
    ],
    stats: { users: 12450, annonces: 8920, ca: 2340000, garages: 156, transactions: 4520 },
  },
  {
    code: "GN", name: "Guinée", flag: "🇬🇳", active: true,
    currency: "GNF", currencySymbol: "GNF", languages: ["fr", "ff"],
    timezone: "Africa/Conakry", tvaRate: 18,
    taxRules: [
      { id: "gn-tva-18", name: "TVA standard", type: "tva", rate: 18, appliesTo: "Services et produits", active: true },
      { id: "gn-douane", name: "Droits de douane véhicules", type: "douane", rate: 20, appliesTo: "Importation de véhicules (variable selon âge)", active: true },
      { id: "gn-taxe-import", name: "Taxe sur l'importation", type: "autre", rate: 10, appliesTo: "Véhicules importés d'occasion", active: true },
    ],
    requiredDocs: [
      { id: "gn-cni", name: "Carte d'identité nationale / Passeport", category: "identite", mandatory: true, description: "Pièce d'identité valide" },
      { id: "gn-carte-grise", name: "Carte grise guinéenne", category: "vehicule", mandatory: true, description: "Document d'immatriculation délivré par la DNTT" },
      { id: "gn-visite", name: "Certificat de visite technique", category: "vehicule", mandatory: true, description: "Visite technique annuelle obligatoire" },
      { id: "gn-patente", name: "Patente commerciale", category: "professionnel", mandatory: true, description: "Pour les professionnels de l'automobile" },
      { id: "gn-nif", name: "NIF (Numéro d'identification fiscale)", category: "fiscal", mandatory: true, description: "Obligatoire pour toute activité commerciale" },
    ],
    regulations: [
      { id: "gn-reg-1", title: "Importation véhicules d'occasion", category: "vente", description: "Réglementation DNTT sur l'âge maximum des véhicules importés", active: true },
      { id: "gn-reg-2", title: "Visite technique annuelle", category: "vente", description: "Tous les véhicules doivent passer une visite technique annuelle", active: true },
      { id: "gn-reg-3", title: "Transport public", category: "vtc", description: "Licence de transport public obligatoire pour VTC et taxi", active: true },
    ],
    stats: { users: 3200, annonces: 1850, ca: 450000, garages: 42, transactions: 980 },
  },
  {
    code: "SN", name: "Sénégal", flag: "🇸🇳", active: true,
    currency: "XOF", currencySymbol: "CFA", languages: ["fr", "wo"],
    timezone: "Africa/Dakar", tvaRate: 18,
    taxRules: [
      { id: "sn-tva-18", name: "TVA standard", type: "tva", rate: 18, appliesTo: "Tous produits et services", active: true },
      { id: "sn-douane", name: "Droits de douane", type: "douane", rate: 20, appliesTo: "Véhicules importés", active: true },
    ],
    requiredDocs: [
      { id: "sn-cni", name: "Carte nationale d'identité CEDEAO", category: "identite", mandatory: true, description: "CNI ou passeport valide" },
      { id: "sn-carte-grise", name: "Carte grise", category: "vehicule", mandatory: true, description: "Immatriculation DGID" },
      { id: "sn-visite", name: "Visite technique", category: "vehicule", mandatory: true, description: "Contrôle technique annuel" },
      { id: "sn-ninea", name: "NINEA", category: "professionnel", mandatory: true, description: "Numéro d'identification nationale des entreprises" },
    ],
    regulations: [
      { id: "sn-reg-1", title: "Importation véhicules", category: "vente", description: "Véhicules d'occasion de moins de 8 ans (5 ans pour diesel)", active: true },
      { id: "sn-reg-2", title: "Assurance obligatoire", category: "assurance", description: "RC auto obligatoire, vérifiée par les forces de l'ordre", active: true },
    ],
    stats: { users: 2100, annonces: 1200, ca: 280000, garages: 28, transactions: 650 },
  },
  {
    code: "MA", name: "Maroc", flag: "🇲🇦", active: false,
    currency: "MAD", currencySymbol: "DH", languages: ["fr", "ar"],
    timezone: "Africa/Casablanca", tvaRate: 20,
    taxRules: [
      { id: "ma-tva-20", name: "TVA standard", type: "tva", rate: 20, appliesTo: "Services et produits", active: true },
      { id: "ma-tva-14", name: "TVA réduite transport", type: "tva", rate: 14, appliesTo: "Transport de personnes", active: true },
      { id: "ma-vignette", name: "Vignette automobile", type: "autre", rate: 0, appliesTo: "Taxe annuelle selon puissance fiscale", active: true },
    ],
    requiredDocs: [
      { id: "ma-cni", name: "CNIE / Passeport", category: "identite", mandatory: true, description: "Carte nationale d'identité électronique" },
      { id: "ma-carte-grise", name: "Carte grise", category: "vehicule", mandatory: true, description: "Certificat d'immatriculation marocain" },
      { id: "ma-ct", name: "Visite technique", category: "vehicule", mandatory: true, description: "Contrôle technique biannuel" },
      { id: "ma-rc", name: "Registre de commerce", category: "professionnel", mandatory: true, description: "Inscription au registre de commerce pour les pros" },
    ],
    regulations: [
      { id: "ma-reg-1", title: "Importation véhicules", category: "vente", description: "Dédouanement obligatoire, TVA + droits de douane", active: true },
    ],
    stats: { users: 0, annonces: 0, ca: 0, garages: 0, transactions: 0 },
  },
  {
    code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", active: false,
    currency: "XOF", currencySymbol: "CFA", languages: ["fr"],
    timezone: "Africa/Abidjan", tvaRate: 18,
    taxRules: [
      { id: "ci-tva-18", name: "TVA standard", type: "tva", rate: 18, appliesTo: "Produits et services", active: true },
    ],
    requiredDocs: [
      { id: "ci-cni", name: "CNI ivoirienne", category: "identite", mandatory: true, description: "Pièce d'identité valide" },
      { id: "ci-carte-grise", name: "Carte grise", category: "vehicule", mandatory: true, description: "Immatriculation véhicule" },
    ],
    regulations: [],
    stats: { users: 0, annonces: 0, ca: 0, garages: 0, transactions: 0 },
  },
  {
    code: "ML", name: "Mali", flag: "🇲🇱", active: false,
    currency: "XOF", currencySymbol: "CFA", languages: ["fr", "bm"],
    timezone: "Africa/Bamako", tvaRate: 18,
    taxRules: [
      { id: "ml-tva-18", name: "TVA standard", type: "tva", rate: 18, appliesTo: "Produits et services", active: true },
    ],
    requiredDocs: [
      { id: "ml-cni", name: "Carte NINA", category: "identite", mandatory: true, description: "Numéro d'identification nationale" },
      { id: "ml-carte-grise", name: "Carte grise", category: "vehicule", mandatory: true, description: "Certificat d'immatriculation" },
    ],
    regulations: [],
    stats: { users: 0, annonces: 0, ca: 0, garages: 0, transactions: 0 },
  },
];

const TABS = [
  { id: "overview", label: "Vue d'ensemble", icon: Globe },
  { id: "countries", label: "Pays", icon: MapPin },
  { id: "currencies", label: "Devises", icon: DollarSign },
  { id: "languages", label: "Langues", icon: Languages },
  { id: "taxes", label: "Taxes & Fiscalité", icon: TrendingUp },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "regulations", label: "Réglementations", icon: Shield },
  { id: "settings", label: "Configuration", icon: Settings },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Component ──────────────────────────────────────────────────────────────
export default function GlobalCountryEngine() {
  const [tab, setTab] = useState<TabId>("overview");
  const [countries, setCountries] = useState<CountryConfig[]>(INITIAL_COUNTRIES);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [editingCountry, setEditingCountry] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [newCountry, setNewCountry] = useState({ code: "", name: "", flag: "", currency: "EUR", timezone: "", tvaRate: 20 });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const activeCountries = countries.filter((c) => c.active);
  const totalUsers = countries.reduce((a, c) => a + c.stats.users, 0);
  const totalAnnonces = countries.reduce((a, c) => a + c.stats.annonces, 0);
  const totalCA = countries.reduce((a, c) => a + c.stats.ca, 0);
  const totalGarages = countries.reduce((a, c) => a + c.stats.garages, 0);
  const totalTransactions = countries.reduce((a, c) => a + c.stats.transactions, 0);

  const toggleCountry = (code: string) => {
    setCountries((prev) => prev.map((c) => c.code === code ? { ...c, active: !c.active } : c));
    const c = countries.find((c) => c.code === code);
    showToast(`${c?.flag} ${c?.name} ${c?.active ? "désactivé" : "activé"}`);
  };

  const addTaxRule = (countryCode: string) => {
    const id = `${countryCode.toLowerCase()}-tax-${Date.now()}`;
    setCountries((prev) => prev.map((c) =>
      c.code === countryCode
        ? { ...c, taxRules: [...c.taxRules, { id, name: "Nouvelle taxe", type: "autre", rate: 0, appliesTo: "", active: true }] }
        : c
    ));
    showToast("Nouvelle règle fiscale ajoutée");
  };

  const removeTaxRule = (countryCode: string, ruleId: string) => {
    setCountries((prev) => prev.map((c) =>
      c.code === countryCode
        ? { ...c, taxRules: c.taxRules.filter((t) => t.id !== ruleId) }
        : c
    ));
    showToast("Règle fiscale supprimée");
  };

  const addDocument = (countryCode: string) => {
    const id = `${countryCode.toLowerCase()}-doc-${Date.now()}`;
    setCountries((prev) => prev.map((c) =>
      c.code === countryCode
        ? { ...c, requiredDocs: [...c.requiredDocs, { id, name: "Nouveau document", category: "autre", mandatory: false, description: "" }] }
        : c
    ));
    showToast("Nouveau document ajouté");
  };

  const removeDocument = (countryCode: string, docId: string) => {
    setCountries((prev) => prev.map((c) =>
      c.code === countryCode
        ? { ...c, requiredDocs: c.requiredDocs.filter((d) => d.id !== docId) }
        : c
    ));
    showToast("Document supprimé");
  };

  const addRegulation = (countryCode: string) => {
    const id = `${countryCode.toLowerCase()}-reg-${Date.now()}`;
    setCountries((prev) => prev.map((c) =>
      c.code === countryCode
        ? { ...c, regulations: [...c.regulations, { id, title: "Nouvelle réglementation", category: "autre", description: "", active: true }] }
        : c
    ));
    showToast("Nouvelle réglementation ajoutée");
  };

  const removeRegulation = (countryCode: string, regId: string) => {
    setCountries((prev) => prev.map((c) =>
      c.code === countryCode
        ? { ...c, regulations: c.regulations.filter((r) => r.id !== regId) }
        : c
    ));
    showToast("Réglementation supprimée");
  };

  const handleAddCountry = () => {
    if (!newCountry.code || !newCountry.name) return;
    const cur = CURRENCIES.find((c) => c.code === newCountry.currency);
    const nc: CountryConfig = {
      code: newCountry.code.toUpperCase(),
      name: newCountry.name,
      flag: newCountry.flag || "🏳️",
      active: false,
      currency: newCountry.currency,
      currencySymbol: cur?.symbol ?? newCountry.currency,
      languages: ["fr"],
      timezone: newCountry.timezone || "UTC",
      tvaRate: newCountry.tvaRate,
      taxRules: [{ id: `${newCountry.code.toLowerCase()}-tva`, name: "TVA standard", type: "tva", rate: newCountry.tvaRate, appliesTo: "Produits et services", active: true }],
      requiredDocs: [{ id: `${newCountry.code.toLowerCase()}-cni`, name: "Pièce d'identité", category: "identite", mandatory: true, description: "Document d'identité officiel" }],
      regulations: [],
      stats: { users: 0, annonces: 0, ca: 0, garages: 0, transactions: 0 },
    };
    setCountries((prev) => [...prev, nc]);
    setShowAddCountry(false);
    setNewCountry({ code: "", name: "", flag: "", currency: "EUR", timezone: "", tvaRate: 20 });
    showToast(`${nc.flag} ${nc.name} ajouté avec succès`);
  };

  const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n >= 1000 ? (n / 1000).toFixed(0) + "k" : n.toString();

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30">
              <Globe size={24} className="text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Global Country Engine</h1>
              <p className="text-xs text-white/40">MKA.P-MS — Moteur mondial de configuration par pays</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-[10px] font-bold text-green-400 border border-green-500/30">
                {activeCountries.length} pays actifs
              </span>
              <span className="rounded-full bg-[#D4AF37]/20 px-3 py-1 text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/30">
                {countries.length} pays configurés
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-1 overflow-x-auto pb-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition
                    ${tab === t.id ? "bg-[#D4AF37] text-black" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* ─── OVERVIEW ────────────────────────────────────────────── */}
        {tab === "overview" && (
          <>
            {/* Stats globales */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {[
                { label: "Utilisateurs", value: fmt(totalUsers), icon: Users, color: "text-blue-400" },
                { label: "Annonces", value: fmt(totalAnnonces), icon: ShoppingCart, color: "text-green-400" },
                { label: "Chiffre d'affaires", value: fmt(totalCA) + " €", icon: TrendingUp, color: "text-[#D4AF37]" },
                { label: "Garages", value: fmt(totalGarages), icon: Settings, color: "text-purple-400" },
                { label: "Transactions", value: fmt(totalTransactions), icon: DollarSign, color: "text-amber-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <s.icon size={18} className={s.color} />
                  <p className="mt-2 text-2xl font-black">{s.value}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Pays actifs */}
            <h2 className="mt-8 text-lg font-bold text-white/80">Pays actifs</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeCountries.map((c) => (
                <div key={c.code} className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-[#D4AF37]/30 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.flag}</span>
                    <div>
                      <h3 className="font-bold text-white">{c.name}</h3>
                      <p className="text-[10px] text-white/40">{c.code} · {c.currency} · TVA {c.tvaRate}%</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-black text-white">{fmt(c.stats.users)}</p>
                      <p className="text-[9px] text-white/30">Utilisateurs</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">{fmt(c.stats.annonces)}</p>
                      <p className="text-[9px] text-white/30">Annonces</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-[#D4AF37]">{fmt(c.stats.ca)} {c.currencySymbol}</p>
                      <p className="text-[9px] text-white/30">CA</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] text-white/50">{c.taxRules.length} taxes</span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] text-white/50">{c.requiredDocs.length} docs</span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] text-white/50">{c.regulations.length} règles</span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] text-white/50">{c.languages.join(", ")}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pays inactifs */}
            {countries.filter((c) => !c.active).length > 0 && (
              <>
                <h2 className="mt-8 text-lg font-bold text-white/50">Pays en préparation</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {countries.filter((c) => !c.active).map((c) => (
                    <div key={c.code} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 opacity-60">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{c.flag}</span>
                        <div>
                          <h3 className="text-sm font-bold text-white/70">{c.name}</h3>
                          <p className="text-[9px] text-white/30">{c.currency} · TVA {c.tvaRate}%</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleCountry(c.code)}
                        className="mt-3 w-full rounded-lg bg-[#D4AF37]/20 py-1.5 text-[10px] font-bold text-[#D4AF37] hover:bg-[#D4AF37]/30"
                      >
                        Activer ce pays
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ─── COUNTRIES ───────────────────────────────────────────── */}
        {tab === "countries" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Gestion des pays ({countries.length})</h2>
              <button onClick={() => setShowAddCountry(!showAddCountry)} className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black hover:bg-[#C4A030]">
                <Plus size={14} /> Ajouter un pays
              </button>
            </div>

            {showAddCountry && (
              <div className="mt-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-5">
                <h3 className="text-sm font-bold text-[#D4AF37] mb-4">Nouveau pays</h3>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <input className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white border border-white/10 outline-none focus:border-[#D4AF37]/50" placeholder="Code (ex: CM)" value={newCountry.code} onChange={(e) => setNewCountry({ ...newCountry, code: e.target.value.toUpperCase().slice(0, 2) })} />
                  <input className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white border border-white/10 outline-none focus:border-[#D4AF37]/50" placeholder="Nom du pays" value={newCountry.name} onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })} />
                  <input className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white border border-white/10 outline-none focus:border-[#D4AF37]/50" placeholder="Drapeau emoji (🇨🇲)" value={newCountry.flag} onChange={(e) => setNewCountry({ ...newCountry, flag: e.target.value })} />
                  <select className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white border border-white/10 outline-none" value={newCountry.currency} onChange={(e) => setNewCountry({ ...newCountry, currency: e.target.value })}>
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code} className="bg-[#111]">{c.code} — {c.name}</option>)}
                  </select>
                  <input className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white border border-white/10 outline-none focus:border-[#D4AF37]/50" placeholder="Fuseau horaire" value={newCountry.timezone} onChange={(e) => setNewCountry({ ...newCountry, timezone: e.target.value })} />
                  <input className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white border border-white/10 outline-none focus:border-[#D4AF37]/50" type="number" placeholder="TVA %" value={newCountry.tvaRate} onChange={(e) => setNewCountry({ ...newCountry, tvaRate: +e.target.value })} />
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={handleAddCountry} className="rounded-lg bg-[#D4AF37] px-5 py-2 text-xs font-bold text-black hover:bg-[#C4A030]"><Save size={12} className="inline mr-1" />Créer</button>
                  <button onClick={() => setShowAddCountry(false)} className="rounded-lg bg-white/10 px-5 py-2 text-xs font-bold text-white/60 hover:text-white"><X size={12} className="inline mr-1" />Annuler</button>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {countries.map((c) => {
                const isExpanded = expandedCountry === c.code;
                const isEditing = editingCountry === c.code;
                return (
                  <div key={c.code} className={`rounded-xl border transition ${c.active ? "border-white/10 bg-white/5" : "border-white/5 bg-white/[0.02] opacity-60"}`}>
                    <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpandedCountry(isExpanded ? null : c.code)}>
                      <span className="text-2xl">{c.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white">{c.name}</h3>
                          <span className="text-[10px] text-white/30">{c.code}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${c.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {c.active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40">
                          {c.currency} ({c.currencySymbol}) · TVA {c.tvaRate}% · {c.languages.map((l) => ALL_LANGUAGES.find((al) => al.code === l)?.name ?? l).join(", ")} · {c.timezone}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); toggleCountry(c.code); }} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${c.active ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-green-500/20 text-green-400 hover:bg-green-500/30"}`}>
                          {c.active ? "Désactiver" : "Activer"}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingCountry(isEditing ? null : c.code); if (!isExpanded) setExpandedCountry(c.code); }} className="rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/60 hover:text-white">
                          <Edit2 size={10} className="inline mr-1" />{isEditing ? "Fermer" : "Modifier"}
                        </button>
                        {isExpanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/5 p-5 space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-5 gap-3">
                          {[
                            { label: "Utilisateurs", value: c.stats.users },
                            { label: "Annonces", value: c.stats.annonces },
                            { label: "CA", value: c.stats.ca, suffix: c.currencySymbol },
                            { label: "Garages", value: c.stats.garages },
                            { label: "Transactions", value: c.stats.transactions },
                          ].map((s) => (
                            <div key={s.label} className="rounded-lg bg-white/5 p-3 text-center">
                              <p className="text-lg font-black">{fmt(s.value)}{s.suffix ? ` ${s.suffix}` : ""}</p>
                              <p className="text-[9px] text-white/30">{s.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Taxes */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-[#D4AF37]">Taxes & Fiscalité ({c.taxRules.length})</h4>
                            {isEditing && <button onClick={() => addTaxRule(c.code)} className="flex items-center gap-1 rounded bg-[#D4AF37]/20 px-2 py-1 text-[10px] font-bold text-[#D4AF37]"><Plus size={10} />Ajouter</button>}
                          </div>
                          <div className="space-y-1">
                            {c.taxRules.map((t) => (
                              <div key={t.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-xs">
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${t.type === "tva" ? "bg-blue-500/20 text-blue-400" : t.type === "douane" ? "bg-amber-500/20 text-amber-400" : t.type === "ecotaxe" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50"}`}>{t.type.toUpperCase()}</span>
                                <span className="font-semibold text-white">{t.name}</span>
                                {t.rate > 0 && <span className="font-bold text-[#D4AF37]">{t.rate}%</span>}
                                <span className="flex-1 text-white/30 truncate">{t.appliesTo}</span>
                                {isEditing && <button onClick={() => removeTaxRule(c.code, t.id)} className="text-red-400 hover:text-red-300"><Trash2 size={12} /></button>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Documents */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-[#D4AF37]">Documents obligatoires ({c.requiredDocs.length})</h4>
                            {isEditing && <button onClick={() => addDocument(c.code)} className="flex items-center gap-1 rounded bg-[#D4AF37]/20 px-2 py-1 text-[10px] font-bold text-[#D4AF37]"><Plus size={10} />Ajouter</button>}
                          </div>
                          <div className="space-y-1">
                            {c.requiredDocs.map((d) => (
                              <div key={d.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-xs">
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${d.category === "identite" ? "bg-blue-500/20 text-blue-400" : d.category === "vehicule" ? "bg-green-500/20 text-green-400" : d.category === "professionnel" ? "bg-purple-500/20 text-purple-400" : d.category === "fiscal" ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/50"}`}>{d.category}</span>
                                <span className="font-semibold text-white">{d.name}</span>
                                {d.mandatory && <span className="text-[9px] text-red-400 font-bold">OBLIGATOIRE</span>}
                                <span className="flex-1 text-white/30 truncate">{d.description}</span>
                                {isEditing && <button onClick={() => removeDocument(c.code, d.id)} className="text-red-400 hover:text-red-300"><Trash2 size={12} /></button>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Réglementations */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-[#D4AF37]">Réglementations ({c.regulations.length})</h4>
                            {isEditing && <button onClick={() => addRegulation(c.code)} className="flex items-center gap-1 rounded bg-[#D4AF37]/20 px-2 py-1 text-[10px] font-bold text-[#D4AF37]"><Plus size={10} />Ajouter</button>}
                          </div>
                          <div className="space-y-1">
                            {c.regulations.map((r) => (
                              <div key={r.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-xs">
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${r.category === "vente" ? "bg-blue-500/20 text-blue-400" : r.category === "location" ? "bg-green-500/20 text-green-400" : r.category === "garage" ? "bg-purple-500/20 text-purple-400" : r.category === "vtc" ? "bg-amber-500/20 text-amber-400" : r.category === "assurance" ? "bg-red-500/20 text-red-400" : r.category === "environnement" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"}`}>{r.category}</span>
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-white">{r.title}</span>
                                  <p className="text-white/30 truncate">{r.description}</p>
                                </div>
                                {isEditing && <button onClick={() => removeRegulation(c.code, r.id)} className="text-red-400 hover:text-red-300"><Trash2 size={12} /></button>}
                              </div>
                            ))}
                            {c.regulations.length === 0 && <p className="text-xs text-white/20 italic">Aucune réglementation configurée</p>}
                          </div>
                        </div>

                        {/* Langues */}
                        <div>
                          <h4 className="text-sm font-bold text-[#D4AF37] mb-2">Langues</h4>
                          <div className="flex flex-wrap gap-2">
                            {ALL_LANGUAGES.map((l) => {
                              const isActive = c.languages.includes(l.code);
                              return (
                                <button
                                  key={l.code}
                                  onClick={() => {
                                    if (!isEditing) return;
                                    setCountries((prev) => prev.map((cc) =>
                                      cc.code === c.code
                                        ? { ...cc, languages: isActive ? cc.languages.filter((ll) => ll !== l.code) : [...cc.languages, l.code] }
                                        : cc
                                    ));
                                    showToast(`${l.name} ${isActive ? "retiré" : "ajouté"} pour ${c.name}`);
                                  }}
                                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${isActive ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30" : "bg-white/5 text-white/30 border border-white/5"} ${isEditing ? "cursor-pointer hover:border-[#D4AF37]/50" : "cursor-default"}`}
                                >
                                  {l.name} ({l.code})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── CURRENCIES ──────────────────────────────────────────── */}
        {tab === "currencies" && (
          <>
            <h2 className="text-lg font-bold mb-4">Devises configurées</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {CURRENCIES.map((cur) => {
                const usedBy = countries.filter((c) => c.currency === cur.code);
                return (
                  <div key={cur.code} className={`rounded-xl border p-4 ${usedBy.length > 0 ? "border-white/10 bg-white/5" : "border-white/5 bg-white/[0.02] opacity-50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-lg font-black text-[#D4AF37]">{cur.symbol}</div>
                      <div>
                        <h3 className="font-bold text-white">{cur.code}</h3>
                        <p className="text-[10px] text-white/40">{cur.name}</p>
                      </div>
                    </div>
                    {usedBy.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {usedBy.map((c) => (
                          <span key={c.code} className="rounded bg-white/10 px-2 py-0.5 text-[9px] text-white/50">{c.flag} {c.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── LANGUAGES ───────────────────────────────────────────── */}
        {tab === "languages" && (
          <>
            <h2 className="text-lg font-bold mb-4">Langues disponibles</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {ALL_LANGUAGES.map((lang) => {
                const usedBy = countries.filter((c) => c.languages.includes(lang.code));
                return (
                  <div key={lang.code} className={`rounded-xl border p-4 ${usedBy.length > 0 ? "border-white/10 bg-white/5" : "border-white/5 bg-white/[0.02] opacity-50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-black text-blue-400">{lang.code.toUpperCase()}</div>
                      <div>
                        <h3 className="font-bold text-white">{lang.name}</h3>
                        <p className="text-[10px] text-white/40">Code: {lang.code}</p>
                      </div>
                    </div>
                    {usedBy.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {usedBy.map((c) => (
                          <span key={c.code} className="rounded bg-white/10 px-2 py-0.5 text-[9px] text-white/50">{c.flag} {c.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── TAXES ───────────────────────────────────────────────── */}
        {tab === "taxes" && (
          <>
            <h2 className="text-lg font-bold mb-4">Fiscalité par pays</h2>
            <div className="space-y-4">
              {countries.map((c) => (
                <div key={c.code} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{c.flag}</span>
                    <h3 className="font-bold text-white">{c.name}</h3>
                    <span className="text-sm font-bold text-[#D4AF37]">TVA principale: {c.tvaRate}%</span>
                    {!c.active && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-400">Inactif</span>}
                  </div>
                  <div className="space-y-1">
                    {c.taxRules.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-xs">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${t.type === "tva" ? "bg-blue-500/20 text-blue-400" : t.type === "douane" ? "bg-amber-500/20 text-amber-400" : t.type === "ecotaxe" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50"}`}>{t.type.toUpperCase()}</span>
                        <span className="font-semibold text-white">{t.name}</span>
                        {t.rate > 0 && <span className="font-bold text-[#D4AF37]">{t.rate}%</span>}
                        <span className="flex-1 text-white/30 truncate">{t.appliesTo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── DOCUMENTS ───────────────────────────────────────────── */}
        {tab === "documents" && (
          <>
            <h2 className="text-lg font-bold mb-4">Documents obligatoires par pays</h2>
            <div className="space-y-4">
              {countries.map((c) => (
                <div key={c.code} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{c.flag}</span>
                    <h3 className="font-bold text-white">{c.name}</h3>
                    <span className="text-xs text-white/40">{c.requiredDocs.length} documents</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {c.requiredDocs.map((d) => (
                      <div key={d.id} className="rounded-lg bg-white/5 p-3">
                        <div className="flex items-center gap-2">
                          <FileText size={12} className="text-[#D4AF37]" />
                          <span className="text-xs font-bold text-white">{d.name}</span>
                          {d.mandatory && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[8px] font-bold text-red-400">REQUIS</span>}
                        </div>
                        <p className="mt-1 text-[10px] text-white/30">{d.description}</p>
                        <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold ${d.category === "identite" ? "bg-blue-500/20 text-blue-400" : d.category === "vehicule" ? "bg-green-500/20 text-green-400" : d.category === "professionnel" ? "bg-purple-500/20 text-purple-400" : "bg-amber-500/20 text-amber-400"}`}>{d.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── REGULATIONS ─────────────────────────────────────────── */}
        {tab === "regulations" && (
          <>
            <h2 className="text-lg font-bold mb-4">Réglementations par pays</h2>
            <div className="space-y-4">
              {countries.map((c) => (
                <div key={c.code} className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{c.flag}</span>
                    <h3 className="font-bold text-white">{c.name}</h3>
                    <span className="text-xs text-white/40">{c.regulations.length} réglementations</span>
                  </div>
                  {c.regulations.length > 0 ? (
                    <div className="space-y-2">
                      {c.regulations.map((r) => (
                        <div key={r.id} className="rounded-lg bg-white/5 p-3">
                          <div className="flex items-center gap-2">
                            <Shield size={12} className="text-[#D4AF37]" />
                            <span className="text-xs font-bold text-white">{r.title}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${r.category === "vente" ? "bg-blue-500/20 text-blue-400" : r.category === "vtc" ? "bg-amber-500/20 text-amber-400" : r.category === "garage" ? "bg-purple-500/20 text-purple-400" : r.category === "assurance" ? "bg-red-500/20 text-red-400" : r.category === "environnement" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"}`}>{r.category}</span>
                          </div>
                          <p className="mt-1 text-[10px] text-white/30">{r.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/20 italic">Aucune réglementation encore configurée pour ce pays</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── SETTINGS ────────────────────────────────────────────── */}
        {tab === "settings" && (
          <>
            <h2 className="text-lg font-bold mb-6">Configuration globale</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-bold text-[#D4AF37] mb-3">Devise par défaut</h3>
                <p className="text-xs text-white/40 mb-3">Devise utilisée pour le tableau de bord global et les rapports consolidés</p>
                <select className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white border border-white/10 outline-none">
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code} className="bg-[#111]">{c.code} — {c.name} ({c.symbol})</option>)}
                </select>
                <button onClick={() => showToast("Devise par défaut mise à jour")} className="mt-3 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black">Enregistrer</button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-bold text-[#D4AF37] mb-3">Langue par défaut</h3>
                <p className="text-xs text-white/40 mb-3">Langue utilisée quand la détection automatique n'est pas disponible</p>
                <select className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white border border-white/10 outline-none">
                  {ALL_LANGUAGES.map((l) => <option key={l.code} value={l.code} className="bg-[#111]">{l.name} ({l.code})</option>)}
                </select>
                <button onClick={() => showToast("Langue par défaut mise à jour")} className="mt-3 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black">Enregistrer</button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-bold text-[#D4AF37] mb-3">Détection automatique</h3>
                <p className="text-xs text-white/40 mb-3">Le système détecte automatiquement le pays via IP / navigateur</p>
                <div className="space-y-2">
                  {[
                    { label: "Détection du pays par IP", enabled: true },
                    { label: "Détection de la langue navigateur", enabled: true },
                    { label: "Adaptation automatique devise", enabled: true },
                    { label: "Adaptation automatique TVA", enabled: true },
                    { label: "Documents requis par pays", enabled: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="text-xs text-white/70">{item.label}</span>
                      <button onClick={() => showToast(`${item.label}: activé`)} className="rounded-full bg-green-500/20 px-2 py-0.5 text-[9px] font-bold text-green-400">Activé</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-bold text-[#D4AF37] mb-3">Modules actifs</h3>
                <p className="text-xs text-white/40 mb-3">Modules disponibles sur la plateforme mondiale</p>
                <div className="space-y-2">
                  {[
                    "Vente", "Location", "Garage", "Carrosserie", "Pièces détachées",
                    "Dépannage", "VTC / Taxi", "Enchères", "Recharge électrique",
                    "Atelier Pro", "AutoData", "Publicités",
                  ].map((m) => (
                    <div key={m} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="text-xs text-white/70">{m}</span>
                      <button onClick={() => showToast(`Module ${m}: actif`)} className="rounded-full bg-green-500/20 px-2 py-0.5 text-[9px] font-bold text-green-400">Actif</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-400">Développement futur</h3>
                </div>
                <p className="text-xs text-white/40 mb-3">Modules prévus pour les prochaines phases</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { name: "Electric+", desc: "Réseau de bornes de recharge" },
                    { name: "Assurance MKA", desc: "Assurance auto intégrée" },
                    { name: "Financement", desc: "Crédit et LOA intégrés" },
                    { name: "Logistique", desc: "Transport de véhicules" },
                    { name: "Transport International", desc: "Import/Export maritime et terrestre" },
                    { name: "Réseau de bornes", desc: "Installation et gestion bornes électriques" },
                  ].map((m) => (
                    <div key={m.name} className="rounded-lg bg-white/5 p-3 border border-white/5">
                      <p className="text-xs font-bold text-white/50">{m.name}</p>
                      <p className="text-[10px] text-white/20">{m.desc}</p>
                      <span className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-bold text-amber-400">PRÉVU</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]">
          <div className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-black shadow-2xl flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-black/40 hover:text-black">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
