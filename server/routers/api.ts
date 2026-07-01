/**
 * Router API Integration — MKA.P-MS
 * 
 * Endpoints pour :
 * - Dashboard API (quotas, historique)
 * - Lookup plaque/VIN ameliore
 * - Estimation vehicule
 * - Geolocalisation
 */

import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import {
  getApiDashboard,
  lookupPlateVin,
  estimateVehicle,
  geocodeAddress,
} from "../services/apiIntegration";

export const apiRouter = router({
  // Dashboard API — visible uniquement pour admin/PDG
  dashboard: adminProcedure.query(() => getApiDashboard()),

  // Lookup plaque/VIN ameliore — renvoie plus de champs
  lookupVehicle: protectedProcedure
    .input(z.object({
      type: z.enum(["plaque", "vin"]),
      query: z.string().min(1).max(30),
    }))
    .query(async ({ input }) => lookupPlateVin(input.type, input.query)),

  // Estimation de prix
  estimate: protectedProcedure
    .input(z.object({
      marque: z.string().min(1),
      modele: z.string().min(1),
      annee: z.number().min(1900).max(2030),
      km: z.number().min(0),
      carburant: z.string().optional(),
      boite: z.string().optional(),
    }))
    .query(async ({ input }) => estimateVehicle(input)),

  // Geolocalisation
  geocode: protectedProcedure
    .input(z.object({ address: z.string().min(1) }))
    .query(async ({ input }) => geocodeAddress(input.address)),
});
