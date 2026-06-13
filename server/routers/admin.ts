import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { router, adminProcedure, directionProcedure } from "../trpc.js";
import { db } from "../db.js";
import { hashPassword } from "../auth.js";
import { logAction } from "../audit.js";
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
  accountDeletionRequests,
  auditLogs,
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
    .mutation(async ({ ctx, input }) => {
      await db
        .update(annonces)
        .set({ status: input.action, updatedAt: new Date() })
        .where(eq(annonces.id, input.id));
      await logAction(ctx.user.uid, `annonce.${input.action}`, "annonce", input.id);
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
    .mutation(async ({ ctx, input }) => {
      await db
        .update(garagesPublics)
        .set({ status: input.action, updatedAt: new Date() })
        .where(eq(garagesPublics.id, input.id));
      await logAction(ctx.user.uid, `garage.${input.action}`, "garage", input.id);
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
      await logAction(ctx.user.uid, `kyc.${input.action}`, "kyc_profile", input.profileId);
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
    .mutation(async ({ ctx, input }) => {
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
      await logAction(ctx.user.uid, "staff.create", "user", u.id, { email: u.email, role: input.role });
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
      await logAction(ctx.user.uid, "account.delete", "user", input.userId);
      return { ok: true };
    }),

  // --- Workflow suppression : un EMPLOYÉ demande, la DIRECTION approuve (§3.3) ---
  requestUserDeletion: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [r] = await db
        .insert(accountDeletionRequests)
        .values({ targetUserId: input.userId, requestedBy: ctx.user.uid, reason: input.reason ?? null })
        .returning();
      await logAction(ctx.user.uid, "account.delete_request", "user", input.userId, { requestId: r.id });
      return r;
    }),

  deletionRequests: adminProcedure.query(async () => {
    return db
      .select({
        id: accountDeletionRequests.id,
        targetUserId: accountDeletionRequests.targetUserId,
        requestedBy: accountDeletionRequests.requestedBy,
        reason: accountDeletionRequests.reason,
        status: accountDeletionRequests.status,
        createdAt: accountDeletionRequests.createdAt,
        targetEmail: users.email,
        targetName: users.name,
      })
      .from(accountDeletionRequests)
      .leftJoin(users, eq(users.id, accountDeletionRequests.targetUserId))
      .orderBy(desc(accountDeletionRequests.createdAt));
  }),

  decideDeletion: directionProcedure
    .input(z.object({ requestId: z.number(), approve: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [req] = await db
        .select()
        .from(accountDeletionRequests)
        .where(eq(accountDeletionRequests.id, input.requestId))
        .limit(1);
      if (!req || req.status !== "en_attente") {
        throw new Error("Demande introuvable ou déjà traitée");
      }
      if (input.approve) {
        if (req.targetUserId !== ctx.user.uid) {
          await db.delete(users).where(eq(users.id, req.targetUserId));
        }
        await logAction(ctx.user.uid, "account.delete_approved", "user", req.targetUserId, { requestId: req.id });
      } else {
        await logAction(ctx.user.uid, "account.delete_rejected", "user", req.targetUserId, { requestId: req.id });
      }
      await db
        .update(accountDeletionRequests)
        .set({ status: input.approve ? "approuvee" : "refusee", decidedBy: ctx.user.uid, decidedAt: new Date() })
        .where(eq(accountDeletionRequests.id, input.requestId));
      return { ok: true };
    }),

  // --- Traçabilité (« radar » Direction) : journal des actions admin (§11) ---
  auditLog: directionProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(async ({ input }) => {
      return db
        .select({
          id: auditLogs.id,
          actorId: auditLogs.actorId,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
          actorEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.actorId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit);
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
      await logAction(ctx.user.uid, input.certified ? "annonce.certify" : "annonce.uncertify", "annonce", input.annonceId);
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
      await logAction(ctx.user.uid, "promo.create", "promo_code", p.id, { code: p.code });
      return p;
    }),

  updatePromo: directionProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(promoCodes)
        .set({ active: input.active, updatedAt: new Date() })
        .where(eq(promoCodes.id, input.id));
      await logAction(ctx.user.uid, "promo.update", "promo_code", input.id, { active: input.active });
      return { ok: true };
    }),

  deletePromo: directionProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(promoCodes).where(eq(promoCodes.id, input.id));
      await logAction(ctx.user.uid, "promo.delete", "promo_code", input.id);
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
    .mutation(async ({ ctx, input }) => {
      await db
        .update(users)
        .set({ role: input.role, staffPosition: input.staffPosition ?? null, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
      await logAction(ctx.user.uid, "account.set_role", "user", input.userId, { role: input.role });
      return { ok: true };
    }),
});
