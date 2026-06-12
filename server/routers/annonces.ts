import { z } from "zod";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { annonces, annoncePhotos, users } from "../schema.js";

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
          photos.slice(0, 10).map((url, i) => ({
            annonceId: created.id,
            url,
            ordre: i,
          })),
        );
      }
      return created;
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
