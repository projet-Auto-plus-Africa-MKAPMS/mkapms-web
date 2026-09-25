/**
 * Objectifs de pilotage plateforme (AdminObjectif.tsx).
 *
 * OBJECTIFS.actuel était une valeur inventée pour chaque indicateur, et
 * OBJECTIFS.objectif (la cible) l'était tout autant. Les deux ne se traitent
 * pas pareil : la valeur ACTUELLE se recalcule en direct depuis les données
 * réelles (jamais stockée), la CIBLE est une décision de la Direction — elle
 * ne doit jamais être devinée, seulement enregistrée quand la Direction la
 * fixe (objectifsPlateforme.cible, NULL tant qu'elle n'a jamais été réglée).
 *
 * Deux indicateurs de la maquette (taux de rétention, NPS) n'ont aujourd'hui
 * aucune méthode de calcul réelle dans le dépôt (pas de cohortes de
 * réactivation, pas de question 0-10 "recommanderiez-vous") — ils restent
 * explicitement "non mesuré", jamais approximés par une autre donnée.
 */
import { z } from "zod";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { objectifsPlateforme, payments, users, annonces, supportTickets } from "../schema.js";

const INDICATEURS = [
  { cle: "ca_mensuel", label: "CA mensuel", unite: "monnaie" as const },
  { cle: "nouveaux_inscrits", label: "Nouveaux inscrits", unite: "compte" as const },
  { cle: "taux_retention", label: "Taux rétention", unite: "pourcent" as const, nonMesure: true },
  { cle: "annonces_actives", label: "Annonces actives", unite: "compte" as const },
  { cle: "nps", label: "NPS (satisfaction)", unite: "score" as const, nonMesure: true },
  { cle: "temps_reponse_support", label: "Temps réponse support", unite: "heures" as const },
] as const;

function debutMois(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const objectifsRouter = router({
  list: adminProcedure.query(async () => {
    const debut = debutMois();

    const cibles = await db.select().from(objectifsPlateforme);
    const cibleMap = new Map(cibles.map((c) => [c.cle, c.cible]));

    const caParDevise = await db
      .select({ currency: payments.currency, total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(and(eq(payments.status, "paid"), gte(payments.createdAt, debut)))
      .groupBy(payments.currency);

    const [nouveaux] = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(gte(users.createdAt, debut));
    const [annoncesActives] = await db.select({ n: sql<number>`count(*)::int` }).from(annonces).where(eq(annonces.status, "publiee"));
    const [tempsReponse] = await db
      .select({ heures: sql<string | null>`avg(extract(epoch from (${supportTickets.respondedAt} - ${supportTickets.createdAt})) / 3600)` })
      .from(supportTickets)
      .where(isNotNull(supportTickets.respondedAt));

    const actuels: Record<string, string | null> = {
      ca_mensuel: caParDevise.length ? caParDevise.map((c) => `${Math.round(Number(c.total)).toLocaleString("fr-FR")} ${c.currency}`).join(" + ") : "0 EUR",
      nouveaux_inscrits: String(nouveaux?.n ?? 0),
      taux_retention: null,
      annonces_actives: String(annoncesActives?.n ?? 0),
      nps: null,
      temps_reponse_support: tempsReponse?.heures != null ? `${Number(tempsReponse.heures).toFixed(1)}h` : null,
    };

    return INDICATEURS.map((i) => ({
      cle: i.cle,
      label: i.label,
      unite: i.unite,
      nonMesure: "nonMesure" in i ? i.nonMesure : false,
      actuel: actuels[i.cle],
      cible: cibleMap.get(i.cle) ?? null,
    }));
  }),

  setCible: adminProcedure
    .input(z.object({ cle: z.enum(INDICATEURS.map((i) => i.cle) as [string, ...string[]]), cible: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const [existant] = await db.select({ id: objectifsPlateforme.id }).from(objectifsPlateforme).where(eq(objectifsPlateforme.cle, input.cle)).limit(1);
      if (existant) {
        await db.update(objectifsPlateforme).set({ cible: String(input.cible), updatedBy: ctx.user.uid, updatedAt: new Date() }).where(eq(objectifsPlateforme.id, existant.id));
      } else {
        await db.insert(objectifsPlateforme).values({ cle: input.cle, cible: String(input.cible), updatedBy: ctx.user.uid });
      }
      return { ok: true };
    }),
});
