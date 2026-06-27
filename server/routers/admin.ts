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
  disputes,
  importRequests,
  partsOrders,
  partsCatalog,
  partsShops,
  partsStock,
  deliveryMissions,
  annoncePhotos,
} from "../schema.js";
import { sql as dsql } from "drizzle-orm";

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

  // Parties 13 & 16 — Centre de commandement PDG : tout en un écran.
  dashboard: adminProcedure.query(async () => {
    const startDay = new Date(); startDay.setHours(0, 0, 0, 0);
    const startWeek = new Date(); startWeek.setDate(startWeek.getDate() - 7);
    const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0, 0, 0, 0);
    const startYear = new Date(); startYear.setMonth(0, 1); startYear.setHours(0, 0, 0, 0);
    const num = (v: unknown) => Number(v ?? 0);

    const sumPaid = async (from: Date) => {
      const [r] = await db.select({ v: dsql<number>`coalesce(sum(${payments.amount}),0)` })
        .from(payments).where(dsql`${payments.status} = 'paid' and ${payments.createdAt} >= ${from}`);
      return num(r?.v);
    };
    const countUsersSince = async (from: Date, type: string) => {
      const [r] = await db.select({ c: dsql<number>`count(*)::int` })
        .from(users).where(dsql`${users.createdAt} >= ${from} and ${users.accountType} = ${type}`);
      return num(r?.c);
    };

    const caJour = await sumPaid(startDay);
    const caSemaine = await sumPaid(startWeek);
    const caMois = await sumPaid(startMonth);
    const caAnnee = await sumPaid(startYear);

    // Commissions estimées (abonnements ≈ revenu plateforme) + remboursements.
    const [commission] = await db.select({ v: dsql<number>`coalesce(sum(${payments.amount}),0)` })
      .from(payments).where(dsql`${payments.status} = 'paid' and ${payments.type} = 'pro_subscription' and ${payments.createdAt} >= ${startMonth}`);
    const [refunded] = await db.select({ v: dsql<number>`coalesce(sum(${payments.amount}),0)` })
      .from(payments).where(dsql`${payments.status} = 'refunded' and ${payments.createdAt} >= ${startMonth}`);

    const [pPending] = await db.select({ c: dsql<number>`count(*)::int` })
      .from(payments).where(eq(payments.status, "pending"));
    const [pFailed] = await db.select({ c: dsql<number>`count(*)::int` })
      .from(payments).where(eq(payments.status, "failed"));
    const [subsActive] = await db.select({ c: dsql<number>`count(*)::int` })
      .from(subscriptions).where(dsql`${subscriptions.status} = 'active'`);
    const [newAccounts] = await db.select({ c: dsql<number>`count(*)::int` })
      .from(users).where(dsql`${users.createdAt} >= ${startMonth}`);
    const newParticuliers = await countUsersSince(startMonth, "particulier");
    const newPros = await countUsersSince(startMonth, "professionnel");
    const [sold] = await db.select({ c: dsql<number>`count(*)::int` })
      .from(annonces).where(eq(annonces.status, "vendue"));
    const [reservations] = await db.select({ c: dsql<number>`count(*)::int` }).from(bookings);
    const [openDisputes] = await db.select({ c: dsql<number>`count(*)::int` })
      .from(disputes).where(dsql`${disputes.status} in ('ouvert','en_analyse')`);
    const [kycWaiting] = await db.select({ c: dsql<number>`count(*)::int` })
      .from(kycProfiles).where(dsql`${kycProfiles.status} in ('en_cours','en_validation')`);
    const [annoncesWaiting] = await db.select({ c: dsql<number>`count(*)::int` })
      .from(annonces).where(eq(annonces.status, "en_validation"));

    return {
      caJour, caSemaine, caMois, caAnnee,
      commissionsMois: num(commission?.v),
      remboursementsMois: num(refunded?.v),
      beneficeEstime: caMois - num(refunded?.v),
      paiementsEnAttente: num(pPending?.c),
      paiementsEchoues: num(pFailed?.c),
      abonnementsActifs: num(subsActive?.c),
      nouveauxComptes: num(newAccounts?.c),
      nouveauxParticuliers: newParticuliers,
      nouveauxPros: newPros,
      vehiculesVendus: num(sold?.c),
      reservations: num(reservations?.c),
      litigesOuverts: num(openDisputes?.c),
      kycEnAttente: num(kycWaiting?.c),
      annoncesEnAttente: num(annoncesWaiting?.c),
    };
  }),

  // Partie 22 — Centre de performance : KPI par univers, en un écran.
  kpis: adminProcedure.query(async () => {
    const num = (v: unknown) => Number(v ?? 0);
    const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

    // Vente
    const [annTotal] = await db.select({ c: dsql<number>`count(*)::int` }).from(annonces);
    const [annSold] = await db.select({ c: dsql<number>`count(*)::int` }).from(annonces).where(eq(annonces.status, "vendue"));
    const [annAvg] = await db.select({ v: dsql<number>`coalesce(avg(${annonces.prix}),0)` }).from(annonces).where(dsql`${annonces.prix} > 0`);
    const [delaiVente] = await db.select({ v: dsql<number>`coalesce(avg(extract(epoch from (${annonces.updatedAt} - ${annonces.createdAt}))/86400),0)` }).from(annonces).where(eq(annonces.status, "vendue"));

    // Garage / Devis
    const [devisTotal] = await db.select({ c: dsql<number>`count(*)::int` }).from(devisGarageRequests);
    const [devisAccept] = await db.select({ c: dsql<number>`count(*)::int` }).from(devisGarageRequests).where(dsql`${devisGarageRequests.status} in ('accepte','accepted','valide')`);

    // Location
    const [bookingsTotal] = await db.select({ c: dsql<number>`count(*)::int` }).from(bookings);

    // Pièces
    const [partsTotal] = await db.select({ c: dsql<number>`count(*)::int` }).from(partsOrders);
    const [partsShopsTotal] = await db.select({ c: dsql<number>`count(*)::int` }).from(partsShops);
    const [partsProductsTotal] = await db.select({ c: dsql<number>`count(*)::int` }).from(partsCatalog);

    // Livraison
    const [missionsTotal] = await db.select({ c: dsql<number>`count(*)::int` }).from(deliveryMissions);

    // Afrique / Import
    const [importsTotal] = await db.select({ c: dsql<number>`count(*)::int` }).from(importRequests);
    const importsByCountry = await db
      .select({ pays: dsql<string>`coalesce(${importRequests.paysDestination}, 'NA')`, c: dsql<number>`count(*)::int` })
      .from(importRequests)
      .groupBy(dsql`coalesce(${importRequests.paysDestination}, 'NA')`)
      .orderBy(dsql`count(*) desc`)
      .limit(5);

    return {
      vente: {
        vendus: num(annSold?.c),
        total: num(annTotal?.c),
        tauxConversion: pct(num(annSold?.c), num(annTotal?.c)),
        panierMoyen: Math.round(num(annAvg?.v)),
        delaiMoyenJours: Math.round(num(delaiVente?.v)),
      },
      garage: {
        devisCrees: num(devisTotal?.c),
        devisAcceptes: num(devisAccept?.c),
        tauxAcceptation: pct(num(devisAccept?.c), num(devisTotal?.c)),
      },
      location: { reservations: num(bookingsTotal?.c) },
      pieces: { commandes: num(partsTotal?.c), boutiques: num(partsShopsTotal?.c), produits: num(partsProductsTotal?.c) },
      livraison: { missions: num(missionsTotal?.c) },
      afrique: { importations: num(importsTotal?.c), paysActifs: importsByCountry },
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

  // Liste complète des annonces pour l'admin
  annoncesAll: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0), type: z.enum(["vente", "location"]).optional() }).default({}))
    .query(async ({ input }) => {
      const conds: any[] = [];
      if (input.type) conds.push(eq(annonces.type, input.type));
      const where = conds.length ? conds.reduce((a, b) => dsql`${a} AND ${b}`) : undefined;
      const rows = await db.select().from(annonces).where(where).orderBy(desc(annonces.createdAt)).limit(input.limit).offset(input.offset);
      const ids = rows.map((r) => r.id);
      const photos = ids.length ? await db.select().from(annoncePhotos).where(dsql`${annoncePhotos.annonceId} in (${dsql.join(ids, dsql`, `)})`).orderBy(annoncePhotos.ordre) : [];
      const photoMap = new Map<number, string>();
      for (const p of photos) { if (!photoMap.has(p.annonceId!)) photoMap.set(p.annonceId!, p.url); }
      const [{ count }] = await db.select({ count: dsql<number>`count(*)::int` }).from(annonces).where(where);
      return { total: count, items: rows.map((r) => ({ ...r, photoPrincipale: photoMap.get(r.id) ?? null })) };
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

  // Suppression d'un compte — PDG : tout. Directeur : particuliers uniquement.
  deleteUser: directionProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.uid) {
        throw new Error("Impossible de supprimer son propre compte");
      }
      // Vérifier le compte cible
      const [target] = await db.select({ role: users.role, accountType: users.accountType, staffPosition: users.staffPosition }).from(users).where(eq(users.id, input.userId)).limit(1);
      if (!target) throw new Error("Compte introuvable");

      // Le Directeur (admin) ne peut pas supprimer : PDG, comptes pro, autres admins
      if (ctx.user.role !== "super_admin") {
        if (target.role === "super_admin") throw new Error("Seul le PDG peut supprimer le compte PDG");
        if (target.role === "admin") throw new Error("Seul le PDG peut supprimer un compte administrateur");
        if (target.accountType === "professionnel" || target.role === "pro" || target.role === "garage" || target.role === "society") {
          throw new Error("Seul le PDG peut supprimer un compte professionnel");
        }
      }

      await db.delete(users).where(eq(users.id, input.userId));
      await logAction(ctx.user.uid, "account.delete", "user", input.userId, { targetRole: target.role });
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
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
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
