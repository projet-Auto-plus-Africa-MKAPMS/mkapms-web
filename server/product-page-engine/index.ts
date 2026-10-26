/**
 * Product Page Engine — router tRPC. Un seul moteur, un seul appel : la
 * fiche produit (Vehicule.tsx) demande sa configuration ici, jamais en
 * recalculant elle-même le type (vente_normale/sur_commande/
 * constructeur_mkapms) depuis plusieurs champs épars.
 */
import { z } from "zod";
import { publicProcedure, router } from "../trpc.js";
import { PRODUCT_PAGE_ENGINE_META } from "./contract.js";
import { VERSION, controlCenterFeed, dashboard, healthStatus, obtenirConfigurationPageProduit } from "./service.js";

export const productPageEngineRouter = router({
  meta: publicProcedure.query(() => ({ ...PRODUCT_PAGE_ENGINE_META, version: VERSION })),
  // healthStatus/controlCenterFeed volontairement sans authentification
  // (sondés par l'Engine Registry / le Système Intelligent, règle MOS #13).
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: publicProcedure.query(() => dashboard()),

  // Appelé par Vehicule.tsx (fiche produit publique) — jamais une donnée
  // confidentielle : la configuration ne porte que des indicateurs
  // d'affichage, jamais un prix fournisseur ni une marge.
  config: publicProcedure
    .input(z.object({ annonceId: z.number().int().positive() }))
    .query(({ input }) => obtenirConfigurationPageProduit(input.annonceId)),
});

// Pas de schema.ts dédié : ce moteur ne possède aucune table en propre,
// il lit uniquement les colonnes `annonces.*` déjà déclarées dans le
// schéma partagé (server/schema.ts) — jamais une duplication de table.
export * as productPageEngineContract from "./contract.js";
export { PRODUCT_PAGE_ENGINE_META };
