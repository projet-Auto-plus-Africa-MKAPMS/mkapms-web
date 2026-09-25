/**
 * Badges & certifications (AdminBadges.tsx).
 *
 * BADGES.attribues était un chiffre inventé par badge. Les critères
 * d'attribution ("identité vérifiée + 10 ventes", "note > 4.5 + pro
 * vérifié"...) mélangent des seuils très différents d'un badge à l'autre
 * (comptage de ventes, moyenne de notes, statut KYC, certification
 * atelier) : les coder tous en une règle numérique unique aurait exigé
 * d'inventer des seuils que la Direction n'a jamais fixés. Le critère reste
 * donc un texte décidé par un agent (modifiable via setCriteres), et le
 * nombre "attribués" vient d'un vrai comptage sur badgeAttributions —
 * jamais un chiffre calculé en devinant la règle. L'attribution effective
 * (badgeAttributions) reste manuelle pour l'instant : aucun moteur
 * d'évaluation automatique des critères n'existe encore (à construire
 * séparément si besoin, une fois les seuils réels validés par la Direction).
 */
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { badges, badgeAttributions, users } from "../schema.js";

const CATALOGUE_INITIAL = [
  { code: "vendeur_certifie", nom: "Vendeur certifié", description: "Identité vérifiée + historique de ventes.", criteres: "Identité vérifiée (KYC) + au moins 10 ventes réalisées." },
  { code: "garage_premium", nom: "Garage premium", description: "Garage professionnel vérifié, bien noté.", criteres: "Note moyenne > 4.5 + professionnel vérifié (KYC)." },
  { code: "top_vendeur", nom: "Top vendeur", description: "Vendeur avec un volume de ventes élevé.", criteres: "Plus de 50 annonces vendues." },
  { code: "super_loueur", nom: "Super loueur", description: "Loueur avec un volume de locations élevé.", criteres: "Plus de 100 locations effectuées." },
  { code: "expert_technique", nom: "Expert technique", description: "Professionnel certifié sur les outils techniques.", criteres: "Certifié Atelier Pro + abonné AutoData Pro." },
] as const;

/** Déclare le catalogue de badges s'il n'existe pas encore — idempotent,
 * ne touche jamais un badge déjà présent (la Direction a pu modifier ses
 * critères depuis). Le nombre "attribués" reste à 0 tant qu'aucune
 * attribution réelle n'est enregistrée dans badgeAttributions. */
export async function seedBadgesCatalogue(): Promise<{ crees: number }> {
  let crees = 0;
  for (const b of CATALOGUE_INITIAL) {
    const [existant] = await db.select({ id: badges.id }).from(badges).where(eq(badges.code, b.code)).limit(1);
    if (existant) continue;
    await db.insert(badges).values(b);
    crees += 1;
  }
  return { crees };
}

export const badgesRouter = router({
  list: adminProcedure.query(async () => {
    const rows = await db
      .select({
        id: badges.id,
        code: badges.code,
        nom: badges.nom,
        description: badges.description,
        criteres: badges.criteres,
        attribues: sql<number>`count(${badgeAttributions.id})::int`,
      })
      .from(badges)
      .leftJoin(badgeAttributions, eq(badgeAttributions.badgeId, badges.id))
      .groupBy(badges.id)
      .orderBy(badges.nom);
    return rows;
  }),

  setCriteres: adminProcedure
    .input(z.object({ id: z.number(), criteres: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      await db.update(badges).set({ criteres: input.criteres, updatedBy: ctx.user.uid, updatedAt: new Date() }).where(eq(badges.id, input.id));
      return { ok: true };
    }),

  titulaires: adminProcedure
    .input(z.object({ badgeId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select({ id: badgeAttributions.id, userId: badgeAttributions.userId, userName: users.name, userEmail: users.email, awardedAt: badgeAttributions.awardedAt })
        .from(badgeAttributions)
        .leftJoin(users, eq(users.id, badgeAttributions.userId))
        .where(eq(badgeAttributions.badgeId, input.badgeId))
        .orderBy(desc(badgeAttributions.awardedAt));
    }),
});
