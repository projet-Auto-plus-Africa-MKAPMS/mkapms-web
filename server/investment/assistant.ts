/**
 * MKA.P-MS Investissement — accès Investisseur à MKA.P-MS Intelligence.
 *
 * Passe uniquement par server/intelligences/routeur.ts (jamais provider.ts
 * directement, comme tout le reste de la plateforme). Le système ne reçoit
 * en contexte QUE les données déjà agrégées de CET investisseur — jamais une
 * requête libre sur la base, jamais les données d'un autre investisseur, un
 * secret MKA.P-MS ou une donnée Direction : le cloisonnement vient du
 * périmètre du prompt, pas d'une consigne qu'on demande au modèle de
 * respecter de bonne volonté.
 */
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { router } from "../intelligences/routeur.js";
import { investments, investorLedger, investorPayouts, investors } from "./schema.js";

export interface ResultatAssistantInvestisseur {
  ok: boolean;
  reponse: string;
  motif: string;
}

function resumeContexte(
  inv: typeof investors.$inferSelect,
  mesInvestissements: (typeof investments.$inferSelect)[],
  ledger: (typeof investorLedger.$inferSelect)[],
  payouts: (typeof investorPayouts.$inferSelect)[],
): string {
  const lignesInvestissements = mesInvestissements.map(
    (i) => `- Investissement #${i.id} : univers=${i.universeId}, pays=${i.countryCode}, statut=${i.status}, début=${i.startAt?.toISOString() ?? "non défini"}, fin=${i.endAt?.toISOString() ?? "non définie"}, modèle=${i.pricingModel}.`,
  );
  const totalNet = ledger.reduce((s, l) => s + Number(l.montantNet), 0);
  const enAttente = ledger.filter((l) => l.statut === "en_attente" || l.statut === "disponible").reduce((s, l) => s + Number(l.montantNet), 0);
  const prochainVersement = payouts.filter((p) => p.statut === "en_attente").sort((a, b) => a.datePrevue.getTime() - b.datePrevue.getTime())[0];

  return [
    `Investisseur #${inv.id} (type ${inv.investorType}).`,
    `Ses investissements (aucun autre investisseur n'existe dans ce contexte) :`,
    ...(lignesInvestissements.length ? lignesInvestissements : ["- Aucun investissement."]),
    `Total net cumulé au Ledger : ${totalNet.toFixed(2)}.`,
    `Montant net en attente (non encore versé) : ${enAttente.toFixed(2)}.`,
    prochainVersement
      ? `Prochain versement prévu le ${prochainVersement.datePrevue.toISOString()} : ${prochainVersement.montantNet}.`
      : "Aucun versement en attente programmé.",
  ].join("\n");
}

/**
 * Répond à une question en langage naturel d'un investisseur, à partir
 * exclusivement de ses propres données déjà agrégées. Ne révèle jamais rien
 * hors de ce périmètre : le contexte envoyé au modèle ne contient jamais
 * autre chose que les lignes ci-dessus.
 */
export async function poserQuestion(investorId: number, question: string): Promise<ResultatAssistantInvestisseur> {
  const [inv] = await db.select().from(investors).where(eq(investors.id, investorId)).limit(1);
  if (!inv) return { ok: false, reponse: "", motif: `Investisseur #${investorId} introuvable.` };

  const [mesInvestissements, ledger, payouts] = await Promise.all([
    db.select().from(investments).where(eq(investments.investorId, investorId)),
    db.select().from(investorLedger).where(eq(investorLedger.investorId, investorId)),
    db.select().from(investorPayouts).where(eq(investorPayouts.investorId, investorId)),
  ]);

  const contexte = resumeContexte(inv, mesInvestissements, ledger, payouts);

  const resultat = await router({
    capacite: "raisonnement",
    moteur: "investment",
    role: "user",
    systeme:
      "Tu es l'assistant MKA.P-MS Intelligence de l'espace Investisseur. Réponds UNIQUEMENT à partir des données fournies ci-dessous, qui appartiennent exclusivement à cet investisseur. Ne révèle jamais de données d'un autre investisseur, aucun secret MKA.P-MS, aucune donnée Direction : tu ne les connais pas. Si l'information demandée n'apparaît pas dans le contexte, dis-le clairement plutôt que de deviner. Ne promets jamais un rendement futur.",
    message: `Contexte (données de cet investisseur uniquement) :\n${contexte}\n\nQuestion de l'investisseur : ${question}`,
  });

  if (!resultat.ok) {
    return { ok: false, reponse: "", motif: resultat.motif };
  }
  return { ok: true, reponse: resultat.texte, motif: "" };
}
