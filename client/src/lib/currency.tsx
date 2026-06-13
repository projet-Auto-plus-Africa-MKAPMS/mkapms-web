import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CURRENCIES, currencyForCountry, formatPrice } from "@shared/currency";
import { useAuth } from "./auth";

const PREF_KEY = "mkapms_currency";

// Devine le pays à partir de la locale du navigateur (ex. "fr-FR" -> "FR").
function guessCountryFromBrowser(): string | null {
  const loc = typeof navigator !== "undefined" ? navigator.language : "";
  const region = loc?.split("-")[1];
  return region ? region.toUpperCase() : null;
}

interface CurrencyCtx {
  currency: string;
  setCurrency: (c: string) => void;
  format: (amountEur: number) => string;
  auto: boolean; // true si la devise suit automatiquement le pays
}

const Ctx = createContext<CurrencyCtx>({
  currency: "EUR",
  setCurrency: () => {},
  format: (a) => formatPrice(a, "EUR"),
  auto: true,
});

// Devise automatique selon le pays de l'utilisateur (§8.6 — exigence forte,
// appliquée partout : annonces, location, abonnements, devis).
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [manual, setManual] = useState<string | null>(() => localStorage.getItem(PREF_KEY));

  // Devise déduite automatiquement : pays du compte > locale navigateur > EUR.
  const autoCurrency = useMemo(() => {
    const country = (user as { country?: string | null } | null)?.country ?? guessCountryFromBrowser();
    return currencyForCountry(country);
  }, [user]);

  const currency = manual && CURRENCIES[manual] ? manual : autoCurrency;

  function setCurrency(c: string) {
    setManual(c);
    localStorage.setItem(PREF_KEY, c);
  }

  useEffect(() => {
    // Si l'utilisateur n'a jamais choisi manuellement, on reste en mode auto.
  }, [autoCurrency]);

  const value = useMemo<CurrencyCtx>(
    () => ({ currency, setCurrency, format: (a: number) => formatPrice(a, currency), auto: !manual }),
    [currency, manual],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  return useContext(Ctx);
}
