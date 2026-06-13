import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { router, adminProcedure, directionProcedure } from "../trpc.js";
import { db } from "../db.js";
import { hashPassword } from "../auth.js";
import {
  users,
  annonces,
  garagesPublics,
  subscriptions,
  payments,
  supportTickets,
  devisGarageRequests,
  bookings,
  kycProfiles,
  kycDocuments,
  promoCodes,
} from "../schema.js";

// Back-office (§10)
export const adminRouter = router({
  stats: adminProcedure.query(async () => {
    const [u] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
    const [a] = await db.select({ c: sql<number>`count(*)::int` }).from(annonces);
    const [g] = await db.select({ c: sql<number>`count(*)::int` }).from(garagesPublics);
    const [s] = await db.select({ c: sql<number>`count(*)::int` }).from(subscriptions);
    const [p] = await db.select({ c: sql<number>`count(*)::int` }).from(payments);
    const [d] = await db.select({ c: sql<number>`count(*)::int` }).from(devisGarageRequests);
    return {
      users: u.c, annonces: a.c, garages: g.c,
      subscriptions: s.c, payments: p.c, devis: d.c,
    };
  }),

  usersList: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return db
        .select({
          id: users.id, email: users.email, name: users.name,
          role: users.role, accountType: users.accountType,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  // Modération des annonces (§10.3)
  annoncesPending: adminProcedure.query(async () => {
    return db
      .select()
      .from(annonces)
      .where(eq(annonces.status, "en_validation"))
      .orderBy(desc(annonces.createdAt));
  }),

  moderateAnnonce: adminProcedure
    .input(z.object({ id: z.number(), action: z.enum(["publiee", "refusee", "archivee"]) }))
    .mutation(async ({ input }) => {
      await db
        .update(annonces)
        .set({ status: input.action, updatedAt: new Date() })
        .where(eq(annonces.id, input.id));
      return { ok: true };
    }),

  // Validation des garages (§7.3 / §10.3)
  garagesPending: adminProcedure.query(async () => {
    return db
      .select()
      .from(garagesPublics)
      .where(eq(garagesPublics.status, "en_attente"))
      .orderBy(desc(garagesPublics.createdAt));
  }),

  validateGarage: adminProcedure
    .input(z.object({ id: z.number(), action: z.enum(["valide", "refuse", "suspendu"]) }))
    .mutation(async ({ input }) => {
      await db
        .update(garagesPublics)
        .set({ status: input.action, updatedAt: new Date() })
        .where(eq(garagesPublics.id, input.id));
      return { ok: true };
    }),

  ticketsList: adminProcedure.query(async () => {
    return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }),

  // ===== EMPLOYÉ (Administration normale) — opérations courantes =====

  // Vérification des documents (SIRET / KBIS / RIB / identité) — §3.2
  kycPending: adminProcedure.query(async () => {
    const profiles = await db
      .select({
        id: kycProfiles.id,
        userId: kycProfiles.userId,
        status: kycProfiles.status,
        submittedAt: kycProfiles.submittedAt,
        userEmail: users.email,
        userName: users.name,
        accountType: users.accountType,
      })
      .from(kycProfiles)
      .leftJoin(users, eq(users.id, kycProfiles.userId))
      .where(sql`${kycProfiles.status} in ('en_cours','en_validation')`)
      .orderBy(desc(kycProfiles.submittedAt));
    return profiles;
  }),

  kycDocuments: adminProcedure
    .input(z.object({ profileId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(kycDocuments).where(eq(kycDocuments.profileId, input.profileId));
    }),

  validateKyc: adminProcedure
    .input(z.object({ profileId: z.number(), action: z.enum(["valide", "refuse"]), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(kycProfiles)
        .set({
          status: input.action,
          validatedAt: new Date(),
          validatedBy: ctx.user.uid,
          rejectionReason: input.action === "refuse" ? (input.reason ?? null) : null,
          updatedAt: new Date(),
        })
        .where(eq(kycProfiles.id, input.profileId));
      return { ok: true };
    }),

  // Suivi des paiements (§3.2)
  paymentsList: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return db
        .select({
          id: payments.id,
          userId: payments.userId,
          type: payments.type,
          amount: payments.amount,
          currency: payments.currency,
          status: payments.status,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .orderBy(desc(payments.createdAt))
        .limit(input.limit);
    }),

  // Suivi des réservations (§3.2)
  reservationsList: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return db
        .select({
          id: bookings.id,
          vehicleId: bookings.vehicleId,
          userId: bookings.userId,
          type: bookings.type,
          status: bookings.status,
          startDate: bookings.startDate,
          createdAt: bookings.createdAt,
        })
        .from(bookings)
        .orderBy(desc(bookings.createdAt))
        .limit(input.limit);
    }),

  // ===== DIRECTION / PDG (Super Admin) — actions réservées =====

  // Liste de l'équipe interne (comptes admin / employés)
  staffList: adminProcedure.query(async () => {
    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        staffPosition: users.staffPosition,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(sql`${users.role} in ('admin','employee','super_admin')`)
      .orderBy(desc(users.createdAt));
  }),

  // Création d'un compte interne (employé / admin) — réservé Direction (§3.1)
  createStaff: directionProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
        password: z.string().min(8),
        role: z.enum(["employee", "admin"]).default("employee"),
        staffPosition: z.enum(["directeur", "adjoint", "gerant", "chef_equipe", "agent"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length) {
        throw new Error("Un compte existe déjà avec cet email");
      }
      const [u] = await db
        .insert(users)
        .values({
          email: input.email,
          name: input.name,
          passwordHash: await hashPassword(input.password),
          role: input.role,
          accountType: "professionnel",
          staffPosition: input.staffPosition ?? null,
          emailVerified: true,
        })
        .returning({ id: users.id, email: users.email });
      return u;
    }),

  // Suppression d'un compte — réservé Direction (§3.1 / §3.3)
  deleteUser: directionProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.uid) {
        throw new Error("Impossible de supprimer son propre compte");
      }
      await db.delete(users).where(eq(users.id, input.userId));
      return { ok: true };
    }),

  // Certification véhicule « Sélection MKA.P-MS » — réservé Direction (§3.1)
  certifyVehicle: directionProcedure
    .input(z.object({ annonceId: z.number(), certified: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(annonces)
        .set({
          selectionMka: input.certified,
          selectionMkaBy: input.certified ? ctx.user.uid : null,
          selectionMkaAt: input.certified ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(annonces.id, input.annonceId));
      return { ok: true };
    }),

  // Codes promotionnels — gestion réservée Direction (§3.1)
  promoList: adminProcedure.query(async () => {
    return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }),

  createPromo: directionProcedure
    .input(
      z.object({
        code: z.string().min(2).max(48),
        type: z.enum(["pourcentage", "montant"]).default("pourcentage"),
        value: z.number().min(0),
        description: z.string().optional(),
        scope: z.string().optional(),
        maxUses: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [p] = await db
        .insert(promoCodes)
        .values({ ...input, code: input.code.toUpperCase(), createdBy: ctx.user.uid })
        .returning();
      return p;
    }),

  updatePromo: directionProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      await db
        .update(promoCodes)
        .set({ active: input.active, updatedAt: new Date() })
        .where(eq(promoCodes.id, input.id));
      return { ok: true };
    }),

  deletePromo: directionProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(promoCodes).where(eq(promoCodes.id, input.id));
      return { ok: true };
    }),

  // Réservé direction : changement de rôle (§10.1)
  setUserRole: directionProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "pro", "garage", "employee", "society", "admin", "super_admin"]),
        staffPosition: z.enum(["pdg", "directeur", "adjoint", "gerant", "chef_equipe", "agent"]).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .update(users)
        .set({ role: input.role, staffPosition: input.staffPosition ?? null, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
      return { ok: true };
    }),
});
