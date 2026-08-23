/**
 * Vehicle Delivery Engine (livraison de véhicules) — router tRPC.
 *
 * Le devis est public : un acheteur doit connaître le coût d'acheminement avant
 * de payer un véhicule. La gouvernance des barèmes et l'activation des options
 * premium restent réservées à la direction : un prix affiché engage l'entreprise.
 */
import { z } from "zod";
import {
  directionProcedure,
  pdgProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../trpc.js";
import { VD_CATEGORIES, VD_ETAPES, VD_MODES } from "./schema.js";
import {
  accepterDevis,
  baremes,
  catalogue,
  controlCenterFeed,
  devis,
  enregistrerOption,
  enregistrerTarif,
  expeditionsDuClient,
  marquerEtape,
} from "./service.js";

export const VEHICLE_DELIVERY_META = {
  code: "livraison_vehicule",
  name: "Vehicle Delivery Engine",
  role:
    "Acheminement des véhicules : modes de transport, étapes, prix par étape et total, avec la qualité réelle du prix (confirmé, estimé, à confirmer, non mesuré).",
} as const;

const devisInput = z.object({
  annonceId: z.number().int().positive().nullable().optional(),
  mode: z.enum(VD_MODES).nullable().optional(),
  categorie: z.enum(VD_CATEGORIES).nullable().optional(),
  paysDepart: z.string().max(4).nullable().optional(),
  paysArrivee: z.string().max(4).nullable().optional(),
  villeDepart: z.string().max(120).nullable().optional(),
  villeArrivee: z.string().max(120).nullable().optional(),
  distanceKm: z.number().positive().max(40000).nullable().optional(),
});

export const vehicleDeliveryRouter = router({
  catalogue: publicProcedure.query(() => catalogue()),

  devis: publicProcedure.input(devisInput).query(async ({ input }) => devis(input)),

  accepter: protectedProcedure
    .input(devisInput.extend({ mode: z.enum(VD_MODES) }))
    .mutation(async ({ ctx, input }) =>
      accepterDevis({
        clientId: ctx.user.uid,
        annonceId: input.annonceId ?? null,
        mode: input.mode,
        categorie: input.categorie ?? null,
        paysDepart: input.paysDepart ?? null,
        paysArrivee: input.paysArrivee ?? null,
        villeDepart: input.villeDepart ?? null,
        villeArrivee: input.villeArrivee ?? null,
        distanceKm: input.distanceKm ?? null,
      }),
    ),

  mesExpeditions: protectedProcedure.query(async ({ ctx }) => expeditionsDuClient(ctx.user.uid)),

  marquerEtape: directionProcedure
    .input(
      z.object({
        expeditionId: z.number().int().positive(),
        etape: z.enum(VD_ETAPES),
        statut: z.enum(["attendu", "en_cours", "fait", "bloque"]),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => marquerEtape({ ...input, auteurId: ctx.user.uid })),

  baremes: directionProcedure.query(() => baremes()),

  enregistrerTarif: pdgProcedure
    .input(
      z.object({
        id: z.number().int().positive().optional(),
        mode: z.enum(VD_MODES),
        categorie: z.enum(VD_CATEGORIES),
        etape: z.enum(VD_ETAPES).default("transport_principal"),
        paysDepart: z.string().max(4).nullable().optional(),
        paysArrivee: z.string().max(4).nullable().optional(),
        prixFixe: z.number().min(0).default(0),
        prixParKm: z.number().min(0).default(0),
        prixMinimum: z.number().min(0).default(0),
        devise: z.string().max(4).default("EUR"),
        delaiJoursMin: z.number().int().min(0).max(365).nullable().optional(),
        delaiJoursMax: z.number().int().min(0).max(365).nullable().optional(),
        origine: z.enum(["interne", "transporteur"]).default("interne"),
        transporteur: z.string().max(120).nullable().optional(),
        source: z.string().max(2000).default(""),
        verifie: z.boolean().default(false),
        actif: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => enregistrerTarif({ ...input, actorId: ctx.user.uid })),

  enregistrerOption: pdgProcedure
    .input(
      z.object({
        code: z.string().min(2).max(48),
        label: z.string().min(2).max(120),
        description: z.string().max(2000).default(""),
        prixFixe: z.number().min(0).nullable().optional(),
        prixPourcent: z.number().min(0).max(200).nullable().optional(),
        devise: z.string().max(4).default("EUR"),
        premium: z.boolean().default(false),
        actif: z.boolean().default(false),
        verifie: z.boolean().default(false),
        motif: z.string().max(2000).default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => enregistrerOption({ ...input, actorId: ctx.user.uid })),

  etatMoteur: directionProcedure.query(() => controlCenterFeed()),
});

export { controlCenterFeed, devis } from "./service.js";
export type { Devis, LigneEtape, LigneOption } from "./service.js";
