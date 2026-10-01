// Multi-devises (cahier des charges §8.6) — détection auto selon le pays.
// Taux indicatifs (1 EUR = X). À synchroniser avec un fournisseur de taux en prod.

export interface CurrencyDef {
  code: string;
  symbol: string;
  rateFromEur: number;
  locale: string;
}

export const CURRENCIES: Record<string, CurrencyDef> = {
  EUR: { code: "EUR", symbol: "€", rateFromEur: 1, locale: "fr-FR" },
  USD: { code: "USD", symbol: "$", rateFromEur: 1.08, locale: "en-US" },
  GBP: { code: "GBP", symbol: "£", rateFromEur: 0.85, locale: "en-GB" },
  CHF: { code: "CHF", symbol: "CHF", rateFromEur: 0.94, locale: "fr-CH" },
  XOF: { code: "XOF", symbol: "FCFA", rateFromEur: 655.957, locale: "fr-FR" },
  XAF: { code: "XAF", symbol: "FCFA", rateFromEur: 655.957, locale: "fr-FR" },
  MAD: { code: "MAD", symbol: "DH", rateFromEur: 10.8, locale: "fr-MA" },
  DZD: { code: "DZD", symbol: "DA", rateFromEur: 145, locale: "fr-DZ" },
  TND: { code: "TND", symbol: "DT", rateFromEur: 3.4, locale: "fr-TN" },
  GNF: { code: "GNF", symbol: "FG", rateFromEur: 9300, locale: "fr-FR" },
  CAD: { code: "CAD", symbol: "$", rateFromEur: 1.46, locale: "fr-CA" },
  NGN: { code: "NGN", symbol: "₦", rateFromEur: 1750, locale: "en-NG" },
  GHS: { code: "GHS", symbol: "₵", rateFromEur: 16, locale: "en-GH" },
  SAR: { code: "SAR", symbol: "﷼", rateFromEur: 4.05, locale: "ar-SA" },
  AED: { code: "AED", symbol: "د.إ", rateFromEur: 3.97, locale: "ar-AE" },
  QAR: { code: "QAR", symbol: "ر.ق", rateFromEur: 3.93, locale: "ar-QA" },
  CNY: { code: "CNY", symbol: "¥", rateFromEur: 7.8, locale: "zh-CN" },
  LYD: { code: "LYD", symbol: "LD", rateFromEur: 5.25, locale: "ar-LY" },
  EGP: { code: "EGP", symbol: "E£", rateFromEur: 52.5, locale: "ar-EG" },
  CDF: { code: "CDF", symbol: "FC", rateFromEur: 3100, locale: "fr-CD" },
  KWD: { code: "KWD", symbol: "د.ك", rateFromEur: 0.33, locale: "ar-KW" },
  MXN: { code: "MXN", symbol: "$", rateFromEur: 19.7, locale: "es-MX" },
  JPY: { code: "JPY", symbol: "¥", rateFromEur: 165, locale: "ja-JP" },
  INR: { code: "INR", symbol: "₹", rateFromEur: 90, locale: "en-IN" },
};

// Pays -> devise (couverture principale Europe + Afrique francophone)
export const COUNTRY_CURRENCY: Record<string, string> = {
  FR: "EUR", BE: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", PT: "EUR", LU: "EUR", NL: "EUR",
  CH: "CHF",
  US: "USD", GB: "GBP",
  SN: "XOF", CI: "XOF", ML: "XOF", BF: "XOF", BJ: "XOF", TG: "XOF", NE: "XOF",
  CM: "XAF", GA: "XAF", CG: "XAF", TD: "XAF",
  MA: "MAD", DZ: "DZD", TN: "TND", GN: "GNF", CA: "CAD",
  NG: "NGN", GH: "GHS", SA: "SAR", AE: "AED", QA: "QAR", CN: "CNY",
  LY: "LYD", EG: "EGP", CD: "CDF", KW: "KWD", MX: "MXN", JP: "JPY", IN: "INR",
};

export function currencyForCountry(country?: string | null): string {
  if (!country) return "EUR";
  return COUNTRY_CURRENCY[country.toUpperCase()] || "EUR";
}

export function convertFromEur(amountEur: number, currency: string): number {
  const def = CURRENCIES[currency] || CURRENCIES.EUR;
  return amountEur * def.rateFromEur;
}

export function formatPrice(amountEur: number, currency = "EUR"): string {
  const def = CURRENCIES[currency] || CURRENCIES.EUR;
  const value = convertFromEur(amountEur, currency);
  const noDecimals = ["XOF", "XAF", "GNF", "DZD", "CDF", "JPY"].includes(def.code);
  return new Intl.NumberFormat(def.locale, {
    style: "currency",
    currency: def.code,
    maximumFractionDigits: noDecimals ? 0 : 2,
  }).format(value);
}
