// Routers transverses Parties 7-18 : litiges, partenaires, entrepôts, pays,
// fidélité, coffre-fort numérique, dossier véhicule.
// Base unique : tout est relié aux mêmes users / logs / paiements.
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, adminProcedure, directionProcedure } from "../trpc.js";
import { db } from "../db.js";
import {
  disputes,
  disputeEvidence,
  partners,
  warehouses,
  warehouseMovements,
  countryConfigs,
  users,
  notifications,
  loyaltyAccounts,
  loyaltyTransactions,
  userDocuments,
  vehicleDossiers,
  vehicleDossierEvents,
} from "../schema.js";
import { logAction, clientMeta } from "../audit.js";
import { makeReference } from "../reference.js";

// ===================== PARTIE 18 — FIDÉLITÉ (Points MKA) =====================
// Paliers : seuil de points pour chaque niveau.
export const LOYALTY_TIERS = [
  { tier: "bronze" as const, min: 0 },
  { tier: "silver" as const, min: 500 },
  { tier: "gold" as const, min: 2000 },
  { tier: "platinum" as const, min: 5000 },
  { tier: "elite" as const, min: 15000 },
];

export function tierForPoints(points: number): "bronze" | "silver" | "gold" | "platinum" | "elite" {
  let current: "bronze" | "silver" | "gold" | "platinum" | "elite" = "bronze";
  for (const t of LOYALTY_TIERS) if (points >= t.min) current = t.tier;
  return current;
}

// Attribue des points (best-effort, ne bloque jamais l'action métier).
export async function awardPoints(
  userId: number,
  points: number,
  reason: string,
  refType?: string,
  refId?: number,
): Promise<void> {
  if (!userId || !points) return;
  try {
    await db.insert(loyaltyTransactions).values({ userId, points, reason, refType: refType ?? null, refId: refId ?? null });
    await db
      .insert(loyaltyAccounts)
      .values({ userId, points, tier: tierForPoints(points) })
      .onConflictDoUpdate({
        target: loyaltyAccounts.userId,
        set: {
          points: sql`${loyaltyAccounts.points} + ${points}`,
          updatedAt: new Date(),
        },
      });
    // Resynchronise le palier après cumul.
    const [acc] = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, userId)).limit(1);
    if (acc) {
      const t = tierForPoints(acc.points);
      if (t !== acc.tier) await db.update(loyaltyAccounts).set({ tier: t }).where(eq(loyaltyAccounts.userId, userId));
    }
  } catch (err) {
    console.error("[loyalty] award échec:", (err as Error).message);
  }
}

// ===================== PARTIE 8 — CENTRE DE LITIGES =====================
export const disputesRouter = router({
  // Mes litiges (utilisateur connecté).
  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(disputes)
      .where(eq(disputes.openedBy, ctx.user.uid))
      .orderBy(desc(disputes.createdAt));
  }),

  open: protectedProcedure
    .input(
      z.object({
        univers: z.enum(["vente", "location", "livraison", "pieces", "garage", "autre"]).default("autre"),
        category: z.string().min(2).max(64),
        description: z.string().min(5).max(2000),
        againstUserId: z.number().optional(),
        refType: z.string().max(32).optional(),
        refId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [d] = await db
        .insert(disputes)
        .values({
          openedBy: ctx.user.uid,
          againstUserId: input.againstUserId ?? null,
          univers: input.univers,
          category: input.category,
          description: input.description,
          refType: input.refType ?? null,
          refId: input.refId ?? null,
        })
        .returning();
      const reference = makeReference("L", d.id);
      await db.update(disputes).set({ reference }).where(eq(disputes.id, d.id));
      await logAction(ctx.user.uid, "dispute.open", "dispute", d.id, { univers: input.univers }, clientMeta(ctx.req));
      return { ...d, reference };
    }),

  addEvidence: protectedProcedure
    .input(
      z.object({
        disputeId: z.number(),
        kind: z.enum(["text", "photo", "document"]).default("text"),
        content: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.select().from(disputes).where(eq(disputes.id, input.disputeId)).limit(1);
      if (!d) throw new Error("Litige introuvable");
      await db.insert(disputeEvidence).values({
        disputeId: input.disputeId,
        userId: ctx.user.uid,
        kind: input.kind,
        content: input.content,
      });
      return { ok: true };
    }),

  evidence: protectedProcedure
    .input(z.object({ disputeId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(disputeEvidence)
        .where(eq(disputeEvidence.disputeId, input.disputeId))
        .orderBy(disputeEvidence.createdAt);
    }),

  // --- Back-office ---
  listAll: adminProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: disputes.id,
          reference: disputes.reference,
          openedBy: disputes.openedBy,
          againstUserId: disputes.againstUserId,
          univers: disputes.univers,
          category: disputes.category,
          description: disputes.description,
          status: disputes.status,
          resolution: disputes.resolution,
          amountRefunded: disputes.amountRefunded,
          createdAt: disputes.createdAt,
          openerEmail: users.email,
        })
        .from(disputes)
        .leftJoin(users, eq(users.id, disputes.openedBy))
        .orderBy(desc(disputes.createdAt));
      if (input?.status) return rows.filter((r) => r.status === input.status);
      return rows;
    }),

  decide: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["en_analyse", "resolu", "rembourse", "clos"]),
        resolution: z.string().max(2000).optional(),
        amountRefunded: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.select().from(disputes).where(eq(disputes.id, input.id)).limit(1);
      if (!d) throw new Error("Litige introuvable");
      await db
        .update(disputes)
        .set({
          status: input.status,
          resolution: input.resolution ?? d.resolution,
          amountRefunded: input.amountRefunded != null ? String(input.amountRefunded) : d.amountRefunded,
          decidedBy: ctx.user.uid,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(disputes.id, input.id));
      await db.insert(notifications).values({
        userId: d.openedBy,
        type: "dispute",
        title: `Litige ${d.reference ?? d.id} mis à jour`,
        body: `Nouveau statut : ${input.status}${input.resolution ? ` — ${input.resolution.slice(0, 80)}` : ""}`,
        url: "/compte",
      });
      await logAction(ctx.user.uid, `dispute.${input.status}`, "dispute", input.id, undefined, clientMeta(ctx.req));
      return { ok: true };
    }),
});

// ===================== PARTIE 15 — PARTENARIATS =====================
export const partnersRouter = router({
  list: adminProcedure.query(async () => {
    return db.select().from(partners).orderBy(desc(partners.createdAt));
  }),

  create: directionProcedure
    .input(
      z.object({
        name: z.string().min(2).max(160),
        type: z.enum([
          "fournisseur_vehicules", "fournisseur_pieces", "transporteur", "garage",
          "vtc", "depanneur", "lavage", "karting", "autre",
        ]).default("autre"),
        country: z.string().max(4).optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().max(32).optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [p] = await db.insert(partners).values({
        name: input.name,
        type: input.type,
        country: input.country ?? null,
        contactEmail: input.contactEmail ?? null,
        contactPhone: input.contactPhone ?? null,
        notes: input.notes ?? null,
      }).returning();
      await logAction(ctx.user.uid, "partner.create", "partner", p.id, { name: p.name }, clientMeta(ctx.req));
      return p;
    }),

  setActive: directionProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(partners).set({ active: input.active, updatedAt: new Date() }).where(eq(partners.id, input.id));
      await logAction(ctx.user.uid, "partner.set_active", "partner", input.id, { active: input.active }, clientMeta(ctx.req));
      return { ok: true };
    }),

  rate: directionProcedure
    .input(z.object({ id: z.number(), rating: z.number().min(0).max(5) }))
    .mutation(async ({ ctx, input }) => {
      await db.update(partners).set({ rating: String(input.rating), updatedAt: new Date() }).where(eq(partners.id, input.id));
      await logAction(ctx.user.uid, "partner.rate", "partner", input.id, { rating: input.rating }, clientMeta(ctx.req));
      return { ok: true };
    }),

  remove: directionProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(partners).where(eq(partners.id, input.id));
      await logAction(ctx.user.uid, "partner.delete", "partner", input.id, undefined, clientMeta(ctx.req));
      return { ok: true };
    }),
});

// ===================== PARTIE 10 — MULTI-ENTREPÔTS =====================
export const warehousesRouter = router({
  list: adminProcedure.query(async () => {
    return db.select().from(warehouses).orderBy(desc(warehouses.createdAt));
  }),

  create: directionProcedure
    .input(
      z.object({
        nom: z.string().min(2).max(160),
        countryCode: z.string().max(4).default("FR"),
        ville: z.string().max(96).optional(),
        adresse: z.string().max(500).optional(),
        responsable: z.string().max(160).optional(),
        type: z.enum(["vehicules", "pieces", "mixte"]).default("mixte"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [w] = await db.insert(warehouses).values({
        nom: input.nom,
        countryCode: input.countryCode.toUpperCase(),
        ville: input.ville ?? null,
        adresse: input.adresse ?? null,
        responsable: input.responsable ?? null,
        type: input.type,
      }).returning();
      await logAction(ctx.user.uid, "warehouse.create", "warehouse", w.id, { nom: w.nom }, clientMeta(ctx.req));
      return w;
    }),

  setActive: directionProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(warehouses).set({ active: input.active }).where(eq(warehouses.id, input.id));
      await logAction(ctx.user.uid, "warehouse.set_active", "warehouse", input.id, { active: input.active }, clientMeta(ctx.req));
      return { ok: true };
    }),

  movements: adminProcedure
    .input(z.object({ warehouseId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(warehouseMovements)
        .where(eq(warehouseMovements.warehouseId, input.warehouseId))
        .orderBy(desc(warehouseMovements.createdAt))
        .limit(input.limit);
    }),

  addMovement: adminProcedure
    .input(
      z.object({
        warehouseId: z.number(),
        kind: z.enum(["entree", "sortie"]).default("entree"),
        itemType: z.string().max(32).default("vehicule"),
        itemRef: z.string().max(128).optional(),
        quantity: z.number().min(1).default(1),
        note: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.insert(warehouseMovements).values({
        warehouseId: input.warehouseId,
        kind: input.kind,
        itemType: input.itemType,
        itemRef: input.itemRef ?? null,
        quantity: input.quantity,
        note: input.note ?? null,
        createdBy: ctx.user.uid,
      });
      await logAction(ctx.user.uid, `warehouse.${input.kind}`, "warehouse", input.warehouseId, { itemRef: input.itemRef }, clientMeta(ctx.req));
      return { ok: true };
    }),
});

// ===================== PARTIE 14 — PLAN AFRIQUE (config pays) =====================
export const countriesRouter = router({
  // Liste publique des pays actifs (pour l'auto-localisation devise/langue).
  listActive: publicProcedure.query(async () => {
    return db.select().from(countryConfigs).where(eq(countryConfigs.active, true)).orderBy(countryConfigs.name);
  }),

  listAll: adminProcedure.query(async () => {
    return db.select().from(countryConfigs).orderBy(countryConfigs.name);
  }),

  upsert: directionProcedure
    .input(
      z.object({
        code: z.string().min(2).max(4),
        name: z.string().min(2).max(96),
        currency: z.string().min(3).max(4).default("EUR"),
        importRules: z.string().max(2000).optional(),
        customsRules: z.string().max(2000).optional(),
        taxes: z.string().max(2000).optional(),
        active: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const code = input.code.toUpperCase();
      const [existing] = await db.select().from(countryConfigs).where(eq(countryConfigs.code, code)).limit(1);
      if (existing) {
        await db.update(countryConfigs).set({
          name: input.name,
          currency: input.currency,
          importRules: input.importRules ?? existing.importRules,
          customsRules: input.customsRules ?? existing.customsRules,
          taxes: input.taxes ?? existing.taxes,
          active: input.active,
        }).where(eq(countryConfigs.code, code));
      } else {
        await db.insert(countryConfigs).values({
          code,
          name: input.name,
          currency: input.currency,
          importRules: input.importRules ?? null,
          customsRules: input.customsRules ?? null,
          taxes: input.taxes ?? null,
          active: input.active,
        });
      }
      await logAction(ctx.user.uid, "country.upsert", "country", null, { code }, clientMeta(ctx.req));
      return { ok: true };
    }),
});

// ===================== PARTIE 18 — FIDÉLITÉ (router) =====================
export const loyaltyRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const [acc] = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, ctx.user.uid)).limit(1);
    const points = acc?.points ?? 0;
    const tier = acc?.tier ?? "bronze";
    const tx = await db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, ctx.user.uid))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(20);
    // Points manquants pour le palier suivant.
    const next = LOYALTY_TIERS.find((t) => t.min > points);
    return { points, tier, nextTier: next?.tier ?? null, pointsToNext: next ? next.min - points : 0, transactions: tx };
  }),

  // Attribution manuelle (Direction) — bonus, geste commercial…
  award: directionProcedure
    .input(z.object({ userId: z.number(), points: z.number(), reason: z.string().min(2).max(128) }))
    .mutation(async ({ ctx, input }) => {
      await awardPoints(input.userId, input.points, input.reason, "manuel", ctx.user.uid);
      await logAction(ctx.user.uid, "loyalty.award", "user", input.userId, { points: input.points }, clientMeta(ctx.req));
      return { ok: true };
    }),
});

// ===================== PREMIUM 1 — COFFRE-FORT NUMÉRIQUE =====================
export const documentsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(userDocuments)
      .where(eq(userDocuments.userId, ctx.user.uid))
      .orderBy(desc(userDocuments.createdAt));
  }),

  add: protectedProcedure
    .input(
      z.object({
        category: z.enum(["carte_grise", "facture", "controle_technique", "contrat", "assurance", "autre"]).default("autre"),
        title: z.string().min(1).max(255),
        fileUrl: z.string().url(),
        fileName: z.string().max(255).optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.insert(userDocuments).values({
        userId: ctx.user.uid,
        category: input.category,
        title: input.title,
        fileUrl: input.fileUrl,
        fileName: input.fileName ?? null,
        notes: input.notes ?? null,
      }).returning();
      return d;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(userDocuments).where(sql`${userDocuments.id} = ${input.id} and ${userDocuments.userId} = ${ctx.user.uid}`);
      return { ok: true };
    }),
});

// ===================== PREMIUM 2 — DOSSIER VÉHICULE INTELLIGENT =====================
export const dossiersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(vehicleDossiers).where(eq(vehicleDossiers.userId, ctx.user.uid)).orderBy(desc(vehicleDossiers.createdAt));
  }),

  create: protectedProcedure
    .input(
      z.object({
        marque: z.string().max(96).optional(),
        modele: z.string().max(96).optional(),
        immatriculation: z.string().max(32).optional(),
        vin: z.string().max(32).optional(),
        annee: z.number().optional(),
        kilometrage: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.insert(vehicleDossiers).values({ userId: ctx.user.uid, ...input }).returning();
      return d;
    }),

  events: protectedProcedure
    .input(z.object({ dossierId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [d] = await db.select().from(vehicleDossiers).where(eq(vehicleDossiers.id, input.dossierId)).limit(1);
      if (!d || d.userId !== ctx.user.uid) return [];
      return db
        .select()
        .from(vehicleDossierEvents)
        .where(eq(vehicleDossierEvents.dossierId, input.dossierId))
        .orderBy(desc(vehicleDossierEvents.createdAt));
    }),

  addEvent: protectedProcedure
    .input(
      z.object({
        dossierId: z.number(),
        type: z.enum(["achat", "entretien", "reparation", "controle_technique", "sinistre", "photo", "vente", "autre"]).default("autre"),
        title: z.string().min(1).max(160),
        description: z.string().max(2000).optional(),
        amount: z.number().optional(),
        eventDate: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.select().from(vehicleDossiers).where(eq(vehicleDossiers.id, input.dossierId)).limit(1);
      if (!d || d.userId !== ctx.user.uid) throw new Error("Dossier introuvable");
      await db.insert(vehicleDossierEvents).values({
        dossierId: input.dossierId,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        amount: input.amount != null ? String(input.amount) : null,
        eventDate: input.eventDate ? new Date(input.eventDate) : null,
      });
      return { ok: true };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(vehicleDossiers).where(sql`${vehicleDossiers.id} = ${input.id} and ${vehicleDossiers.userId} = ${ctx.user.uid}`);
      return { ok: true };
    }),
});
