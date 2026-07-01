import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search, X, MapPin, Car, Wrench, Key, Gavel, Settings, Truck,
  HelpCircle, ChevronRight, Star, Shield, Navigation, Phone,
  MessageSquare, Calendar, ArrowRight, Paintbrush, Zap, FileText,
  Users, Building2, Package, Clock, AlertCircle, Sparkles, Filter,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════
   MOTEUR DE RECHERCHE UNIVERSELLE MKA.P-MS
   Cherche dans TOUTE la plateforme : vehicules, garages, location,
   pieces, services, aide, FAQ, encheres, etc.
   ══════════════════════════════════════════════════════════════════════ */

// ── Synonymes intelligents ──────────────────────────────────────────
const SYNONYMES: Record<string, string[]> = {
  garage: ["reparer", "reparation", "mecano", "mecanicien", "mecanique", "entretien", "vidange", "revision", "panne"],
  carrosserie: ["peinture voiture", "peinture auto", "debosselage", "rayure", "tole", "carrossier"],
  "controle technique": ["ct", "controle", "technique"],
  location: ["louer", "location voiture", "location vehicule", "rent"],
  "vtc taxi": ["location chauffeur", "vtc", "taxi", "chauffeur"],
  "carte grise": ["papier voiture", "papiers", "immatriculation", "certificat"],
  estimation: ["estimer", "estimation", "prix voiture", "valeur vehicule", "combien vaut"],
  depannage: ["depanneur", "depannage", "remorquage", "panne autoroute", "panne route", "sos"],
  pieces: ["piece auto", "piece detachee", "batterie", "frein", "pneu", "filtre", "amortisseur"],
  vendre: ["vendre ma voiture", "vente", "deposer annonce", "publier annonce"],
  acheter: ["achat", "acheter voiture", "occasion", "vehicule"],
  electrique: ["borne", "borne electrique", "electric", "recharge", "ev"],
  aide: ["comment", "faq", "question", "aide", "support", "contact", "probleme"],
  comptable: ["comptable", "comptabilite", "facture", "tva"],
  livraison: ["livraison", "transport", "convoyage"],
  finance: ["financement", "credit", "pret", "finance", "leasing", "loa"],
  encheres: ["enchere", "encheres", "lot", "vente aux encheres"],
  abonnement: ["abonnement", "offre", "plan", "premium", "boost"],
};

// ── Categories de resultats ─────────────────────────────────────────
type ResultCategory = "vehicule" | "location" | "garage" | "carrosserie" | "pieces" | "depannage" | "services" | "aide";

interface SearchResult {
  id: string;
  titre: string;
  description: string;
  category: ResultCategory;
  to: string;
  icon: typeof Car;
  prix?: string;
  ville?: string;
  distance?: string;
  badge?: string;
  badgeColor?: string;
  note?: number;
  phone?: string;
  photo?: string;
  priority: number; // 1=exact, 2=geo, 3=officiel, 4=pro verifie, 5=premium, 6=classique, 7=aide
}

// ── Pages statiques indexables ──────────────────────────────────────
const STATIC_PAGES: SearchResult[] = [
  // Services
  { id: "s-depot", titre: "Deposer une annonce", description: "Publier votre vehicule a la vente sur MKA.P-MS", category: "services", to: "/acheter/depot-annonce", icon: Car, priority: 3 },
  { id: "s-estim", titre: "Estimer mon vehicule", description: "Estimation gratuite de la valeur de votre vehicule", category: "services", to: "/estimation", icon: Star, priority: 3 },
  { id: "s-cg", titre: "Carte grise", description: "Faire votre carte grise en ligne — demarches simplifiees", category: "services", to: "/carte-grise", icon: FileText, priority: 3 },
  { id: "s-devis", titre: "Demander un devis garage", description: "Devis gratuit pour reparation, entretien, revision", category: "garage", to: "/devis", icon: Wrench, priority: 3 },
  { id: "s-depannage", titre: "Depannage & Remorquage", description: "Assistance 24h/24 — depannage route et autoroute", category: "depannage", to: "/depannage", icon: Truck, priority: 3 },
  { id: "s-livraison", titre: "Livraison vehicule", description: "Transport et livraison de votre vehicule partout en France", category: "services", to: "/livraison", icon: Truck, priority: 3 },
  { id: "s-finance", titre: "Finance+ — Financement auto", description: "Credit auto, leasing, LOA — simulation gratuite", category: "services", to: "/finance", icon: Building2, priority: 3 },
  { id: "s-assurance", titre: "Assurance auto", description: "Comparez les assurances auto — devis instantane", category: "services", to: "/assurance", icon: Shield, priority: 3 },
  { id: "s-historique", titre: "Historique vehicule", description: "Rapport complet : sinistres, entretien, km verifie", category: "services", to: "/historique", icon: Clock, priority: 3 },
  // Univers Acheter
  { id: "u-officiel", titre: "Vehicules MKA.P-MS Officiels", description: "Stock officiel MKA.P-MS — controle 200 points, garantie, Finance+", category: "vehicule", to: "/acheter/mkapms-officiel", icon: Shield, badge: "OFFICIEL", badgeColor: "bg-[#D4AF37]", priority: 3 },
  { id: "u-pro", titre: "Vehicules Professionnels", description: "Annonces de professionnels de l'automobile verifies", category: "vehicule", to: "/acheter/professionnel", icon: Building2, badge: "PRO", badgeColor: "bg-blue-600", priority: 4 },
  { id: "u-part", titre: "Vehicules Particuliers", description: "Annonces de particuliers — vente directe", category: "vehicule", to: "/acheter/particulier", icon: Users, badge: "PARTICULIER", badgeColor: "bg-green-600", priority: 6 },
  { id: "u-encheres", titre: "Encheres Pro", description: "Ventes aux encheres professionnelles — lots de vehicules", category: "vehicule", to: "/acheter/encheres", icon: Gavel, priority: 4 },
  { id: "u-moto", titre: "Motos & Scooters", description: "Motos, scooters et quads d'occasion", category: "vehicule", to: "/acheter/moto-occasion", icon: Car, priority: 6 },
  // Univers Location
  { id: "l-voiture", titre: "Location voiture", description: "Louez une voiture — particulier, pro, courte ou longue duree", category: "location", to: "/louer", icon: Key, priority: 3 },
  { id: "l-vtc", titre: "Location VTC & Taxi", description: "Vehicules de transport avec chauffeur", category: "location", to: "/louer/vtc-taxi", icon: Key, priority: 4 },
  { id: "l-utilitaire", titre: "Location utilitaire", description: "Fourgons, camions, utilitaires — pro et particulier", category: "location", to: "/louer/utilitaire", icon: Truck, priority: 5 },
  // Univers Garage
  { id: "g-garage", titre: "Trouver un garage", description: "Garages verifies pres de chez vous — devis gratuit", category: "garage", to: "/garages", icon: Wrench, priority: 3 },
  { id: "g-carrosserie", titre: "Carrosserie", description: "Carrossiers : peinture, debosselage, reparation tole", category: "carrosserie", to: "/carrosserie", icon: Paintbrush, priority: 3 },
  { id: "g-pieces", titre: "Pieces detachees", description: "Pieces auto neuves et d'occasion — livraison rapide", category: "pieces", to: "/pieces", icon: Settings, priority: 3 },
  { id: "g-ct", titre: "Controle technique", description: "Centres de controle technique pres de chez vous", category: "garage", to: "/garages", icon: Shield, priority: 3 },
  // Electric+
  { id: "e-electric", titre: "Electric+ — Bornes de recharge", description: "Trouvez les bornes de recharge electrique proches", category: "services", to: "/electric", icon: Zap, priority: 5 },
  // Aide / FAQ
  { id: "a-aide", titre: "Centre d'aide", description: "Questions frequentes, guides, tutoriels", category: "aide", to: "/aide", icon: HelpCircle, priority: 7 },
  { id: "a-vendre", titre: "Comment vendre ma voiture ?", description: "Guide complet pour vendre votre vehicule sur MKA.P-MS", category: "aide", to: "/aide", icon: HelpCircle, priority: 7 },
  { id: "a-acheter", titre: "Comment acheter un vehicule ?", description: "Guide d'achat — inspection, paiement, livraison", category: "aide", to: "/aide", icon: HelpCircle, priority: 7 },
  { id: "a-abonnement", titre: "Abonnements MKA.P-MS", description: "Decouvrez nos offres : Boost, Premium, Pro, Franchise", category: "aide", to: "/abonnements", icon: Star, priority: 7 },
  { id: "a-support", titre: "Contacter le support MKA.P-MS", description: "Service client — assistance par messagerie", category: "aide", to: "/messagerie", icon: MessageSquare, priority: 7 },
  { id: "a-confiance", titre: "Charte de confiance MKA.P-MS", description: "Securite, verification, garanties de la plateforme", category: "aide", to: "/confiance", icon: Shield, priority: 7 },
];

// ── Onglets ──────────────────────────────────────────────────────────
const TABS: { id: ResultCategory | "tout"; label: string; icon: typeof Car; to?: string }[] = [
  { id: "tout", label: "Tout", icon: Search },
  { id: "vehicule", label: "Vehicules", icon: Car, to: "/acheter" },
  { id: "location", label: "Location", icon: Key, to: "/louer" },
  { id: "garage", label: "Garage", icon: Wrench, to: "/garages" },
  { id: "carrosserie", label: "Carrosserie", icon: Paintbrush, to: "/carrosserie" },
  { id: "pieces", label: "Pieces", icon: Settings, to: "/pieces" },
  { id: "depannage", label: "Depannage", icon: Truck, to: "/depannage" },
  { id: "services", label: "Services", icon: Building2, to: "/services" },
  { id: "aide", label: "Aide", icon: HelpCircle, to: "/aide" },
];

// ── Suggestions populaires ───────────────────────────────────────────
const SUGGESTIONS = [
  "Peugeot 308", "BMW Serie 3", "garage mecanique", "location voiture",
  "estimer mon vehicule", "carte grise", "pieces frein", "controle technique",
  "depannage", "VTC taxi", "Mercedes occasion", "Renault Clio",
];

// ── Detect "pres de moi" intent ──────────────────────────────────────
function hasGeoIntent(q: string): boolean {
  const lower = q.toLowerCase();
  return ["pres de moi", "autour de moi", "proche", "le plus proche", "a proximite", "nearby"].some(k => lower.includes(k));
}

// ── Search logic ────────────────────────────────────────────────────
function searchAll(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const words = lower.split(/\s+/).filter(w => w.length > 1);

  // Expand synonymes
  const expanded = new Set(words);
  for (const [canonical, syns] of Object.entries(SYNONYMES)) {
    for (const w of words) {
      if (syns.some(s => s.includes(w) || w.includes(s)) || canonical.includes(w)) {
        canonical.split(" ").forEach(c => expanded.add(c));
      }
    }
  }
  const allWords = Array.from(expanded);

  // Score each static page
  const scored = STATIC_PAGES.map(page => {
    const pageText = `${page.titre} ${page.description} ${page.badge || ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let score = 0;
    for (const w of allWords) {
      if (pageText.includes(w)) score += 10;
    }
    // Exact title match bonus
    if (pageText.startsWith(lower)) score += 50;
    // Priority bonus (lower priority number = better)
    score += (8 - page.priority) * 2;
    return { ...page, score };
  })
  .filter(p => p.score > 0)
  .sort((a, b) => b.score - a.score);

  return scored;
}

// ── Composant principal ─────────────────────────────────────────────
export default function RechercheUniverselle() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialQ = params.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [tab, setTab] = useState<ResultCategory | "tout">("tout");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchAll(query), [query]);
  const geoIntent = hasGeoIntent(query);

  const filtered = tab === "tout" ? results : results.filter(r => r.category === tab);

  // Group by category for "tout" tab
  const grouped = useMemo(() => {
    if (tab !== "tout") return null;
    const groups: Record<string, SearchResult[]> = {};
    for (const r of results.slice(0, 30)) {
      if (!groups[r.category]) groups[r.category] = [];
      if (groups[r.category].length < 5) groups[r.category].push(r);
    }
    return groups;
  }, [results, tab]);

  // Category config
  const catConfig: Record<string, { label: string; color: string; icon: typeof Car }> = {
    vehicule: { label: "Vehicules", color: "text-blue-600", icon: Car },
    location: { label: "Location", color: "text-[#D4AF37]", icon: Key },
    garage: { label: "Garage", color: "text-green-600", icon: Wrench },
    carrosserie: { label: "Carrosserie", color: "text-purple-600", icon: Paintbrush },
    pieces: { label: "Pieces", color: "text-orange-600", icon: Settings },
    depannage: { label: "Depannage", color: "text-red-600", icon: Truck },
    services: { label: "Services", color: "text-[#D4AF37]", icon: Building2 },
    aide: { label: "Aide & FAQ", color: "text-slate-600", icon: HelpCircle },
  };

  // Assistant MKA.P-MS — guidage par intention
  function handleAssistantSend() {
    if (!assistantInput.trim()) return;
    const userMsg = assistantInput.trim();
    setAssistantMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setAssistantInput("");

    const lower = userMsg.toLowerCase();
    let response = "";

    if (lower.includes("vendre") || lower.includes("deposer")) {
      response = "Tres bien. Voulez-vous d'abord estimer votre vehicule ou deposer directement une annonce ? Vous pouvez aller sur « Estimer mon vehicule » ou « Deposer une annonce ».";
    } else if (lower.includes("acheter") || lower.includes("cherche")) {
      response = "Je vous aide a trouver le vehicule ideal. Utilisez la barre de recherche ci-dessus ou explorez nos univers : Officiel MKA.P-MS, Professionnel, ou Particulier.";
    } else if (lower.includes("louer") || lower.includes("location")) {
      response = "Pour la location, nous proposons : voitures particuliers, utilitaires, VTC & Taxi. Quel type de vehicule recherchez-vous ?";
    } else if (lower.includes("reparer") || lower.includes("garage") || lower.includes("mecani")) {
      response = "Je peux vous aider a trouver un garage. Allez sur « Trouver un garage » pour voir les garages verifies pres de chez vous, ou demandez un devis gratuit.";
    } else if (lower.includes("carte grise") || lower.includes("papier")) {
      response = "Pour votre carte grise, rendez-vous sur notre service « Carte grise » — demarches simplifiees et suivi en ligne.";
    } else if (lower.includes("depann") || lower.includes("panne") || lower.includes("sos")) {
      response = "En cas de panne, notre service « Depannage & Remorquage » est disponible 24h/24. Je vous redirige.";
    } else if (lower.includes("contact") || lower.includes("support") || lower.includes("aide")) {
      response = "Notre equipe est disponible via la messagerie MKA.P-MS. Vous pouvez aussi consulter notre centre d'aide pour les questions frequentes.";
    } else if (lower.includes("prix") || lower.includes("estim") || lower.includes("combien")) {
      response = "Pour connaitre la valeur de votre vehicule, utilisez notre outil « Estimation gratuite ». Il vous donnera une fourchette de prix basee sur le marche.";
    } else if (lower.includes("piece") || lower.includes("frein") || lower.includes("pneu") || lower.includes("batterie")) {
      response = "Recherchez vos pieces detachees dans notre catalogue. Nous proposons des pieces neuves et d'occasion avec livraison rapide.";
    } else {
      response = "Je suis l'Assistant MKA.P-MS. Je peux vous guider pour : acheter, vendre, louer, reparer, trouver des pieces, faire une carte grise, ou contacter le support. Que souhaitez-vous faire ?";
    }

    setTimeout(() => {
      setAssistantMessages(prev => [...prev, { role: "assistant", text: response }]);
    }, 500);
  }

  useEffect(() => {
    if (initialQ) inputRef.current?.focus();
  }, [initialQ]);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* ── Header avec barre de recherche ── */}
      <div className="bg-[#111] px-4 pt-6 pb-4">
        <h1 className="text-lg font-black text-white flex items-center gap-2">
          <Search size={18} className="text-[#D4AF37]" /> Recherche MKA.P-MS
        </h1>
        <p className="text-[10px] text-white/50 mt-0.5">Cherchez dans toute la plateforme</p>

        {/* Barre de recherche */}
        <div className="mt-3 relative">
          <div className="flex items-center bg-white rounded-xl overflow-hidden border-2 border-[#D4AF37]/50 focus-within:border-[#D4AF37]">
            <Search size={16} className="ml-3 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(e.target.value.length === 0); }}
              onFocus={() => { if (!query) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Vehicule, garage, piece, service, aide..."
              className="flex-1 px-3 py-3 text-sm text-[#111] placeholder-slate-400 outline-none bg-transparent"
            />
            {query && (
              <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="mr-2 p-1 rounded-full hover:bg-slate-100">
                <X size={14} className="text-slate-400" />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && !query && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl bg-white border border-slate-200 shadow-lg p-3 max-h-60 overflow-y-auto">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Recherches populaires</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => { setQuery(s); setShowSuggestions(false); }} className="rounded-full bg-[#F5F3EF] px-3 py-1.5 text-xs text-[#111] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Geo intent indicator */}
        {geoIntent && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#D4AF37]">
            <Navigation size={12} /> Geolocalisation activee — resultats proches de vous
          </div>
        )}
      </div>

      {/* ── Onglets ── */}
      <div className="px-4 mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count = t.id === "tout" ? results.length : results.filter(r => r.category === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.to && !query) {
                  navigate(t.to);
                } else {
                  setTab(t.id);
                }
              }}
              className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"
              }`}
            >
              <Icon size={11} /> {t.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* ── Resultats ── */}
      <div className="px-4 mt-4">
        {query && results.length === 0 && (
          <div className="rounded-xl bg-white border border-slate-200 p-6 text-center">
            <AlertCircle size={32} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-600">Aucun resultat pour "{query}"</p>
            <p className="mt-1 text-xs text-slate-400">Essayez d'autres mots-cles ou demandez a l'Assistant MKA.P-MS</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button onClick={() => setShowAssistant(true)} className="rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white hover:bg-[#c9a430] transition flex items-center gap-1">
                <Sparkles size={12} /> Demander a l'Assistant
              </button>
              <button onClick={() => setQuery("")} className="rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                Modifier la recherche
              </button>
            </div>
          </div>
        )}

        {/* Grouped results for "tout" */}
        {query && tab === "tout" && grouped && Object.entries(grouped).map(([cat, items]) => {
          const cfg = catConfig[cat];
          if (!cfg || items.length === 0) return null;
          const Icon = cfg.icon;
          return (
            <div key={cat} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xs font-bold flex items-center gap-1.5 ${cfg.color}`}>
                  <Icon size={13} /> {cfg.label}
                </h3>
                <button onClick={() => setTab(cat as ResultCategory)} className="text-[10px] text-[#D4AF37] font-semibold flex items-center gap-0.5">
                  Voir tout <ArrowRight size={10} />
                </button>
              </div>
              <div className="space-y-1.5">
                {items.map((r) => (
                  <ResultCard key={r.id} result={r} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Filtered results for specific tab */}
        {query && tab !== "tout" && (
          <div className="space-y-1.5">
            {filtered.map((r) => (
              <ResultCard key={r.id} result={r} />
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-6">Aucun resultat dans cette categorie</p>
            )}
          </div>
        )}

        {/* No query — show exploration */}
        {!query && (
          <div className="space-y-4">
            {/* Quick access */}
            <div>
              <h3 className="text-xs font-bold text-[#111] mb-2">Acces rapide</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Acheter", icon: Car, to: "/acheter", color: "bg-blue-50 text-blue-600 border-blue-200" },
                  { label: "Louer", icon: Key, to: "/louer", color: "bg-amber-50 text-[#D4AF37] border-amber-200" },
                  { label: "Garage", icon: Wrench, to: "/garages", color: "bg-green-50 text-green-600 border-green-200" },
                  { label: "Vendre", icon: Car, to: "/acheter/depot-annonce", color: "bg-red-50 text-red-600 border-red-200" },
                  { label: "Estimation", icon: Star, to: "/estimation", color: "bg-purple-50 text-purple-600 border-purple-200" },
                  { label: "Encheres", icon: Gavel, to: "/acheter/encheres", color: "bg-slate-50 text-[#111] border-slate-200" },
                  { label: "Pieces", icon: Settings, to: "/pieces", color: "bg-orange-50 text-orange-600 border-orange-200" },
                  { label: "Depannage", icon: Truck, to: "/depannage", color: "bg-red-50 text-red-500 border-red-200" },
                  { label: "Aide", icon: HelpCircle, to: "/aide", color: "bg-slate-50 text-slate-600 border-slate-200" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.label} to={item.to} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition hover:shadow-md ${item.color}`}>
                      <Icon size={20} />
                      <span className="text-[10px] font-bold">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Assistant shortcut */}
            <button
              onClick={() => setShowAssistant(true)}
              className="w-full flex items-center gap-3 rounded-xl bg-white border border-[#D4AF37]/30 p-4 hover:shadow-md transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/10">
                <Sparkles size={18} className="text-[#D4AF37]" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-bold text-[#111]">Assistant MKA.P-MS</p>
                <p className="text-[10px] text-slate-500">Dites-moi ce que vous cherchez, je vous guide</p>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* ── Assistant MKA.P-MS (modal) ── */}
      {showAssistant && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAssistant(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111]">Assistant MKA.P-MS</h3>
                  <p className="text-[9px] text-slate-400">Je vous guide sur la plateforme</p>
                </div>
              </div>
              <button onClick={() => setShowAssistant(false)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {assistantMessages.length === 0 && (
                <div className="text-center py-6">
                  <Sparkles size={28} className="mx-auto text-[#D4AF37]/40" />
                  <p className="mt-2 text-sm text-slate-500">Bonjour ! Comment puis-je vous aider ?</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {["Je veux vendre ma voiture", "Trouver un garage", "Louer un vehicule", "Faire ma carte grise"].map((s) => (
                      <button key={s} onClick={() => { setAssistantInput(s); }} className="rounded-full bg-[#F5F3EF] px-3 py-1.5 text-[10px] text-[#111] hover:bg-[#D4AF37]/10 transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {assistantMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    m.role === "user"
                      ? "bg-[#D4AF37] text-white rounded-br-md"
                      : "bg-[#F5F3EF] text-[#111] rounded-bl-md"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAssistantSend(); }}
                  placeholder="Ecrivez votre question..."
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]"
                />
                <button onClick={handleAssistantSend} className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#c9a430] transition">
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ResultCard component ────────────────────────────────────────────
function ResultCard({ result }: { result: SearchResult }) {
  const Icon = result.icon;
  return (
    <Link
      to={result.to}
      className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 p-3 hover:border-[#D4AF37]/40 hover:shadow-md transition group"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-[#D4AF37]/10 transition">
        <Icon size={18} className="text-slate-500 group-hover:text-[#D4AF37] transition" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs font-bold text-[#111] truncate">{result.titre}</h4>
          {result.badge && (
            <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[7px] font-extrabold text-white ${result.badgeColor || "bg-slate-500"}`}>
              {result.badge}
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 truncate mt-0.5">{result.description}</p>
        {(result.ville || result.distance || result.prix) && (
          <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400">
            {result.ville && <span className="flex items-center gap-0.5"><MapPin size={8} /> {result.ville}</span>}
            {result.distance && <span className="flex items-center gap-0.5"><Navigation size={8} /> {result.distance}</span>}
            {result.prix && <span className="font-bold text-[#D4AF37]">{result.prix}</span>}
          </div>
        )}
      </div>
      <ChevronRight size={14} className="text-slate-300 shrink-0 group-hover:text-[#D4AF37] transition" />
    </Link>
  );
}
