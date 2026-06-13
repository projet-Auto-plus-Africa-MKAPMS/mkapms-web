import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  CreditCard,
  Wrench,
  RotateCcw,
  Car,
  KeyRound,
  FileText,
  Building2,
  TrendingUp,
  History,
  Truck,
  Star,
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronUp,
  UserPlus,
  LogIn,
  FileCheck,
  AlertTriangle,
  Users,
  Gauge,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import VehicleCard from "../components/VehicleCard";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stats = trpc.meta.homeStats.useQuery();
  const featured = trpc.annonces.list.useQuery({ type: "vente", limit: 8 });

  // Estimation
  const [estimOpen, setEstimOpen] = useState(false);
  const [estimMode, setEstimMode] = useState<"plaque" | "vin">("plaque");
  const [estimPlaque, setEstimPlaque] = useState("");
  const [estimVin, setEstimVin] = useState("");
  const [estimDetails, setEstimDetails] = useState({ marque: "", modele: "", annee: "", km: "", carburant: "", boite: "", version: "", couleur: "" });
  const [estimResult, setEstimResult] = useState(false);

  // Recherche voitures
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchForm, setSearchForm] = useState({
    marque: "", modele: "", prixMin: "", prixMax: "", kmMax: "", anneeMin: "", anneeMax: "",
    carburant: "", boite: "", categorie: "", ville: "", rayon: "",
  });

  // Historique
  const [histOpen, setHistOpen] = useState(false);
  const [histMode, setHistMode] = useState<"plaque" | "vin">("plaque");
  const [histPlaque, setHistPlaque] = useState("");
  const [histVin, setHistVin] = useState("");
  const [histResult, setHistResult] = useState(false);

  // Créer compte
  const [compteOpen, setCompteOpen] = useState(false);

  function handleEstimSearch() {
    setEstimResult(true);
    setEstimDetails({ marque: "Peugeot", modele: "208", annee: "2019", km: "45 000", carburant: "Essence", boite: "Manuelle", version: "1.2 PureTech 82 Active", couleur: "Gris" });
  }

  function handleSearchVoitures() {
    const params = new URLSearchParams();
    if (searchForm.marque) params.set("q", searchForm.marque + " " + searchForm.modele);
    if (searchForm.prixMax) params.set("prixMax", searchForm.prixMax);
    if (searchForm.ville) params.set("ville", searchForm.ville);
    navigate(`/acheter?${params.toString()}`);
  }

  return (
    <div>
      {/* ═══ HERO — FOND NOIR ═══ */}
      <section className="relative overflow-hidden bg-[#111]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent" />
        <div className="container-page relative py-14 md:py-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5">
            <Star size={14} className="text-[#D4AF37]" />
            <span className="text-sm font-semibold text-[#D4AF37]">Bienvenue sur MKA.P-MS</span>
          </div>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-white md:text-5xl">
            La marketplace automobile <span className="text-[#D4AF37]">de référence.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/60">
            Achat, vente, location, réparation, pièces, livraison — tout l'automobile dans une seule plateforme.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: ShieldCheck, t: "Véhicules vérifiés" },
              { icon: CreditCard, t: "Paiement sécurisé" },
              { icon: Wrench, t: "Garages certifiés" },
              { icon: RotateCcw, t: "Satisfait ou remboursé" },
            ].map((e) => {
              const Icon = e.icon;
              return (
                <span key={e.t} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70">
                  <Icon size={14} className="text-[#D4AF37]" /> {e.t}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ ESTIMATION DE VOITURE ═══ */}
      <section className="bg-[#FAFAFA] py-6">
        <div className="container-page">
          <button
            onClick={() => { setEstimOpen(!estimOpen); if (searchOpen) setSearchOpen(false); }}
            className="flex w-full items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-6 py-4 shadow-sm transition hover:border-[#D4AF37]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                <TrendingUp size={20} className="text-[#D4AF37]" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-bold text-[#111]">Estimation de voiture</h2>
                <p className="text-xs text-[#6B7280]">Estimez la valeur de votre véhicule gratuitement</p>
              </div>
            </div>
            {estimOpen ? <ChevronUp size={20} className="text-[#6B7280]" /> : <ChevronDown size={20} className="text-[#6B7280]" />}
          </button>

          {estimOpen && (
            <div className="mt-3 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              {/* Plaque / VIN / Rechercher — 3 colonnes en ligne */}
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">PLAQUE D'IMMATRICULATION</label>
                  <input
                    className={`w-full rounded-xl border px-4 py-3 text-sm font-medium uppercase outline-none transition ${estimMode === "plaque" ? "border-[#D4AF37] bg-[#FFFDF5]" : "border-[#D1D5DB]"}`}
                    placeholder="AA-123-BB"
                    value={estimPlaque}
                    onFocus={() => setEstimMode("plaque")}
                    onChange={(e) => { setEstimPlaque(e.target.value.toUpperCase()); setEstimMode("plaque"); }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#6B7280]">NUMÉRO VIN</label>
                  <input
                    className={`w-full rounded-xl border px-4 py-3 text-sm font-medium uppercase outline-none transition ${estimMode === "vin" ? "border-[#D4AF37] bg-[#FFFDF5]" : "border-[#D1D5DB]"}`}
                    placeholder="VF3XXXXXXXXX00000"
                    value={estimVin}
                    onFocus={() => setEstimMode("vin")}
                    onChange={(e) => { setEstimVin(e.target.value.toUpperCase()); setEstimMode("vin"); }}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleEstimSearch}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white hover:bg-[#C5A028] md:w-auto"
                  >
                    <Search size={16} /> Rechercher
                  </button>
                </div>
              </div>

              {/* Champs détaillés qui se remplissent */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Marque</label>
                  <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111]" value={estimDetails.marque} onChange={(e) => setEstimDetails((d) => ({ ...d, marque: e.target.value }))} placeholder="—" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Modèle</label>
                  <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111]" value={estimDetails.modele} onChange={(e) => setEstimDetails((d) => ({ ...d, modele: e.target.value }))} placeholder="—" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Version</label>
                  <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111]" value={estimDetails.version} onChange={(e) => setEstimDetails((d) => ({ ...d, version: e.target.value }))} placeholder="—" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Année</label>
                  <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111]" value={estimDetails.annee} onChange={(e) => setEstimDetails((d) => ({ ...d, annee: e.target.value }))} placeholder="—" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Kilométrage</label>
                  <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111]" value={estimDetails.km} onChange={(e) => setEstimDetails((d) => ({ ...d, km: e.target.value }))} placeholder="—" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Énergie</label>
                  <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111]" value={estimDetails.carburant} onChange={(e) => setEstimDetails((d) => ({ ...d, carburant: e.target.value }))} placeholder="—" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Boîte</label>
                  <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111]" value={estimDetails.boite} onChange={(e) => setEstimDetails((d) => ({ ...d, boite: e.target.value }))} placeholder="—" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Couleur</label>
                  <input className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-sm text-[#111]" value={estimDetails.couleur} onChange={(e) => setEstimDetails((d) => ({ ...d, couleur: e.target.value }))} placeholder="—" />
                </div>
              </div>

              {estimResult && (
                <div className="mt-4 rounded-xl bg-[#111] p-5">
                  <p className="text-sm text-white/60">Estimation basée sur le marché</p>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-white/40">Prix bas</p>
                      <p className="text-lg font-bold text-white">8 500 €</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#D4AF37]">Prix recommandé</p>
                      <p className="text-2xl font-extrabold text-[#D4AF37]">10 200 €</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Prix haut</p>
                      <p className="text-lg font-bold text-white">12 000 €</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/vendre")}
                    className="mt-4 w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]"
                  >
                    Déposer mon annonce au meilleur prix
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══ RECHERCHE DE VOITURES ═══ */}
      <section className="bg-[#FAFAFA] pb-6">
        <div className="container-page">
          <button
            onClick={() => { setSearchOpen(!searchOpen); if (estimOpen) setEstimOpen(false); }}
            className="flex w-full items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-6 py-4 shadow-sm transition hover:border-[#D4AF37]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111]">
                <Search size={20} className="text-[#D4AF37]" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-bold text-[#111]">Recherche de voitures</h2>
                <p className="text-xs text-[#6B7280]">Trouvez le véhicule idéal avec nos filtres avancés</p>
              </div>
            </div>
            {searchOpen ? <ChevronUp size={20} className="text-[#6B7280]" /> : <ChevronDown size={20} className="text-[#6B7280]" />}
          </button>

          {searchOpen && (
            <div className="mt-3 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Marque</label>
                  <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" placeholder="Ex: Peugeot" value={searchForm.marque} onChange={(e) => setSearchForm((f) => ({ ...f, marque: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Modèle</label>
                  <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" placeholder="Ex: 208" value={searchForm.modele} onChange={(e) => setSearchForm((f) => ({ ...f, modele: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Prix min (€)</label>
                  <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" placeholder="0" type="number" value={searchForm.prixMin} onChange={(e) => setSearchForm((f) => ({ ...f, prixMin: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Prix max (€)</label>
                  <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" placeholder="50 000" type="number" value={searchForm.prixMax} onChange={(e) => setSearchForm((f) => ({ ...f, prixMax: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Kilométrage max</label>
                  <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" placeholder="150 000" type="number" value={searchForm.kmMax} onChange={(e) => setSearchForm((f) => ({ ...f, kmMax: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Année min</label>
                  <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" placeholder="2015" type="number" value={searchForm.anneeMin} onChange={(e) => setSearchForm((f) => ({ ...f, anneeMin: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Énergie</label>
                  <select className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" value={searchForm.carburant} onChange={(e) => setSearchForm((f) => ({ ...f, carburant: e.target.value }))}>
                    <option value="">Toutes</option>
                    <option value="essence">Essence</option>
                    <option value="diesel">Diesel</option>
                    <option value="electrique">Électrique</option>
                    <option value="hybride">Hybride</option>
                    <option value="gpl">GPL</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Boîte</label>
                  <select className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" value={searchForm.boite} onChange={(e) => setSearchForm((f) => ({ ...f, boite: e.target.value }))}>
                    <option value="">Toutes</option>
                    <option value="manuelle">Manuelle</option>
                    <option value="automatique">Automatique</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Catégorie</label>
                  <select className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" value={searchForm.categorie} onChange={(e) => setSearchForm((f) => ({ ...f, categorie: e.target.value }))}>
                    <option value="">Toutes</option>
                    <option value="citadine">Citadine</option>
                    <option value="berline">Berline</option>
                    <option value="suv">SUV</option>
                    <option value="break">Break</option>
                    <option value="coupe">Coupé</option>
                    <option value="cabriolet">Cabriolet</option>
                    <option value="monospace">Monospace</option>
                    <option value="utilitaire">Utilitaire</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Localisation</label>
                  <input className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" placeholder="Ville ou code postal" value={searchForm.ville} onChange={(e) => setSearchForm((f) => ({ ...f, ville: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#9CA3AF]">Rayon (km)</label>
                  <select className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#D4AF37]" value={searchForm.rayon} onChange={(e) => setSearchForm((f) => ({ ...f, rayon: e.target.value }))}>
                    <option value="">Tous</option>
                    <option value="10">10 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km</option>
                    <option value="100">100 km</option>
                    <option value="200">200 km</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button onClick={handleSearchVoitures} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white hover:bg-[#C5A028]">
                  <Search size={16} /> Rechercher
                </button>
                <button
                  onClick={() => {
                    if (!user) { navigate("/connexion"); return; }
                    alert("Alerte activée ! Vous serez notifié dès qu'un véhicule correspond à vos critères.");
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#111] px-6 py-3 text-sm font-bold text-[#111] hover:bg-[#111] hover:text-white"
                >
                  <Bell size={16} /> Activer l'alerte
                </button>
              </div>
              {!user && (
                <p className="mt-2 text-center text-xs text-[#9CA3AF]">
                  Connectez-vous pour activer les alertes et recevoir les notifications.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══ VÉHICULES À LA UNE ═══ */}
      <section className="bg-white py-10">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-[#111]">Véhicules à la une</h2>
            <Link to="/acheter" className="flex items-center gap-1 text-sm font-semibold text-[#D4AF37] hover:underline">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {featured.isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#E5E7EB]" />
                ))
              : featured.data?.items.map((v) => <VehicleCard key={v.id} v={v as any} />)}
            {featured.data && featured.data.items.length === 0 && (
              <p className="col-span-full text-sm text-[#6B7280]">
                Aucune annonce pour le moment.{" "}
                <Link to="/vendre" className="font-semibold text-[#D4AF37]">Déposer une annonce</Link>.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ═══ UNIVERS ═══ */}
      <section className="bg-[#FAFAFA] py-10">
        <div className="container-page">
          <h2 className="text-center text-xl font-extrabold text-[#111]">Un écosystème complet</h2>
          <div className="mt-6 grid gap-3 grid-cols-2 lg:grid-cols-3">
            {[
              { to: "/acheter", icon: Car, title: "Acheter / Vendre", desc: "Voitures et motos" },
              { to: "/louer", icon: KeyRound, title: "Location", desc: "VTC, utilitaire" },
              { to: "/devis", icon: FileText, title: "Devis Garage", desc: "Garages certifiés" },
              { to: "/garage-plus", icon: Building2, title: "Garage+ Pro", desc: "Gestion atelier" },
              { to: "/pieces", icon: Wrench, title: "Pièces Auto", desc: "80+ catégories" },
              { to: "/livraison", icon: Truck, title: "Livraison", desc: "Moto, camion" },
            ].map((u) => {
              const Icon = u.icon;
              return (
                <Link key={u.to} to={u.to} className="group flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 transition hover:border-[#D4AF37] hover:shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#111] text-[#D4AF37] transition group-hover:bg-[#D4AF37] group-hover:text-white">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111]">{u.title}</h3>
                    <p className="text-xs text-[#6B7280]">{u.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ HISTORIQUE VÉHICULE ═══ */}
      <section className="bg-[#111] py-10">
        <div className="container-page">
          <button
            onClick={() => setHistOpen(!histOpen)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4 transition hover:border-[#D4AF37]/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
                <History size={20} className="text-[#D4AF37]" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-bold text-white">Historique de véhicule</h2>
                <p className="text-xs text-white/50">Vérifiez l'historique complet avant d'acheter</p>
              </div>
            </div>
            {histOpen ? <ChevronUp size={20} className="text-white/50" /> : <ChevronDown size={20} className="text-white/50" />}
          </button>

          {histOpen && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-6">
              {/* Infos récupérables */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: FileCheck, t: "Contrôles techniques" },
                  { icon: AlertTriangle, t: "Accidents déclarés" },
                  { icon: Users, t: "Nombre de propriétaires" },
                  { icon: Gauge, t: "Kilométrage réel" },
                ].map((info) => {
                  const Icon = info.icon;
                  return (
                    <div key={info.t} className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-3 text-center">
                      <Icon size={20} className="text-[#D4AF37]" />
                      <span className="text-xs font-medium text-white/70">{info.t}</span>
                    </div>
                  );
                })}
              </div>

              {/* Plaque / VIN / Rechercher */}
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/50">PLAQUE D'IMMATRICULATION</label>
                  <input
                    className={`w-full rounded-xl border bg-white/10 px-4 py-3 text-sm font-medium uppercase text-white outline-none transition ${histMode === "plaque" ? "border-[#D4AF37]" : "border-white/10"}`}
                    placeholder="AA-123-BB"
                    value={histPlaque}
                    onFocus={() => setHistMode("plaque")}
                    onChange={(e) => { setHistPlaque(e.target.value.toUpperCase()); setHistMode("plaque"); }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/50">NUMÉRO VIN</label>
                  <input
                    className={`w-full rounded-xl border bg-white/10 px-4 py-3 text-sm font-medium uppercase text-white outline-none transition ${histMode === "vin" ? "border-[#D4AF37]" : "border-white/10"}`}
                    placeholder="VF3XXXXXXXXX00000"
                    value={histVin}
                    onFocus={() => setHistMode("vin")}
                    onChange={(e) => { setHistVin(e.target.value.toUpperCase()); setHistMode("vin"); }}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setHistResult(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white hover:bg-[#C5A028] md:w-auto"
                  >
                    <Search size={16} /> Rechercher
                  </button>
                </div>
              </div>

              {histResult && (
                <div className="mt-4 rounded-xl bg-white/5 p-5">
                  <p className="mb-3 text-sm font-bold text-[#D4AF37]">Résultat — Historique véhicule</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-white/5 p-3"><p className="text-xs text-white/40">Propriétaires</p><p className="text-lg font-bold text-white">2</p></div>
                    <div className="rounded-lg bg-white/5 p-3"><p className="text-xs text-white/40">Accidents</p><p className="text-lg font-bold text-green-400">0</p></div>
                    <div className="rounded-lg bg-white/5 p-3"><p className="text-xs text-white/40">Dernier CT</p><p className="text-lg font-bold text-white">03/2025</p></div>
                    <div className="rounded-lg bg-white/5 p-3"><p className="text-xs text-white/40">Km vérifié</p><p className="text-lg font-bold text-white">45 200</p></div>
                  </div>
                  <Link to="/historique" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#D4AF37] hover:underline">
                    Voir le rapport complet <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ═══ CHIFFRES CLÉS ═══ */}
      <section className="bg-[#111] py-10 border-t border-white/5">
        <div className="container-page grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {[
            { v: stats.data?.vehicules ?? "—", l: "Véhicules" },
            { v: stats.data?.garages ?? "—", l: "Garages partenaires" },
            { v: "200+", l: "Pays couverts" },
            { v: "24/7", l: "Support client" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl font-extrabold text-[#D4AF37]">{String(s.v)}</div>
              <div className="mt-1 text-xs font-medium text-white/50">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA — CRÉER UN COMPTE / SE CONNECTER ═══ */}
      <section className="bg-white py-12">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold text-[#111]">Rejoignez MKA.P-MS</h2>
            <p className="mt-2 text-[#6B7280]">
              Inscription gratuite. Déposez votre annonce, recherchez un véhicule, gérez votre activité pro.
            </p>
          </div>

          {/* Créer un compte — bouton qui s'ouvre */}
          <div className="mx-auto mt-8 max-w-lg">
            <button
              onClick={() => setCompteOpen(!compteOpen)}
              className="flex w-full items-center justify-between rounded-2xl border-2 border-[#111] px-6 py-4 transition hover:bg-[#111] hover:text-white group"
            >
              <div className="flex items-center gap-3">
                <UserPlus size={20} className="text-[#D4AF37]" />
                <span className="font-bold text-[#111] group-hover:text-white">Créer un compte</span>
              </div>
              {compteOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {compteOpen && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Link
                  to="/connexion"
                  className="flex flex-col items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center transition hover:border-[#D4AF37] hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
                    <Car size={28} className="text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#111]">Particulier</h3>
                  <p className="text-xs text-[#6B7280]">Achetez, vendez, louez. Inscription gratuite.</p>
                </Link>
                <Link
                  to="/connexion"
                  className="flex flex-col items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center transition hover:border-[#D4AF37] hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111]">
                    <Building2 size={28} className="text-[#D4AF37]" />
                  </div>
                  <h3 className="font-bold text-[#111]">Professionnel</h3>
                  <p className="text-xs text-[#6B7280]">Garage, vente, location, VTC, pièces, carte grise.</p>
                </Link>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link to="/connexion" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028]">
                <LogIn size={16} /> Se connecter
              </Link>
              <Link to="/vendre" className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#D4AF37] py-3 text-sm font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
                Déposer une annonce
              </Link>
            </div>

            <Link to="/mission" className="mt-4 block text-center text-sm font-medium text-[#6B7280] hover:text-[#D4AF37]">
              Découvrir notre mission →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
