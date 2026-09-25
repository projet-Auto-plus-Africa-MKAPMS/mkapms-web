/**
 * AdminStatistiques.tsx (superadmin) affichait 6 indicateurs 100% fabriqués
 * (CA, nouveaux inscrits, annonces, taux de conversion, panier moyen, taux
 * de désabonnement), chacun avec une variation et un détail inventés
 * (ex : "motif principal : prix trop élevé (38%)" sans aucune source).
 *
 * ca/nouveauxInscrits/annoncesPubliees/panierMoyen sont recalculés en direct
 * depuis payments/users/annonces, avec une vraie variation mois en cours vs
 * mois précédent (jamais un pourcentage deviné).
 *
 * tauxConversion reste "nonMesure" : aucun suivi de visite/session n'existe
 * dans ce dépôt (pas de table pageViews ni d'analytics front), donc "visites
 * → contact" n'a aucune source réelle — jamais approximé par un autre
 * chiffre disponible.
 *
 * tauxDesabonnement est une VRAIE mesure mais une approximation documentée :
 * (abonnements annulés ce mois) / (abonnements actifs + annulés ce mois),
 * calculée depuis subscriptions.status/updatedAt (mis à jour précisément à
 * l'annulation par stripeWebhook.ts, jamais à un autre moment). Ce n'est pas
 * un churn par cohorte à proprement parler, mais un ratio réel sur des
 * données réelles — jamais un motif de désabonnement inventé.
 */
import { desc, eq, and, sql } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { payments, users, annonces, subscriptions } from "../schema.js";

function debutMois(offsetMois = 0): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMois, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function variation(actuel: number, precedent: number): number | null {
  if (precedent <= 0) return null;
  return Math.round(((actuel - precedent) / precedent) * 1000) / 10;
}

export const statistiquesRouter = router({
  globales: adminProcedure.query(async () => {
    const moisEnCours = debutMois(0);
    const moisPrecedent = debutMois(-1);

    // Chiffre d'affaires (par devise — jamais fusionné par un taux de change deviné)
    const caParDevise = async (debut: Date, fin: Date) =>
      db
        .select({ currency: payments.currency, total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
        .from(payments)
        .where(and(eq(payments.status, "paid"), sql`${payments.createdAt} >= ${debut} and ${payments.createdAt} < ${fin}`))
        .groupBy(payments.currency);
    const caActuel = await caParDevise(moisEnCours, debutMois(1));
    const caPrecedent = await caParDevise(moisPrecedent, moisEnCours);
    const caActuelEur = Number(caActuel.find((c) => c.currency === "EUR")?.total ?? 0);
    const caPrecedentEur = Number(caPrecedent.find((c) => c.currency === "EUR")?.total ?? 0);

    // Nouveaux inscrits
    const compterUsers = async (debut: Date, fin: Date, accountType?: "particulier" | "professionnel") => {
      const conds = [sql`${users.createdAt} >= ${debut} and ${users.createdAt} < ${fin}`];
      if (accountType) conds.push(eq(users.accountType, accountType));
      const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(and(...conds));
      return r?.n ?? 0;
    };
    const nouveauxActuel = await compterUsers(moisEnCours, debutMois(1));
    const nouveauxPrecedent = await compterUsers(moisPrecedent, moisEnCours);
    const nouveauxParticuliers = await compterUsers(moisEnCours, debutMois(1), "particulier");
    const nouveauxPros = await compterUsers(moisEnCours, debutMois(1), "professionnel");

    // Annonces publiées (au sens où elles ont été mises en ligne — statut publiee/vendue/louee)
    const compterAnnonces = async (debut: Date, fin: Date, type?: "vente" | "location") => {
      const conds = [
        sql`${annonces.createdAt} >= ${debut} and ${annonces.createdAt} < ${fin}`,
        sql`${annonces.status} in ('publiee','vendue','louee')`,
      ];
      if (type) conds.push(eq(annonces.type, type));
      const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(annonces).where(and(...conds));
      return r?.n ?? 0;
    };
    const annoncesActuel = await compterAnnonces(moisEnCours, debutMois(1));
    const annoncesPrecedent = await compterAnnonces(moisPrecedent, moisEnCours);
    const annoncesVente = await compterAnnonces(moisEnCours, debutMois(1), "vente");
    const annoncesLocation = await compterAnnonces(moisEnCours, debutMois(1), "location");

    // Panier moyen (EUR — devise dominante ; jamais fusionné avec d'autres devises)
    const panierMoyen = async (debut: Date, fin: Date) => {
      const [r] = await db
        .select({ v: sql<string>`coalesce(avg(${payments.amount}), 0)` })
        .from(payments)
        .where(and(eq(payments.status, "paid"), eq(payments.currency, "EUR"), sql`${payments.createdAt} >= ${debut} and ${payments.createdAt} < ${fin}`));
      return Number(r?.v ?? 0);
    };
    const panierActuel = await panierMoyen(moisEnCours, debutMois(1));
    const panierPrecedent = await panierMoyen(moisPrecedent, moisEnCours);

    // Taux de désabonnement — approximation réelle documentée (voir en-tête de fichier)
    const [annulesCeMois] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(subscriptions)
      .where(and(eq(subscriptions.status, "cancelled"), sql`${subscriptions.updatedAt} >= ${moisEnCours}`));
    const [actifsActuels] = await db.select({ n: sql<number>`count(*)::int` }).from(subscriptions).where(eq(subscriptions.status, "active"));
    const annules = annulesCeMois?.n ?? 0;
    const actifs = actifsActuels?.n ?? 0;
    const baseChurn = actifs + annules;

    return {
      ca: { actuel: caActuelEur.toFixed(2), devise: "EUR", variationPct: variation(caActuelEur, caPrecedentEur) },
      nouveauxInscrits: { actuel: nouveauxActuel, variationPct: variation(nouveauxActuel, nouveauxPrecedent), particuliers: nouveauxParticuliers, professionnels: nouveauxPros },
      annoncesPubliees: { actuel: annoncesActuel, variationPct: variation(annoncesActuel, annoncesPrecedent), vente: annoncesVente, location: annoncesLocation },
      panierMoyen: { actuel: panierActuel.toFixed(2), devise: "EUR", variationPct: variation(panierActuel, panierPrecedent) },
      tauxConversion: { nonMesure: true },
      tauxDesabonnement: { actuel: baseChurn > 0 ? Math.round((annules / baseChurn) * 1000) / 10 : null, annulesCeMois: annules, actifsActuels: actifs },
    };
  }),
});
