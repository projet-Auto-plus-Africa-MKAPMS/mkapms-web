import { Link, NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import {
  Home,
  Search,
  Heart,
  PlusCircle,
  MessageSquare,
  User,
  Menu,
  X,
  Bell,
} from "lucide-react";
import SupportWidget from "./SupportWidget";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { CURRENCIES } from "@shared/currency";
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
        <Link to="/" className="flex flex-col">
          <span className="text-lg font-extrabold tracking-tight text-noir">
            MK<span className="text-gold">A</span><span className="text-noir">.P-MS</span>
          </span>
          <span className="-mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            La marketplace automobile
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
          <CurrencySelect />
          <SupportWidget />
          <Link to="/vendre" className="btn-gold">
            Déposer une annonce
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <NotificationsBell />
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

        <div className="flex items-center gap-2 md:hidden">
          <SupportWidget />
          <button aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
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

function CurrencySelect() {
  const { currency, setCurrency } = useCurrency();
  return (
    <select
      aria-label="Devise"
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-600"
    >
      {Object.keys(CURRENCIES).map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const unread = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const list = trpc.notifications.list.useQuery({ limit: 15 }, { enabled: open });
  const markRead = trpc.notifications.markRead.useMutation();
  const markAll = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
  });
  const count = unread.data ?? 0;

  async function openNotif(id: number, url: string | null) {
    await markRead.mutateAsync({ id });
    utils.notifications.unreadCount.invalidate();
    utils.notifications.list.invalidate();
    setOpen(false);
    if (url) navigate(url);
  }

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:text-brand"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-sm font-bold text-slate-800">Notifications</span>
            {count > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-brand hover:underline"
              >
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {list.isLoading && <p className="px-3 py-4 text-sm text-slate-500">Chargement…</p>}
            {list.data && list.data.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                Aucune notification.<br />
                Enregistre une recherche pour être alerté des nouvelles annonces.
              </p>
            )}
            {list.data?.map((n) => (
              <button
                key={n.id}
                onClick={() => openNotif(n.id, n.url)}
                className={`block w-full border-b border-slate-50 px-3 py-2.5 text-left hover:bg-slate-50 ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                {n.body && <p className="text-xs text-slate-500">{n.body}</p>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Footer() {
  const { data: legal } = trpc.meta.legal.useQuery();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-noir">
              MK<span className="text-gold">A</span>.P-MS
            </span>
            <span className="-mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              La marketplace automobile
            </span>
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
            <li><Link to="/confiance">Centre de confiance</Link></li>
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
    { to: "/favoris", label: "Favoris", icon: Heart },
    { to: "/vendre", label: "Publier", icon: PlusCircle },
    { to: "/compte/messages", label: "Messages", icon: MessageSquare },
    { to: "/compte", label: "Compte", icon: User },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 border-t border-slate-200 bg-white md:hidden">
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
