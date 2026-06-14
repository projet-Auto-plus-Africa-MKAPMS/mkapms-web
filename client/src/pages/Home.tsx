import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Plus, PlusCircle, FileText, Wrench, Car, KeyRound, Truck, Star,
  ArrowRight, ShieldCheck, Users, User, Gauge, Heart, ChevronRight, ChevronDown,
  CheckCircle, Check, Clock, Package, Phone, Mail, MapPin, Globe, Headphones, Tag,
  AlertTriangle,
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
  const [openBadge, setOpenBadge] = useState<string | null>(null);

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
          1. HERO — FOND CLAIR + VOITURE COUVERTE
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#F5F3EF]">
        <div className="container-page relative py-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">La marketplace automobile</p>
          <h1 className="mt-3 text-2xl font-black uppercase leading-tight text-[#111] sm:text-3xl md:text-4xl">
            La référence<br />
            <span className="text-[#D4AF37]">de confiance</span><br />
            pour tous vos projets auto
          </h1>
          <div className="mx-auto my-4 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-[#D4AF37]" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D4AF37]">
              <span className="text-xs font-bold text-[#D4AF37]">M</span>
            </div>
            <div className="h-px w-12 bg-[#D4AF37]" />
          </div>
          <p className="mx-auto max-w-md text-sm text-[#6B7280]">
            Achat, vente, location, entretien, livraison et bien plus encore.<br />
            Tout l'univers automobile réuni au même endroit.
          </p>
          <img
            src="https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80"
            alt="Voiture vitrine"
            className="mx-auto mt-6 h-48 w-auto object-contain sm:h-56 md:h-64"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          1b. 4 ACTIONS — VENDRE, ACHETER, LOUER, RÉPARER
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F5F3EF] pb-8">
        <div className="container-page">
          <div className="mx-auto grid max-w-lg grid-cols-4 gap-3">
            {[
              { icon: Tag, label: "VENDRE", sub: "Mon véhicule", to: "/vendre" },
              { icon: Search, label: "ACHETER", sub: "Un véhicule", to: "/acheter" },
              { icon: KeyRound, label: "LOUER", sub: "Un véhicule", to: "/louer" },
              { icon: Wrench, label: "RÉPARER", sub: "Mon véhicule", to: "/garages" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-1 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111] text-white transition group-hover:bg-[#D4AF37]">
                    <Icon size={22} />
                  </div>
                  <span className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-[#111]">{a.label}</span>
                  <span className="text-[9px] text-[#6B7280]">{a.sub}</span>
                  <div className="mx-auto mt-1 h-0.5 w-6 rounded bg-[#D4AF37]" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          1c. 4 BADGES CONFIANCE
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-8 border-t border-[#E5E7EB]">
        <div className="container-page">
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "FIABILITÉ\nGARANTIE", desc: "Transactions\n100% sécurisées", details: [
                "Paiement sécurisé via Stripe (3D Secure)",
                "Vérification d'identité obligatoire (KYC)",
                "Protection acheteur : remboursement si non conforme",
                "Protection vendeur : paiement garanti après livraison",
                "Transactions chiffrées SSL 256 bits",
                "Wallet sécurisé avec double authentification",
              ]},
              { icon: FileText, title: "TRANSPARENCE\nTOTALE", desc: "Historique vérifié\net certifié", details: [
                "Historique complet du véhicule vérifié",
                "Contrôle technique certifié",
                "Kilométrage réel garanti",
                "Rapport d'inspection détaillé",
                "Photos haute résolution obligatoires",
                "Aucun frais caché — tout est affiché",
              ]},
              { icon: Globe, title: "RÉSEAU\nMONDIAL", desc: "Livraison Europe\net Afrique", details: [
                "Livraison dans toute la France métropolitaine",
                "Export vers l'Afrique (Sénégal, Côte d'Ivoire, Mali…)",
                "Réseau de garages partenaires certifiés",
                "Partenaires logistiques professionnels",
                "Suivi de livraison en temps réel",
                "Assurance transport incluse",
              ]},
              { icon: Headphones, title: "ACCOMPAGNEMENT\nPREMIUM", desc: "Support disponible\n7j/7", details: [
                "Support client disponible 7j/7",
                "Assistance téléphonique et par chat",
                "Accompagnement personnalisé pour les pros",
                "Aide à la création d'annonces",
                "Conseils pour l'estimation de votre véhicule",
                "Équipe dédiée pour les professionnels",
              ]},
            ].map((b) => {
              const Icon = b.icon;
              const isOpen = openBadge === b.title;
              return (
                <div key={b.title} className="flex flex-col items-center gap-1 text-center">
                  <button
                    type="button"
                    onClick={() => setOpenBadge(isOpen ? null : b.title)}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2 transition ${isOpen ? "bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]" : "hover:bg-[#F8F9FA]"}`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                      <Icon size={20} className="text-[#D4AF37]" />
                    </div>
                    <h3 className="mt-1 whitespace-pre-line text-[9px] font-extrabold uppercase tracking-wide text-[#111]">{b.title}</h3>
                    <p className="whitespace-pre-line text-[9px] text-[#6B7280]">{b.desc}</p>
                  </button>
                  {isOpen && (
                    <div className="mt-2 w-full rounded-lg border border-[#D4AF37]/20 bg-[#FEFCE8] p-3 text-left">
                      <ul className="space-y-1.5">
                        {b.details.map((d) => (
                          <li key={d} className="flex items-start gap-1.5 text-[10px] text-[#111]">
                            <Check size={10} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. RECHERCHE + ESTIMATION — CÔTE À CÔTE
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          {/* Recherche — compact : tabs + filtres en grille + bouton */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-[#111]">Rechercher un véhicule</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["toutes", "voitures", "motos", "utilitaires"] as const).map((t) => (
                <button key={t} onClick={() => setSearchTab(t)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${searchTab === t ? "bg-[#111] text-white" : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"}`}
                >{t}</button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#D4AF37]" value={sMarque} onChange={(e) => setSMarque(e.target.value)}>
                <option value="">Marque</option>
                {["Peugeot","Renault","Citroën","BMW","Mercedes","Audi","Volkswagen","Toyota","Ford","Opel","Fiat","Hyundai","Kia","Nissan","Dacia"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#D4AF37]" value={sModele} onChange={(e) => setSModele(e.target.value)}>
                <option value="">Modèle</option>
              </select>
              <select className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#D4AF37]" value={sLoc} onChange={(e) => setSLoc(e.target.value)}>
                <option value="">Localisation</option>
                <option value="Paris">Paris</option>
                <option value="Lyon">Lyon</option>
                <option value="Marseille">Marseille</option>
                <option value="Toulouse">Toulouse</option>
                <option value="Bordeaux">Bordeaux</option>
                <option value="Nice">Nice</option>
                <option value="Lille">Lille</option>
              </select>
              <select className="rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#D4AF37]" value={sPrix} onChange={(e) => setSPrix(e.target.value)}>
                <option value="">Prix max</option>
                <option value="5000">5 000 €</option>
                <option value="10000">10 000 €</option>
                <option value="15000">15 000 €</option>
                <option value="20000">20 000 €</option>
                <option value="30000">30 000 €</option>
                <option value="50000">50 000 €</option>
              </select>
            </div>
            <button onClick={doSearch} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white hover:bg-[#C5A028]">
              Rechercher <Search size={16} />
            </button>
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
          2b. SE CONNECTER / CRÉER UN COMPTE
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
          3. CATÉGORIES POPULAIRES
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#111] sm:text-xl">Catégories populaires</h2>
            <Link to="/acheter" className="flex items-center gap-1 text-sm font-semibold text-[#D4AF37] hover:underline">Voir toutes <ArrowRight size={14} /></Link>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
            {CATEGORIES.slice(0, 6).map((c) => (
              <Link key={c.label} to={c.to} className="group flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] transition group-hover:bg-[#D4AF37]/10">
                  <Car size={22} className="text-[#6B7280] group-hover:text-[#D4AF37]" />
                </div>
                <span className="text-xs font-bold text-[#111]">{c.label}</span>
                <span className="text-[10px] text-[#9CA3AF]">{c.count} annonces</span>
              </Link>
            ))}
          </div>
          {CATEGORIES.length > 6 && (
            <div className="mt-3 flex justify-center">
              <Link to={CATEGORIES[6].to} className="group flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-4 text-center transition hover:border-[#D4AF37] hover:shadow-md w-[calc(33.333%-8px)] sm:w-[calc(25%-9px)] md:w-[calc(14.285%-10px)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] transition group-hover:bg-[#D4AF37]/10">
                  <Car size={22} className="text-[#6B7280] group-hover:text-[#D4AF37]" />
                </div>
                <span className="text-xs font-bold text-[#111]">{CATEGORIES[6].label}</span>
                <span className="text-[10px] text-[#9CA3AF]">{CATEGORIES[6].count} annonces</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. HISTORIQUE VÉHICULE
         ═══════════════════════════════════════════════════════════ */}
      {/* ═══ SECTION HISTORIQUE — Bloc premium noir/or au milieu de la page blanche ═══ */}
      <section className="bg-white">
        {/* Header section historique — fond blanc */}
        <div className="border-b border-[#F5F5F5]">
          <div className="container-page flex items-center justify-between py-3">
            <Link to="/historique" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111]">
                <span className="text-xs font-extrabold text-[#D4AF37]">M</span>
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-[#111]">MKA<span className="text-[#D4AF37]">.P</span>-MS</h3>
                <p className="text-[6px] font-semibold uppercase tracking-widest text-slate-400">La Marketplace Automobile</p>
              </div>
            </Link>
            <div className="hidden items-center gap-3 md:flex">
              <span className="flex items-center gap-1 rounded-full border border-[#F5F5F5] px-2.5 py-1 text-[8px] text-slate-500">
                <CheckCircle size={9} className="text-[#D4AF37]" /> <strong className="text-[#111]">Données officielles</strong>
              </span>
              <span className="flex items-center gap-1 rounded-full border border-[#F5F5F5] px-2.5 py-1 text-[8px] text-slate-500">
                <CheckCircle size={9} className="text-[#D4AF37]" /> <strong className="text-[#111]">Paiement 100% sécurisé</strong>
              </span>
              <span className="flex items-center gap-1 rounded-full border border-[#F5F5F5] px-2.5 py-1 text-[8px] text-slate-500">
                <CheckCircle size={9} className="text-[#D4AF37]" /> <strong className="text-[#111]">Rapport instantané</strong>
              </span>
            </div>
            <Link to="/compte" className="flex items-center gap-1 rounded-full border border-[#D4AF37] px-3 py-1.5 text-[9px] font-semibold text-[#111] hover:bg-[#D4AF37] hover:text-white transition">
              Mon compte
            </Link>
          </div>
        </div>

        {/* Hero — Bloc noir premium avec reflets or */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#111111] via-[#1A1A1A] to-[#0D0D0D]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.08)_0%,_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(212,175,55,0.05)_0%,_transparent_50%)]" />
          <div className="container-page relative py-8 lg:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-md">
                <h2 className="text-xl font-extrabold uppercase leading-tight text-white sm:text-2xl lg:text-3xl">
                  Vérifiez l'historique<br />de votre futur<br /><span className="italic text-[#D4AF37]">véhicule</span>
                </h2>
                <p className="mt-2 text-sm text-white/50">Évitez les mauvaises surprises et achetez en toute confiance.</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-white/50">
                  <span className="flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> + 537 842 rapports</span>
                  <span className="flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> 4,8/5 (12 684 avis)</span>
                  <span className="flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> Garantie satisfait ou remboursé sous 14 jours</span>
                </div>
              </div>
              {/* Score de confiance + silhouette voiture */}
              <div className="flex items-center gap-4">
                <div className="opacity-20">
                  <Car size={100} className="text-white" />
                </div>
                <div className="rounded-xl border border-[#D4AF37]/30 bg-[#111]/80 px-5 py-3 text-center backdrop-blur-sm">
                  <p className="text-[8px] font-semibold text-white/50">Score de confiance</p>
                  <div className="mx-auto mt-1.5 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-green-400">
                    <div className="text-center"><span className="text-lg font-extrabold text-white">92</span><p className="text-[7px] text-white/40">/100</p></div>
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-green-400">Excellent</p>
                  <p className="mt-0.5 text-[7px] text-white/40">Ce véhicule présente<br />un faible risque</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recherche — fond blanc, contours or */}
        <div className="border-b border-[#F5F5F5] bg-white py-4">
          <div className="container-page">
            <div className="flex gap-1">
              {(["plate", "vin", "foreign"] as const).map((t) => (
                <button key={t} onClick={() => {}}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition ${t === "plate" ? "bg-[#D4AF37] text-white" : "border border-[#D4AF37]/30 text-[#111] hover:bg-[#D4AF37]/5"}`}>
                  {t === "plate" ? "Par plaque" : t === "vin" ? "Par VIN" : "Immatriculation étrangère"}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border-2 border-[#D4AF37] bg-white px-2 py-2">
                <span className="flex h-7 w-5 items-center justify-center rounded-sm bg-blue-700 text-[8px] font-bold text-white">F</span>
                <input
                  className="w-28 bg-transparent text-center text-base font-extrabold text-[#111] outline-none placeholder-slate-300"
                  placeholder="AA - 123 - BB"
                  value={histPlaque}
                  onChange={(e) => setHistPlaque(e.target.value.toUpperCase())}
                />
                <div className="flex flex-col items-center"><span className="text-[6px]">🇪🇺</span><span className="rounded bg-blue-700 px-0.5 text-[6px] font-bold text-white">75</span></div>
              </div>
              <span className="text-xs font-bold text-slate-300">ou</span>
              <div className="flex items-center gap-1 rounded-lg border border-[#D4AF37]/30 bg-white px-3 py-2">
                <span className="text-[9px] text-slate-300">||||||||</span>
                <input className="w-32 bg-transparent text-sm text-[#111] outline-none placeholder-slate-300" placeholder="Entrez le numéro VIN" />
              </div>
              <Link to="/historique" className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#111] hover:bg-[#C5A028] hover:text-white">
                VÉRIFIER L'HISTORIQUE <ArrowRight size={12} />
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[8px] text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> Rapport instantané en quelques secondes</span>
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> Paiement 100% sécurisé</span>
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> Données officielles et vérifiées</span>
            </div>
          </div>
        </div>

        {/* Tarifs — fond blanc, cartes blanches, contours or */}
        <div className="bg-white py-6">
          <div className="container-page">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold uppercase text-[#111]">Choisissez votre rapport</h3>
                <p className="text-[10px] text-slate-500">Des informations claires pour une décision en toute confiance.</p>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-[#D4AF37]/30 px-3 py-1 text-[8px] font-semibold text-[#111]">
                <CheckCircle size={9} className="text-green-500" /> Garantie satisfait ou remboursé 14 jours
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { label: "RAPPORT EXPRESS", prix: "4,99", desc: "Les informations essentielles pour un premier contrôle.", features: ["Accidents", "Vol", "Kilométrage", "Gage", "Importation", "Et plus encore…"], icon: "⚡", popular: false },
                { label: "RAPPORT COMPLET", prix: "7,99", desc: "L'historique détaillé pour acheter en toute sérénité.", features: ["Tout le rapport Express", "Entretien et réparations", "Nombre de propriétaires", "Contrôles techniques", "Détails sur l'importation", "Et plus encore…"], icon: "🛡️", popular: true },
                { label: "RAPPORT PREMIUM", prix: "12,99", desc: "Le rapport ultra-détaillé avec analyse avancée IA.", features: ["Tout le rapport Complet", "Analyse IA des risques", "Estimation valeur marché", "Historique photos (si disponible)", "Documents administratifs", "Et plus encore…"], icon: "🏆", popular: false },
              ].map((r) => (
                <div key={r.label} className={`relative rounded-xl bg-white p-4 ${r.popular ? "border-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10" : "border border-[#D4AF37]/20"}`}>
                  {r.popular && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2"><span className="rounded-full bg-[#D4AF37] px-3 py-0.5 text-[8px] font-bold uppercase text-white shadow">Le plus populaire</span></div>}
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{r.icon}</span>
                    <div><h4 className="text-xs font-extrabold text-[#111]">{r.label}</h4><p className="mt-0.5 text-[9px] text-slate-500">{r.desc}</p></div>
                  </div>
                  <div className="mt-3"><span className="text-xl font-extrabold text-[#111]">{r.prix} €</span><span className="ml-1 text-[9px] text-slate-400">par rapport</span></div>
                  <div className="mt-3 space-y-1">{r.features.map((f) => (<div key={f} className="flex items-center gap-1 text-[10px] text-[#111]"><CheckCircle size={10} className="shrink-0 text-[#D4AF37]" /> {f}</div>))}</div>
                  <Link to="/historique" className={`mt-4 block w-full rounded-full py-2 text-center text-[10px] font-bold transition ${r.popular ? "bg-[#D4AF37] text-white hover:bg-[#C5A028]" : "border-2 border-[#D4AF37] text-[#111] hover:bg-[#D4AF37] hover:text-white"}`}>CHOISIR</Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bandeau alerte */}
        <div className="border-y border-[#D4AF37]/20 bg-[#FFFDF5] py-3">
          <div className="container-page text-center">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#8B6914]">Économisez des milliers d'euros et évitez les pièges</p>
            <div className="mt-1.5 flex flex-wrap justify-center gap-3 text-[9px]">
              <span className="flex items-center gap-1 font-semibold text-red-600"><AlertTriangle size={10} /> Véhicule volé</span>
              <span className="flex items-center gap-1 font-semibold text-orange-600"><AlertTriangle size={10} /> Compteur trafiqué</span>
              <span className="flex items-center gap-1 font-semibold text-red-600"><AlertTriangle size={10} /> Véhicule accidenté</span>
              <span className="flex items-center gap-1 font-semibold text-orange-600"><AlertTriangle size={10} /> Véhicule gagé</span>
              <span className="flex items-center gap-1 font-semibold text-red-600"><AlertTriangle size={10} /> Importation à risque</span>
            </div>
          </div>
        </div>

        {/* Ce que contient — fond blanc, icônes or */}
        <div className="bg-white py-5">
          <div className="container-page">
            <h3 className="text-center text-xs font-extrabold uppercase tracking-wide text-[#111]">Ce que contient votre rapport</h3>
            <div className="mx-auto mt-4 grid max-w-xl grid-cols-4 gap-3 sm:grid-cols-8">
              {["Accidents", "Vol", "Kilométrage", "Gage", "Entretien", "Importation", "Propriétaires", "Et plus encore"].map((t) => (
                <div key={t} className="flex flex-col items-center gap-1 text-center">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-white shadow-sm">
                    <CheckCircle size={14} className="text-[#D4AF37]" />
                    <div className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500"><CheckCircle size={7} className="text-white" /></div>
                  </div>
                  <span className="text-[8px] font-bold text-[#111]">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Exemple + Pourquoi + Analyse IA */}
        <div className="bg-[#F5F5F5] py-6">
          <div className="container-page">
            <div className="grid gap-3 md:grid-cols-2">
              {/* Exemple de rapport */}
              <div className="rounded-xl border border-[#D4AF37]/20 bg-white p-4">
                <div className="flex items-center gap-2"><Star size={12} className="text-[#D4AF37]" fill="#D4AF37" /><h4 className="text-xs font-extrabold text-[#111]">EXEMPLE DE RAPPORT</h4></div>
                <div className="mt-2 flex items-start justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-[#111]">RENAULT CLIO IV</h5>
                    <p className="text-[9px] text-slate-500">1.5 dCi 90 cv</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[8px] font-bold text-blue-700"><span className="flex h-2.5 w-2.5 items-center justify-center rounded-sm bg-blue-600 text-[5px] text-white">F</span> AA-123-BB</span>
                    <p className="mt-0.5 text-[7px] text-slate-400">Rapport généré le 28/05/2024 à 21:10</p>
                  </div>
                  <span className="rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-[7px] font-bold text-green-700">RAPPORT COMPLET</span>
                </div>
                <div className="mt-3 flex gap-3">
                  <div className="flex flex-col items-center">
                    <p className="text-[7px] text-slate-400">Score de confiance</p>
                    <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-full border-[2px] border-green-400"><div className="text-center"><span className="text-base font-extrabold text-[#111]">92</span><p className="text-[6px] text-slate-400">/100</p></div></div>
                    <p className="mt-0.5 text-[9px] font-bold text-green-600">Excellent</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[
                      { l: "Accidents", v: "Aucun accident déclaré" }, { l: "Kilométrage", v: "128 450 km Cohérent" },
                      { l: "Vol", v: "Aucun vol déclaré" }, { l: "Gage", v: "Aucun gage enregistré" },
                      { l: "Entretien", v: "12 entretiens trouvés" }, { l: "Propriétaires", v: "2 propriétaires" },
                      { l: "Importation", v: "Non importé" }, { l: "Contrôle technique", v: "Valide jusqu'au 12/2025" },
                    ].map((r) => (
                      <div key={r.l} className="flex items-center justify-between text-[9px]">
                        <span className="flex items-center gap-1 text-slate-600"><CheckCircle size={8} className="text-[#D4AF37]" /> {r.l}</span>
                        <span className="font-semibold text-[#111]">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Link to="/historique" className="mt-3 flex items-center gap-1.5 rounded-full border border-[#D4AF37] px-3 py-1.5 text-[9px] font-bold text-[#111] hover:bg-[#D4AF37] hover:text-white transition">VOIR UN EXEMPLE COMPLET <ArrowRight size={9} /></Link>
              </div>

              <div className="flex flex-col gap-3">
                {/* Pourquoi vérifier */}
                <div className="rounded-xl border border-[#D4AF37]/20 bg-white p-4">
                  <h4 className="text-xs font-extrabold text-[#111]">POURQUOI VÉRIFIER L'HISTORIQUE ?</h4>
                  <div className="mt-2 space-y-2">
                    {[
                      { t: "Achetez en toute confiance", d: "Évitez les mauvaises surprises et les vices cachés." },
                      { t: "Protégez votre investissement", d: "Un historique clair = une meilleure valeur." },
                      { t: "Gagnez du temps", d: "Rapport instantané disponible 24H/24 et 7J/7." },
                    ].map((p) => (
                      <div key={p.t} className="flex items-start gap-2">
                        <ShieldCheck size={12} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                        <div><p className="text-[10px] font-bold text-[#111]">{p.t}</p><p className="text-[9px] text-slate-500">{p.d}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Analyse IA — noir premium */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#111111] to-[#1A1A1A] p-4">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.1)_0%,_transparent_60%)]" />
                  <div className="relative flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37]"><span className="text-[7px] font-bold text-white">IA</span></div>
                    <h4 className="text-xs font-extrabold text-[#D4AF37]">ANALYSE INTELLIGENTE MKA.P-MS</h4>
                  </div>
                  <p className="relative mt-1.5 text-[10px] text-white/60">Notre IA analyse des millions de données pour vous fournir un rapport fiable et objectif.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer garanties — fond blanc, icônes or */}
        <div className="border-t border-[#F5F5F5] bg-white py-5">
          <div className="container-page">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: "Sources officielles", desc: "Données provenant d'organismes officiels et partenaires agréés" },
                { label: "100% sécurisé", desc: "Vos données sont protégées et confidentielles" },
                { label: "Rapport instantané", desc: "Disponible immédiatement après paiement" },
                { label: "Disponible 24h/24", desc: "Service accessible à tout moment, où que vous soyez" },
                { label: "Support expert", desc: "Une équipe à votre écoute 7j/7" },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                  <CheckCircle size={16} className="text-[#D4AF37]" />
                  <h5 className="text-[9px] font-bold text-[#111]">{b.label}</h5>
                  <p className="text-[7px] text-slate-500 leading-tight">{b.desc}</p>
                </div>
              ))}
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
            ];
            return (
              <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-3">
                {services.map((s) => {
                  const Icon = s.icon;
                  const isAccent = (s as any).accent;
                  return (
                    <Link key={s.to} to={s.to} className={`group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition hover:shadow-md ${isAccent ? "border-red-200 bg-red-50 hover:border-red-400" : "border-[#E5E7EB] bg-white hover:border-[#D4AF37]"}`}>
                      <div className={`flex h-14 w-14 items-center justify-center rounded-full transition ${isAccent ? "bg-red-100 group-hover:bg-red-200" : "bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20"}`}>
                        <Icon size={26} className={isAccent ? "text-red-600" : "text-[#D4AF37]"} />
                      </div>
                      <h3 className="text-xs font-bold text-[#111]">{s.title}</h3>
                      <p className="text-[10px] text-[#6B7280] leading-tight">{s.desc}</p>
                      <span className={`mt-1 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white ${isAccent ? "bg-red-600" : "bg-[#D4AF37]"}`}>{s.cta}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. ANNONCES PREMIUM + ESPACE PUB
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10">
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
                  <div key={i} className="w-[220px] shrink-0 snap-start">
                    <div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#E5E7EB]" />
                  </div>
                ))
              : featured.data?.items.slice(0, 10).map((v) => (
                  <div key={v.id} className="w-[220px] shrink-0 snap-start">
                    <VehicleCard v={v as any} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7. ANNONCES CLASSIQUES — carrousel horizontal
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white pb-10">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#111]">
              Toutes les annonces
            </h2>
            <Link to="/acheter" className="text-sm font-semibold text-[#6B7280] hover:text-[#D4AF37]">Voir toutes →</Link>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
            {featured.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[220px] shrink-0 snap-start">
                    <div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#E5E7EB]" />
                  </div>
                ))
              : featured.data?.items.map((v) => (
                  <div key={v.id} className="w-[220px] shrink-0 snap-start">
                    <VehicleCard v={v as any} />
                  </div>
                ))}
            {featured.data && featured.data.items.length === 0 && (
              <p className="text-sm text-[#6B7280]">Aucune annonce.{" "}
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
          {(() => {
            const items = [
              { icon: ShieldCheck, title: "Sécurisé", desc: "Vos transactions sont protégées à 100%.", details: "Paiement sécurisé, vérification des annonces, protection acheteur/vendeur, données chiffrées et conformité RGPD." },
              { icon: Users, title: "Fiable", desc: "Des milliers d'utilisateurs nous font confiance.", details: "Plus de 50 000 utilisateurs actifs, avis vérifiés, vendeurs certifiés et support réactif 7j/7." },
              { icon: Gauge, title: "Rapide", desc: "Trouvez ce que vous cherchez en quelques clics.", details: "Recherche intelligente, filtres avancés, estimation instantanée par plaque et dépôt d'annonce en moins d'1 minute." },
              { icon: CheckCircle, title: "Complet", desc: "Tous les services auto réunis au même endroit.", details: "Achat, vente, location, pièces détachées, carte grise, assurance, livraison, financement — tout en un." },
              { icon: Heart, title: "Accompagnement", desc: "Une équipe à votre écoute à chaque étape.", details: "Assistance personnalisée, chat en direct, aide à la négociation et suivi de votre dossier de A à Z." },
            ];
            const first4 = items.slice(0, 4);
            const last = items[4];
            return (
              <>
                <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
                  {first4.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.title}
                        type="button"
                        onClick={(e) => {
                          const el = e.currentTarget.querySelector("[data-details]") as HTMLElement;
                          if (el) el.classList.toggle("hidden");
                        }}
                        className="flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-4 text-center transition hover:shadow-md hover:border-[#D4AF37] cursor-pointer"
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
                <div className="mx-auto mt-3 flex max-w-3xl justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      const el = e.currentTarget.querySelector("[data-details]") as HTMLElement;
                      if (el) el.classList.toggle("hidden");
                    }}
                    className="flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-4 text-center transition hover:shadow-md hover:border-[#D4AF37] cursor-pointer w-[calc(50%-6px)] md:w-[calc(25%-9px)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10">
                      <last.icon size={22} className="text-[#D4AF37]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#111]">{last.title}</h3>
                    <p className="text-[10px] text-[#6B7280] leading-tight">{last.desc}</p>
                    <p data-details className="hidden mt-2 text-[10px] text-[#374151] leading-tight border-t border-[#E5E7EB] pt-2">{last.details}</p>
                  </button>
                </div>
              </>
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
                  <div key={i} className="w-[220px] shrink-0 snap-start">
                    <div className="aspect-[4/5] animate-pulse rounded-2xl bg-[#E5E7EB]" />
                  </div>
                ))
              : featured.data?.items.slice(0, 10).map((v) => (
                  <div key={v.id} className="w-[220px] shrink-0 snap-start">
                    <VehicleCard v={v as any} />
                  </div>
                ))}
            {featured.data && featured.data.items.length === 0 && (
              <p className="text-sm text-[#9CA3AF]">Aucune annonce pour le moment.</p>
            )}
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
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {PRO_ACTIVITIES.map((a) => (
              <Link key={a.label} to={a.to} className="group flex flex-col items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-3 text-center transition hover:border-[#D4AF37] hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/10 transition group-hover:bg-[#D4AF37]/20">
                  <Wrench size={18} className="text-[#D4AF37]" />
                </div>
                <span className="text-[10px] font-medium text-[#374151] sm:text-xs">{a.label}</span>
              </Link>
            ))}
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
            {SOCIAL_LINKS.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" title={s.name} className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-slate-600 transition ${s.color} hover:text-white hover:border-transparent`}>{s.label}</a>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-slate-400">Suivez-nous sur les réseaux sociaux</p>
        </div>

        {/* Autres Ajouts — cliquables avec détails */}
        <div className="container-page border-t border-slate-200 py-6">
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#111]">
            <Star size={14} className="text-[#D4AF37]" /> Autres Ajouts Intégrés
          </h4>
          <div className="mt-3 space-y-1">
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
