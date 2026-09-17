/**
 * LOT 7 (suite) — Portail Fournisseur/Transporteur : surface tRPC.
 *
 * `monAcces` est la seule procédure ouverte aux rôles "supplier"/"carrier" :
 * elle résout STRICTEMENT le compte appelant (jamais un identifiant reçu du
 * client), et ne renvoie que le strict nécessaire à l'identification — rien
 * de comptable, rien de commercial, rien qui appartienne à la Direction.
 * L'octroi/l'activation/la révocation restent des décisions PDG (LOT 7 :
 * "jamais un onboarding automatique").
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, pdgProcedure, supplierCarrierProcedure } from "../trpc.js";
import { db } from "../db.js";
import { supplierConnections, supplierProfiles } from "../supplier-engine/schema.js";
import { CONNECTION_AUTH_TYPES, CONNECTION_ENVIRONMENTS } from "../supplier-engine/contract.js";
import { partners } from "../modules/operations.js";
import { grantSupplierAccess, grantCarrierAccess, activateAccess, revokeAccess, resolveAccess } from "../supplier-engine/access.js";
import {
  obtenirFournisseurDetail,
  ajouterContact,
  enregistrerConnexion,
  testerConnexion,
  definirMapping,
} from "../supplier-engine/service.js";

/** La fiche fournisseur de l'appelant, ou refus explicite — jamais un identifiant reçu du client. */
async function monSupplierProfileId(userId: number): Promise<number> {
  const acces = await resolveAccess(userId);
  if (!acces || acces.accountType !== "supplier" || !acces.supplierProfileId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Aucun accès fournisseur actif pour ce compte." });
  }
  return acces.supplierProfileId;
}

export const supplierPortalRouter = router({
  monAcces: supplierCarrierProcedure.query(async ({ ctx }) => {
    const acces = await resolveAccess(ctx.user.uid);
    if (!acces) return null;

    if (acces.accountType === "supplier" && acces.supplierProfileId) {
      const [fiche] = await db
        .select({ id: supplierProfiles.id, companyLegalName: supplierProfiles.companyLegalName, countryCode: supplierProfiles.countryCode, status: supplierProfiles.status })
        .from(supplierProfiles)
        .where(eq(supplierProfiles.id, acces.supplierProfileId))
        .limit(1);
      return { ...acces, fiche: fiche ?? null };
    }

    if (acces.accountType === "carrier" && acces.partnerId) {
      const [fiche] = await db
        .select({ id: partners.id, name: partners.name, country: partners.country })
        .from(partners)
        .where(eq(partners.id, acces.partnerId))
        .limit(1);
      return { ...acces, fiche: fiche ?? null };
    }

    return { ...acces, fiche: null };
  }),

  /**
   * Parcours réel au-delà du portail en lecture (LOT7 suite) : le fournisseur
   * configure et teste lui-même son propre flux de données, sans attendre
   * qu'un membre MKA.P-MS le fasse pour lui. Réutilise exactement le moteur
   * déjà réel et testé (supplier-engine/service.ts) — jamais un second
   * système de connexion. Ce qui reste hors de ce périmètre (vérification
   * KYB, contrat, territoires, activation/suspension) reste une décision
   * Direction, jamais déléguée ici.
   */
  monDetail: supplierCarrierProcedure.query(async ({ ctx }) => {
    const supplierProfileId = await monSupplierProfileId(ctx.user.uid);
    return obtenirFournisseurDetail(supplierProfileId);
  }),

  ajouterMonContact: supplierCarrierProcedure
    .input(
      z.object({
        kind: z.enum(["commercial", "technique", "comptabilite"]),
        name: z.string().max(160).optional(),
        email: z.string().email().max(255).optional(),
        phone: z.string().max(32).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supplierProfileId = await monSupplierProfileId(ctx.user.uid);
      return ajouterContact({ supplierProfileId, ...input });
    }),

  configurerMaConnexion: supplierCarrierProcedure
    .input(
      z.object({
        method: z.string().min(1).max(32),
        authType: z.enum(CONNECTION_AUTH_TYPES).optional(),
        environment: z.enum(CONNECTION_ENVIRONMENTS).optional(),
        endpointUrl: z.string().max(512).optional(),
        secretRef: z.string().max(128).optional(),
        rateLimitPerMinute: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supplierProfileId = await monSupplierProfileId(ctx.user.uid);
      return enregistrerConnexion({ supplierProfileId, actorId: ctx.user.uid, ...input });
    }),

  testerMaConnexion: supplierCarrierProcedure
    .input(z.object({ connectionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const supplierProfileId = await monSupplierProfileId(ctx.user.uid);
      const [connexion] = await db.select({ supplierProfileId: supplierConnections.supplierProfileId }).from(supplierConnections).where(eq(supplierConnections.id, input.connectionId)).limit(1);
      if (!connexion || connexion.supplierProfileId !== supplierProfileId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Connexion introuvable pour votre fiche fournisseur." });
      }
      return testerConnexion(input.connectionId, ctx.user.uid);
    }),

  definirMonMapping: supplierCarrierProcedure
    .input(
      z.object({
        entityType: z.enum(["vehicule", "piece"]),
        regles: z
          .array(
            z.object({
              canonicalField: z.string().max(64),
              supplierField: z.string().max(128),
              transform: z.record(z.string(), z.unknown()).optional(),
            }),
          )
          .max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supplierProfileId = await monSupplierProfileId(ctx.user.uid);
      return definirMapping({ supplierProfileId, entityType: input.entityType, regles: input.regles, actorId: ctx.user.uid });
    }),

  grantSupplier: pdgProcedure
    .input(z.object({ userId: z.number(), supplierProfileId: z.number() }))
    .mutation(({ ctx, input }) => grantSupplierAccess({ ...input, grantedBy: ctx.user.uid })),

  grantCarrier: pdgProcedure
    .input(z.object({ userId: z.number(), partnerId: z.number() }))
    .mutation(({ ctx, input }) => grantCarrierAccess({ ...input, grantedBy: ctx.user.uid })),

  activer: pdgProcedure.input(z.object({ userId: z.number() })).mutation(({ input }) => activateAccess(input.userId)),

  revoquer: pdgProcedure.input(z.object({ userId: z.number() })).mutation(({ ctx, input }) => revokeAccess(input.userId, ctx.user.uid)),
});
