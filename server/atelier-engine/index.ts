/**
 * Moteur d'Atelier — routes.
 *
 * Toute écriture est réservée à un compte professionnel, et bornée aux garages
 * que ce compte possède réellement : un professionnel ne valide pas un dossier
 * ni un stock qui n'est pas le sien.
 */
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "../db.js";
import { garagesPublics, rdvGarage } from "../schema.js";
import { pdgProcedure, proProcedure, router } from "../trpc.js";
import {
  alertesStock,
  enregistrerStock,
  enregistrerValidation,
  etat,
  listerStock,
  mouvementsStock,
  reportsRdv,
  validationsDossier,
  validationsGarages,
} from "./service.js";

export const ATELIER_ENGINE_META = {
  code: "atelier",
  name: "MKA.P-MS Moteur d'Atelier",
  role: "Enregistre les validations d'atelier et de contrôle qualité, tient le stock de pièces d'un garage et trace les reports de rendez-vous.",
} as const;

/** Garages réellement possédés par le compte courant. */
async function mesGarages(userId: number) {
  return db
    .select({ id: garagesPublics.id, name: garagesPublics.name })
    .from(garagesPublics)
    .where(eq(garagesPublics.ownerId, userId));
}

async function garageAutorise(userId: number, garageId: number | undefined) {
  const miens = await mesGarages(userId);
  if (garageId == null) return { garageId: miens[0]?.id, miens };
  if (!miens.some((g) => g.id === garageId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Ce garage n'appartient pas à votre compte professionnel.",
    });
  }
  return { garageId, miens };
}

/** Le garage sur lequel écrire, ou un refus explicite s'il n'y en a aucun. */
async function garageObligatoire(userId: number, garageId: number | undefined): Promise<number> {
  const resolu = (await garageAutorise(userId, garageId)).garageId;
  if (resolu == null) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Aucun garage n'est rattaché à votre compte : créez d'abord votre fiche garage, l'atelier travaille toujours au nom d'un garage.",
    });
  }
  return resolu;
}

const pointSchema = z.object({
  libelle: z.string().min(1).max(200),
  conforme: z.boolean(),
  remarque: z.string().max(500).optional(),
});

export const atelierEngineRouter = router({
  /** Garages du compte : sert aux écrans à ne proposer que le périmètre réel. */
  mesGarages: proProcedure.query(({ ctx }) => mesGarages(ctx.user.uid)),

  /**
   * Validation interne ou contrôle qualité réellement enregistré.
   * La conformité est calculée à partir des points cochés, pas déclarée.
   */
  enregistrerValidation: proProcedure
    .input(
      z.object({
        garageId: z.number().int().positive().optional(),
        dossier: z.string().min(1).max(96),
        type: z.enum(["validation_interne", "controle_qualite"]),
        etape: z.string().max(96).optional(),
        points: z.array(pointSchema).min(1).max(50),
        remarque: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const garageId = await garageObligatoire(ctx.user.uid, input.garageId);
      return enregistrerValidation({
        garageId,
        dossier: input.dossier,
        type: input.type,
        etape: input.etape,
        points: input.points,
        remarque: input.remarque,
        validePar: ctx.user.uid,
      });
    }),

  validationsDossier: proProcedure
    .input(z.object({ dossier: z.string().min(1).max(96) }))
    .query(async ({ input, ctx }) => {
      const miens = await mesGarages(ctx.user.uid);
      return validationsDossier(
        input.dossier,
        miens.map((g) => g.id),
      );
    }),

  mesValidations: proProcedure
    .input(
      z
        .object({ type: z.enum(["validation_interne", "controle_qualite"]).optional() })
        .default({}),
    )
    .query(async ({ input, ctx }) => {
      const miens = await mesGarages(ctx.user.uid);
      return validationsGarages(
        miens.map((g) => g.id),
        input.type,
      );
    }),

  /* ------------------------------------------------------------- stock */

  stock: proProcedure.query(async ({ ctx }) => {
    const miens = await mesGarages(ctx.user.uid);
    const lignes = await listerStock(miens.map((g) => g.id));
    const alertes = lignes.filter((l) => l.seuil > 0 && l.quantite <= l.seuil);
    return { garages: miens, lignes, alertes };
  }),

  enregistrerStock: proProcedure
    .input(
      z.object({
        garageId: z.number().int().positive().optional(),
        reference: z.string().min(1).max(96),
        designation: z.string().min(1).max(200),
        quantite: z.number().int().min(0).max(1_000_000),
        seuil: z.number().int().min(0).max(1_000_000).optional(),
        prixAchatCents: z.number().int().min(0).optional(),
        prixVenteCents: z.number().int().min(0).optional(),
        emplacement: z.string().max(96).optional(),
        motif: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const garageId = await garageObligatoire(ctx.user.uid, input.garageId);
      return enregistrerStock({ ...input, garageId, parUser: ctx.user.uid });
    }),

  mouvementsStock: proProcedure
    .input(z.object({ stockId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const miens = await mesGarages(ctx.user.uid);
      return mouvementsStock(
        input.stockId,
        miens.map((g) => g.id),
      );
    }),

  alertesStock: proProcedure.query(async ({ ctx }) => {
    const miens = await mesGarages(ctx.user.uid);
    return alertesStock(miens.map((g) => g.id));
  }),

  /**
   * Historique des reports d'un rendez-vous. Le rendez-vous doit appartenir à
   * un garage du compte : sinon un identifiant deviné exposerait le planning
   * d'un autre atelier.
   */
  reportsRdv: proProcedure
    .input(z.object({ rdvId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const miens = await mesGarages(ctx.user.uid);
      if (miens.length === 0) return [];
      const [ligne] = await db
        .select({ id: rdvGarage.id })
        .from(rdvGarage)
        .where(
          and(
            eq(rdvGarage.id, input.rdvId),
            inArray(
              rdvGarage.garageId,
              miens.map((g) => g.id),
            ),
          ),
        )
        .limit(1);
      if (!ligne) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ce rendez-vous appartient à un garage qui n'est pas le vôtre.",
        });
      }
      return reportsRdv(input.rdvId);
    }),

  /** Lecture de direction : ce que le moteur a réellement enregistré. */
  etat: pdgProcedure.query(() => etat()),
});
