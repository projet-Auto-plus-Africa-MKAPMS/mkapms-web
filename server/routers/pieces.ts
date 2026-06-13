import { z } from "zod";
import { and, desc, eq, ilike, sql, gte, lte, or } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, proProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import {
  partsShops,
  partsSites,
  partsCatalog,
  partsCompatibility,
  partsStock,
  partsOrders,
  partsOrderItems,
  partsInvoices,
  devisItems,
} from "../schema.js";

// ===== BOUTIQUE PIÈCES AUTO PRO — Mini-ERP =====
export const piecesRouter = router({
  // ── BOUTIQUES ──
  shops: publicProcedure
    .input(
      z.object({
        q: z.string().optional(),
        country: z.string().optional(),
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
      }).default({}),
    )
    .query(async ({ input }) => {
      const conds = [eq(partsShops.active, true)];
      if (input.country) conds.push(eq(partsShops.countryCode, input.country));
      if (input.q) conds.push(ilike(partsShops.nom, `%${input.q}%`));
      const where = and(...conds);
      const items = await db.select().from(partsShops).where(where)
        .orderBy(desc(partsShops.createdAt)).limit(input.limit).offset(input.offset);
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(partsShops).where(where);
      return { total: count, items };
    }),

  shop: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const [s] = await db.select().from(partsShops).where(eq(partsShops.id, input.id)).limit(1);
    return s ?? null;
  }),

  createShop: proProcedure
    .input(
      z.object({
        nom: z.string().min(2),
        type: z.enum(["magasin_pieces", "casse_auto", "grossiste", "distributeur", "centre_auto", "garage_vendeur"]).default("magasin_pieces"),
        description: z.string().optional(),
        adresse: z.string().optional(),
        ville: z.string().optional(),
        codePostal: z.string().optional(),
        countryCode: z.string().optional(),
        telephone: z.string().optional(),
        email: z.string().optional(),
        siret: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [s] = await db.insert(partsShops).values({ ...input, ownerId: ctx.user.uid }).returning();
      return s;
    }),

  updateShop: proProcedure
    .input(z.object({
      id: z.number(),
      nom: z.string().min(2).optional(),
      description: z.string().optional(),
      adresse: z.string().optional(),
      ville: z.string().optional(),
      telephone: z.string().optional(),
      email: z.string().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [s] = await db.update(partsShops).set({ ...data, updatedAt: new Date() }).where(eq(partsShops.id, id)).returning();
      return s;
    }),

  // ── MULTI-SITES (magasins / entrepôts) ──
  sites: proProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(partsSites).where(eq(partsSites.shopId, input.shopId)).orderBy(desc(partsSites.createdAt));
    }),

  createSite: proProcedure
    .input(z.object({
      shopId: z.number(),
      nom: z.string().min(2),
      type: z.enum(["magasin", "entrepot", "garage"]).default("entrepot"),
      adresse: z.string().optional(),
      ville: z.string().optional(),
      codePostal: z.string().optional(),
      countryCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [s] = await db.insert(partsSites).values(input).returning();
      return s;
    }),

  // ── CATALOGUE (référencement obligatoire) ──
  catalog: publicProcedure
    .input(
      z.object({
        shopId: z.number().optional(),
        q: z.string().optional(),
        categorie: z.string().optional(),
        condition: z.enum(["neuf", "occasion", "reconditionne", "echange_standard"]).optional(),
        marqueVehicule: z.string().optional(),
        modeleVehicule: z.string().optional(),
        anneeVehicule: z.number().optional(),
        limit: z.number().min(1).max(100).default(40),
        offset: z.number().min(0).default(0),
      }).default({}),
    )
    .query(async ({ input }) => {
      const conds = [eq(partsCatalog.active, true)];
      if (input.shopId) conds.push(eq(partsCatalog.shopId, input.shopId));
      if (input.categorie) conds.push(eq(partsCatalog.categorie, input.categorie));
      if (input.condition) conds.push(eq(partsCatalog.condition, input.condition));
      if (input.q) {
        conds.push(or(
          ilike(partsCatalog.nom, `%${input.q}%`),
          ilike(partsCatalog.referenceInterne, `%${input.q}%`),
          ilike(partsCatalog.referenceOem, `%${input.q}%`),
          ilike(partsCatalog.referenceEquipementier, `%${input.q}%`),
          ilike(partsCatalog.codeBarre, `%${input.q}%`),
        )!);
      }

      // Vehicle compatibility filter
      if (input.marqueVehicule || input.modeleVehicule || input.anneeVehicule) {
        const compatConds = [];
        if (input.marqueVehicule) compatConds.push(ilike(partsCompatibility.marque, `%${input.marqueVehicule}%`));
        if (input.modeleVehicule) compatConds.push(ilike(partsCompatibility.modele, `%${input.modeleVehicule}%`));
        if (input.anneeVehicule) {
          compatConds.push(or(
            eq(partsCompatibility.anneeDebut, 0),
            lte(partsCompatibility.anneeDebut, input.anneeVehicule),
          )!);
          compatConds.push(or(
            eq(partsCompatibility.anneeFin, 0),
            gte(partsCompatibility.anneeFin, input.anneeVehicule),
          )!);
        }
        const compatIds = await db.select({ catalogId: partsCompatibility.catalogId })
          .from(partsCompatibility).where(and(...compatConds));
        const ids = compatIds.map(c => c.catalogId);
        if (ids.length === 0) return { total: 0, items: [] };
        conds.push(sql`${partsCatalog.id} = ANY(${ids})`);
      }

      const where = and(...conds);
      const items = await db.select().from(partsCatalog).where(where)
        .orderBy(desc(partsCatalog.createdAt)).limit(input.limit).offset(input.offset);
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(partsCatalog).where(where);
      return { total: count, items };
    }),

  part: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const [p] = await db.select().from(partsCatalog).where(eq(partsCatalog.id, input.id)).limit(1);
    if (!p) return null;
    const compat = await db.select().from(partsCompatibility).where(eq(partsCompatibility.catalogId, input.id));
    const stocks = await db.select().from(partsStock).where(eq(partsStock.catalogId, input.id));
    const totalQte = stocks.reduce((s, st) => s + st.quantite, 0);
    const totalReserve = stocks.reduce((s, st) => s + st.quantiteReservee, 0);
    return {
      ...p,
      compatibilites: compat,
      stocks,
      stockTotal: totalQte,
      stockReserve: totalReserve,
      stockDisponible: totalQte - totalReserve,
    };
  }),

  addPart: proProcedure
    .input(
      z.object({
        shopId: z.number(),
        nom: z.string().min(2),
        description: z.string().optional(),
        referenceInterne: z.string().min(1),
        referenceOem: z.string().optional(),
        referenceEquipementier: z.string().optional(),
        codeBarre: z.string().optional(),
        categorie: z.string().optional(),
        sousCategorie: z.string().optional(),
        marquePiece: z.string().optional(),
        etat: z.string().optional(),
        condition: z.enum(["neuf", "occasion", "reconditionne", "echange_standard"]).default("neuf"),
        fournisseurId: z.number().optional(),
        prixHt: z.number().positive(),
        tvaRate: z.number().default(20),
        poidsKg: z.number().optional(),
        longueurCm: z.number().optional(),
        largeurCm: z.number().optional(),
        hauteurCm: z.number().optional(),
        quantiteInitiale: z.number().min(0).default(0),
        siteId: z.number().optional(),
        entrepot: z.string().optional(),
        rayon: z.string().optional(),
        etagere: z.string().optional(),
        seuilMin: z.number().min(0).default(2),
        compatibilites: z.array(z.object({
          marque: z.string(),
          modele: z.string().optional(),
          moteur: z.string().optional(),
          anneeDebut: z.number().optional(),
          anneeFin: z.number().optional(),
        })).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const prixTtc = String(Number((input.prixHt * (1 + input.tvaRate / 100)).toFixed(2)));
      const [p] = await db.insert(partsCatalog).values({
        shopId: input.shopId,
        nom: input.nom,
        description: input.description,
        referenceInterne: input.referenceInterne,
        referenceOem: input.referenceOem,
        referenceEquipementier: input.referenceEquipementier,
        codeBarre: input.codeBarre,
        categorie: input.categorie,
        sousCategorie: input.sousCategorie,
        marquePiece: input.marquePiece,
        etat: input.etat,
        condition: input.condition,
        fournisseurId: input.fournisseurId,
        prixHt: String(input.prixHt),
        prixTtc,
        tvaRate: String(input.tvaRate),
        poidsKg: input.poidsKg ? String(input.poidsKg) : undefined,
        longueurCm: input.longueurCm ? String(input.longueurCm) : undefined,
        largeurCm: input.largeurCm ? String(input.largeurCm) : undefined,
        hauteurCm: input.hauteurCm ? String(input.hauteurCm) : undefined,
      }).returning();

      // Initial stock
      await db.insert(partsStock).values({
        catalogId: p.id,
        siteId: input.siteId,
        quantite: input.quantiteInitiale,
        seuilMin: input.seuilMin,
        entrepot: input.entrepot,
        rayon: input.rayon,
        etagere: input.etagere,
      });

      // Compatibilités véhicule
      if (input.compatibilites?.length) {
        for (const c of input.compatibilites) {
          await db.insert(partsCompatibility).values({
            catalogId: p.id,
            marque: c.marque,
            modele: c.modele,
            moteur: c.moteur,
            anneeDebut: c.anneeDebut,
            anneeFin: c.anneeFin,
          });
        }
      }

      return p;
    }),

  updatePart: proProcedure
    .input(z.object({
      id: z.number(),
      nom: z.string().optional(),
      description: z.string().optional(),
      referenceOem: z.string().optional(),
      referenceEquipementier: z.string().optional(),
      codeBarre: z.string().optional(),
      categorie: z.string().optional(),
      sousCategorie: z.string().optional(),
      marquePiece: z.string().optional(),
      etat: z.string().optional(),
      prixHt: z.number().optional(),
      tvaRate: z.number().optional(),
      poidsKg: z.number().optional(),
      longueurCm: z.number().optional(),
      largeurCm: z.number().optional(),
      hauteurCm: z.number().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, prixHt, tvaRate, poidsKg, longueurCm, largeurCm, hauteurCm, ...rest } = input;
      const upd: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (prixHt !== undefined) upd.prixHt = String(prixHt);
      if (tvaRate !== undefined) upd.tvaRate = String(tvaRate);
      if (prixHt !== undefined || tvaRate !== undefined) {
        const ht = prixHt ?? 0;
        const tva = tvaRate ?? 20;
        upd.prixTtc = String(Number((ht * (1 + tva / 100)).toFixed(2)));
      }
      if (poidsKg !== undefined) upd.poidsKg = String(poidsKg);
      if (longueurCm !== undefined) upd.longueurCm = String(longueurCm);
      if (largeurCm !== undefined) upd.largeurCm = String(largeurCm);
      if (hauteurCm !== undefined) upd.hauteurCm = String(hauteurCm);
      const [p] = await db.update(partsCatalog).set(upd).where(eq(partsCatalog.id, id)).returning();
      return p;
    }),

  // ── COMPATIBILITÉ VÉHICULE ──
  addCompatibility: proProcedure
    .input(z.object({
      catalogId: z.number(),
      marque: z.string(),
      modele: z.string().optional(),
      moteur: z.string().optional(),
      anneeDebut: z.number().optional(),
      anneeFin: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [c] = await db.insert(partsCompatibility).values(input).returning();
      return c;
    }),

  removeCompatibility: proProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(partsCompatibility).where(eq(partsCompatibility.id, input.id));
      return { ok: true };
    }),

  compatibilities: publicProcedure
    .input(z.object({ catalogId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(partsCompatibility).where(eq(partsCompatibility.catalogId, input.catalogId));
    }),

  // ── GESTION DE STOCK ──
  stockByCatalog: proProcedure
    .input(z.object({ catalogId: z.number() }))
    .query(async ({ input }) => {
      const stocks = await db.select().from(partsStock).where(eq(partsStock.catalogId, input.catalogId));
      const totalQte = stocks.reduce((s, st) => s + st.quantite, 0);
      const totalReserve = stocks.reduce((s, st) => s + st.quantiteReservee, 0);
      return { stocks, total: totalQte, reserve: totalReserve, disponible: totalQte - totalReserve };
    }),

  updateStock: proProcedure
    .input(z.object({
      id: z.number(),
      quantite: z.number().min(0).optional(),
      seuilMin: z.number().min(0).optional(),
      entrepot: z.string().optional(),
      rayon: z.string().optional(),
      etagere: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [s] = await db.update(partsStock).set({ ...data, updatedAt: new Date() }).where(eq(partsStock.id, id)).returning();
      return s;
    }),

  stockAlerts: proProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ input }) => {
      const catalogIds = await db.select({ id: partsCatalog.id }).from(partsCatalog).where(eq(partsCatalog.shopId, input.shopId));
      if (catalogIds.length === 0) return { faible: [], rupture: [], surstock: [] };
      const ids = catalogIds.map(c => c.id);
      const allStock = await db.select().from(partsStock).where(sql`${partsStock.catalogId} = ANY(${ids})`);
      const faible: typeof allStock = [];
      const rupture: typeof allStock = [];
      const surstock: typeof allStock = [];
      for (const s of allStock) {
        const dispo = s.quantite - s.quantiteReservee;
        if (dispo <= 0) rupture.push(s);
        else if (dispo <= s.seuilMin) faible.push(s);
        else if (dispo > s.seuilMin * 10 && s.seuilMin > 0) surstock.push(s);
      }
      return { faible, rupture, surstock };
    }),

  // ── PANIER / COMMANDES ──
  createOrder: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        items: z.array(z.object({ catalogId: z.number(), quantite: z.number().min(1) })).min(1),
        devisId: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ref = `MKA-PO-${String(Date.now()).slice(-6)}`;
      let totalHt = 0;
      let totalTtc = 0;

      // Verify stock & compute totals
      const itemDetails: { catalogId: number; quantite: number; prixHt: number; prixTtc: number }[] = [];
      for (const it of input.items) {
        const [part] = await db.select().from(partsCatalog).where(eq(partsCatalog.id, it.catalogId)).limit(1);
        if (!part) throw new Error(`Pièce #${it.catalogId} introuvable`);
        const ht = Number(part.prixHt) * it.quantite;
        const ttc = Number(part.prixTtc ?? part.prixHt) * it.quantite;
        totalHt += ht;
        totalTtc += ttc;
        itemDetails.push({ catalogId: it.catalogId, quantite: it.quantite, prixHt: Number(part.prixHt), prixTtc: Number(part.prixTtc ?? part.prixHt) });
      }

      const [order] = await db.insert(partsOrders).values({
        reference: ref,
        shopId: input.shopId,
        buyerId: ctx.user.uid,
        status: "panier",
        totalHt: String(totalHt.toFixed(2)),
        totalTtc: String(totalTtc.toFixed(2)),
        devisId: input.devisId,
        notes: input.notes,
      }).returning();

      for (const it of itemDetails) {
        await db.insert(partsOrderItems).values({
          orderId: order.id,
          catalogId: it.catalogId,
          quantite: it.quantite,
          prixUnitaireHt: String(it.prixHt),
          totalHt: String((it.prixHt * it.quantite).toFixed(2)),
        });

        // Reserve stock
        const stocks = await db.select().from(partsStock).where(eq(partsStock.catalogId, it.catalogId));
        if (stocks.length > 0) {
          await db.update(partsStock)
            .set({ quantiteReservee: stocks[0].quantiteReservee + it.quantite, updatedAt: new Date() })
            .where(eq(partsStock.id, stocks[0].id));
        }
      }

      return order;
    }),

  confirmOrder: proProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input }) => {
      const [order] = await db.update(partsOrders)
        .set({ status: "confirme", updatedAt: new Date() })
        .where(eq(partsOrders.id, input.orderId)).returning();
      return order;
    }),

  updateOrderStatus: proProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(["panier", "confirme", "preparation", "expedie", "livre", "termine", "annule"]),
    }))
    .mutation(async ({ input }) => {
      const [order] = await db.update(partsOrders)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(partsOrders.id, input.orderId)).returning();

      // If cancelled, release reserved stock
      if (input.status === "annule") {
        const items = await db.select().from(partsOrderItems).where(eq(partsOrderItems.orderId, input.orderId));
        for (const it of items) {
          const stocks = await db.select().from(partsStock).where(eq(partsStock.catalogId, it.catalogId));
          if (stocks.length > 0) {
            const newReserve = Math.max(0, stocks[0].quantiteReservee - it.quantite);
            await db.update(partsStock).set({ quantiteReservee: newReserve, updatedAt: new Date() }).where(eq(partsStock.id, stocks[0].id));
          }
        }
      }

      // If delivered/terminated, decrement real stock
      if (input.status === "livre" || input.status === "termine") {
        const items = await db.select().from(partsOrderItems).where(eq(partsOrderItems.orderId, input.orderId));
        for (const it of items) {
          const stocks = await db.select().from(partsStock).where(eq(partsStock.catalogId, it.catalogId));
          if (stocks.length > 0) {
            const newQte = Math.max(0, stocks[0].quantite - it.quantite);
            const newReserve = Math.max(0, stocks[0].quantiteReservee - it.quantite);
            await db.update(partsStock).set({ quantite: newQte, quantiteReservee: newReserve, updatedAt: new Date() }).where(eq(partsStock.id, stocks[0].id));
          }
        }
      }

      return order;
    }),

  myOrders: protectedProcedure.query(async ({ ctx }) => {
    const orders = await db.select().from(partsOrders).where(eq(partsOrders.buyerId, ctx.user.uid)).orderBy(desc(partsOrders.createdAt));
    return orders;
  }),

  orderItems: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(partsOrderItems).where(eq(partsOrderItems.orderId, input.orderId));
    }),

  shopOrders: proProcedure
    .input(z.object({ shopId: z.number(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const conds = [eq(partsOrders.shopId, input.shopId)];
      if (input.status) conds.push(eq(partsOrders.status, input.status as "panier"));
      return db.select().from(partsOrders).where(and(...conds)).orderBy(desc(partsOrders.createdAt));
    }),

  // ── LIVRAISON AUTOMATIQUE ──
  estimateLivraison: publicProcedure
    .input(z.object({ catalogIds: z.array(z.number()).min(1) }))
    .query(async ({ input }) => {
      let totalPoids = 0;
      let maxDim = 0;
      for (const id of input.catalogIds) {
        const [p] = await db.select().from(partsCatalog).where(eq(partsCatalog.id, id)).limit(1);
        if (p) {
          totalPoids += Number(p.poidsKg ?? 0);
          const dims = [Number(p.longueurCm ?? 0), Number(p.largeurCm ?? 0), Number(p.hauteurCm ?? 0)];
          maxDim = Math.max(maxDim, ...dims);
        }
      }
      let vehiculePropose: string;
      if (totalPoids <= 5 && maxDim <= 40) vehiculePropose = "moto";
      else if (totalPoids <= 15 && maxDim <= 60) vehiculePropose = "scooter";
      else if (totalPoids <= 100 && maxDim <= 120) vehiculePropose = "utilitaire";
      else if (totalPoids <= 500 && maxDim <= 200) vehiculePropose = "fourgon";
      else vehiculePropose = "camion";
      return { totalPoidsKg: totalPoids, maxDimensionCm: maxDim, vehiculePropose };
    }),

  // ── FACTURATION ──
  createInvoice: proProcedure
    .input(z.object({
      orderId: z.number().optional(),
      shopId: z.number(),
      buyerId: z.number().optional(),
      type: z.enum(["devis", "bon_commande", "facture", "avoir", "recu"]),
      totalHt: z.number().optional(),
      totalTva: z.number().optional(),
      totalTtc: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const ref = `MKA-${input.type.toUpperCase().replace("_", "")}-${String(Date.now()).slice(-6)}`;
      const [inv] = await db.insert(partsInvoices).values({
        orderId: input.orderId,
        shopId: input.shopId,
        buyerId: input.buyerId,
        type: input.type,
        reference: ref,
        totalHt: input.totalHt ? String(input.totalHt) : null,
        totalTva: input.totalTva ? String(input.totalTva) : null,
        totalTtc: input.totalTtc ? String(input.totalTtc) : null,
        status: "brouillon",
      }).returning();
      return inv;
    }),

  invoices: proProcedure
    .input(z.object({ shopId: z.number(), type: z.string().optional() }))
    .query(async ({ input }) => {
      const conds = [eq(partsInvoices.shopId, input.shopId)];
      if (input.type) conds.push(eq(partsInvoices.type, input.type as "facture"));
      return db.select().from(partsInvoices).where(and(...conds)).orderBy(desc(partsInvoices.createdAt));
    }),

  updateInvoiceStatus: proProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["brouillon", "emis", "paye", "annule"]),
    }))
    .mutation(async ({ input }) => {
      const [inv] = await db.update(partsInvoices).set({ status: input.status }).where(eq(partsInvoices.id, input.id)).returning();
      return inv;
    }),

  // ── LIAISON DEVIS+ (3 options) ──
  addPartToDevis: proProcedure
    .input(z.object({
      devisId: z.number(),
      catalogId: z.number(),
      quantite: z.number().min(1).default(1),
      ordre: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const [part] = await db.select().from(partsCatalog).where(eq(partsCatalog.id, input.catalogId)).limit(1);
      if (!part) throw new Error("Pièce introuvable");
      const [item] = await db.insert(devisItems).values({
        devisId: input.devisId,
        designation: part.nom,
        quantite: String(input.quantite),
        prixUnitaireHt: part.prixHt,
        ordre: input.ordre,
        type: "piece",
        catalogId: input.catalogId,
      }).returning();
      return item;
    }),

  // ── TABLEAU DE BORD BOUTIQUE ──
  dashboard: proProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ input }) => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const allOrders = await db.select().from(partsOrders).where(eq(partsOrders.shopId, input.shopId));
      const ventesJour = allOrders.filter(o => o.status !== "panier" && o.status !== "annule" && o.createdAt >= todayStart);
      const ventesMois = allOrders.filter(o => o.status !== "panier" && o.status !== "annule" && o.createdAt >= monthStart);
      const caJour = ventesJour.reduce((s, o) => s + Number(o.totalTtc ?? 0), 0);
      const caMois = ventesMois.reduce((s, o) => s + Number(o.totalTtc ?? 0), 0);
      const commandesEnCours = allOrders.filter(o => o.status === "confirme" || o.status === "preparation" || o.status === "expedie").length;
      const livraisonsEnCours = allOrders.filter(o => o.status === "expedie").length;

      // Stock alerts
      const catalogIds = await db.select({ id: partsCatalog.id }).from(partsCatalog).where(eq(partsCatalog.shopId, input.shopId));
      const ids = catalogIds.map(c => c.id);
      let stockFaible = 0;
      if (ids.length > 0) {
        const allStock = await db.select().from(partsStock).where(sql`${partsStock.catalogId} = ANY(${ids})`);
        stockFaible = allStock.filter(s => (s.quantite - s.quantiteReservee) <= s.seuilMin && (s.quantite - s.quantiteReservee) > 0).length;
      }

      const totalProduits = catalogIds.length;

      return {
        ventesJour: ventesJour.length,
        caJour,
        ventesMois: ventesMois.length,
        caMois,
        commandesEnCours,
        livraisonsEnCours,
        stockFaible,
        totalProduits,
      };
    }),

  // ── ADMIN: vue globale pièces ──
  adminStats: adminProcedure.query(async () => {
    const [{ shops }] = await db.select({ shops: sql<number>`count(*)::int` }).from(partsShops);
    const [{ products }] = await db.select({ products: sql<number>`count(*)::int` }).from(partsCatalog);
    const [{ orders }] = await db.select({ orders: sql<number>`count(*)::int` }).from(partsOrders);
    return { shops, products, orders };
  }),
});
