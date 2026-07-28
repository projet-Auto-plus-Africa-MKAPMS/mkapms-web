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
  Settings,
} from "lucide-react";
import SupportWidget from "./SupportWidget";
import DomainSelector from "./DomainSelector";
import { Logo } from "./Logo";
import { DynamicPWAIcon } from "./DynamicPWAIcon";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { isAdmin } from "@shared/roles";
import { useCurrency } from "../lib/currency";
import { CURRENCIES } from "@shared/currency";
import { trpc } from "../lib/trpc";
import { SmartLink, useResolvedTarget } from "../lib/redirect";

// Navigation publique — aucune donnée interne (VO retiré : confidentiel).
// Chaque entrée passe par le Moteur de Redirection (redirKey) avec un
// fallback = destination par défaut, donc le lien fonctionne toujours.
const NAV = [
  { to: "/acheter", label: "Acheter", redirKey: "nav_acheter" },
  { to: "/louer", label: "Louer", redirKey: "nav_louer" },
  { to: "/pieces", label: "Pièces", redirKey: "nav_pieces" },
  { to: "/devis", label: "Devis Garage", redirKey: "nav_devis" },
  { to: "/garages", label: "Garages", redirKey: "nav_garages" },
  { to: "/univers", label: "Univers", redirKey: "nav_univers" },
  { to: "/abonnements", label: "Abonnements", redirKey: "nav_abonnements" },
];

// Décalage haut du header en mode application installée (PWA).
// - iPhone : valeur historique 28px (rendu déjà validé, on n'y touche pas).
// - Android & autres : zone de sécurité native `env(safe-area-inset-top)` qui
//   s'adapte à chaque appareil (0 si l'OS gère déjà la barre d'état), ce qui
//   corrige le header « trop bas » sur Samsung sans affecter iPhone.
function standaloneTopOffset(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const iOSStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || iOSStandalone;
  if (!standalone) return undefined;
  return iOSStandalone ? "28px" : "env(safe-area-inset-top, 0px)";
}

// Élément de menu résolu par le Moteur de Redirection (garde l'état actif).
function NavItem({ to, label, redirKey }: { to: string; label: string; redirKey: string }) {
  const { target } = useResolvedTarget(redirKey, to);
  return (
    <NavLink
      to={target}
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive ? "text-brand" : "text-slate-600 hover:text-brand"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"
      style={{ paddingTop: standaloneTopOffset() }}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-4 lg:max-w-[1680px]">
        <Link
          to="/"
          className="flex shrink-0 flex-col items-center justify-center leading-none overflow-visible"
          aria-label="MKA.P-MS — Accueil"
          data-testid="header-logo-link"
        >
          {/* Blason : ÉTAT OUVERT pour les visiteurs, ÉTAT FERMÉ dès qu'un
              compte est créé / l'utilisateur connecté (charte de marque).
              Le nom officiel « MKA.P-MS » (image charte exacte) est sous le blason.
              Taille du blason réduite pour rentrer proprement dans le cadre
              du header sur toutes les tailles d'appareils (mobile + PWA). */}
          <Logo
            variant={user ? "closed" : "open"}
            size={32}
            withWordmark
            className="shrink-0"
            data-testid={user ? "header-logo-closed" : "header-logo-open"}
          />
        </Link>

        <nav className="hidden min-w-0 items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavItem key={n.to} to={n.to} label={n.label} redirKey={n.redirKey} />
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <DomainSelector />
          <CurrencySelect />
          <SupportWidget />
          <NotificationsBell />
          <SmartLink redirKey="bouton_deposer_annonce" fallback="/vendre" className="btn-gold">
            Déposer une annonce
          </SmartLink>
          {user ? (
            <div className="flex items-center gap-2">
              <SmartLink
                redirKey="bouton_messagerie"
                fallback="/messagerie"
                className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:text-brand"
              >
                <MessageSquare size={18} />
              </SmartLink>
              {isAdmin(user.role) && (
                <SmartLink redirKey="bouton_admin" fallback="/admin" className="rounded-lg bg-[#111] px-3 py-1.5 text-xs font-bold text-[#D4AF37] hover:bg-[#222]">
                  Admin
                </SmartLink>
              )}
              <SmartLink redirKey="bouton_compte" fallback="/compte" className="btn-outline">
                {user.name?.split(" ")[0] || "Compte"}
              </SmartLink>
              <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
                Quitter
              </button>
            </div>
          ) : (
            <SmartLink redirKey="bouton_connexion" fallback="/connexion" className="btn-primary">
              Connexion
            </SmartLink>
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
          <button
            aria-label="Menu"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:text-brand"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-page flex flex-col py-2">
            {NAV.map((n) => (
              <SmartLink
                key={n.to}
                redirKey={n.redirKey}
                fallback={n.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700"
              >
                {n.label}
              </SmartLink>
            ))}
            <SmartLink redirKey="bouton_deposer_annonce" fallback="/vendre" onClick={() => setOpen(false)} className="btn-gold mt-2">
              Déposer une annonce
            </SmartLink>
            {user && (
              <Link to="/parametres" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                <Settings size={16} className="text-slate-500" />
                Paramètres
              </Link>
            )}
            {!user && (
              <SmartLink redirKey="bouton_connexion" fallback="/connexion" onClick={() => setOpen(false)} className="btn-primary mt-2">
                Connexion
              </SmartLink>
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
            {/* Logo FERMÉ (état membre) + nom officiel + slogan officiel (images charte exactes) */}
            <Logo variant="closed" size={44} withWordmark withSlogan />
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
              <li><SmartLink redirKey="nav_acheter" fallback="/acheter">Acheter</SmartLink></li>
              <li><SmartLink redirKey="nav_louer" fallback="/louer">Louer</SmartLink></li>
              <li><SmartLink redirKey="nav_devis" fallback="/devis">Devis Garage</SmartLink></li>
              <li><SmartLink redirKey="nav_garages" fallback="/garages">Réseau de garages</SmartLink></li>
              <li><SmartLink redirKey="bouton_abonnements" fallback="/abonnements">Abonnements</SmartLink></li>
              <li><SmartLink redirKey="bouton_mission" fallback="/mission">Notre Mission</SmartLink></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-800">Aide & légal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><SmartLink redirKey="bouton_aide" fallback="/aide">Centre d'aide / FAQ</SmartLink></li>
              <li><SmartLink redirKey="bouton_confiance" fallback="/confiance">Centre de confiance</SmartLink></li>
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
      {/* Bascule dynamique de l'icône PWA / favicon selon état d'authentification */}
      <DynamicPWAIcon />
      <Header />
      {/* Spacer pour compenser le header fixe (même décalage que le header). */}
      <div className="h-[72px]" style={{ marginTop: standaloneTopOffset() }} />
      <BackButton />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
