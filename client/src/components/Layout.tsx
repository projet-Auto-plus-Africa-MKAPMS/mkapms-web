import { Link, NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import {
  Home,
  Search,
  PlusCircle,
  MessageSquare,
  User,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { trpc } from "../lib/trpc";

const NAV = [
  { to: "/acheter", label: "Acheter" },
  { to: "/louer", label: "Louer" },
  { to: "/pieces", label: "Pièces" },
  { to: "/devis", label: "Devis Garage" },
  { to: "/garages", label: "Garages" },
  { to: "/univers", label: "Univers" },
  { to: "/abonnements", label: "Abonnements" },
];

function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg font-extrabold text-white">
            M
          </span>
          <span className="text-lg font-extrabold tracking-tight text-brand">
            MKA.P-MS
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "text-brand" : "text-slate-600 hover:text-brand"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/vendre" className="btn-gold">
            Déposer une annonce
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/compte" className="btn-outline">
                {user.name?.split(" ")[0] || "Compte"}
              </Link>
              <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
                Quitter
              </button>
            </div>
          ) : (
            <Link to="/connexion" className="btn-primary">
              Connexion
            </Link>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-page flex flex-col py-2">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700"
              >
                {n.label}
              </Link>
            ))}
            <Link to="/vendre" onClick={() => setOpen(false)} className="btn-gold mt-2">
              Déposer une annonce
            </Link>
            {!user && (
              <Link to="/connexion" onClick={() => setOpen(false)} className="btn-primary mt-2">
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { data: legal } = trpc.meta.legal.useQuery();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-extrabold text-white">
              M
            </span>
            <span className="font-extrabold text-brand">MKA.P-MS</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            La marketplace automobile de référence. Achat, location et entretien — une seule
            plateforme, pensée pour votre confiance.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-slate-800">Plateforme</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link to="/acheter">Acheter</Link></li>
            <li><Link to="/louer">Louer</Link></li>
            <li><Link to="/devis">Devis Garage</Link></li>
            <li><Link to="/garages">Réseau de garages</Link></li>
            <li><Link to="/abonnements">Abonnements</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-slate-800">Aide & légal</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link to="/aide">Centre d'aide / FAQ</Link></li>
            <li><Link to="/aide#cgv">CGV / CGU</Link></li>
            <li><Link to="/aide#rgpd">Confidentialité (RGPD)</Link></li>
            <li><Link to="/aide#mentions">Mentions légales</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-slate-800">Contact</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li>{legal?.telephone}</li>
            <li>{legal?.email}</li>
            <li>{legal?.siege}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {legal?.raisonSociale} — {legal?.forme}, capital{" "}
        {legal?.capital}. SIREN {legal?.siren} · TVA {legal?.tva}.
      </div>
    </footer>
  );
}

function BottomNav() {
  const loc = useLocation();
  const items = [
    { to: "/", label: "Accueil", icon: Home },
    { to: "/acheter", label: "Rechercher", icon: Search },
    { to: "/vendre", label: "Publier", icon: PlusCircle },
    { to: "/compte/messages", label: "Messages", icon: MessageSquare },
    { to: "/compte", label: "Compte", icon: User },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden">
      {items.map((it) => {
        const Icon = it.icon;
        const active = loc.pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
              active ? "text-brand" : "text-slate-500"
            }`}
          >
            <Icon size={20} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
