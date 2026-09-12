/**
 * MKA.P-MS Investissement — Investment Ownership Router.
 *
 * Entrées : pays + univers + date (+ transaction). Sortie : le contrat actif
 * qui possède ce périmètre, l'investisseur correspondant, et la règle
 * financière applicable. Aucun employé ne choisit manuellement le
 * bénéficiaire — c'est le sens même de ce routeur.
 */
import { and, eq, ne } from "drizzle-orm";
import { db } from "../db.js";
import { investments } from "./schema.js";

/** Statuts qui ne bloquent jamais rien : le périmètre est libre dès qu'un contrat y arrive. */
const STATUTS_INACTIFS = ["CANCELLED", "TERMINATED", "EXPIRED"] as const;

export interface RequeteOwnership {
  countryCode: string;
  universeId: string;
  date?: Date;
}

export interface ResultatOwnership {
  trouve: boolean;
  investissement?: typeof investments.$inferSelect;
  motif: string;
}

/**
 * Injectable uniquement pour les tests (aucune base de données réelle dans
 * cet environnement de travail) : la production utilise toujours les
 * fonctions ci-dessous, qui interrogent réellement la table investments.
 */
export type TrouverContratActifFn = typeof trouverContratActif;
export type VerifierConflitFn = typeof verifierConflit;

type Investissement = typeof investments.$inferSelect;

/**
 * Logique pure de sélection — jamais d'accès base ici, ce qui la rend
 * testable sans dépendance : reçoit déjà les candidats du même périmètre
 * (pays + univers + ACTIVE + exclusif), ne décide que lequel couvre la date.
 */
export function selectionnerContratActif(candidats: Investissement[], date: Date, universeId: string, pays: string): ResultatOwnership {
  const couvrants = candidats.filter(
    (c) => (!c.startAt || c.startAt.getTime() <= date.getTime()) && (!c.endAt || c.endAt.getTime() >= date.getTime()),
  );
  if (couvrants.length === 0) {
    return { trouve: false, motif: `Aucun contrat ACTIVE pour ${universeId} / ${pays} à cette date : périmètre non attribué, reste sous contrôle économique MKA.P-MS.` };
  }
  if (couvrants.length > 1) {
    // Ne devrait jamais arriver si verifierConflit() a bien été appelé avant activation — signalé, jamais deviné.
    return { trouve: false, motif: `Incohérence détectée : plusieurs contrats ACTIVE exclusifs se chevauchent pour ${universeId} / ${pays} — à corriger avant toute attribution automatique.` };
  }
  return { trouve: true, investissement: couvrants[0], motif: `Contrat #${couvrants[0].id} (investisseur #${couvrants[0].investorId}) attribué automatiquement.` };
}

/**
 * Le cœur de l'attribution automatique : France + Location Pro + date de
 * transaction → contrat ACTIVE couvrant ce périmètre à cette date, ou rien.
 * Aucune attribution possible sur un contrat non ACTIVE, quel que soit son
 * statut par ailleurs (jamais un contrat en attente de paiement qui touche
 * un revenu réel).
 */
export async function trouverContratActif(req: RequeteOwnership): Promise<ResultatOwnership> {
  const date = req.date ?? new Date();
  const pays = req.countryCode.toUpperCase().trim();

  const candidats = await db
    .select()
    .from(investments)
    .where(
      and(
        eq(investments.countryCode, pays),
        eq(investments.universeId, req.universeId),
        eq(investments.status, "ACTIVE"),
        eq(investments.exclusive, true),
      ),
    );

  return selectionnerContratActif(candidats, date, req.universeId, pays);
}

export interface RequeteConflit {
  countryCode: string;
  universeId: string;
  startAt: Date;
  endAt: Date | null;
  excludeInvestmentId?: number;
}

export interface ResultatConflit {
  conflit: boolean;
  motif: string;
}

/** Vrai si deux périodes [début,fin] (fin nulle = ouverte) se chevauchent. */
function periodesSeChevauchent(debutA: Date | null, finA: Date | null, debutB: Date, finB: Date | null): boolean {
  const finAvantDebutB = finA ? finA.getTime() < debutB.getTime() : false;
  const debutApresFinA = finB && debutA ? debutA.getTime() > finB.getTime() : false;
  return !finAvantDebutB && !debutApresFinA;
}

/** Logique pure de détection — reçoit les candidats déjà filtrés par pays+univers+exclusif+non-terminal. */
export function detecterConflit(candidats: Investissement[], req: RequeteConflit, universeId: string, pays: string): ResultatConflit {
  const chevauchants = candidats.filter(
    (c) => c.id !== req.excludeInvestmentId && periodesSeChevauchent(c.startAt, c.endAt, req.startAt, req.endAt),
  );
  if (chevauchants.length > 0) {
    return {
      conflit: true,
      motif: `Contrat #${chevauchants[0].id} (statut ${chevauchants[0].status}) revendique déjà l'exclusivité sur ${universeId} / ${pays} pour une période qui chevauche — second contrat incompatible bloqué.`,
    };
  }
  return { conflit: false, motif: "Aucun contrat exclusif concurrent sur ce périmètre et cette période." };
}

/**
 * Empêche exactement ce que la direction a demandé de bloquer : deux
 * contrats exclusifs incompatibles sur même univers + même pays + période
 * qui se chevauche. Vérifie tout contrat pas encore dans un état terminal
 * (pas seulement ACTIVE) : un contrat déjà en attente de paiement pour ce
 * périmètre doit lui aussi bloquer un second contrat concurrent.
 */
export async function verifierConflit(req: RequeteConflit): Promise<ResultatConflit> {
  const pays = req.countryCode.toUpperCase().trim();
  const candidats = await db
    .select()
    .from(investments)
    .where(
      and(
        eq(investments.countryCode, pays),
        eq(investments.universeId, req.universeId),
        eq(investments.exclusive, true),
        ne(investments.status, STATUTS_INACTIFS[0]),
        ne(investments.status, STATUTS_INACTIFS[1]),
        ne(investments.status, STATUTS_INACTIFS[2]),
      ),
    );

  return detecterConflit(candidats, req, req.universeId, pays);
}
