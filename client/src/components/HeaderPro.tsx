/**
 * MKA.P-MS — Header du portail B2B (mkapms.pro / "/b2b")
 *
 * Distinct du header grand public (Layout.tsx) : deux niveaux, orientation
 * professionnelle, lien explicite de retour vers la plateforme principale.
 * Chaque rubrique pointe vers une page réellement construite — pas de menu
 * déroulant fictif tant que le contenu de ces sous-menus n'existe pas.
 */
import { Link, NavLink } from "react-router-dom";
import { ArrowLeftRight, Building2, Handshake, Truck, Star, HelpCircle } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../lib/auth";
import { useCurrency } from "../lib/currency";
import { CurrencySelect, NotificationsBell } from "./Layout";

const B2B_NAV = [
  { to: "/espace-pro", label: "Professionnels", icon: Building2 },
  { to: "/investissement", label: "Investisseurs", icon: Star },
  { to: "/partenaires", label: "Partenaires", icon: Handshake },
  { to: "/espace-transporteur", label: "Transport & Livraison", icon: Truck },
  { to: "/abonnements", label: "Abonnements", icon: Star },
  { to: "/aide", label: "Aide", icon: HelpCircle },
];

export default function HeaderPro() {
  const { user, logout } = useAuth();
  const { country } = useCurrency();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur text-white">
      {/* Ligne 1 : identité + compte */}
      <div className="border-b border-white/5">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/b2b" className="flex items-center gap-2" aria-label="MKA.P-MS Pro — Accueil">
            <Logo variant={user ? "closed" : "open"} size={26} withWordmark className="shrink-0" />
            <span className="hidden text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] sm:inline">Pro</span>
          </Link>
          <div className="flex items-center gap-2">
            {country && <span className="hidden text-xs text-white/50 md:inline">{country}</span>}
            <div className="hidden sm:block [&_select]:bg-white/5 [&_select]:text-white/80 [&_select]:border-white/15">
              <CurrencySelect />
            </div>
            <NotificationsBell />
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/compte" className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10">
                  {user.name?.split(" ")[0] || "Compte"}
                </Link>
                <button onClick={logout} className="text-xs text-white/50 hover:text-white">Quitter</button>
              </div>
            ) : (
              <Link to="/connexion" className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#111] hover:bg-[#C9A227]">
                Connexion
              </Link>
            )}
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 lg:flex"
            >
              <ArrowLeftRight size={13} />
              Plateforme principale
            </Link>
          </div>
        </div>
      </div>

      {/* Ligne 2 : navigation B2B */}
      <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-hide" aria-label="Navigation B2B">
        {B2B_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isActive ? "bg-[#D4AF37] text-[#111]" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <item.icon size={13} />
            {item.label}
          </NavLink>
        ))}
        <Link
          to="/"
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 lg:hidden"
        >
          <ArrowLeftRight size={13} />
          Plateforme principale
        </Link>
      </nav>
    </header>
  );
}
