import { router, publicProcedure } from "../trpc.js";
import { CURRENCIES } from "@shared/currency.js";

// Multi-devises (Partie B §5) : taux de change récupérés DYNAMIQUEMENT, avec
// pivot EUR. Cache mémoire 1 h + repli sur les taux statiques si l'API échoue
// (la plateforme ne tombe jamais à cause d'un fournisseur de taux externe).

interface RatesCache {
  fetchedAt: number;
  rates: Record<string, number>; // 1 EUR = X devise
  live: boolean;
}

const ONE_HOUR = 60 * 60 * 1000;
let cache: RatesCache | null = null;

function staticRates(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [code, def] of Object.entries(CURRENCIES)) out[code] = def.rateFromEur;
  return out;
}

async function fetchLiveRates(): Promise<RatesCache> {
  const codes = Object.keys(CURRENCIES).filter((c) => c !== "EUR");
  try {
    // Fournisseur gratuit sans clé ; base EUR.
    const url = `https://open.er-api.com/v6/latest/EUR`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) throw new Error("réponse invalide");
    const rates: Record<string, number> = { EUR: 1 };
    for (const code of codes) {
      rates[code] = data.rates[code] ?? CURRENCIES[code].rateFromEur;
    }
    return { fetchedAt: Date.now(), rates, live: true };
  } catch {
    return { fetchedAt: Date.now(), rates: staticRates(), live: false };
  }
}

export const currencyRouter = router({
  // Catalogue des devises supportées (symbole, locale).
  list: publicProcedure.query(() => CURRENCIES),

  // Taux de change dynamiques (1 EUR = X), avec cache et repli.
  rates: publicProcedure.query(async () => {
    if (!cache || Date.now() - cache.fetchedAt > ONE_HOUR) {
      cache = await fetchLiveRates();
    }
    return { base: "EUR", rates: cache.rates, live: cache.live, fetchedAt: cache.fetchedAt };
  }),
});
