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
} from "lucide-react";
import { trpc } from "../lib/trpc";
import VehicleCard from "../components/VehicleCard";

const UNIVERS = [
  { to: "/acheter", icon: Car, title: "Acheter / Vendre", desc: "Voitures et motos, particuliers & pros, véhicules vérifiés." },
  { to: "/louer", icon: KeyRound, title: "Louer un véhicule", desc: "Particulier, VTC, Taxi, Utilitaire — réservation 100% sécurisée." },
  { to: "/devis", icon: FileText, title: "Devis Garage", desc: "Demande en 7 étapes, mise en relation avec des garages certifiés." },
  { to: "/garage-plus", icon: Building2, title: "Garage+ Pro", desc: "Gérez devis, agenda, stock, employés et facturation." },
];

const ENGAGEMENTS = [
  { icon: ShieldCheck, t: "Véhicules vérifiés" },
  { icon: CreditCard, t: "Paiement sécurisé" },
  { icon: Wrench, t: "Garages certifiés" },
  { icon: RotateCcw, t: "Satisfait ou remboursé" },
];

export default function Home() {
  const [q, setQ] = useState("");
  const [prixMax, setPrixMax] = useState<string>("");
  const [ville, setVille] = useState("");
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
      {/* Hero — premium clair (fond blanc, accent or) */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-soft via-gold to-gold-soft" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-soft/40 blur-3xl" />
        <div className="container-page relative py-14 md:py-20">
          <span className="badge-premium mb-4 inline-flex items-center gap-1">
            ★ Plateforme automobile premium
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-noir md:text-5xl">
            Plus de 50 000 véhicules <span className="text-gold-dark">vérifiés.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Achat, location et entretien — une seule plateforme, pensée pour votre confiance.
          </p>

          <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg md:grid-cols-[1fr_auto_auto_auto]">
            <input
              className="input"
              placeholder="Marque, modèle, version…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <select className="input md:w-44" value={prixMax} onChange={(e) => setPrixMax(e.target.value)}>
              <option value="">Prix max</option>
              <option value="5000">≤ 5 000 €</option>
              <option value="10000">≤ 10 000 €</option>
              <option value="20000">≤ 20 000 €</option>
              <option value="50000">≤ 50 000 €</option>
              <option value="100000">≤ 100 000 €</option>
            </select>
            <input
              className="input md:w-44"
              placeholder="Localisation"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
            />
            <button className="btn-primary" onClick={search}>
              <Search size={18} /> Rechercher
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {ENGAGEMENTS.map((e) => {
              const Icon = e.icon;
              return (
                <span key={e.t} className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 font-medium text-ink">
                  <Icon size={16} className="text-gold-dark" /> {e.t}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Univers */}
      <section className="container-page py-14">
        <h2 className="text-2xl font-extrabold text-slate-900">Quatre univers, une plateforme</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {UNIVERS.map((u) => {
            const Icon = u.icon;
            return (
              <Link key={u.to} to={u.to} className="card p-5 transition hover:shadow-md">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold-soft text-gold-dark">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{u.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{u.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Véhicules à la une */}
      <section className="container-page pb-14">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">Véhicules à la une</h2>
          <Link to="/acheter" className="text-sm font-semibold text-brand">
            Voir tout →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card aspect-[4/5] animate-pulse bg-slate-100" />
              ))
            : featured.data?.items.map((v) => <VehicleCard key={v.id} v={v as any} />)}
          {featured.data && featured.data.items.length === 0 && (
            <p className="col-span-full text-sm text-slate-500">
              Aucune annonce pour le moment. Soyez le premier à{" "}
              <Link to="/vendre" className="font-semibold text-brand">déposer une annonce</Link>.
            </p>
          )}
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="bg-white py-14">
        <div className="container-page grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {[
            { v: stats.data?.vehicules ?? "—", l: "Véhicules" },
            { v: stats.data?.garages ?? "—", l: "Garages partenaires" },
            { v: "200+", l: "Pays couverts" },
            { v: "24/7", l: "Support client" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl font-extrabold text-brand">{String(s.v)}</div>
              <div className="mt-1 text-sm text-slate-500">{s.l}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
