/**
 * Moteur d'Atelier — réapprovisionnement de bout en bout.
 *
 *   seuil (atelier_stock.seuil)
 *   → proposition (ouverte par l'événement atelier.stock_bas ou à la main)
 *   → décision humaine (validée / refusée, quantité et prix ajustables)
 *   → commande fournisseur (engagement financier sous plafond mensuel)
 *   → transmission (email réel si le SMTP est configuré, sinon bon « à transmettre »)
 *   → réception (le stock est réellement incrémenté, mouvement tracé)
 *
 * Rien n'achète tout seul : la plateforme propose, l'atelier décide, et la
 * commande est refusée si elle dépasse le plafond que l'atelier s'est fixé.
 * Chaque étape est publiée à l'Event Bus : Système Intelligent (alertes) et
 * MKA.P-MS Intelligences (mémoire) suivent sans qu'on les appelle à la main.
 */
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  atelierCommandesFournisseur,
  atelierReapproPropositions,
  atelierReapproReglages,
  atelierStock,
  atelierStockMouvements,
  type LigneCommandeFournisseur,
} from "./schema.js";
import { emitSafe } from "../event-bus/service.js";
import { heartbeat } from "../engine-registry/service.js";
import { sendEmail } from "../services/email.js";

export const STATUTS_PROPOSITION = [
  "proposee",
  "validee",
  "refusee",
  "commandee",
  "receptionnee",
] as const;
export type StatutProposition = (typeof STATUTS_PROPOSITION)[number];

export const STATUTS_COMMANDE = ["a_transmettre", "envoyee", "receptionnee", "annulee"] as const;
export type StatutCommande = (typeof STATUTS_COMMANDE)[number];

export type LigneCommande = LigneCommandeFournisseur;

export class ReapproRefus extends Error {
  constructor(
    message: string,
    readonly code: "PRECONDITION_FAILED" | "NOT_FOUND" | "BAD_REQUEST" = "PRECONDITION_FAILED",
  ) {
    super(message);
  }
}

/* ----------------------------------------------------------------- réglages */

export interface ReglagesInput {
  garageId: number;
  plafondMensuelCents: number;
  propositionAuto: boolean;
  fournisseurNom?: string;
  fournisseurEmail?: string;
  fournisseurTelephone?: string;
  parUser: number;
}

export async function reglages(garageId: number) {
  const [r] = await db
    .select()
    .from(atelierReapproReglages)
    .where(eq(atelierReapproReglages.garageId, garageId))
    .limit(1);
  return r ?? null;
}

export async function enregistrerReglages(input: ReglagesInput) {
  const valeurs = {
    plafondMensuelCents: input.plafondMensuelCents,
    propositionAuto: input.propositionAuto,
    fournisseurNom: input.fournisseurNom ?? null,
    fournisseurEmail: input.fournisseurEmail ?? null,
    fournisseurTelephone: input.fournisseurTelephone ?? null,
    parUser: input.parUser,
    updatedAt: new Date(),
  };
  const [ligne] = await db
    .insert(atelierReapproReglages)
    .values({ garageId: input.garageId, ...valeurs })
    .onConflictDoUpdate({ target: atelierReapproReglages.garageId, set: valeurs })
    .returning();

  await emitSafe({
    source: "atelier",
    type: "atelier.reappro_reglages_modifies",
    payload: {
      garageId: ligne.garageId,
      plafondMensuelCents: ligne.plafondMensuelCents,
      propositionAuto: ligne.propositionAuto,
      fournisseur: ligne.fournisseurNom ?? "",
    },
  });
  await heartbeat("atelier", "ok", {
    message: `Plafond de réapprovisionnement du garage ${ligne.garageId} fixé à ${ligne.plafondMensuelCents} cents/mois.`,
  });
  return ligne;
}

/* ------------------------------------------------------------- propositions */

/** Quantité qui ramène la ligne à deux fois son seuil : au moins une pièce. */
function quantiteCouvrante(quantite: number, seuil: number): number {
  return Math.max(1, seuil * 2 - quantite);
}

/**
 * Ouvre une proposition pour une ligne de stock sous son seuil. Idempotent :
 * une proposition encore ouverte (proposée ou validée) sur la même ligne n'est
 * pas doublée, la rupture répétée ne doit pas produire dix propositions.
 */
export async function proposerPourStock(
  stockId: number,
  origine: "seuil_auto" | "manuelle",
  parUser?: number,
): Promise<{ proposition: typeof atelierReapproPropositions.$inferSelect; nouvelle: boolean }> {
  const [ligne] = await db.select().from(atelierStock).where(eq(atelierStock.id, stockId)).limit(1);
  if (!ligne) throw new ReapproRefus("Ligne de stock introuvable.", "NOT_FOUND");

  if (origine === "seuil_auto") {
    const r = await reglages(ligne.garageId);
    if (r && !r.propositionAuto) {
      throw new ReapproRefus(
        `Le garage ${ligne.garageId} a désactivé les propositions automatiques : la rupture reste signalée par l'alerte, sans proposition.`,
      );
    }
  }

  const [ouverte] = await db
    .select()
    .from(atelierReapproPropositions)
    .where(
      and(
        eq(atelierReapproPropositions.stockId, stockId),
        inArray(atelierReapproPropositions.statut, ["proposee", "validee"]),
      ),
    )
    .limit(1);
  if (ouverte) return { proposition: ouverte, nouvelle: false };

  const [proposition] = await db
    .insert(atelierReapproPropositions)
    .values({
      garageId: ligne.garageId,
      stockId: ligne.id,
      reference: ligne.reference,
      designation: ligne.designation,
      quantiteConstatee: ligne.quantite,
      seuil: ligne.seuil,
      quantiteProposee: quantiteCouvrante(ligne.quantite, ligne.seuil),
      prixUnitaireCents: ligne.prixAchatCents ?? null,
      origine,
      decidePar: null,
    })
    .returning();

  await emitSafe({
    source: "atelier",
    type: "atelier.reappro_proposee",
    payload: {
      propositionId: proposition.id,
      garageId: proposition.garageId,
      reference: proposition.reference,
      quantiteProposee: proposition.quantiteProposee,
      origine,
      prixConnu: proposition.prixUnitaireCents != null,
    },
  });
  await heartbeat("atelier", "ok", {
    message: `Proposition de réapprovisionnement #${proposition.id} ouverte (${proposition.reference}, ${origine}${parUser ? `, par ${parUser}` : ""}).`,
  });
  return { proposition, nouvelle: true };
}

/** Ouvre une proposition pour chaque ligne sous seuil des garages donnés. */
export async function proposerToutesLesRuptures(garageIds: number[], parUser: number) {
  if (garageIds.length === 0) return { ouvertes: 0, dejaOuvertes: 0 };
  const basses = await db
    .select({ id: atelierStock.id })
    .from(atelierStock)
    .where(
      and(
        inArray(atelierStock.garageId, garageIds),
        sql`${atelierStock.seuil} > 0 and ${atelierStock.quantite} <= ${atelierStock.seuil}`,
      ),
    );
  let ouvertes = 0;
  let dejaOuvertes = 0;
  for (const b of basses) {
    const r = await proposerPourStock(b.id, "manuelle", parUser);
    if (r.nouvelle) ouvertes += 1;
    else dejaOuvertes += 1;
  }
  return { ouvertes, dejaOuvertes };
}

export async function listerPropositions(garageIds: number[], statuts?: StatutProposition[]) {
  if (garageIds.length === 0) return [];
  const conds = [inArray(atelierReapproPropositions.garageId, garageIds)];
  if (statuts && statuts.length > 0) conds.push(inArray(atelierReapproPropositions.statut, statuts));
  return db
    .select()
    .from(atelierReapproPropositions)
    .where(and(...conds))
    .orderBy(desc(atelierReapproPropositions.id))
    .limit(200);
}

export interface DecisionInput {
  propositionId: number;
  garageIds: number[];
  decision: "valider" | "refuser";
  quantite?: number;
  prixUnitaireCents?: number;
  motif?: string;
  parUser: number;
}

/** Décision humaine sur une proposition. Seule une proposition « proposée » se décide. */
export async function deciderProposition(input: DecisionInput) {
  const [p] = await db
    .select()
    .from(atelierReapproPropositions)
    .where(
      and(
        eq(atelierReapproPropositions.id, input.propositionId),
        inArray(atelierReapproPropositions.garageId, input.garageIds),
      ),
    )
    .limit(1);
  if (!p) throw new ReapproRefus("Proposition introuvable sur vos garages.", "NOT_FOUND");
  if (p.statut !== "proposee") {
    throw new ReapproRefus(`Cette proposition est déjà « ${p.statut} » : elle ne se décide plus.`);
  }
  if (input.decision === "refuser" && !input.motif?.trim()) {
    throw new ReapproRefus("Un refus exige un motif : sans lui, personne ne saura pourquoi la rupture est restée.", "BAD_REQUEST");
  }

  const [ligne] = await db
    .update(atelierReapproPropositions)
    .set({
      statut: input.decision === "valider" ? "validee" : "refusee",
      quantiteProposee: input.quantite ?? p.quantiteProposee,
      prixUnitaireCents: input.prixUnitaireCents ?? p.prixUnitaireCents,
      decidePar: input.parUser,
      decideAt: new Date(),
      motifDecision: input.motif ?? null,
    })
    .where(eq(atelierReapproPropositions.id, p.id))
    .returning();

  await emitSafe({
    source: "atelier",
    type: "atelier.reappro_decidee",
    payload: {
      propositionId: ligne.id,
      garageId: ligne.garageId,
      reference: ligne.reference,
      decision: ligne.statut,
      quantite: ligne.quantiteProposee,
      motif: ligne.motifDecision ?? "",
    },
  });
  await heartbeat("atelier", "ok", {
    message: `Proposition #${ligne.id} ${ligne.statut} par ${input.parUser}.`,
  });
  return ligne;
}

/* ---------------------------------------------------------------- commandes */

function debutDuMois(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Engagement du mois courant : commandes non annulées depuis le 1er. */
export async function engagementDuMois(garageId: number): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${atelierCommandesFournisseur.totalCents}), 0)::int` })
    .from(atelierCommandesFournisseur)
    .where(
      and(
        eq(atelierCommandesFournisseur.garageId, garageId),
        ne(atelierCommandesFournisseur.statut, "annulee"),
        gte(atelierCommandesFournisseur.createdAt, debutDuMois()),
      ),
    );
  return total;
}

export interface CommandeInput {
  garageId: number;
  propositionIds: number[];
  fournisseurNom?: string;
  fournisseurEmail?: string;
  fournisseurTelephone?: string;
  parUser: number;
}

function numeroCommande(garageId: number, id: number): string {
  const d = new Date();
  const ym = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `CF-${garageId}-${ym}-${String(id).padStart(4, "0")}`;
}

function bonDeCommandeHtml(numero: string, lignes: LigneCommande[], totalCents: number, garageId: number) {
  const eur = (c: number) => `${(c / 100).toFixed(2)} €`;
  const rows = lignes
    .map(
      (l) =>
        `<tr><td style="padding:4px 8px;border:1px solid #ddd">${l.reference}</td><td style="padding:4px 8px;border:1px solid #ddd">${l.designation}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${l.quantite}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${eur(l.prixUnitaireCents)}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${eur(l.quantite * l.prixUnitaireCents)}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
    <h2 style="color:#111">Bon de commande ${numero}</h2>
    <p style="color:#444">Commande de pièces émise depuis l'atelier MKA.P-MS (garage n°${garageId}).</p>
    <table style="border-collapse:collapse;width:100%;font-size:13px">
      <thead><tr style="background:#f5f3ef"><th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Référence</th><th style="padding:4px 8px;border:1px solid #ddd;text-align:left">Désignation</th><th style="padding:4px 8px;border:1px solid #ddd">Qté</th><th style="padding:4px 8px;border:1px solid #ddd">PU HT</th><th style="padding:4px 8px;border:1px solid #ddd">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="text-align:right;font-weight:bold;margin-top:12px">Total HT : ${eur(totalCents)}</p>
    <p style="font-size:12px;color:#777">Merci de confirmer la disponibilité et le délai de livraison en réponse à ce message.</p>
  </div>`;
}

/**
 * Passe la commande fournisseur à partir de propositions VALIDÉES.
 *
 * Refus explicites (aucun succès affiché sans commande réelle) :
 *  - proposition non validée, ou déjà commandée ;
 *  - prix d'achat inconnu sur une ligne (on n'engage pas un montant qu'on ignore) ;
 *  - plafond mensuel non fixé (0) ou dépassé par cette commande ;
 *  - aucun fournisseur (ni dans la demande ni dans les réglages).
 */
export async function commanderFournisseur(input: CommandeInput) {
  if (input.propositionIds.length === 0) {
    throw new ReapproRefus("Aucune proposition sélectionnée.", "BAD_REQUEST");
  }
  const props = await db
    .select()
    .from(atelierReapproPropositions)
    .where(
      and(
        inArray(atelierReapproPropositions.id, input.propositionIds),
        eq(atelierReapproPropositions.garageId, input.garageId),
      ),
    );
  if (props.length !== input.propositionIds.length) {
    throw new ReapproRefus("Une des propositions n'existe pas ou n'appartient pas à ce garage.", "NOT_FOUND");
  }
  const nonValidees = props.filter((p) => p.statut !== "validee");
  if (nonValidees.length > 0) {
    throw new ReapproRefus(
      `Proposition(s) non validées : ${nonValidees.map((p) => `#${p.id} (${p.statut})`).join(", ")}. Une commande ne part que sur des propositions validées par l'atelier.`,
    );
  }
  const sansPrix = props.filter((p) => p.prixUnitaireCents == null || p.prixUnitaireCents <= 0);
  if (sansPrix.length > 0) {
    throw new ReapproRefus(
      `Prix d'achat inconnu pour ${sansPrix.map((p) => p.reference).join(", ")} : renseignez-le sur la proposition avant de commander, on n'engage pas un montant qu'on ignore.`,
    );
  }

  const r = await reglages(input.garageId);
  const fournisseurNom = input.fournisseurNom?.trim() || r?.fournisseurNom || "";
  const fournisseurEmail = input.fournisseurEmail?.trim() || r?.fournisseurEmail || null;
  const fournisseurTelephone = input.fournisseurTelephone?.trim() || r?.fournisseurTelephone || null;
  if (!fournisseurNom) {
    throw new ReapproRefus(
      "Aucun fournisseur : indiquez-le sur la commande ou fixez un fournisseur habituel dans les réglages de réapprovisionnement.",
    );
  }

  const plafond = r?.plafondMensuelCents ?? 0;
  if (plafond <= 0) {
    throw new ReapproRefus(
      "Aucun plafond d'engagement mensuel n'est fixé pour ce garage : fixez-le dans les réglages avant toute commande fournisseur.",
    );
  }
  const lignes: LigneCommande[] = props.map((p) => ({
    propositionId: p.id,
    stockId: p.stockId,
    reference: p.reference,
    designation: p.designation,
    quantite: p.quantiteProposee,
    prixUnitaireCents: p.prixUnitaireCents as number,
  }));
  const totalCents = lignes.reduce((n, l) => n + l.quantite * l.prixUnitaireCents, 0);
  const engage = await engagementDuMois(input.garageId);
  if (engage + totalCents > plafond) {
    await emitSafe({
      source: "atelier",
      type: "atelier.reappro_plafond_depasse",
      payload: {
        garageId: input.garageId,
        plafondCents: plafond,
        engageCents: engage,
        demandeCents: totalCents,
      },
    });
    throw new ReapproRefus(
      `Plafond mensuel dépassé : ${((plafond - engage) / 100).toFixed(2)} € restent disponibles sur ${(plafond / 100).toFixed(2)} €, la commande demande ${(totalCents / 100).toFixed(2)} €. Relevez le plafond ou réduisez la commande.`,
    );
  }

  const commande = await db.transaction(async (tx) => {
    const [c] = await tx
      .insert(atelierCommandesFournisseur)
      .values({
        garageId: input.garageId,
        numero: `CF-${input.garageId}-tmp-${Date.now()}`,
        fournisseurNom,
        fournisseurEmail,
        fournisseurTelephone,
        lignes,
        totalCents,
        passeePar: input.parUser,
      })
      .returning();
    const [c2] = await tx
      .update(atelierCommandesFournisseur)
      .set({ numero: numeroCommande(input.garageId, c.id) })
      .where(eq(atelierCommandesFournisseur.id, c.id))
      .returning();
    await tx
      .update(atelierReapproPropositions)
      .set({ statut: "commandee", commandeId: c.id })
      .where(inArray(atelierReapproPropositions.id, input.propositionIds));
    return c2;
  });

  // Transmission réelle : l'email part si le SMTP est configuré. Sinon la
  // commande reste « à transmettre » et l'écran le dit — jamais « envoyée ».
  let emailEnvoye = false;
  if (fournisseurEmail) {
    emailEnvoye = await sendEmail(
      fournisseurEmail,
      `Bon de commande ${commande.numero} — MKA.P-MS Atelier`,
      bonDeCommandeHtml(commande.numero, lignes, totalCents, input.garageId),
    );
  }
  const [finale] = await db
    .update(atelierCommandesFournisseur)
    .set({ emailEnvoye, statut: emailEnvoye ? "envoyee" : "a_transmettre" })
    .where(eq(atelierCommandesFournisseur.id, commande.id))
    .returning();

  await emitSafe({
    source: "atelier",
    type: "atelier.commande_fournisseur_passee",
    payload: {
      commandeId: finale.id,
      numero: finale.numero,
      garageId: finale.garageId,
      fournisseur: fournisseurNom,
      totalCents,
      lignes: lignes.length,
      statut: finale.statut,
      engageApresCents: engage + totalCents,
      plafondCents: plafond,
    },
  });
  if ((engage + totalCents) * 10 >= plafond * 9) {
    await emitSafe({
      source: "atelier",
      type: "atelier.reappro_plafond_proche",
      payload: {
        garageId: input.garageId,
        plafondCents: plafond,
        engageCents: engage + totalCents,
      },
    });
  }
  await heartbeat("atelier", "ok", {
    message: `Commande fournisseur ${finale.numero} passée (${(totalCents / 100).toFixed(2)} €, ${finale.statut}).`,
  });
  return finale;
}

export async function listerCommandes(garageIds: number[]) {
  if (garageIds.length === 0) return [];
  return db
    .select()
    .from(atelierCommandesFournisseur)
    .where(inArray(atelierCommandesFournisseur.garageId, garageIds))
    .orderBy(desc(atelierCommandesFournisseur.id))
    .limit(200);
}

function lignesDe(c: typeof atelierCommandesFournisseur.$inferSelect): LigneCommande[] {
  return Array.isArray(c.lignes) ? (c.lignes as LigneCommande[]) : [];
}

/**
 * Réception : le stock est réellement incrémenté ligne par ligne, avec un
 * mouvement motivé par le numéro de commande. Une réception partielle est
 * possible (quantités reçues fournies), le reste reste dû.
 */
export async function receptionnerCommande(input: {
  commandeId: number;
  garageIds: number[];
  recues?: { propositionId: number; quantite: number }[];
  parUser: number;
}) {
  const [c] = await db
    .select()
    .from(atelierCommandesFournisseur)
    .where(
      and(
        eq(atelierCommandesFournisseur.id, input.commandeId),
        inArray(atelierCommandesFournisseur.garageId, input.garageIds),
      ),
    )
    .limit(1);
  if (!c) throw new ReapproRefus("Commande introuvable sur vos garages.", "NOT_FOUND");
  if (c.statut === "receptionnee" || c.statut === "annulee") {
    throw new ReapproRefus(`Cette commande est déjà « ${c.statut} ».`);
  }
  const lignes = lignesDe(c);
  const recuesPar = new Map((input.recues ?? []).map((r) => [r.propositionId, r.quantite]));

  let piecesEntrees = 0;
  await db.transaction(async (tx) => {
    for (const l of lignes) {
      const qte = recuesPar.has(l.propositionId) ? (recuesPar.get(l.propositionId) as number) : l.quantite;
      if (qte <= 0) continue;
      const [s] = await tx.select().from(atelierStock).where(eq(atelierStock.id, l.stockId)).limit(1);
      if (!s) continue;
      const [maj] = await tx
        .update(atelierStock)
        .set({ quantite: s.quantite + qte, prixAchatCents: l.prixUnitaireCents, updatedAt: new Date() })
        .where(eq(atelierStock.id, s.id))
        .returning();
      await tx.insert(atelierStockMouvements).values({
        stockId: s.id,
        delta: qte,
        quantiteApres: maj.quantite,
        motif: `réception commande ${c.numero}`,
        parUser: input.parUser,
      });
      piecesEntrees += qte;
    }
    await tx
      .update(atelierCommandesFournisseur)
      .set({ statut: "receptionnee", receptionneePar: input.parUser, receptionneeAt: new Date() })
      .where(eq(atelierCommandesFournisseur.id, c.id));
    await tx
      .update(atelierReapproPropositions)
      .set({ statut: "receptionnee" })
      .where(eq(atelierReapproPropositions.commandeId, c.id));
  });

  await emitSafe({
    source: "atelier",
    type: "atelier.commande_fournisseur_receptionnee",
    payload: { commandeId: c.id, numero: c.numero, garageId: c.garageId, piecesEntrees, lignes: lignes.length },
  });
  await heartbeat("atelier", "ok", {
    message: `Commande ${c.numero} réceptionnée : ${piecesEntrees} pièce(s) entrées en stock.`,
  });
  return { commandeId: c.id, numero: c.numero, piecesEntrees };
}

export async function annulerCommande(input: {
  commandeId: number;
  garageIds: number[];
  motif: string;
  parUser: number;
}) {
  const [c] = await db
    .select()
    .from(atelierCommandesFournisseur)
    .where(
      and(
        eq(atelierCommandesFournisseur.id, input.commandeId),
        inArray(atelierCommandesFournisseur.garageId, input.garageIds),
      ),
    )
    .limit(1);
  if (!c) throw new ReapproRefus("Commande introuvable sur vos garages.", "NOT_FOUND");
  if (c.statut === "receptionnee") {
    throw new ReapproRefus("Une commande réceptionnée ne s'annule plus : corrigez le stock par un mouvement.");
  }
  if (c.statut === "annulee") throw new ReapproRefus("Commande déjà annulée.");

  await db.transaction(async (tx) => {
    await tx
      .update(atelierCommandesFournisseur)
      .set({ statut: "annulee", annuleePar: input.parUser, annuleeAt: new Date(), motifAnnulation: input.motif })
      .where(eq(atelierCommandesFournisseur.id, c.id));
    // Les propositions redeviennent validées : la rupture n'a pas disparu.
    await tx
      .update(atelierReapproPropositions)
      .set({ statut: "validee", commandeId: null })
      .where(eq(atelierReapproPropositions.commandeId, c.id));
  });

  await emitSafe({
    source: "atelier",
    type: "atelier.commande_fournisseur_annulee",
    payload: { commandeId: c.id, numero: c.numero, garageId: c.garageId, motif: input.motif, totalCents: c.totalCents },
  });
  return { commandeId: c.id, numero: c.numero };
}

/* -------------------------------------------------------------------- état */

export async function etatReappro() {
  const [{ propositions }] = await db
    .select({ propositions: sql<number>`count(*)::int` })
    .from(atelierReapproPropositions);
  const [{ enAttente }] = await db
    .select({ enAttente: sql<number>`count(*)::int` })
    .from(atelierReapproPropositions)
    .where(eq(atelierReapproPropositions.statut, "proposee"));
  const [{ commandes }] = await db
    .select({ commandes: sql<number>`count(*)::int` })
    .from(atelierCommandesFournisseur);
  const [{ aTransmettre }] = await db
    .select({ aTransmettre: sql<number>`count(*)::int` })
    .from(atelierCommandesFournisseur)
    .where(eq(atelierCommandesFournisseur.statut, "a_transmettre"));
  const [{ engageCents }] = await db
    .select({ engageCents: sql<number>`coalesce(sum(${atelierCommandesFournisseur.totalCents}), 0)::int` })
    .from(atelierCommandesFournisseur)
    .where(
      and(ne(atelierCommandesFournisseur.statut, "annulee"), gte(atelierCommandesFournisseur.createdAt, debutDuMois())),
    );
  const [{ garagesAvecPlafond }] = await db
    .select({ garagesAvecPlafond: sql<number>`count(*)::int` })
    .from(atelierReapproReglages)
    .where(sql`${atelierReapproReglages.plafondMensuelCents} > 0`);
  return { propositions, enAttente, commandes, aTransmettre, engageCents, garagesAvecPlafond };
}
