/**
 * MKA.P-MS — Sélecteur de domaine (Règle 5)
 *
 * Composant visible dans le header.
 * Le changement de domaine préserve la session JWT (token stocké en localStorage).
 * L'utilisateur n'est JAMAIS déconnecté lors du changement de domaine.
 *
 * Affichage :
 *   🇫🇷 France      → mkapms.fr
 *   🏢 Professionnels → mkapms.pro
 *   🌍 International  → mkapms.site
 */

import { useState, useRef, useEffect } from "react";
import { useDomain } from "../lib/domain";
import type { DomainKey } from "../lib/domain";
import { Globe, ChevronDown, Building2 } from "lucide-react";

interface DomainOption {
  key: DomainKey;
  label: string;
  sublabel: string;
  flag: string;
  host: string;
}

const DOMAIN_OPTIONS: DomainOption[] = [
  {
    key: "fr",
    label: "France",
    sublabel: "Particuliers & Pros",
    flag: "🇫🇷",
    host: "mkapms.fr",
  },
  {
    key: "pro",
    label: "Professionnels",
    sublabel: "B2B · Flottes · API",
    flag: "🏢",
    host: "mkapms.pro",
  },
  {
    key: "site",
    label: "International",
    sublabel: "47 pays · 18 devises",
    flag: "🌍",
    host: "mkapms.site",
  },
];

/**
 * Construit l'URL de destination en préservant le chemin et le token JWT.
 * Le token est passé en query param ?_t= pour être récupéré par le domaine cible
 * et réinjecté dans localStorage sans redemander la connexion.
 */
function buildDomainUrl(targetHost: string, currentPath: string, token: string | null): string {
  const proto = window.location.protocol; // https: en prod
  const path = currentPath || "/";
  const base = `${proto}//${targetHost}${path}`;
  if (!token) return base;
  const sep = path.includes("?") ? "&" : "?";
  return `${base}${sep}_t=${encodeURIComponent(token)}`;
}

export default function DomainSelector() {
  const { key: currentKey } = useDomain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = DOMAIN_OPTIONS.find((o) => o.key === currentKey) ?? DOMAIN_OPTIONS[0];

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(option: DomainOption) {
    setOpen(false);
    if (option.key === currentKey) return;

    // Récupérer le token JWT pour le transmettre au domaine cible
    const token = localStorage.getItem("token") || sessionStorage.getItem("token") || null;
    const url = buildDomainUrl(option.host, window.location.pathname, token);

    // En développement local, on reste sur le même host
    const isLocal = window.location.hostname === "localhost" || window.location.hostname.includes("127.");
    if (isLocal) {
      // Simuler le changement sans quitter localhost
      window.location.href = `/?_domain=${option.key}`;
      return;
    }

    window.location.href = url;
  }

  return (
    <div ref={ref} className="relative">
      {/* Bouton principal */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition"
        aria-label="Changer de domaine"
        title="Changer de portail"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline text-xs font-semibold">{current.label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Changer de portail</p>
          </div>
          {DOMAIN_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => handleSelect(option)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F5F3EF] transition ${
                option.key === currentKey ? "bg-[#D4AF37]/5" : ""
              }`}
            >
              <span className="text-xl leading-none w-6 text-center">{option.flag}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${option.key === currentKey ? "text-[#D4AF37]" : "text-[#111]"}`}>
                  {option.label}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{option.sublabel}</p>
              </div>
              {option.key === currentKey && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              )}
            </button>
          ))}
          <div className="px-3 py-2 border-t border-slate-100 bg-[#F5F3EF]">
            <p className="text-[9px] text-slate-400 text-center">
              Même compte · Même données · Même sécurité
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
