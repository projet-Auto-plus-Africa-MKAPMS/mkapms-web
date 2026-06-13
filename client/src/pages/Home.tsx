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
  MapPin,
  Star,
  ArrowRight,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import VehicleCard from "../components/VehicleCard";

const UNIVERS = [
  { to: "/acheter", icon: Car, title: "Acheter / Vendre", desc: "Voitures et motos vérifiés" },
  { to: "/louer", icon: KeyRound, title: "Location", desc: "Particulier, VTC, Utilitaire" },
  { to: "/devis", icon: FileText, title: "Devis Garage", desc: "Garages certifiés MKA.P-MS" },
  { to: "/garage-plus", icon: Building2, title: "Garage+ Pro", desc: "Gestion complète atelier" },
  { to: "/pieces", icon: Wrench, title: "Pièces Auto", desc: "80+ catégories, stock réel" },
  { to: "/livraison", icon: Truck, title: "Livraison", desc: "Moto, utilitaire, camion" },
];

export default function Home() {
  const [q, setQ] = useState("");
  const [prixMax, setPrixMax] = useState<string>("");
  const [ville, setVille] = useState("");
  const [estimForm, setEstimForm] = useState({ marque: "", modele: "", annee: "", km: "" });
  const navigate = useNavigate();
  const stats = trpc.meta.homeStats.useQuery();
  const featured = trpc.annonces.list.useQuery({ type: "vente", limit: 8 });

  function search() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (prixMax) params.set("prixMax", prixMax);
    if (ville) params.set("ville", ville);
    navigate(`/acheter?${params.toString()}`);
  }

  return (
    <div>
      {/* ═══ HERO — FOND NOIR PREMIUM ═══ */}
      <section className="relative overflow-hidden bg-[#111]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#D4AF37]/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[#D4AF37]/5 blur-3xl" />

        <div className="container-page relative py-16 md:py-24">
          {/* Bienvenue */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5">
            <Star size={14} className="text-[#D4AF37]" />
            <span className="text-sm font-semibold text-[#D4AF37]">Bienvenue sur MKA.P-MS</span>
          </div>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            La marketplace automobile<br />
            <span className="text-[#D4AF37]">de référence.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/60">
            Achat, vente, location, réparation, pièces, livraison — tout l'univers automobile réuni dans une seule plateforme premium.
          </p>

          {/* Barre de recherche */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:max-w-3xl">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
              <input
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
                placeholder="Marque, modèle, version…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
              <select
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
                value={prixMax}
                onChange={(e) => setPrixMax(e.target.value)}
              >
                <option value="" className="text-black">Prix max</option>
                <option value="5000" className="text-black">≤ 5 000 €</option>
                <option value="10000" className="text-black">≤ 10 000 €</option>
                <option value="20000" className="text-black">≤ 20 000 €</option>
                <option value="50000" className="text-black">≤ 50 000 €</option>
              </select>
              <input
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-[#D4AF37]"
                placeholder="Ville"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
              />
              <button className="flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white hover:bg-[#C5A028]" onClick={search}>
                <Search size={18} /> Rechercher
              </button>
            </div>
          </div>

          {/* Engagements */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { icon: ShieldCheck, t: "Véhicules vérifiés" },
              { icon: CreditCard, t: "Paiement sécurisé" },
              { icon: Wrench, t: "Garages certifiés" },
              { icon: RotateCcw, t: "Satisfait ou remboursé" },
            ].map((e) => {
              const Icon = e.icon;
              return (
                <span key={e.t} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/70">
                  <Icon size={16} className="text-[#D4AF37]" /> {e.t}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ ESTIMATION VÉHICULE ═══ */}
      <section className="bg-[#FAFAFA] py-14">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/10 px-3 py-1 text-sm font-semibold text-[#D4AF37]">
                <TrendingUp size={16} /> Estimation gratuite
              </div>
              <h2 className="text-3xl font-extrabold text-[#111]">
                Estimez la valeur de votre véhicule
              </h2>
              <p className="mt-3 text-[#6B7280]">
                Obtenez une estimation fiable en quelques secondes, basée sur les prix du marché en temps réel. Gratuit et sans engagement.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-[#374151]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-white">1</span>
                  Entrez les informations du véhicule
                </div>
                <div className="flex items-center gap-3 text-sm text-[#374151]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-white">2</span>
                  Recevez une estimation basée sur le marché
                </div>
                <div className="flex items-center gap-3 text-sm text-[#374151]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-white">3</span>
                  Publiez votre annonce au meilleur prix
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-[#111]">Estimation rapide</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                  placeholder="Marque (ex: Peugeot)"
                  value={estimForm.marque}
                  onChange={(e) => setEstimForm((f) => ({ ...f, marque: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                  placeholder="Modèle (ex: 208)"
                  value={estimForm.modele}
                  onChange={(e) => setEstimForm((f) => ({ ...f, modele: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                  placeholder="Année"
                  value={estimForm.annee}
                  onChange={(e) => setEstimForm((f) => ({ ...f, annee: e.target.value }))}
                />
                <input
                  className="rounded-xl border border-[#D1D5DB] px-4 py-3 text-sm outline-none focus:border-[#D4AF37]"
                  placeholder="Kilométrage"
                  value={estimForm.km}
                  onChange={(e) => setEstimForm((f) => ({ ...f, km: e.target.value }))}
                />
              </div>
              <button
                className="mt-4 w-full rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-white hover:bg-[#C5A028]"
                onClick={() => navigate(`/vendre?marque=${estimForm.marque}&modele=${estimForm.modele}`)}
              >
                Estimer mon véhicule gratuitement
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HISTORIQUE VÉHICULE ═══ */}
      <section className="bg-[#111] py-14">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/20">
                <History size={28} className="text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-bold text-white">Historique véhicule</h3>
              <p className="mt-3 text-white/60">
                Vérifiez l'historique complet d'un véhicule avant d'acheter : accidents, entretiens, nombre de propriétaires, kilométrage réel.
              </p>
              <Link to="/historique" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-white hover:bg-[#C5A028]">
                Vérifier un véhicule <ArrowRight size={16} />
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/20">
                <MapPin size={28} className="text-[#D4AF37]" />
              </div>
              <h3 className="text-2xl font-bold text-white">Trouvez un garage</h3>
              <p className="mt-3 text-white/60">
                Des garages certifiés MKA.P-MS près de chez vous. Devis gratuit, suivi en temps réel, garantie sur les réparations.
              </p>
              <Link to="/garages" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#D4AF37] px-6 py-3 text-sm font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
                Voir les garages <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ UNIVERS ═══ */}
      <section className="bg-white py-14">
        <div className="container-page">
          <h2 className="text-center text-2xl font-extrabold text-[#111]">Un écosystème complet</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-[#6B7280]">
            Tout ce dont vous avez besoin pour l'automobile, dans une seule plateforme.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {UNIVERS.map((u) => {
              const Icon = u.icon;
              return (
                <Link key={u.to} to={u.to} className="group flex items-start gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 transition hover:border-[#D4AF37] hover:shadow-md">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#111] text-[#D4AF37] transition group-hover:bg-[#D4AF37] group-hover:text-white">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111]">{u.title}</h3>
                    <p className="mt-1 text-sm text-[#6B7280]">{u.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ VÉHICULES À LA UNE ═══ */}
      <section className="bg-[#FAFAFA] py-14">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-[#111]">Véhicules à la une</h2>
            <Link to="/acheter" className="flex items-center gap-1 text-sm font-semibold text-[#D4AF37] hover:underline">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
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

      {/* ═══ CHIFFRES CLÉS — FOND NOIR ═══ */}
      <section className="bg-[#111] py-14">
        <div className="container-page grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {[
            { v: stats.data?.vehicules ?? "—", l: "Véhicules" },
            { v: stats.data?.garages ?? "—", l: "Garages partenaires" },
            { v: "200+", l: "Pays couverts" },
            { v: "24/7", l: "Support client" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-4xl font-extrabold text-[#D4AF37]">{String(s.v)}</div>
              <div className="mt-2 text-sm font-medium text-white/60">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="bg-white py-14">
        <div className="container-page text-center">
          <h2 className="text-3xl font-extrabold text-[#111]">Prêt à commencer ?</h2>
          <p className="mx-auto mt-3 max-w-lg text-[#6B7280]">
            Rejoignez MKA.P-MS et découvrez une nouvelle façon de vivre l'automobile. Inscription gratuite.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/vendre" className="rounded-xl bg-[#D4AF37] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#C5A028]">
              Déposer une annonce
            </Link>
            <Link to="/connexion" className="rounded-xl border-2 border-[#111] px-8 py-3.5 text-sm font-bold text-[#111] hover:bg-[#111] hover:text-white">
              Créer un compte
            </Link>
            <Link to="/mission" className="rounded-xl border border-[#D4AF37] px-8 py-3.5 text-sm font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white">
              Notre mission
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
