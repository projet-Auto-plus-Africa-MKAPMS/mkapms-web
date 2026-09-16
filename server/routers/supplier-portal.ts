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
import { router, pdgProcedure, supplierCarrierProcedure } from "../trpc.js";
import { db } from "../db.js";
import { supplierProfiles } from "../supplier-engine/schema.js";
import { partners } from "../modules/operations.js";
import { grantSupplierAccess, grantCarrierAccess, activateAccess, revokeAccess, resolveAccess } from "../supplier-engine/access.js";

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

  grantSupplier: pdgProcedure
    .input(z.object({ userId: z.number(), supplierProfileId: z.number() }))
    .mutation(({ ctx, input }) => grantSupplierAccess({ ...input, grantedBy: ctx.user.uid })),

  grantCarrier: pdgProcedure
    .input(z.object({ userId: z.number(), partnerId: z.number() }))
    .mutation(({ ctx, input }) => grantCarrierAccess({ ...input, grantedBy: ctx.user.uid })),

  activer: pdgProcedure.input(z.object({ userId: z.number() })).mutation(({ input }) => activateAccess(input.userId)),

  revoquer: pdgProcedure.input(z.object({ userId: z.number() })).mutation(({ ctx, input }) => revokeAccess(input.userId, ctx.user.uid)),
});
