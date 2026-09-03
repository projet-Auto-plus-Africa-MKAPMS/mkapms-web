/**
 * Moteur d'Atelier — service.
 *
 * Ce moteur existe pour une raison précise : trois actions de l'atelier étaient
 * déclarées « non branchées » au Moteur de boutons faute de capacité serveur.
 * Il fournit cette capacité, et rien de plus :
 *
 *  - il ENREGISTRE une validation interne ou un contrôle qualité (qui, quoi,
 *    quand, conforme ou non, points réellement contrôlés) ;
 *  - il TIENT le stock de pièces d'un garage, avec un mouvement par écriture ;
 *  - il TRACE le report d'un rendez-vous atelier.
 *
 * Il ne décide rien à la place de l'atelier et ne prononce aucune conformité
 * tout seul. Chaque écriture est publiée à l'Event Bus : le Système Intelligent
 * ouvre l'alerte, MKA.P-MS Intelligences en garde la mémoire technique.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  atelierRdvReports,
  atelierStock,
  atelierStockMouvements,
  atelierValidations,
} from "./schema.js";
import { emitSafe } from "../event-bus/service.js";
import { heartbeat } from "../engine-registry/service.js";
import { etatReappro, proposerPourStock, ReapproRefus } from "./reappro.js";

export const TYPES_VALIDATION = ["validation_interne", "controle_qualite"] as const;
export type TypeValidation = (typeof TYPES_VALIDATION)[number];

export interface PointControle {
  libelle: string;
  conforme: boolean;
  remarque?: string;
}

export interface ValidationInput {
  garageId?: number;
  dossier: string;
  type: TypeValidation;
  etape?: string;
  points: PointControle[];
  remarque?: string;
  validePar: number;
}

/**
 * Enregistre une validation d'atelier.
 *
 * La conformité n'est pas déclarative : elle est CALCULÉE à partir des points
 * réellement cochés. Un contrôle sans point coché n'est pas conforme.
 */
export async function enregistrerValidation(input: ValidationInput) {
  const points = input.points.map((p) => ({
    libelle: p.libelle,
    conforme: !!p.conforme,
    remarque: p.remarque ?? null,
  }));
  const conforme = points.length > 0 && points.every((p) => p.conforme);

  const [ligne] = await db
    .insert(atelierValidations)
    .values({
      garageId: input.garageId ?? null,
      dossier: input.dossier,
      type: input.type,
      etape: input.etape ?? null,
      conforme,
      points,
      remarque: input.remarque ?? null,
      validePar: input.validePar,
    })
    .returning();

  await emitSafe({
    source: "atelier",
    type: "atelier.validation_enregistree",
    payload: {
      validationId: ligne.id,
      dossier: ligne.dossier,
      type: ligne.type,
      conforme: ligne.conforme,
    },
  });

  if (!conforme) {
    const manquants = points.filter((p) => !p.conforme).map((p) => p.libelle);
    await emitSafe({
      source: "atelier",
      type: "atelier.controle_non_conforme",
      payload: {
        dossier: ligne.dossier,
        type: ligne.type,
        points: manquants.length > 0 ? manquants.join(", ") : "aucun point contrôlé",
      },
    });
  }

  await heartbeat("atelier", "ok", {
    message: `Validation ${ligne.type} enregistrée sur ${ligne.dossier} (${conforme ? "conforme" : "non conforme"}).`,
  });

  return ligne;
}

/**
 * Validations d'un dossier, bornées aux garages du compte qui interroge : un
 * professionnel ne lit pas les contrôles qualité d'un confrère en devinant un
 * numéro de dossier.
 */
export async function validationsDossier(dossier: string, garageIds: number[], limit = 50) {
  if (garageIds.length === 0) return [];
  return db
    .select()
    .from(atelierValidations)
    .where(
      and(
        eq(atelierValidations.dossier, dossier),
        inArray(atelierValidations.garageId, garageIds),
      ),
    )
    .orderBy(desc(atelierValidations.id))
    .limit(limit);
}

export async function validationsGarages(garageIds: number[], type?: TypeValidation, limit = 100) {
  if (garageIds.length === 0) return [];
  const conds = [inArray(atelierValidations.garageId, garageIds)];
  if (type) conds.push(eq(atelierValidations.type, type));
  return db
    .select()
    .from(atelierValidations)
    .where(and(...conds))
    .orderBy(desc(atelierValidations.id))
    .limit(limit);
}

/* ------------------------------------------------------------------- stock */

export interface StockInput {
  garageId: number;
  reference: string;
  designation: string;
  quantite: number;
  seuil?: number;
  prixAchatCents?: number;
  prixVenteCents?: number;
  emplacement?: string;
  motif?: string;
  parUser: number;
}

/**
 * Écrit une ligne de stock (création ou mise à jour) et le mouvement qui va
 * avec. La quantité affichée à l'écran vient donc toujours d'ici, jamais d'un
 * tableau écrit dans la page.
 */
export async function enregistrerStock(input: StockInput) {
  // Ligne et mouvement dans la même transaction : un stock modifié sans
  // mouvement enregistré serait un stock dont plus personne ne sait l'origine.
  const { ligne, delta } = await db.transaction(async (tx) => {
    const [existant] = await tx
      .select()
      .from(atelierStock)
      .where(
        and(eq(atelierStock.garageId, input.garageId), eq(atelierStock.reference, input.reference)),
      )
      .limit(1);

    const valeurs = {
      designation: input.designation,
      quantite: input.quantite,
      seuil: input.seuil ?? existant?.seuil ?? 0,
      prixAchatCents: input.prixAchatCents ?? existant?.prixAchatCents ?? null,
      prixVenteCents: input.prixVenteCents ?? existant?.prixVenteCents ?? null,
      emplacement: input.emplacement ?? existant?.emplacement ?? null,
      updatedAt: new Date(),
    };

    const [enregistree] = existant
      ? await tx
          .update(atelierStock)
          .set(valeurs)
          .where(eq(atelierStock.id, existant.id))
          .returning()
      : await tx
          .insert(atelierStock)
          .values({ garageId: input.garageId, reference: input.reference, ...valeurs })
          .returning();

    const mouvement = enregistree.quantite - (existant?.quantite ?? 0);
    await tx.insert(atelierStockMouvements).values({
      stockId: enregistree.id,
      delta: mouvement,
      quantiteApres: enregistree.quantite,
      motif: input.motif ?? (existant ? "correction de stock" : "création de la ligne"),
      parUser: input.parUser,
    });

    return { ligne: enregistree, delta: mouvement };
  });

  if (ligne.seuil > 0 && ligne.quantite <= ligne.seuil) {
    await emitSafe({
      source: "atelier",
      type: "atelier.stock_bas",
      payload: {
        garageId: ligne.garageId,
        reference: ligne.reference,
        quantite: ligne.quantite,
        seuil: ligne.seuil,
      },
    });
    // Le seuil ouvre la proposition lui-même (idempotent) ; l'atelier décide.
    try {
      await proposerPourStock(ligne.id, "seuil_auto");
    } catch (e) {
      if (!(e instanceof ReapproRefus)) throw e;
    }
  }

  await heartbeat("atelier", "ok", {
    message: `Stock ${ligne.reference} à ${ligne.quantite} (mouvement ${delta >= 0 ? "+" : ""}${delta}).`,
  });

  return ligne;
}

export async function listerStock(garageIds: number[]) {
  if (garageIds.length === 0) return [];
  return db
    .select()
    .from(atelierStock)
    .where(inArray(atelierStock.garageId, garageIds))
    .orderBy(atelierStock.designation);
}

/** Mouvements d'une ligne de stock, réservés aux garages du compte. */
export async function mouvementsStock(stockId: number, garageIds: number[], limit = 50) {
  if (garageIds.length === 0) return [];
  const [ligne] = await db
    .select({ id: atelierStock.id })
    .from(atelierStock)
    .where(and(eq(atelierStock.id, stockId), inArray(atelierStock.garageId, garageIds)))
    .limit(1);
  if (!ligne) return [];
  return db
    .select()
    .from(atelierStockMouvements)
    .where(eq(atelierStockMouvements.stockId, stockId))
    .orderBy(desc(atelierStockMouvements.id))
    .limit(limit);
}

export async function alertesStock(garageIds: number[]) {
  const lignes = await listerStock(garageIds);
  return lignes.filter((l) => l.seuil > 0 && l.quantite <= l.seuil);
}

/* ------------------------------------------------- report de rendez-vous */

export interface ReportRdvInput {
  rdvId: number;
  ancienneDate: Date;
  nouvelleDate: Date;
  motif: string;
  parUser: number;
}

/**
 * Trace le report d'un rendez-vous. Le déplacement du rendez-vous lui-même
 * appartient au module garages (c'est lui qui tient `rdv_garage`) : ce moteur
 * en conserve la preuve et le remet à l'Event Bus.
 */
export async function tracerReportRdv(input: ReportRdvInput) {
  const [ligne] = await db
    .insert(atelierRdvReports)
    .values({
      rdvId: input.rdvId,
      ancienneDate: input.ancienneDate,
      nouvelleDate: input.nouvelleDate,
      motif: input.motif,
      parUser: input.parUser,
    })
    .returning();

  await emitSafe({
    source: "atelier",
    type: "atelier.rdv_reporte",
    payload: {
      rdvId: input.rdvId,
      nouvelleDate: input.nouvelleDate.toISOString(),
      motif: input.motif,
    },
  });

  await heartbeat("atelier", "ok", {
    message: `Rendez-vous ${input.rdvId} reporté au ${input.nouvelleDate.toISOString()}.`,
  });

  return ligne;
}

export async function reportsRdv(rdvId: number) {
  return db
    .select()
    .from(atelierRdvReports)
    .where(eq(atelierRdvReports.rdvId, rdvId))
    .orderBy(desc(atelierRdvReports.id));
}

/* ------------------------------------------------------- état et santé */

export async function etat() {
  const [{ validations }] = await db
    .select({ validations: sql<number>`count(*)::int` })
    .from(atelierValidations);
  const [{ nonConformes }] = await db
    .select({ nonConformes: sql<number>`count(*)::int` })
    .from(atelierValidations)
    .where(eq(atelierValidations.conforme, false));
  const [{ lignesStock }] = await db
    .select({ lignesStock: sql<number>`count(*)::int` })
    .from(atelierStock);
  const [{ stockBas }] = await db
    .select({ stockBas: sql<number>`count(*)::int` })
    .from(atelierStock)
    .where(sql`${atelierStock.seuil} > 0 and ${atelierStock.quantite} <= ${atelierStock.seuil}`);
  const [{ reports }] = await db
    .select({ reports: sql<number>`count(*)::int` })
    .from(atelierRdvReports);
  const reappro = await etatReappro();

  return {
    checkedAt: new Date().toISOString(),
    validations,
    nonConformes,
    lignesStock,
    stockBas,
    reports,
    reappro,
  };
}

export async function health(): Promise<{ status: "up" | "degraded" | "down"; message: string }> {
  try {
    const e = await etat();
    if (e.validations === 0 && e.lignesStock === 0) {
      return {
        status: "up",
        message:
          "Capacités disponibles (validations, contrôle qualité, stock, report de rendez-vous) : aucune écriture pour l'instant.",
      };
    }
    // Un stock bas est du métier, pas une panne : le moteur reste sain, c'est
    // l'alerte Système Intelligent qui porte le sujet.
    return {
      status: "up",
      message: `${e.validations} validation(s) enregistrée(s), ${e.lignesStock} référence(s) en stock, ${e.reports} report(s) de rendez-vous.`,
    };
  } catch (err) {
    return {
      status: "down",
      message: `Moteur d'Atelier injoignable : ${err instanceof Error ? err.message : "erreur inconnue"}`,
    };
  }
}
