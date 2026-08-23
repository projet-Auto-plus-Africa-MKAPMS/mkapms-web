/**
 * Estimation Hub — moteur d'estimation unifiée d'un véhicule.
 *
 * Ce moteur ne calcule rien lui-même : il interroge les moteurs propriétaires
 * (VO pour la valeur, Vehicle Delivery pour l'acheminement, Import Risk pour
 * l'importation, catalogue de pièces pour l'entretien) et assemble une réponse
 * unique pour l'acheteur, le vendeur et MKA.P-MS Intelligences.
 *
 * Règle : chaque volet porte sa source et sa qualité. Un volet dont la source
 * manque est renvoyé « non mesuré » avec le connecteur nommé — jamais complété
 * par une valeur plausible.
 */
import { and, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "../db.js";
import { annonces } from "../schema.js";
import { partCompatibilities, partsCatalog } from "../modules/pieces.js";
import { diagnostiquer } from "../import-risk/service.js";
import { categorieDeTransport, devis as devisAcheminement } from "../vehicle-delivery/service.js";
import { estimate as estimerValeur } from "../vo-engine/service.js";
import { emitSafe } from "../event-bus/service.js";

/** Qualité d'un volet : identique au vocabulaire du moteur d'acheminement. */
export type QualiteVolet = "confirme" | "estime" | "non_mesure" | "indisponible";

export interface Volet {
  code: "valeur" | "acheminement" | "pieces" | "importation";
  label: string;
  /** Montant central quand il est chiffrable, sinon null. */
  montant: number | null;
  montantBas: number | null;
  montantHaut: number | null;
  devise: string;
  qualite: QualiteVolet;
  /** Ce sur quoi le chiffre repose réellement. */
  preuve: string;
  /** Ce qui empêche de faire mieux (connecteur, donnée, barème). */
  manque: string | null;
  /** Moteur propriétaire du volet : aucun calcul n'est dupliqué ici. */
  moteur: string;
}

export interface EstimationComplete {
  annonceId: number | null;
  titre: string | null;
  marque: string | null;
  modele: string | null;
  annee: number | null;
  paysDepart: string | null;
  paysArrivee: string | null;
  volets: Volet[];
  /** Coût total d'acquisition quand tous les volets obligatoires sont chiffrés. */
  totalAcquisition: number | null;
  devise: string;
  qualiteGlobale: QualiteVolet;
  /** Blocage réglementaire remonté par le moteur d'importation. */
  bloquant: boolean;
  resume: string;
  manques: string[];
}

const DEVISE = "EUR";

/**
 * Entretien : médiane réelle du catalogue de pièces compatible avec ce modèle.
 * Sans pièce compatible publiée, aucun budget n'est avancé — un budget
 * d'entretien inventé pousse à l'achat sur une base fausse.
 */
async function voletPieces(
  marque: string | null,
  modele: string | null,
  annee: number | null,
): Promise<Volet> {
  const base: Omit<Volet, "montant" | "montantBas" | "montantHaut" | "qualite" | "preuve" | "manque"> = {
    code: "pieces",
    label: "Budget pièces d'entretien courant",
    devise: DEVISE,
    moteur: "pieces",
  };

  if (!marque || !modele) {
    return {
      ...base,
      montant: null,
      montantBas: null,
      montantHaut: null,
      qualite: "non_mesure",
      preuve: "Marque ou modèle absent de l'annonce.",
      manque: "Marque et modèle déclarés par le vendeur.",
    };
  }

  const conds: SQL[] = [
    eq(partsCatalog.active, true),
    ilike(partCompatibilities.marque, marque),
    ilike(partCompatibilities.modele, modele),
  ];
  if (annee) {
    conds.push(
      or(isNull(partCompatibilities.anneeDebut), sql`${partCompatibilities.anneeDebut} <= ${annee}`)!,
    );
    conds.push(
      or(isNull(partCompatibilities.anneeFin), sql`${partCompatibilities.anneeFin} >= ${annee}`)!,
    );
  }

  const [stats] = await db
    .select({
      n: sql<number>`count(*)::int`,
      p25: sql<number>`percentile_cont(0.25) within group (order by ${partsCatalog.prixHt})`,
      median: sql<number>`percentile_cont(0.5) within group (order by ${partsCatalog.prixHt})`,
      p75: sql<number>`percentile_cont(0.75) within group (order by ${partsCatalog.prixHt})`,
    })
    .from(partsCatalog)
    .innerJoin(partCompatibilities, eq(partCompatibilities.catalogId, partsCatalog.id))
    .where(and(...conds));

  const n = Number(stats?.n ?? 0);
  if (n < 3 || !stats?.median) {
    return {
      ...base,
      montant: null,
      montantBas: null,
      montantHaut: null,
      qualite: "non_mesure",
      preuve: `${n} pièce(s) compatible(s) publiée(s) : échantillon insuffisant pour un budget.`,
      manque:
        "Catalogue de pièces par modèle (connecteur données techniques constructeur / AutoData) ou pièces publiées par les magasins.",
    };
  }

  return {
    ...base,
    montant: Math.round(Number(stats.median)),
    montantBas: Math.round(Number(stats.p25 ?? stats.median)),
    montantHaut: Math.round(Number(stats.p75 ?? stats.median)),
    qualite: "estime",
    preuve: `Médiane du prix des ${n} pièces compatibles réellement publiées sur la plateforme.`,
    manque:
      "Plan d'entretien constructeur (périodicité, pièces obligatoires) : le montant reste un ordre de grandeur par pièce, pas un coût d'entretien annuel.",
  };
}

export async function estimationComplete(input: {
  annonceId?: number | null;
  marque?: string | null;
  modele?: string | null;
  annee?: number | null;
  kilometrage?: number | null;
  etat?: string | null;
  paysArrivee?: string | null;
  villeArrivee?: string | null;
  userId?: number | null;
}): Promise<EstimationComplete> {
  const annonceId = input.annonceId ?? null;
  let marque = input.marque ?? null;
  let modele = input.modele ?? null;
  let annee = input.annee ?? null;
  let kilometrage = input.kilometrage ?? null;
  let titre: string | null = null;
  let paysDepart: string | null = null;
  let categorieAnnonce: string | null = null;
  let prixDemande: number | null = null;

  if (annonceId) {
    const [a] = await db
      .select({
        titre: annonces.titre,
        marque: annonces.marque,
        modele: annonces.modele,
        annee: annonces.annee,
        kilometrage: annonces.kilometrage,
        prix: annonces.prix,
        pays: annonces.pays,
        categorie: annonces.categorie,
      })
      .from(annonces)
      .where(eq(annonces.id, annonceId));
    if (!a) throw new Error(`Annonce ${annonceId} introuvable.`);
    titre = a.titre;
    marque = marque ?? a.marque;
    modele = modele ?? a.modele;
    annee = annee ?? a.annee;
    kilometrage = kilometrage ?? a.kilometrage;
    paysDepart = a.pays ? a.pays.toUpperCase() : null;
    categorieAnnonce = a.categorie;
    prixDemande = a.prix === null ? null : Number(a.prix);
  }

  const paysArrivee = input.paysArrivee ? input.paysArrivee.toUpperCase() : null;
  const volets: Volet[] = [];
  const manques: string[] = [];

  // ── 1. Valeur de marché (moteur VO) ─────────────────────────────────
  if (marque && modele) {
    const v = await estimerValeur({
      userId: input.userId ?? null,
      marque,
      modele,
      annee,
      kilometrage,
      etat: input.etat ?? null,
      countryCode: paysArrivee ?? paysDepart ?? "FR",
    });
    volets.push({
      code: "valeur",
      label: "Valeur de marché du véhicule",
      montant: v.mid,
      montantBas: v.low,
      montantHaut: v.high,
      devise: v.currency,
      qualite: v.method === "comparables" ? "estime" : "non_mesure",
      preuve: v.disclaimer,
      manque:
        v.method === "comparables"
          ? null
          : "Annonces comparables publiées dans ce pays (ou cote fournisseur) : la fourchette repose sur un barème de décote.",
      moteur: "vo",
    });
    if (v.method !== "comparables") {
      manques.push("Cote de marché fournisseur (aucune annonce comparable dans ce pays).");
    }
  } else {
    volets.push({
      code: "valeur",
      label: "Valeur de marché du véhicule",
      montant: null,
      montantBas: null,
      montantHaut: null,
      devise: DEVISE,
      qualite: "non_mesure",
      preuve: "Marque et modèle nécessaires pour interroger le moteur VO.",
      manque: "Marque et modèle du véhicule.",
      moteur: "vo",
    });
  }

  // ── 2. Acheminement (moteur Vehicle Delivery) ───────────────────────
  const acheminement = await devisAcheminement({
    annonceId,
    categorie: annonceId ? null : categorieDeTransport(categorieAnnonce),
    paysDepart,
    paysArrivee,
    villeArrivee: input.villeArrivee ?? null,
    userId: input.userId ?? null,
  });
  volets.push({
    code: "acheminement",
    label: `Acheminement — ${acheminement.modeLabel}`,
    montant: acheminement.total,
    montantBas: acheminement.total,
    montantHaut: acheminement.total,
    devise: acheminement.devise,
    qualite:
      acheminement.total === null
        ? "non_mesure"
        : acheminement.qualite === "confirme"
          ? "confirme"
          : "estime",
    preuve: acheminement.resume,
    manque: acheminement.manques[0] ?? null,
    moteur: "livraison_vehicule",
  });
  manques.push(...acheminement.manques);

  // ── 3. Importation (moteur Import Risk) ─────────────────────────────
  let bloquant = false;
  if (annonceId) {
    const diag = await diagnostiquer({ annonceId, paysDestination: paysArrivee });
    bloquant = diag.bloquant;
    const chiffrables = diag.risques.filter((r) => r.manque);
    volets.push({
      code: "importation",
      label: "Droits, taxes et homologation à l'arrivée",
      montant: null,
      montantBas: null,
      montantHaut: null,
      devise: DEVISE,
      qualite: diag.bloquant ? "indisponible" : "non_mesure",
      preuve: diag.resume,
      manque:
        chiffrables[0]?.manque ??
        "Barème douanier et grille de taxes du pays d'arrivée : aucun montant d'importation ne peut être chiffré.",
      moteur: "risque_import",
    });
    for (const r of chiffrables) {
      if (r.manque) manques.push(r.manque);
    }
  }

  // ── 4. Pièces et entretien ──────────────────────────────────────────
  const pieces = await voletPieces(marque, modele, annee);
  volets.push(pieces);
  if (pieces.manque) manques.push(pieces.manque);

  // ── Total d'acquisition : uniquement si tout l'obligatoire est chiffré.
  const prixVehicule = prixDemande ?? volets.find((v) => v.code === "valeur")?.montant ?? null;
  const coutAcheminement = acheminement.total;
  const totalAcquisition =
    prixVehicule !== null && coutAcheminement !== null && !bloquant
      ? Math.round(prixVehicule + coutAcheminement)
      : null;

  const qualiteGlobale: QualiteVolet = bloquant
    ? "indisponible"
    : totalAcquisition === null
      ? "non_mesure"
      : volets.some((v) => v.code !== "importation" && v.qualite === "non_mesure")
        ? "estime"
        : "estime";

  const resume = bloquant
    ? "Ce véhicule ne peut pas être importé dans le pays de livraison : aucun coût total n'est calculé, l'opération est bloquée."
    : totalAcquisition === null
      ? "Coût total d'acquisition non chiffrable : au moins un volet obligatoire n'a pas de source (voir les manques)."
      : `Prix du véhicule et acheminement chiffrés : ${totalAcquisition.toLocaleString("fr-FR")} ${DEVISE} hors droits, taxes et homologation à l'arrivée, qui restent non mesurés.`;

  const manquesUniques = Array.from(new Set(manques));

  if (totalAcquisition === null && !bloquant) {
    await emitSafe({
      source: "estimation",
      type: "estimation.incomplete",
      payload: {
        annonceId: annonceId ?? 0,
        paysDepart: paysDepart ?? "",
        paysArrivee: paysArrivee ?? "",
        manques: manquesUniques.join(" | "),
      },
    });
  }

  return {
    annonceId,
    titre,
    marque,
    modele,
    annee,
    paysDepart,
    paysArrivee,
    volets,
    totalAcquisition,
    devise: DEVISE,
    qualiteGlobale,
    bloquant,
    resume,
    manques: manquesUniques,
  };
}

export async function controlCenterFeed() {
  const [pieces] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(partCompatibilities);
  const [publiees] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(annonces)
    .where(eq(annonces.status, "publiee"));

  const manques: string[] = [
    "Connecteur données techniques constructeur (AutoData ou équivalent) : plans d'entretien et pièces par modèle",
    "Cote de marché fournisseur : les pays sans annonces comparables retombent sur un barème de décote",
    "Barème douanier et taxes par pays : le coût d'importation reste non mesuré",
  ];

  const compat = Number(pieces?.n ?? 0);
  return {
    version: "1",
    health: compat === 0 ? ("degraded" as const) : ("ok" as const),
    resume:
      compat === 0
        ? "Aucune compatibilité pièce/modèle enregistrée : le budget entretien est renvoyé « non mesuré » au lieu d'être estimé au hasard."
        : `${compat} compatibilités pièce/modèle et ${Number(publiees?.n ?? 0)} annonces publiées alimentent les estimations.`,
    compatibilitesPieces: compat,
    annoncesPubliees: Number(publiees?.n ?? 0),
    manques,
  };
}
