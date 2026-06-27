import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CURRENCIES, currencyForCountry, formatPrice } from "@shared/currency";
import { useAuth } from "./auth";
import { trpc } from "./trpc";

const CURRENCY_KEY = "mkapms_currency";
const COUNTRY_KEY = "mkapms_country"; // Partie B §5 : mémorisation du pays choisi.

// Devine le pays à partir de la locale du navigateur (ex. "fr-FR" -> "FR").
function guessCountryFromBrowser(): string | null {
  const loc = typeof navigator !== "undefined" ? navigator.language : "";
  const region = loc?.split("-")[1];
  return region ? region.toUpperCase() : null;
}

interface CurrencyCtx {
  currency: string;
  country: string | null;
  setCurrency: (c: string) => void;
  setCountry: (c: string) => void;
  format: (amountEur: number) => string;
  auto: boolean; // true si la devise suit automatiquement le pays
  live: boolean; // true si les taux proviennent du fournisseur en direct
}

const Ctx = createContext<CurrencyCtx>({
  currency: "EUR",
  country: null,
  setCurrency: () => {},
  setCountry: () => {},
  format: (a) => formatPrice(a, "EUR"),
  auto: true,
  live: false,
});

// Devise automatique selon le pays (Partie B §5 — exigence forte, appliquée
// partout : annonces, location, abonnements, devis). Taux dynamiques avec repli.
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [manual, setManual] = useState<string | null>(() => localStorage.getItem(CURRENCY_KEY));
  const [country, setCountryState] = useState<string | null>(() => localStorage.getItem(COUNTRY_KEY));

  // Taux récupérés dynamiquement (router currency.rates), pivot EUR, cache serveur 1 h.
  const ratesQuery = trpc.currency.rates.useQuery(undefined, {
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Pays effectif : choix mémorisé > pays du compte > locale navigateur.
  const effectiveCountry = useMemo(() => {
    return (
      country ??
      (user as { country?: string | null } | null)?.country ??
      guessCountryFromBrowser()
    );
  }, [country, user]);

  const autoCurrency = useMemo(() => currencyForCountry(effectiveCountry), [effectiveCountry]);
  const currency = manual && CURRENCIES[manual] ? manual : autoCurrency;

  function setCurrency(c: string) {
    setManual(c);
    localStorage.setItem(CURRENCY_KEY, c);
  }
  function setCountry(c: string) {
    setCountryState(c);
    localStorage.setItem(COUNTRY_KEY, c);
    // Si l'utilisateur n'a pas forcé une devise, on suit le pays.
    if (!manual) localStorage.removeItem(CURRENCY_KEY);
  }

  const liveRates = ratesQuery.data?.rates ?? null;
  const live = ratesQuery.data?.live ?? false;

  // Conversion : taux en direct si dispo, sinon repli sur les taux statiques.
  function format(amountEur: number): string {
    const rate = liveRates?.[currency];
    const def = CURRENCIES[currency] || CURRENCIES.EUR;
    if (rate == null) return formatPrice(amountEur, currency);
    const noDecimals = ["XOF", "XAF", "GNF", "DZD"].includes(def.code);
    return new Intl.NumberFormat(def.locale, {
      style: "currency",
      currency: def.code,
      maximumFractionDigits: noDecimals ? 0 : 2,
    }).format(amountEur * rate);
  }

  const value = useMemo<CurrencyCtx>(
    () => ({ currency, country: effectiveCountry, setCurrency, setCountry, format, auto: !manual, live }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency, manual, effectiveCountry, liveRates, live],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  return useContext(Ctx);
}
