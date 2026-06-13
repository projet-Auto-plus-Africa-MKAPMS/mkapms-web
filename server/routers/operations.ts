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
  subsidiaries,
  sites,
  franchises,
  platformSettings,
  monitoringEvents,
  backupLogs,
  annonces,
  insurancePolicies,
  labExperiments,
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

  // Active / désactive un pays en un clic (Partie 19 — expansion).
  setActive: directionProcedure
    .input(z.object({ code: z.string().min(2).max(4), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const code = input.code.toUpperCase();
      await db.update(countryConfigs).set({ active: input.active }).where(eq(countryConfigs.code, code));
      await logAction(ctx.user.uid, "country.setActive", "country", null, { code, active: input.active }, clientMeta(ctx.req));
      return { ok: true };
    }),

  // Partie 19 §4 — objectifs / stats par pays (utilisateurs, annonces, abonnements).
  stats: adminProcedure.query(async () => {
    const usersByCountry = await db
      .select({ code: sql<string>`coalesce(${users.country}, 'NA')`, c: sql<number>`count(*)::int` })
      .from(users)
      .groupBy(sql`coalesce(${users.country}, 'NA')`);
    const annoncesByCountry = await db
      .select({ code: sql<string>`coalesce(${annonces.pays}, 'NA')`, c: sql<number>`count(*)::int` })
      .from(annonces)
      .groupBy(sql`coalesce(${annonces.pays}, 'NA')`);
    const countries = await db.select().from(countryConfigs).orderBy(countryConfigs.name);
    const uMap = new Map(usersByCountry.map((r) => [r.code, r.c]));
    const aMap = new Map(annoncesByCountry.map((r) => [r.code, r.c]));
    return countries.map((c) => ({
      code: c.code,
      name: c.name,
      active: c.active,
      currency: c.currency,
      users: uMap.get(c.code) ?? 0,
      annonces: aMap.get(c.code) ?? 0,
    }));
  }),
});

// ===================== PARTIE 19 — GOUVERNANCE (filiales, sites, franchises) =====================
export const governanceRouter = router({
  // ---- Filiales ----
  listSubsidiaries: adminProcedure.query(async () => {
    return db.select().from(subsidiaries).orderBy(desc(subsidiaries.createdAt));
  }),
  createSubsidiary: directionProcedure
    .input(
      z.object({
        name: z.string().min(2).max(160),
        countryCode: z.string().min(2).max(4),
        city: z.string().max(96).optional(),
        managerId: z.number().optional(),
        budget: z.number().optional(),
        currency: z.string().min(3).max(4).default("EUR"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [s] = await db.insert(subsidiaries).values({
        name: input.name,
        countryCode: input.countryCode.toUpperCase(),
        city: input.city ?? null,
        managerId: input.managerId ?? null,
        budget: input.budget != null ? String(input.budget) : null,
        currency: input.currency,
      }).returning();
      await logAction(ctx.user.uid, "subsidiary.create", "subsidiary", s.id, { name: input.name }, clientMeta(ctx.req));
      return s;
    }),
  setSubsidiaryActive: directionProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.update(subsidiaries).set({ active: input.active }).where(eq(subsidiaries.id, input.id));
      return { ok: true };
    }),

  // ---- Sites locaux ----
  listSites: adminProcedure.query(async () => {
    return db.select().from(sites).orderBy(desc(sites.createdAt));
  }),
  createSite: directionProcedure
    .input(
      z.object({
        subsidiaryId: z.number().optional(),
        type: z.enum(["agence", "entrepot", "garage", "karting", "lavage", "autre"]).default("agence"),
        name: z.string().min(2).max(160),
        countryCode: z.string().min(2).max(4),
        city: z.string().max(96).optional(),
        address: z.string().max(500).optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [s] = await db.insert(sites).values({
        subsidiaryId: input.subsidiaryId ?? null,
        type: input.type,
        name: input.name,
        countryCode: input.countryCode.toUpperCase(),
        city: input.city ?? null,
        address: input.address ?? null,
        lat: input.lat != null ? String(input.lat) : null,
        lng: input.lng != null ? String(input.lng) : null,
      }).returning();
      await logAction(ctx.user.uid, "site.create", "site", s.id, { name: input.name, type: input.type }, clientMeta(ctx.req));
      return s;
    }),

  // ---- Franchises ----
  listFranchises: adminProcedure.query(async () => {
    return db.select().from(franchises).orderBy(desc(franchises.createdAt));
  }),
  createFranchise: directionProcedure
    .input(
      z.object({
        name: z.string().min(2).max(160),
        type: z.enum(["garage", "lavage", "karting", "agence", "autre"]).default("garage"),
        countryCode: z.string().min(2).max(4),
        zone: z.string().max(160).optional(),
        ownerId: z.number().optional(),
        redevance: z.number().optional(),
        currency: z.string().min(3).max(4).default("EUR"),
        contractStart: z.string().optional(),
        contractEnd: z.string().optional(),
        status: z.enum(["prospect", "active", "suspendue", "resiliee"]).default("prospect"),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [f] = await db.insert(franchises).values({
        name: input.name,
        type: input.type,
        countryCode: input.countryCode.toUpperCase(),
        zone: input.zone ?? null,
        ownerId: input.ownerId ?? null,
        redevance: input.redevance != null ? String(input.redevance) : null,
        currency: input.currency,
        contractStart: input.contractStart ? new Date(input.contractStart) : null,
        contractEnd: input.contractEnd ? new Date(input.contractEnd) : null,
        status: input.status,
        notes: input.notes ?? null,
      }).returning();
      await logAction(ctx.user.uid, "franchise.create", "franchise", f.id, { name: input.name }, clientMeta(ctx.req));
      return f;
    }),
  setFranchiseStatus: directionProcedure
    .input(z.object({ id: z.number(), status: z.enum(["prospect", "active", "suspendue", "resiliee"]) }))
    .mutation(async ({ ctx, input }) => {
      await db.update(franchises).set({ status: input.status }).where(eq(franchises.id, input.id));
      await logAction(ctx.user.uid, "franchise.status", "franchise", input.id, { status: input.status }, clientMeta(ctx.req));
      return { ok: true };
    }),

  // Partie 19 §5 — données pour la carte mondiale (sites géolocalisés).
  mapData: publicProcedure.query(async () => {
    const activeSites = await db.select().from(sites).where(eq(sites.active, true));
    return activeSites
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => ({ id: s.id, type: s.type, name: s.name, city: s.city, countryCode: s.countryCode, lat: Number(s.lat), lng: Number(s.lng) }));
  }),
});

// ===================== PARTIE 20 — CONTINUITÉ & SÉCURITÉ =====================
export const MAINTENANCE_KEY = "maintenance_mode";

export const platformRouter = router({
  // État public : la plateforme est-elle en maintenance ?
  status: publicProcedure.query(async () => {
    const [m] = await db.select().from(platformSettings).where(eq(platformSettings.key, MAINTENANCE_KEY)).limit(1);
    return { maintenance: m?.value === "on", updatedAt: m?.updatedAt ?? null };
  }),

  setMaintenance: directionProcedure
    .input(z.object({ on: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .insert(platformSettings)
        .values({ key: MAINTENANCE_KEY, value: input.on ? "on" : "off" })
        .onConflictDoUpdate({ target: platformSettings.key, set: { value: input.on ? "on" : "off", updatedAt: new Date() } });
      await logAction(ctx.user.uid, "platform.maintenance", "platform", null, { on: input.on }, clientMeta(ctx.req));
      return { ok: true };
    }),

  // Surveillance : derniers événements (erreurs, paiements, API, serveurs).
  monitoring: adminProcedure.query(async () => {
    const events = await db.select().from(monitoringEvents).orderBy(desc(monitoringEvents.createdAt)).limit(50);
    const [crit] = await db.select({ c: sql<number>`count(*)::int` }).from(monitoringEvents).where(sql`${monitoringEvents.severity} in ('error','critical') and ${monitoringEvents.resolved} = false`);
    return { events, criticalOpen: Number(crit?.c ?? 0) };
  }),

  resolveEvent: directionProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(monitoringEvents).set({ resolved: true }).where(eq(monitoringEvents.id, input.id));
      return { ok: true };
    }),

  // Historique des sauvegardes (Railway gère le backup managé Postgres).
  backups: adminProcedure.query(async () => {
    return db.select().from(backupLogs).orderBy(desc(backupLogs.createdAt)).limit(30);
  }),

  // Enregistre une sauvegarde (déclenchée par un job/cron ou manuellement).
  logBackup: directionProcedure
    .input(z.object({ type: z.string().max(32).default("database"), status: z.enum(["success", "failed", "running"]).default("success"), location: z.string().max(500).optional(), note: z.string().max(500).optional() }))
    .mutation(async ({ input }) => {
      const [b] = await db.insert(backupLogs).values({ type: input.type, status: input.status, location: input.location ?? null, note: input.note ?? null }).returning();
      return b;
    }),
});

// Helper : journalise un événement de surveillance (best-effort).
export async function logMonitoring(
  source: string,
  severity: "info" | "warning" | "error" | "critical",
  message: string,
  meta?: string,
): Promise<void> {
  try {
    await db.insert(monitoringEvents).values({ source, severity, message, meta: meta ?? null });
  } catch (err) {
    console.error("[monitoring] log échec:", (err as Error).message);
  }
}

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

// ===================== PARTIE 21 — ASSURANCES (polices par univers) =====================
export const insuranceRouter = router({
  list: adminProcedure.query(async () => {
    return db.select().from(insurancePolicies).orderBy(desc(insurancePolicies.createdAt));
  }),
  create: directionProcedure
    .input(
      z.object({
        type: z.enum(["location", "transport", "garage", "vtc", "livraison", "autre"]).default("autre"),
        compagnie: z.string().min(2).max(160),
        numeroPolice: z.string().max(96).optional(),
        countryCode: z.string().max(4).optional(),
        primeMensuelle: z.number().optional(),
        currency: z.string().min(3).max(4).default("EUR"),
        dateDebut: z.string().optional(),
        dateFin: z.string().optional(),
        documentUrl: z.string().url().optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [p] = await db.insert(insurancePolicies).values({
        type: input.type,
        compagnie: input.compagnie,
        numeroPolice: input.numeroPolice ?? null,
        countryCode: input.countryCode ? input.countryCode.toUpperCase() : null,
        primeMensuelle: input.primeMensuelle != null ? String(input.primeMensuelle) : null,
        currency: input.currency,
        dateDebut: input.dateDebut ? new Date(input.dateDebut) : null,
        dateFin: input.dateFin ? new Date(input.dateFin) : null,
        documentUrl: input.documentUrl ?? null,
        notes: input.notes ?? null,
      }).returning();
      await logAction(ctx.user.uid, "insurance.create", "insurance", p.id, { type: input.type }, clientMeta(ctx.req));
      return p;
    }),
  setStatus: directionProcedure
    .input(z.object({ id: z.number(), status: z.enum(["active", "expiree", "suspendue"]) }))
    .mutation(async ({ input }) => {
      await db.update(insurancePolicies).set({ status: input.status }).where(eq(insurancePolicies.id, input.id));
      return { ok: true };
    }),
});

// ===================== PARTIE 23 — MKA.P-MS LAB (feature flags / expériences) =====================
export const labRouter = router({
  // Lecture publique des expériences ACTIVES (pour piloter le front sans casser le coeur).
  activeFlags: publicProcedure.query(async () => {
    const rows = await db.select().from(labExperiments).where(eq(labExperiments.status, "actif"));
    return rows.map((r) => ({ key: r.key, name: r.name, config: r.config }));
  }),
  list: adminProcedure.query(async () => {
    return db.select().from(labExperiments).orderBy(desc(labExperiments.createdAt));
  }),
  create: directionProcedure
    .input(
      z.object({
        key: z.string().min(2).max(64).regex(/^[a-z0-9_]+$/, "min., chiffres, _ uniquement"),
        name: z.string().min(2).max(160),
        category: z.enum(["offre", "page", "service", "paiement", "ia", "autre"]).default("autre"),
        description: z.string().max(2000).optional(),
        config: z.string().max(4000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [e] = await db.insert(labExperiments).values({
        key: input.key,
        name: input.name,
        category: input.category,
        description: input.description ?? null,
        config: input.config ?? null,
        createdBy: ctx.user.uid,
      }).returning();
      await logAction(ctx.user.uid, "lab.create", "experiment", e.id, { key: input.key }, clientMeta(ctx.req));
      return e;
    }),
  // Le Super Admin peut activer / tester / désactiver sans toucher au système principal.
  setStatus: directionProcedure
    .input(z.object({ id: z.number(), status: z.enum(["brouillon", "test", "actif", "desactive"]) }))
    .mutation(async ({ ctx, input }) => {
      await db.update(labExperiments).set({ status: input.status, updatedAt: new Date() }).where(eq(labExperiments.id, input.id));
      await logAction(ctx.user.uid, "lab.status", "experiment", input.id, { status: input.status }, clientMeta(ctx.req));
      return { ok: true };
    }),
});
