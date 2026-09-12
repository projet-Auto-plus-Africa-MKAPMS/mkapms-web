/**
 * MKA.P-MS Investissement — Investor Payout.
 *
 * Regroupe les mouvements du Ledger d'une période en un versement réel.
 * Aucun montant inventé : toujours la somme de mouvements déjà écrits par
 * revenu.ts::attribuerRevenu. Le PSP réel (Stripe ou autre) n'est pas
 * configuré dans cet environnement de travail — voir HANDOFF DEVAN ; ce
 * moteur, ses statuts, son historique et ses tests sont prêts à recevoir
 * l'exécution réelle du virement dès qu'un adapter est branché.
 */
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../db.js";
import { investorLedger, investorPayoutHistory, investorPayouts } from "./schema.js";

export interface ResultatPayout {
  ok: boolean;
  motif: string;
  payout?: typeof investorPayouts.$inferSelect;
}

async function transitionnerPayout(payoutId: number, vers: (typeof investorPayouts.$inferSelect)["statut"], motif: string, changedBy: number | null = null): Promise<ResultatPayout> {
  const [existant] = await db.select().from(investorPayouts).where(eq(investorPayouts.id, payoutId)).limit(1);
  if (!existant) return { ok: false, motif: `Versement #${payoutId} introuvable.` };

  const [payout] = await db.update(investorPayouts).set({ statut: vers, updatedAt: new Date() }).where(eq(investorPayouts.id, payoutId)).returning();
  await db.insert(investorPayoutHistory).values({ payoutId, fromStatus: existant.statut, toStatus: vers, motif, changedBy });
  return { ok: true, motif, payout };
}

/**
 * Crée un versement à partir des mouvements réellement écrits au Ledger pour
 * cet investissement, sur la période demandée — jamais un montant estimé.
 * Ne modifie pas les lignes de Ledger : elles ne passent à "verse" qu'à la
 * confirmation réelle du paiement (confirmerVersement).
 */
export async function creerPayoutPourPeriode(
  investmentId: number,
  investorId: number,
  contractDocumentId: number | null,
  periodeDebut: Date,
  periodeFin: Date,
  datePrevue: Date,
): Promise<ResultatPayout> {
  const mouvements = await db
    .select()
    .from(investorLedger)
    .where(
      and(
        eq(investorLedger.investmentId, investmentId),
        inArray(investorLedger.statut, ["en_attente", "disponible"]),
        gte(investorLedger.createdAt, periodeDebut),
        lte(investorLedger.createdAt, periodeFin),
      ),
    );

  if (mouvements.length === 0) {
    return { ok: false, motif: `Aucun mouvement disponible au Ledger pour l'investissement #${investmentId} sur cette période : aucun versement créé.` };
  }

  const devise = mouvements[0].devise;
  const montantBrut = mouvements.reduce((s, m) => s + Number(m.montantBrut), 0);
  const montantNet = mouvements.reduce((s, m) => s + Number(m.montantNet), 0);

  const [payout] = await db
    .insert(investorPayouts)
    .values({
      investorId,
      investmentId,
      contractDocumentId,
      periodeDebut,
      periodeFin,
      datePrevue,
      montantBrut: String(montantBrut),
      montantNet: String(montantNet),
      devise,
      statut: "en_attente",
    })
    .returning();

  await db.insert(investorPayoutHistory).values({ payoutId: payout.id, fromStatus: null, toStatus: "en_attente", motif: `Créé à partir de ${mouvements.length} mouvement(s) du Ledger.` });

  return { ok: true, motif: `Versement #${payout.id} créé (${mouvements.length} mouvement(s), net ${montantNet} ${devise}).`, payout };
}

/**
 * Confirme un versement réellement exécuté (preuve/référence PSP fournie par
 * l'appelant — jamais généré ici) et fait passer au Ledger les mouvements
 * couverts par la période du "en_attente"/"disponible" vers "verse".
 */
export async function confirmerVersement(payoutId: number, reference: string, preuveUrl: string | null, changedBy: number | null = null): Promise<ResultatPayout> {
  const [payout] = await db.select().from(investorPayouts).where(eq(investorPayouts.id, payoutId)).limit(1);
  if (!payout) return { ok: false, motif: `Versement #${payoutId} introuvable.` };

  await db
    .update(investorPayouts)
    .set({ statut: "paye", dateReelle: new Date(), reference, preuveUrl, updatedAt: new Date() })
    .where(eq(investorPayouts.id, payoutId));
  await db.insert(investorPayoutHistory).values({ payoutId, fromStatus: payout.statut, toStatus: "paye", motif: `Confirmé (référence ${reference}).`, changedBy });

  await db
    .update(investorLedger)
    .set({ statut: "verse" })
    .where(
      and(
        eq(investorLedger.investmentId, payout.investmentId),
        inArray(investorLedger.statut, ["en_attente", "disponible"]),
        gte(investorLedger.createdAt, payout.periodeDebut),
        lte(investorLedger.createdAt, payout.periodeFin),
      ),
    );

  return { ok: true, motif: `Versement #${payoutId} confirmé, Ledger mis à jour.` };
}

/** Échec réel (rejet PSP, IBAN invalide...) — jamais un statut deviné, toujours un motif explicite. */
export async function marquerEchec(payoutId: number, motifEchec: string, changedBy: number | null = null): Promise<ResultatPayout> {
  const [payout] = await db.select().from(investorPayouts).where(eq(investorPayouts.id, payoutId)).limit(1);
  if (!payout) return { ok: false, motif: `Versement #${payoutId} introuvable.` };
  await db
    .update(investorPayouts)
    .set({ statut: "echoue", motifEchec, tentatives: payout.tentatives + 1, updatedAt: new Date() })
    .where(eq(investorPayouts.id, payoutId));
  await db.insert(investorPayoutHistory).values({ payoutId, fromStatus: payout.statut, toStatus: "echoue", motif: motifEchec, changedBy });
  return { ok: true, motif: `Versement #${payoutId} marqué en échec (tentative ${payout.tentatives + 1}) : ${motifEchec}` };
}

/** Nouvelle tentative après échec — repasse en_attente, jamais un paiement supposé réussi entre-temps. */
export async function reessayer(payoutId: number, changedBy: number | null = null): Promise<ResultatPayout> {
  return transitionnerPayout(payoutId, "en_attente", "Nouvelle tentative après échec.", changedBy);
}

export async function ouvrirLitige(payoutId: number, motif: string, changedBy: number | null = null): Promise<ResultatPayout> {
  return transitionnerPayout(payoutId, "litige", motif, changedBy);
}

export async function historiquePayout(payoutId: number) {
  return db.select().from(investorPayoutHistory).where(eq(investorPayoutHistory.payoutId, payoutId)).orderBy(investorPayoutHistory.changedAt);
}
