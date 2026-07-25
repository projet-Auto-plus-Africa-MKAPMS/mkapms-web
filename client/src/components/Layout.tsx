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
import DomainSelector from "./DomainSelector";
import { Logo } from "./Logo";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { isAdmin } from "@shared/roles";
import { useCurrency } from "../lib/currency";
import { CURRENCIES } from "@shared/currency";
import { trpc } from "../lib/trpc";

// Navigation publique — aucune donnée interne (VO retiré : confidentiel).
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
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"
      style={{
        paddingTop: window.matchMedia("(display-mode: standalone)").matches
          || (navigator as any).standalone === true
          ? "28px"
          : undefined,
      }}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:max-w-[1680px]">
        <Link to="/" className="flex shrink-0 flex-col items-start" aria-label="MKA.P-MS — Accueil">
          {/* Logo OUVERT (Version 2 – Lune / Expansion) — surfaces principales de l'app
              Responsive : plus petit sur mobile pour éviter le débordement, tagline masqué < md */}
          <img
            src="/logo-open.png"
            alt="MKA.P-MS"
            className="h-7 w-auto sm:h-8 md:h-9 select-none"
            draggable={false}
          />
          <span className="hidden md:inline -mt-0.5 whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            La marketplace automobile
          </span>
        </Link>

        <nav className="hidden min-w-0 items-center gap-1 lg:flex">
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

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <DomainSelector />
          <CurrencySelect />
          <SupportWidget />
          <NotificationsBell />
          <Link to="/vendre" className="btn-gold">
            Déposer une annonce
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/messagerie"
                className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:text-brand"
                aria-label="Messages"
              >
                <MessageSquare size={18} />
              </Link>
              {isAdmin(user.role) && (
                <Link to="/admin" className="rounded-lg bg-[#111] px-3 py-1.5 text-xs font-bold text-[#D4AF37] hover:bg-[#222]">
                  Admin
                </Link>
              )}
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

        <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
          <DomainSelector />
          {/* Cloche notification : TOUJOURS visible (même utilisateur non connecté
              ou chargement session en cours). Le composant gère lui-même le cas
              non connecté en redirigeant vers /connexion au clic. Résout :
              - Icône invisible sur mkapms.pro et mkapms.site
              - Icône qui apparaît après 2-5s avec réseau lent (l'attente de
                user est supprimée, l'icône est stable dès le premier rendu). */}
          <NotificationsBell />
          <SupportWidget />
          <button aria-label="Menu" className="shrink-0" onClick={() => setOpen((o) => !o)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
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
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const unread = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 60_000,
    enabled: !!user,
  });
  const list = trpc.notifications.list.useQuery({ limit: 15 }, { enabled: open && !!user });
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
        onClick={() => (user ? setOpen((o) => !o) : navigate("/connexion"))}
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
        <div className="fixed left-1/2 top-[68px] z-50 w-[calc(100vw-1.5rem)] max-w-sm -translate-x-1/2 rounded-xl border border-slate-200 bg-white shadow-xl lg:absolute lg:left-auto lg:right-0 lg:top-full lg:mt-2 lg:w-80 lg:max-w-none lg:translate-x-0">
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
  const location = useLocation();
  const { data: legal } = trpc.meta.legal.useQuery();

  // Pas de footer Layout sur la page d'accueil (elle a son propre footer)
  if (location.pathname === "/") return null;

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page pt-10 pb-4 md:pt-12 md:pb-5">
        {/* Logo + description */}
        <div className="mb-6 text-center">
          <div className="flex flex-col items-center">
            {/* Logo FERMÉ (Version 1 – Terre / Unité) — utilisé à l'intérieur de l'app */}
            <Logo variant="closed" size={44} />
            <span className="mt-2 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              MKA.P-MS · La marketplace automobile
            </span>
          </div>
          <p className="mt-3 mx-auto max-w-md text-sm text-slate-500 text-center">
            La marketplace automobile de référence. Achat, location et entretien — une seule
            plateforme, pensée pour votre confiance.
          </p>
        </div>

        {/* Plateforme + Aide & légal côte à côte */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-center md:text-left">
          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-800">Plateforme</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/acheter">Acheter</Link></li>
              <li><Link to="/louer">Louer</Link></li>
              <li><Link to="/devis">Devis Garage</Link></li>
              <li><Link to="/garages">Réseau de garages</Link></li>
              <li><Link to="/abonnements">Abonnements</Link></li>
              <li><Link to="/mission">Notre Mission</Link></li>
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
          <div className="col-span-2 mt-2 md:col-span-2 md:mt-0 text-center md:text-left">
            <h4 className="mb-3 text-sm font-bold text-slate-800">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>{legal?.telephone}</li>
              <li>{legal?.email}</li>
              <li>{legal?.siege}</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-3 pb-4 text-center text-xs text-slate-400">
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
    { to: "/recherche-universelle", label: "Rechercher", icon: Search },
    { to: "/favoris", label: "Favoris", icon: Heart },
    { to: "/vendre", label: "Publier", icon: PlusCircle },
    { to: "/messagerie", label: "Messages", icon: MessageSquare },
    { to: "/compte", label: "Compte", icon: User },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 border-t border-slate-200 bg-white lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
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

function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === "/") return null;
  return (
    <div className="container-page pt-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-medium text-[#6B7280] hover:text-[#111] transition"
      >
        <span className="text-lg leading-none">←</span> Retour
      </button>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* Spacer pour compenser le header fixe */}
      <div className="h-16" style={{
        marginTop: typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true) ? "28px" : undefined,
      }} />
      <BackButton />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
