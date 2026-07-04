/**
 * MKA.P-MS — Moteur de redirection intelligent (Règle 11)
 *
 * Analyse le profil de l'utilisateur et son comportement pour proposer
 * automatiquement le bon domaine sans que l'utilisateur ait à réfléchir.
 *
 * Règles de redirection :
 *   - Particulier qui cherche à vendre → mkapms.fr
 *   - Concessionnaire / API / flotte → mkapms.pro
 *   - Utilisateur hors France → mkapms.site (avec sélecteur pays)
 *   - Professionnel (role=pro/vendeur/garage) sur .fr → suggère .pro
 *
 * Le moteur ne force jamais la redirection : il propose une bannière discrète.
 * L'utilisateur reste maître de son choix.
 */

import { useEffect, useState } from "react";
import { useDomain } from "../lib/domain";
import { useAuth } from "../lib/auth";
import { X, ArrowRight, Building2, Globe } from "lucide-react";

const STORAGE_KEY = "mkapms_smart_router_dismissed";
const DISMISSED_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

interface Suggestion {
  targetDomain: "fr" | "pro" | "site";
  targetHost: string;
  icon: typeof Building2;
  title: string;
  reason: string;
  cta: string;
}

/**
 * Détermine si la suggestion a déjà été rejetée récemment.
 */
function isDismissed(key: string): boolean {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${key}`);
    if (!raw) return false;
    const ts = Number(raw);
    return Date.now() - ts < DISMISSED_TTL_MS;
  } catch {
    return false;
  }
}

function dismiss(key: string): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, String(Date.now()));
  } catch {}
}

/**
 * Détecte le pays de l'utilisateur via l'API de géolocalisation IP (légère, sans clé).
 * Retourne le code pays ISO 2 ou null si indisponible.
 */
async function detectCountryCode(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.country_code || null;
  } catch {
    return null;
  }
}

export default function SmartRouter() {
  const { key: currentDomain } = useDomain();
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      // Attendre 2s pour laisser la page se charger
      await new Promise((r) => setTimeout(r, 2000));
      if (cancelled) return;

      // ── Règle 1 : Professionnel sur .fr → suggérer .pro ──────────────────
      if (
        currentDomain === "fr" &&
        user &&
        ["pro", "vendeur", "garage", "loueur", "admin"].includes(user.role ?? "")
      ) {
        const key = `pro_suggestion_${user.id}`;
        if (!isDismissed(key)) {
          setSuggestion({
            targetDomain: "pro",
            targetHost: "mkapms.pro",
            icon: Building2,
            title: "Vous êtes un professionnel",
            reason: "MKA.P-MS Pro est fait pour vous : Garage+, Atelier Pro, Flotte, API et outils B2B.",
            cta: "Accéder à MKA.P-MS Pro",
          });
          setVisible(true);
          return;
        }
      }

      // ── Règle 2 : Utilisateur hors France sur .fr → suggérer .site ───────
      if (currentDomain === "fr") {
        const countryCode = await detectCountryCode();
        if (cancelled) return;
        if (countryCode && countryCode !== "FR") {
          const key = `site_suggestion_${countryCode}`;
          if (!isDismissed(key)) {
            setSuggestion({
              targetDomain: "site",
              targetHost: "mkapms.site",
              icon: Globe,
              title: `Vous semblez être hors de France (${countryCode})`,
              reason: "MKA.P-MS World vous propose votre pays, votre langue et votre devise.",
              cta: "Accéder à MKA.P-MS World",
            });
            setVisible(true);
            return;
          }
        }
      }

      // ── Règle 3 : Particulier sur .pro → suggérer .fr ────────────────────
      if (
        currentDomain === "pro" &&
        user &&
        user.role === "user"
      ) {
        const key = `fr_suggestion_${user.id}`;
        if (!isDismissed(key)) {
          setSuggestion({
            targetDomain: "fr",
            targetHost: "mkapms.fr",
            icon: Globe,
            title: "Vous êtes un particulier",
            reason: "MKA.P-MS France est la plateforme idéale pour acheter, vendre ou louer votre véhicule.",
            cta: "Accéder à MKA.P-MS France",
          });
          setVisible(true);
          return;
        }
      }
    }

    analyze();
    return () => { cancelled = true; };
  }, [currentDomain, user]);

  function handleAccept() {
    if (!suggestion) return;
    const token = localStorage.getItem("token") || sessionStorage.getItem("token") || null;
    const isLocal = window.location.hostname === "localhost" || window.location.hostname.includes("127.");
    if (isLocal) {
      setVisible(false);
      return;
    }
    const sep = "?";
    const url = token
      ? `${window.location.protocol}//${suggestion.targetHost}${sep}_t=${encodeURIComponent(token)}`
      : `${window.location.protocol}//${suggestion.targetHost}`;
    window.location.href = url;
  }

  function handleDismiss() {
    if (!suggestion) return;
    const key = suggestion.targetDomain === "pro"
      ? `pro_suggestion_${user?.id ?? "anon"}`
      : suggestion.targetDomain === "site"
      ? `site_suggestion_anon`
      : `fr_suggestion_${user?.id ?? "anon"}`;
    dismiss(key);
    setVisible(false);
    setSuggestion(null);
  }

  if (!visible || !suggestion) return null;

  const Icon = suggestion.icon;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className="rounded-2xl border border-[#D4AF37]/30 bg-white shadow-2xl overflow-hidden">
        {/* Barre dorée en haut */}
        <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#F0D060] to-[#D4AF37]" />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#111]">{suggestion.title}</p>
              <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{suggestion.reason}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-lg hover:bg-slate-100 transition text-slate-400"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] py-2 text-xs font-bold text-[#111] hover:bg-[#C9A227] transition"
            >
              {suggestion.cta}
              <ArrowRight size={12} />
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition"
            >
              Rester ici
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
