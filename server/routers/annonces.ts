import { z } from "zod";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { annonces, annoncePhotos, users, subscriptions } from "../schema.js";
import { getPlan } from "@shared/plans.js";
import { logAction } from "../audit.js";

// Quota d'annonces du pro selon son abonnement actif. Renvoie l'état SANS bloquer
// (règle Partie A §2 : on facture les dépassements, on ne bloque jamais).
async function quotaInfo(userId: number) {
  const actives = await db
    .select({ id: annonces.id })
    .from(annonces)
    .where(and(eq(annonces.ownerId, userId), eq(annonces.status, "publiee")));
  const used = actives.length;
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  const plan = sub ? getPlan(sub.planCode) : undefined;
  const limit = plan?.quotas.maxAnnonces ?? null; // null = illimité
  const overageEur = plan?.overageEur ?? 0;
  const over = limit != null && used >= limit;
  const approaching = limit != null && !over && used >= Math.max(1, limit - 2);
  return { used, limit, overageEur, over, approaching, planCode: sub?.planCode ?? null };
}

const categorieEnum = z.enum([
  "citadine", "berline", "break", "suv", "coupe", "cabriolet", "monospace",
  "utilitaire", "camion", "moto", "scooter", "quad", "luxe", "autre",
]);

export const annoncesRouter = router({
  // Liste publique avec filtres (page Acheter / Louer)
  list: publicProcedure
    .input(
      z.object({
        type: z.enum(["vente", "location"]).optional(),
        q: z.string().optional(),
        categorie: categorieEnum.optional(),
        famille: z.enum(["auto", "moto"]).optional(),
        vendeurType: z.enum(["particulier", "professionnel", "concession"]).optional(),
        prixMax: z.number().optional(),
        ville: z.string().optional(),
        segmentLocation: z.enum(["particulier", "professionnel", "vtc_taxi"]).optional(),
        limit: z.number().min(1).max(100).default(24),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const conds = [eq(annonces.status, "publiee")];
      if (input.type) conds.push(eq(annonces.type, input.type));
      if (input.categorie) conds.push(eq(annonces.categorie, input.categorie));
      if (input.famille) conds.push(eq(annonces.famille, input.famille));
      if (input.vendeurType) conds.push(eq(annonces.vendeurType, input.vendeurType));
      if (input.segmentLocation) conds.push(eq(annonces.segmentLocation, input.segmentLocation));
      if (input.prixMax) conds.push(lte(annonces.prix, String(input.prixMax)));
      if (input.ville) conds.push(ilike(annonces.ville, `%${input.ville}%`));
      if (input.q) {
        const like = `%${input.q}%`;
        conds.push(
          or(
            ilike(annonces.titre, like),
            ilike(annonces.marque, like),
            ilike(annonces.modele, like),
            ilike(annonces.version, like),
          )!,
        );
      }
      const where = and(...conds);
      const rows = await db
        .select()
        .from(annonces)
        .where(where)
        .orderBy(desc(annonces.boosted), desc(annonces.publishedAt), desc(annonces.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(annonces)
        .where(where);

      // photo principale par annonce
      const ids = rows.map((r) => r.id);
      const photos = ids.length
        ? await db
            .select()
            .from(annoncePhotos)
            .where(sql`${annoncePhotos.annonceId} in (${sql.join(ids, sql`, `)})`)
            .orderBy(annoncePhotos.ordre)
        : [];
      const photoMap = new Map<number, string>();
      for (const p of photos) {
        if (!photoMap.has(p.annonceId!)) photoMap.set(p.annonceId!, p.url);
      }
      return {
        total: count,
        items: rows.map((r) => ({ ...r, photoPrincipale: photoMap.get(r.id) ?? null })),
      };
    }),

  // Fiche véhicule détaillée
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [a] = await db.select().from(annonces).where(eq(annonces.id, input.id)).limit(1);
      if (!a) throw new TRPCError({ code: "NOT_FOUND" });
      const photos = await db
        .select()
        .from(annoncePhotos)
        .where(eq(annoncePhotos.annonceId, a.id))
        .orderBy(annoncePhotos.ordre);
      const [owner] = a.ownerId
        ? await db.select().from(users).where(eq(users.id, a.ownerId)).limit(1)
        : [];
      return {
        ...a,
        photos,
        vendeur: owner
          ? {
              id: owner.id,
              name: owner.companyName || owner.name,
              accountType: owner.accountType,
              rating: owner.rating,
              reviewCount: owner.reviewCount,
              phone: a.contactTelephone || owner.phone,
            }
          : null,
      };
    }),

  // Estimation intelligente du prix (Partie 5 §4) — basée sur les annonces
  // comparables réellement présentes sur la plateforme (data-driven), avec repli
  // heuristique transparent si l'échantillon est insuffisant. Barèmes affinables.
  estimate: publicProcedure
    .input(
      z.object({
        marque: z.string().min(1),
        modele: z.string().min(1),
        annee: z.number().optional(),
        kilometrage: z.number().optional(),
        carburant: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const conds = [
        eq(annonces.status, "publiee"),
        eq(annonces.type, "vente"),
        ilike(annonces.marque, input.marque),
        ilike(annonces.modele, input.modele),
      ];
      if (input.annee) {
        conds.push(gte(annonces.annee, input.annee - 3));
        conds.push(lte(annonces.annee, input.annee + 3));
      }
      const rows = await db
        .select({ prix: annonces.prix, km: annonces.kilometrage, annee: annonces.annee })
        .from(annonces)
        .where(and(...conds));

      const sample = rows
        .map((r) => ({ prix: Number(r.prix), km: r.km, annee: r.annee }))
        .filter((r) => Number.isFinite(r.prix) && r.prix > 500);

      const percentile = (arr: number[], p: number) => {
        if (!arr.length) return 0;
        const s = [...arr].sort((a, b) => a - b);
        const idx = Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))));
        return s[idx];
      };

      if (sample.length >= 4) {
        const prices = sample.map((s) => s.prix);
        let mid = percentile(prices, 50);
        let low = percentile(prices, 25);
        let high = percentile(prices, 75);

        // Ajustement kilométrage : si le véhicule a plus/moins de km que la
        // médiane, on nudge la fourchette de ±20 % maximum.
        const kms = sample.map((s) => s.km).filter((k): k is number => k != null && k > 0);
        if (input.kilometrage != null && kms.length >= 3) {
          const medianKm = percentile(kms, 50);
          if (medianKm > 0) {
            const factorRaw = 1 + (medianKm - input.kilometrage) / (medianKm * 4);
            const factor = Math.min(1.2, Math.max(0.8, factorRaw));
            mid = Math.round(mid * factor);
            low = Math.round(low * factor);
            high = Math.round(high * factor);
          }
        }
        return {
          method: "comparables" as const,
          sampleSize: sample.length,
          low: Math.round(low),
          mid: Math.round(mid),
          high: Math.round(high),
        };
      }

      // Repli heuristique (socle, barèmes à affiner) : base générique avec
      // décote par âge (12 %/an) et pénalité kilométrique légère.
      const year = new Date().getFullYear();
      const age = input.annee ? Math.max(0, year - input.annee) : 6;
      const base = 26000;
      let mid = base * Math.pow(0.88, age);
      if (input.kilometrage != null) mid -= Math.min(mid * 0.4, input.kilometrage * 0.04);
      mid = Math.max(1200, Math.round(mid));
      return {
        method: "heuristique" as const,
        sampleSize: sample.length,
        low: Math.round(mid * 0.85),
        mid,
        high: Math.round(mid * 1.15),
      };
    }),

  incrementView: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db
        .update(annonces)
        .set({ vues: sql`${annonces.vues} + 1` })
        .where(eq(annonces.id, input.id));
      return { ok: true };
    }),

  // Mes annonces (espace compte)
  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(annonces)
      .where(eq(annonces.ownerId, ctx.user.uid))
      .orderBy(desc(annonces.createdAt));
  }),

  // État du quota d'annonces (alerte préventive côté client, jamais de blocage)
  quotaStatus: protectedProcedure.query(async ({ ctx }) => quotaInfo(ctx.user.uid)),

  // Dépôt d'annonce (Vendre)
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["vente", "location"]).default("vente"),
        titre: z.string().min(3),
        description: z.string().optional(),
        marque: z.string().min(1),
        modele: z.string().min(1),
        version: z.string().optional(),
        categorie: categorieEnum.default("berline"),
        famille: z.enum(["auto", "moto"]).default("auto"),
        carburant: z.string().default("essence"),
        boite: z.string().default("manuelle"),
        annee: z.number().optional(),
        kilometrage: z.number().optional(),
        couleur: z.string().optional(),
        puissanceCv: z.number().optional(),
        portes: z.number().optional(),
        places: z.number().optional(),
        prix: z.number().default(0),
        prixJour: z.number().optional(),
        prixSemaine: z.number().optional(),
        prixMois: z.number().optional(),
        ville: z.string().optional(),
        codePostal: z.string().optional(),
        pays: z.string().default("FR"),
        contactTelephone: z.string().optional(),
        photos: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { photos, ...rest } = input;
      const [created] = await db
        .insert(annonces)
        .values({
          ownerId: ctx.user.uid,
          titre: rest.titre,
          description: rest.description,
          marque: rest.marque,
          modele: rest.modele,
          version: rest.version,
          type: rest.type,
          categorie: rest.categorie as any,
          famille: rest.famille as any,
          carburant: rest.carburant as any,
          boite: rest.boite as any,
          annee: rest.annee,
          kilometrage: rest.kilometrage,
          couleur: rest.couleur,
          puissanceCv: rest.puissanceCv,
          portes: rest.portes,
          places: rest.places,
          prix: String(rest.prix),
          prixJour: rest.prixJour != null ? String(rest.prixJour) : undefined,
          prixSemaine: rest.prixSemaine != null ? String(rest.prixSemaine) : undefined,
          prixMois: rest.prixMois != null ? String(rest.prixMois) : undefined,
          ville: rest.ville,
          codePostal: rest.codePostal,
          pays: rest.pays,
          contactTelephone: rest.contactTelephone,
          vendeurType: ctx.user.role === "user" ? "particulier" : "professionnel",
          status: "publiee",
          publishedAt: new Date(),
        })
        .returning();

      if (photos.length) {
        await db.insert(annoncePhotos).values(
          photos.slice(0, 30).map((url, i) => ({
            annonceId: created.id,
            url,
            ordre: i,
          })),
        );
      }

      // Règle Partie A §2 : pas de blocage. Si le quota est dépassé, on TRACE le
      // dépassement facturé (radar PDG + comptabilité) au lieu de refuser l'annonce.
      const quota = await quotaInfo(ctx.user.uid);
      let overageBilled = 0;
      if (quota.over && quota.overageEur > 0) {
        overageBilled = quota.overageEur;
        await logAction(ctx.user.uid, "annonce.overage", "annonce", created.id, {
          planCode: quota.planCode,
          used: quota.used,
          limit: quota.limit,
          overageEur: quota.overageEur,
        });
      }
      return { ...created, overageBilled, quota };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [a] = await db.select().from(annonces).where(eq(annonces.id, input.id)).limit(1);
      if (!a || a.ownerId !== ctx.user.uid) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.update(annonces).set({ status: "archivee" }).where(eq(annonces.id, input.id));
      return { ok: true };
    }),
});
