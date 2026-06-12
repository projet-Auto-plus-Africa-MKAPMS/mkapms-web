import { z } from "zod";
import { sql } from "drizzle-orm";
import { router, publicProcedure } from "../trpc.js";
import { db } from "../db.js";
import { annonces, garagesPublics, users } from "../schema.js";
import { currencyForCountry, CURRENCIES } from "@shared/currency.js";

export const metaRouter = router({
  // Détection de devise selon le pays (§8.6)
  currency: publicProcedure
    .input(z.object({ country: z.string().optional() }))
    .query(({ input }) => {
      const code = currencyForCountry(input.country);
      return { currency: code, def: CURRENCIES[code] };
    }),

  // Chiffres clés page d'accueil (§1.2)
  homeStats: publicProcedure.query(async () => {
    const [{ vehicules }] = await db
      .select({ vehicules: sql<number>`count(*)::int` })
      .from(annonces);
    const [{ garages }] = await db
      .select({ garages: sql<number>`count(*)::int` })
      .from(garagesPublics);
    const [{ membres }] = await db
      .select({ membres: sql<number>`count(*)::int` })
      .from(users);
    return {
      vehicules: Math.max(vehicules, 0),
      garages: Math.max(garages, 0),
      membres: Math.max(membres, 0),
      pays: 200,
    };
  }),

  // Identité légale (footer / mentions)
  legal: publicProcedure.query(() => ({
    raisonSociale: "MKA.P-MS — Auto Plus Africa",
    forme: "SASU",
    capital: "2 500 €",
    siege: "14 Rue du petit Viarmes, 95270 Belloy-en-France, France",
    siren: "932 217 896",
    siret: "932 217 896 00012",
    tva: "FR43932217896",
    rcs: "Pontoise B 932 217 896",
    ape: "4520A",
    telephone: "+33 7 62 44 51 42",
    email: "mka.garageauto@gmail.com",
    whatsapp: "+33 7 62 44 51 42",
    directeur: "M. KAS Mohamed, Président",
  })),
});
