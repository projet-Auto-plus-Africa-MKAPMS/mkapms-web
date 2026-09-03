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
import {
  annulerCommande,
  commanderFournisseur,
  deciderProposition,
  engagementDuMois,
  enregistrerReglages,
  listerCommandes,
  listerPropositions,
  proposerPourStock,
  proposerToutesLesRuptures,
  ReapproRefus,
  receptionnerCommande,
  reglages,
  STATUTS_PROPOSITION,
} from "./reappro.js";

export const ATELIER_ENGINE_META = {
  code: "atelier",
  name: "MKA.P-MS Moteur d'Atelier",
  role: "Enregistre les validations d'atelier et de contrôle qualité, tient le stock de pièces d'un garage, conduit le réapprovisionnement (seuil → proposition → décision → commande fournisseur sous plafond → réception) et trace les reports de rendez-vous.",
} as const;

/** Un refus métier du réapprovisionnement devient une erreur tRPC lisible, jamais un 500. */
async function reappro<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ReapproRefus) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

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

  /* ---------------------------------------------------- réapprovisionnement */

  /** Réglages (plafond mensuel, fournisseur habituel) + engagement du mois, pour un garage du compte. */
  reapproReglages: proProcedure
    .input(z.object({ garageId: z.number().int().positive().optional() }).default({}))
    .query(async ({ input, ctx }) => {
      const { garageId, miens } = await garageAutorise(ctx.user.uid, input.garageId);
      if (garageId == null) return { garages: miens, garageId: null, reglages: null, engageCents: 0 };
      return {
        garages: miens,
        garageId,
        reglages: await reglages(garageId),
        engageCents: await engagementDuMois(garageId),
      };
    }),

  enregistrerReapproReglages: proProcedure
    .input(
      z.object({
        garageId: z.number().int().positive().optional(),
        plafondMensuelCents: z.number().int().min(0).max(1_000_000_000),
        propositionAuto: z.boolean(),
        fournisseurNom: z.string().max(160).optional(),
        fournisseurEmail: z.string().email().max(200).optional(),
        fournisseurTelephone: z.string().max(40).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const garageId = await garageObligatoire(ctx.user.uid, input.garageId);
      return enregistrerReglages({ ...input, garageId, parUser: ctx.user.uid });
    }),

  /** Propositions des garages du compte, filtrables par statut. */
  propositions: proProcedure
    .input(z.object({ statuts: z.array(z.enum(STATUTS_PROPOSITION)).optional() }).default({}))
    .query(async ({ input, ctx }) => {
      const miens = await mesGarages(ctx.user.uid);
      return listerPropositions(
        miens.map((g) => g.id),
        input.statuts,
      );
    }),

  /** Ouvre à la main une proposition sur une ligne de stock du compte. */
  proposerReappro: proProcedure
    .input(z.object({ stockId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const miens = await mesGarages(ctx.user.uid);
      const lignes = await listerStock(miens.map((g) => g.id));
      if (!lignes.some((l) => l.id === input.stockId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cette ligne de stock n'est pas la vôtre." });
      }
      return reappro(() => proposerPourStock(input.stockId, "manuelle", ctx.user.uid));
    }),

  /** Ouvre une proposition pour chaque rupture actuelle des garages du compte. */
  proposerToutesRuptures: proProcedure.mutation(async ({ ctx }) => {
    const miens = await mesGarages(ctx.user.uid);
    return proposerToutesLesRuptures(
      miens.map((g) => g.id),
      ctx.user.uid,
    );
  }),

  /** Décision humaine : valider (quantité/prix ajustables) ou refuser (motif exigé). */
  deciderProposition: proProcedure
    .input(
      z.object({
        propositionId: z.number().int().positive(),
        decision: z.enum(["valider", "refuser"]),
        quantite: z.number().int().min(1).max(1_000_000).optional(),
        prixUnitaireCents: z.number().int().min(1).optional(),
        motif: z.string().max(300).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const miens = await mesGarages(ctx.user.uid);
      return reappro(() =>
        deciderProposition({ ...input, garageIds: miens.map((g) => g.id), parUser: ctx.user.uid }),
      );
    }),

  /** Commande fournisseur réelle, sur propositions validées, sous plafond mensuel. */
  commanderFournisseur: proProcedure
    .input(
      z.object({
        garageId: z.number().int().positive().optional(),
        propositionIds: z.array(z.number().int().positive()).min(1).max(100),
        fournisseurNom: z.string().max(160).optional(),
        fournisseurEmail: z.string().email().max(200).optional(),
        fournisseurTelephone: z.string().max(40).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const garageId = await garageObligatoire(ctx.user.uid, input.garageId);
      return reappro(() => commanderFournisseur({ ...input, garageId, parUser: ctx.user.uid }));
    }),

  commandesFournisseur: proProcedure.query(async ({ ctx }) => {
    const miens = await mesGarages(ctx.user.uid);
    return listerCommandes(miens.map((g) => g.id));
  }),

  /** Réception : le stock est réellement incrémenté, mouvement tracé par commande. */
  receptionnerCommande: proProcedure
    .input(
      z.object({
        commandeId: z.number().int().positive(),
        recues: z
          .array(z.object({ propositionId: z.number().int().positive(), quantite: z.number().int().min(0) }))
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const miens = await mesGarages(ctx.user.uid);
      return reappro(() =>
        receptionnerCommande({ ...input, garageIds: miens.map((g) => g.id), parUser: ctx.user.uid }),
      );
    }),

  annulerCommande: proProcedure
    .input(z.object({ commandeId: z.number().int().positive(), motif: z.string().min(3).max(300) }))
    .mutation(async ({ input, ctx }) => {
      const miens = await mesGarages(ctx.user.uid);
      return reappro(() =>
        annulerCommande({ ...input, garageIds: miens.map((g) => g.id), parUser: ctx.user.uid }),
      );
    }),

  /** Lecture de direction : ce que le moteur a réellement enregistré. */
  etat: pdgProcedure.query(() => etat()),
});
