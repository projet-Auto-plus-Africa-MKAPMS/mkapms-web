import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Plus, FileText, Wrench, Car, KeyRound, Truck, Star,
  ArrowRight, ShieldCheck, Users, Gauge, Heart, ChevronRight, ChevronDown,
  CheckCircle, Clock, Package, Phone, Mail, MapPin, Globe,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import VehicleCard from "../components/VehicleCard";

/* ── catégories ── */
const CATEGORIES = [
  { label: "Citadines", count: "+2 350", to: "/acheter?categorie=citadine" },
  { label: "Berlines", count: "+4 152", to: "/acheter?categorie=berline" },
  { label: "SUV & 4x4", count: "+3 782", to: "/acheter?categorie=suv" },
  { label: "Utilitaires", count: "+1 256", to: "/acheter?categorie=utilitaire" },
  { label: "Coupés", count: "+1 842", to: "/acheter?categorie=coupe" },
  { label: "Motos", count: "+2 620", to: "/acheter?famille=moto" },
  { label: "Scooters", count: "+1 125", to: "/acheter?famille=moto&categorie=scooter" },
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

  /* newsletter */
  const [newsEmail, setNewsEmail] = useState("");

  function doSearch() {
    const p = new URLSearchParams();
    if (sMarque) p.set("q", sMarque + (sModele ? " " + sModele : ""));
    if (sPrix) p.set("prixMax", sPrix);
    if (sLoc) p.set("ville", sLoc);
    if (searchTab === "motos") p.set("famille", "moto");
    if (searchTab === "utilitaires") p.set("categorie", "utilitaire");
    navigate(`/acheter?${p.toString()}`);
  }

  return (
    <div className="overflow-x-hidden bg-white">

      {/* ═══════════════════════════════════════════════════════════
          1. HERO — FOND NOIR
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#111]">
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjEyLDE3NSw1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+')] opacity-40" />

        <div className="container-page relative grid gap-8 py-12 md:py-16 lg:grid-cols-[1fr_340px]">
          {/* Gauche */}
          <div>
            <h1 className="text-2xl font-black uppercase leading-tight text-white sm:text-3xl md:text-5xl">
              La plateforme auto<br />
              <span className="text-[#D4AF37]">qui simplifie tout</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/60">
              Achat, vente, location, entretien, livraison et bien plus encore. Tout l'univers automobile réuni au même endroit.
            </p>

            {/* 4 actions rapides */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-md">
              {[
                { icon: Plus, label: "Déposer une annonce", to: "/vendre" },
                { icon: Search, label: "Rechercher un véhicule", to: "/acheter" },
                { icon: FileText, label: "Obtenir un devis", to: "/devis" },
                { icon: Wrench, label: "Trouver un garage", to: "/garages" },
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/20 transition group-hover:bg-[#D4AF37]">
                      <Icon size={18} className="text-[#D4AF37] group-hover:text-white" />
                    </div>
                    <span className="text-[10px] font-medium leading-tight text-white/70 sm:text-xs">{a.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Note */}
            <div className="mt-6 flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-[#D4AF37] px-3 py-1">
                <Star size={14} className="text-white" fill="white" />
                <span className="text-sm font-bold text-white">4,8/5</span>
              </div>
              <span className="text-xs text-white/50">+50 000 utilisateurs nous font confiance</span>
            </div>
          </div>

          {/* Droite — Ouvrir un compte */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-white">Ouvrir un compte</h3>
            <div className="mt-4 space-y-3">
              <Link to="/connexion" className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-[#D4AF37]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20">
                  <Car size={18} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="font-bold text-white">Particulier</p>
                  <p className="mt-0.5 text-xs text-white/50">Achetez, vendez et profitez de tous nos services.</p>
                </div>
                <ChevronRight size={16} className="mt-1 shrink-0 text-white/30" />
              </Link>
              <Link to="/connexion" className="group flex items-start gap-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 transition hover:border-[#D4AF37]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]">
                  <Wrench size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-[#D4AF37]">Professionnel</p>
                  <p className="mt-0.5 text-xs text-white/50">Gérez votre activité et développez votre business avec MKA.</p>
                </div>
                <ChevronRight size={16} className="mt-1 shrink-0 text-[#D4AF37]/50" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. RECHERCHE + ESTIMATION — CÔTE À CÔTE
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8F9FA] py-10">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          {/* Recherche */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#111]">Rechercher un véhicule</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["toutes", "voitures", "motos", "utilitaires"] as const).map((t) => (
                <button key={t} onClick={() => setSearchTab(t)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${searchTab === t ? "bg-[#111] text-white" : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"}`}
                >{t}</button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Marque</label>
                <select className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" value={sMarque} onChange={(e) => setSMarque(e.target.value)}>
                  <option value="">Toutes les marques</option>
                  {["Peugeot","Renault","Citroën","BMW","Mercedes","Audi","Volkswagen","Toyota","Ford","Opel","Fiat","Hyundai","Kia","Nissan","Dacia"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Modèle</label>
                <select className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" value={sModele} onChange={(e) => setSModele(e.target.value)}>
                  <option value="">Tous les modèles</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Localisation</label>
                <select className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" value={sLoc} onChange={(e) => setSLoc(e.target.value)}>
                  <option value="">Toute la France</option>
                  <option value="Paris">Paris</option>
                  <option value="Lyon">Lyon</option>
                  <option value="Marseille">Marseille</option>
                  <option value="Toulouse">Toulouse</option>
                  <option value="Bordeaux">Bordeaux</option>
                  <option value="Nice">Nice</option>
                  <option value="Lille">Lille</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Prix maximum</label>
                <select className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" value={sPrix} onChange={(e) => setSPrix(e.target.value)}>
                  <option value="">Prix maximum</option>
                  <option value="5000">5 000 €</option>
                  <option value="10000">10 000 €</option>
                  <option value="15000">15 000 €</option>
                  <option value="20000">20 000 €</option>
                  <option value="30000">30 000 €</option>
                  <option value="50000">50 000 €</option>
                </select>
              </div>
              <button onClick={doSearch} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]">
                Rechercher <Search size={16} />
              </button>
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

            {/* Km + Boîte */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Kilométrage</label>
                <input type="number" className="input text-sm border-[#D4AF37]" placeholder="85000" value={estimKm} onChange={(e) => setEstimKm(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#D4AF37]">Boîte</label>
                <select className="input text-sm" value={estimBoite} onChange={(e) => setEstimBoite(e.target.value)}>
                  <option value="manuelle">Manuelle</option>
                  <option value="automatique">Automatique</option>
                </select>
              </div>
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

            {/* Résultat */}
            {estimResult && (
              <div className="mt-4 rounded-xl border-2 border-[#D4AF37] bg-[#FFFBEB] p-4 text-center">
                <p className="text-xs text-[#92400E]">Estimation de votre véhicule</p>
                <p className="mt-1 text-2xl font-extrabold text-[#D4AF37]">
                  {estimResult.low.toLocaleString()} € – {estimResult.high.toLocaleString()} €
                </p>
                <p className="mt-1 text-sm text-[#111]">Prix conseillé : <strong>{estimResult.mid.toLocaleString()} €</strong></p>
                <p className="mt-1 text-xs text-[#9CA3AF]">Estimation basée sur la cote du marché français</p>
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
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
            {CATEGORIES.map((c) => (
              <Link key={c.label} to={c.to} className="group flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] transition group-hover:bg-[#D4AF37]/10">
                  <Car size={22} className="text-[#6B7280] group-hover:text-[#D4AF37]" />
                </div>
                <span className="text-xs font-bold text-[#111]">{c.label}</span>
                <span className="text-[10px] text-[#9CA3AF]">{c.count} annonces</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. HISTORIQUE VÉHICULE — FOND SOMBRE
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#1A1A2E] py-10">
        <div className="container-page relative">
          <div className="lg:max-w-lg">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-[#D4AF37]" />
              <h2 className="text-xl font-bold text-white">Vérifier l'historique d'un véhicule</h2>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Évitez les mauvaises surprises, vérifiez l'historique complet d'un véhicule avant d'acheter.
            </p>

            {/* Barre plaque */}
            <div className="mt-5 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-[10px] font-bold text-white">F</span>
                <input
                  className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder-white/40 outline-none"
                  placeholder="Entrez le n° de plaque (ex: AB-123-CD)"
                  value={histPlaque}
                  onChange={(e) => setHistPlaque(e.target.value.toUpperCase())}
                />
              </div>
              <button onClick={() => setHistResult(true)} className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#C5A028]">
                Vérifier
              </button>
            </div>

            {/* Tags infos */}
            <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-4">
              {["Accidents", "Vol", "Kilométrage", "Gage", "Entretien", "Importation", "Propriétaires", "Et plus encore…"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle size={14} className="shrink-0 text-green-400" />
                  <span className="text-xs text-white/70">{t}</span>
                </div>
              ))}
            </div>

            {histResult && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-white/10 p-3 text-center"><p className="text-xs text-white/40">Propriétaires</p><p className="text-xl font-bold text-white">2</p></div>
                <div className="rounded-lg bg-white/10 p-3 text-center"><p className="text-xs text-white/40">Accidents</p><p className="text-xl font-bold text-green-400">0</p></div>
                <div className="rounded-lg bg-white/10 p-3 text-center"><p className="text-xs text-white/40">Dernier CT</p><p className="text-xl font-bold text-white">03/25</p></div>
                <div className="rounded-lg bg-white/10 p-3 text-center"><p className="text-xs text-white/40">Km vérifié</p><p className="text-xl font-bold text-white">45 200</p></div>
              </div>
            )}
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { title: "Achat / Vente", desc: "Trouvez ou vendez votre véhicule facilement.", cta: "Voir les annonces", to: "/acheter", color: "from-blue-600 to-blue-800" },
              { title: "Location", desc: "Voitures, utilitaires, motos… Louez en toute confiance.", cta: "Voir les offres", to: "/louer", color: "from-emerald-600 to-emerald-800" },
              { title: "VO Interne", desc: "Gestion complète des véhicules d'occasion : achat, réparation, revente.", cta: "Accéder au VO", to: "/vo", color: "from-violet-600 to-violet-800" },
              { title: "Devis", desc: "Recevez plusieurs devis et comparez facilement.", cta: "Demander un devis", to: "/devis", color: "from-orange-500 to-orange-700" },
              { title: "Livraison & Pièces", desc: "Faites livrer vos pièces ou vos véhicules rapidement.", cta: "Découvrir", to: "/pieces", color: "from-[#D4AF37] to-[#B8960E]" },
            ].map((s) => (
              <Link key={s.to} to={s.to} className="group overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition hover:shadow-lg">
                <div className={`h-36 bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Car size={48} className="text-white/30" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[#111]">{s.title}</h3>
                  <p className="mt-1 text-xs text-[#6B7280]">{s.desc}</p>
                  <span className="mt-3 inline-block rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white">{s.cta}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. ANNONCES PREMIUM + ESPACE PUB
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8F9FA] py-10">
        <div className="container-page">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-[#111]">
                  <Star size={18} className="text-[#D4AF37]" fill="#D4AF37" /> Annonces mises en avant <span className="text-[#D4AF37]">(Premium)</span>
                </h2>
                <Link to="/acheter" className="text-sm font-semibold text-[#6B7280] hover:text-[#D4AF37]">Voir toutes</Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                {featured.isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#E5E7EB]" />)
                  : featured.data?.items.slice(0, 4).map((v) => <VehicleCard key={v.id} v={v as any} />)}
              </div>
            </div>

            {/* Espace publicitaire */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-sm">
              <h3 className="text-lg font-bold text-[#111]">Espace publicitaire</h3>
              <p className="mt-2 text-sm text-[#6B7280]">Boostez votre visibilité avec nos offres publicitaires</p>
              <div className="mt-4 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5">
                <Package size={48} className="text-[#D4AF37]/40" />
              </div>
              <Link to="/abonnements" className="mt-4 inline-block rounded-lg border-2 border-red-500 px-6 py-2 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white">
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7. ANNONCES CLASSIQUES
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8F9FA] pb-10">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#111]">
              <Star size={18} className="text-[#6B7280]" /> Toutes les annonces <span className="text-[#6B7280]">(Classiques)</span>
            </h2>
            <Link to="/acheter" className="text-sm font-semibold text-[#6B7280] hover:text-[#D4AF37]">Voir toutes</Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {featured.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#E5E7EB]" />)
              : featured.data?.items.slice(0, 4).map((v) => <VehicleCard key={v.id} v={v as any} />)}
            {featured.data && featured.data.items.length === 0 && (
              <p className="col-span-full text-sm text-[#6B7280]">Aucune annonce.{" "}
                <Link to="/vendre" className="font-semibold text-[#D4AF37]">Déposer une annonce</Link>.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          8. POURQUOI CHOISIR MKA.P-MS
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10">
        <div className="container-page">
          <h2 className="text-center text-xl font-bold text-[#111]">Pourquoi choisir MKA-P-MS ?</h2>
          <div className="mx-auto mt-6 grid max-w-2xl gap-4">
            {[
              { icon: ShieldCheck, title: "Sécurisé", desc: "Vos transactions sont protégées à 100%." },
              { icon: Users, title: "Fiable", desc: "Des milliers d'utilisateurs nous font confiance." },
              { icon: Gauge, title: "Rapide", desc: "Trouvez ce que vous cherchez en quelques clics." },
              { icon: CheckCircle, title: "Complet", desc: "Tous les services auto réunis au même endroit." },
              { icon: Heart, title: "Accompagnement", desc: "Une équipe à votre écoute à chaque étape." },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.title} className="flex items-start gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 transition hover:shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                    <Icon size={20} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111]">{r.title}</h3>
                    <p className="mt-0.5 text-sm text-[#6B7280]">{r.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
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
          10. PARTENAIRES
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10">
        <div className="container-page">
          <h2 className="text-center text-xl font-bold text-[#111]">Nos professionnels partenaires</h2>
          <Link to="/garages" className="mt-1 block text-center text-sm text-[#6B7280] hover:text-[#D4AF37]">Voir tous nos partenaires →</Link>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PARTENAIRES.map((p) => (
              <Link key={p.title} to={p.to} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 transition hover:shadow-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#F3F4F6]">
                  <Wrench size={28} className="text-[#D4AF37]" />
                </div>
                <h3 className="mt-3 font-bold text-[#111]">{p.title}</h3>
                <p className="mt-1 text-xs text-[#6B7280]">{p.desc}</p>
                <span className="mt-3 inline-block rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white">{p.cta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          11. ESPACE PRO — BANDE NOIRE
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#111] py-10">
        <div className="container-page">
          <div className="flex flex-col items-center gap-4 text-center lg:flex-row lg:justify-between lg:text-left">
            <div>
              <h2 className="text-xl font-bold text-white">Espace Pro : développez votre activité</h2>
              <p className="mt-1 text-sm text-white/50">Accédez à tous nos outils et services dédiés aux professionnels.</p>
            </div>
            <Link to="/espace-pro" className="shrink-0 rounded-xl border-2 border-[#D4AF37] px-6 py-3 text-sm font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
              Découvrir l'espace Pro
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {PRO_ACTIVITIES.map((a) => (
              <Link key={a.label} to={a.to} className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center transition hover:border-[#D4AF37]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition group-hover:bg-[#D4AF37]/20">
                  <Wrench size={18} className="text-[#D4AF37]" />
                </div>
                <span className="text-[10px] font-medium text-white/60 sm:text-xs">{a.label}</span>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-white/40">Gérez votre activité, vos véhicules, vos équipes et vos documents.</p>
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
  "Deux sessions d'annonces (Premium & Classiques)",
  "Espace Pro complet et visible",
  "Historique véhicule mis en avant",
  "Catégories + services + partenaires",
  "Publicité intégrée",
  "Statistiques & preuves sociales",
  "Parcours utilisateur fluide et logique",
  "Paiement sécurisé",
  "Support réactif 7/7",
  "Mises à jour régulières",
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
              {["f", "i", "Y", "t"].map((s, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37]">{s}</a>
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
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1.5 lg:grid-cols-5">
              {AJOUTS.map((a) => (
                <div key={a} className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle size={12} className="shrink-0 text-orange-500" />{a}
                </div>
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

        {/* Sections en accordéon */}
        <div className="container-page">
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
              <div className="flex items-start gap-2"><Globe size={12} className="mt-0.5 shrink-0 text-slate-400" /> 14 Rue du petit Viarmes, 95270 Belloy-en-France, France</div>
            </div>
          </FooterAccordion>
        </div>

        {/* Newsletter & Réseaux */}
        <div className="container-page border-t border-slate-200 py-6">
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-[#D4AF37]" />
            <h4 className="text-sm font-bold text-[#111]">Newsletter & Réseaux</h4>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
              placeholder="Votre adresse email"
              type="email"
              value={newsEmail}
              onChange={(e) => setNewsEmail(e.target.value)}
            />
            <button className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-bold text-white hover:bg-[#C5A028]">S'abonner</button>
          </div>
          <div className="mt-3 flex gap-3">
            {["f", "i", "Y", "t"].map((s, i) => (
              <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-[#D4AF37] hover:text-white">{s}</a>
            ))}
          </div>
        </div>

        {/* Autres Ajouts */}
        <div className="container-page border-t border-slate-200 py-6">
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#111]">
            <Star size={14} className="text-[#D4AF37]" /> Autres Ajouts Intégrés
          </h4>
          <div className="mt-3 space-y-1.5">
            {AJOUTS.map((a) => (
              <div key={a} className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle size={12} className="shrink-0 text-orange-500" />{a}
              </div>
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
