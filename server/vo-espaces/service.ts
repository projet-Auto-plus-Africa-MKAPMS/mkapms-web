/**
 * Cloisonnement des espaces VO — service.
 *
 * Trois espaces étanches :
 *   • officiel     → stock MKA.P-MS, réservé à l'équipe (VO Interne) ;
 *   • pro          → stock du professionnel abonné, uniquement le sien ;
 *   • particulier  → aucun espace de gestion VO.
 *
 * La décision est prise ici, côté serveur, à partir du rôle et de l'abonnement
 * réellement enregistré : le navigateur ne peut ni la contourner ni la deviner.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { annoncePhotos, annonces, bookings, subscriptions } from "../schema.js";
import { getPlan } from "@shared/plans.js";
import { ADMIN_ROLES, PRO_ROLES, type UserRole } from "@shared/roles.js";

export type EspaceVo = "officiel" | "pro" | "particulier";

export interface AbonnementVo {
  planCode: string;
  label: string;
  status: string;
  finPeriode: string | null;
  quotaAnnonces: number | null;
}

export type CodeCartePro =
  | "stock" | "actives" | "reservees" | "vendues" | "ventes_mois" | "ca_mois";

export interface CarteTableauPro {
  readonly code: CodeCartePro;
  readonly libelle: string;
  readonly genre: "compte" | "montant";
  /** Écrans qui affichent cette carte. */
  readonly tableaux: readonly ("pro" | "resume_vendeur")[];
  /** Destination ouverte au clic (statut passé en `?statut=`). */
  readonly cible: string;
  readonly statut: string | null;
  valeur: number;
}

/**
 * Cartes des tableaux de bord pro (/vente et /vente/resume-vendeur) : le moteur
 * déclare libellé, destination et statut ouvert ; l'écran ne fait qu'afficher.
 */
export const CARTES_TABLEAU_PRO: readonly Omit<CarteTableauPro, "valeur">[] = [
  { code: "stock", libelle: "Stock", genre: "compte", tableaux: ["pro", "resume_vendeur"], cible: "/vente/stock", statut: null },
  { code: "actives", libelle: "Actives", genre: "compte", tableaux: ["pro"], cible: "/vente/stock", statut: "publiee" },
  { code: "reservees", libelle: "Réservations", genre: "compte", tableaux: ["pro", "resume_vendeur"], cible: "/vente/reservations", statut: null },
  { code: "vendues", libelle: "Vendues", genre: "compte", tableaux: ["pro"], cible: "/vente/stock", statut: "vendue" },
  { code: "ventes_mois", libelle: "Ventes mois", genre: "compte", tableaux: ["resume_vendeur"], cible: "/vente/stock", statut: "vendue" },
  { code: "ca_mois", libelle: "CA mois", genre: "montant", tableaux: ["resume_vendeur"], cible: "/vente/statistiques", statut: null },
];

export interface AccesVo {
  espace: EspaceVo;
  /** Équipe MKA.P-MS : accès à l'espace officiel, sans abonnement. */
  equipe: boolean;
  /** L'espace de gestion VO demandé est-il ouvert à cet utilisateur ? */
  autorise: boolean;
  /** Abonnement VO réellement actif (null pour l'équipe et les particuliers). */
  abonnement: AbonnementVo | null;
  /** Raison lisible du refus, vide si l'accès est ouvert. */
  motif: string;
  /** Où envoyer l'utilisateur quand l'accès est refusé. */
  redirection: string;
}

export function espaceDe(role: string | null | undefined): EspaceVo {
  if (role && ADMIN_ROLES.includes(role as UserRole)) return "officiel";
  if (role && PRO_ROLES.includes(role as UserRole)) return "pro";
  return "particulier";
}

/** Abonnement VO actif de cet utilisateur, ou null. */
export async function abonnementVoActif(userId: number): Promise<AbonnementVo | null> {
  const lignes = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt));

  for (const ligne of lignes) {
    const plan = getPlan(ligne.planCode);
    if (plan?.category !== "vo") continue;
    if (ligne.currentPeriodEnd && ligne.currentPeriodEnd.getTime() < Date.now()) continue;
    return {
      planCode: ligne.planCode,
      label: plan.label,
      status: ligne.status,
      finPeriode: ligne.currentPeriodEnd?.toISOString() ?? null,
      quotaAnnonces: ligne.quotaAnnonces ?? plan.quotas.maxAnnonces,
    };
  }
  return null;
}

/** Décision d'accès à l'espace de gestion VO. */
export async function accesVo(user: { uid: number; role: string }): Promise<AccesVo> {
  const espace = espaceDe(user.role);

  if (espace === "officiel") {
    return {
      espace,
      equipe: true,
      autorise: true,
      abonnement: null,
      motif: "",
      redirection: "/vo",
    };
  }

  if (espace === "particulier") {
    return {
      espace,
      equipe: false,
      autorise: false,
      abonnement: null,
      motif:
        "L'espace de gestion VO est réservé aux comptes professionnels abonnés. Un compte particulier gère ses véhicules depuis ses annonces.",
      redirection: "/inscription-pro-vo",
    };
  }

  const abonnement = await abonnementVoActif(user.uid);
  if (!abonnement) {
    return {
      espace,
      equipe: false,
      autorise: false,
      abonnement: null,
      motif: "Aucun abonnement VO actif sur ce compte professionnel.",
      redirection: "/inscription-pro-vo",
    };
  }

  return {
    espace,
    equipe: false,
    autorise: true,
    abonnement,
    motif: "",
    redirection: "/vente",
  };
}

/* ── Stock du professionnel : uniquement ses propres véhicules ───────────── */

export interface VehiculeStockPro {
  id: number;
  reference: string | null;
  titre: string;
  marque: string;
  modele: string;
  version: string | null;
  annee: number | null;
  kilometrage: number | null;
  prix: number;
  devise: string;
  status: string;
  type: string;
  categorieAnnonce: string;
  vendeurType: string;
  photo: string | null;
  vues: number;
  contacts: number;
  publieLe: string | null;
  majLe: string;
}

/**
 * Le stock d'un professionnel = ses propres annonces véhicules.
 * Aucune jointure avec le stock officiel (table vo_vehicules) : les deux
 * espaces n'ont aucune donnée en commun.
 */
export async function stockProDe(
  userId: number,
  options?: { status?: string; limit?: number },
): Promise<VehiculeStockPro[]> {
  const conditions = [eq(annonces.ownerId, userId)];
  if (options?.status) {
    conditions.push(sql`${annonces.status}::text = ${options.status}`);
  }

  const lignes = await db
    .select()
    .from(annonces)
    .where(and(...conditions))
    .orderBy(desc(annonces.updatedAt))
    .limit(options?.limit ?? 100);

  const photos = lignes.length
    ? await db
        .select({ annonceId: annoncePhotos.annonceId, url: annoncePhotos.url })
        .from(annoncePhotos)
        .where(
          inArray(
            annoncePhotos.annonceId,
            lignes.map((a) => a.id),
          ),
        )
        .orderBy(annoncePhotos.annonceId, annoncePhotos.ordre)
    : [];
  const premierePhoto = new Map<number, string>();
  for (const p of photos) {
    if (!premierePhoto.has(p.annonceId)) premierePhoto.set(p.annonceId, p.url);
  }

  return lignes.map((a) => ({
    id: a.id,
    reference: a.reference,
    titre: a.titre,
    marque: a.marque,
    modele: a.modele,
    version: a.version,
    annee: a.annee,
    kilometrage: a.kilometrage,
    prix: Number(a.prix),
    devise: a.devise,
    status: a.status,
    type: a.type,
    categorieAnnonce: a.categorieAnnonce,
    vendeurType: a.vendeurType,
    photo: premierePhoto.get(a.id) ?? null,
    vues: a.vues,
    contacts: a.contacts,
    publieLe: a.publishedAt?.toISOString() ?? null,
    majLe: a.updatedAt.toISOString(),
  }));
}

export interface CompteursPro {
  stock: number;
  actives: number;
  reservees: number;
  vendues: number;
  brouillons: number;
  enValidation: number;
  expirees: number;
  /** Ventes/locations conclues depuis le 1er du mois (date de dernière mise à jour). */
  ventesMois: number;
  /** Chiffre d'affaires du mois en cours : somme des prix des annonces conclues. */
  caMois: number;
  quotaAnnonces: number | null;
  /** Cartes du tableau de bord, déclarées par le moteur avec leur destination. */
  cartes: CarteTableauPro[];
}

export async function compteursProDe(
  userId: number,
  quotaAnnonces: number | null,
): Promise<CompteursPro> {
  const lignes = await db
    .select({ status: annonces.status, n: sql<number>`count(*)::int` })
    .from(annonces)
    .where(eq(annonces.ownerId, userId))
    .groupBy(annonces.status);

  const parStatut = new Map<string, number>();
  for (const l of lignes) parStatut.set(String(l.status), Number(l.n));
  const n = (...statuts: string[]) =>
    statuts.reduce((somme, s) => somme + (parStatut.get(s) ?? 0), 0);

  // Réservations : demandes en cours sur les véhicules de ce professionnel.
  const [reservees] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .innerJoin(annonces, eq(annonces.id, bookings.vehicleId))
    .where(
      and(
        eq(annonces.ownerId, userId),
        sql`${bookings.status} IN ('pending','accepted')`,
      ),
    );

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);
  const [mois] = await db
    .select({
      n: sql<number>`count(*)::int`,
      ca: sql<string>`coalesce(sum(${annonces.prix}), 0)`,
    })
    .from(annonces)
    .where(
      and(
        eq(annonces.ownerId, userId),
        sql`${annonces.status} IN ('vendue','louee')`,
        sql`${annonces.updatedAt} >= ${debutMois}`,
      ),
    );

  const base = {
    stock: [...parStatut.values()].reduce((a, b) => a + b, 0),
    actives: n("publiee"),
    reservees: Number(reservees?.n ?? 0),
    vendues: n("vendue", "louee"),
    brouillons: n("brouillon"),
    enValidation: n("en_validation"),
    expirees: n("expiree", "archivee", "refusee"),
    ventesMois: Number(mois?.n ?? 0),
    caMois: Number(mois?.ca ?? 0),
    quotaAnnonces,
  };
  const valeurs: Record<CodeCartePro, number> = {
    stock: base.stock, actives: base.actives, reservees: base.reservees,
    vendues: base.vendues, ventes_mois: base.ventesMois, ca_mois: base.caMois,
  };
  return { ...base, cartes: CARTES_TABLEAU_PRO.map((c) => ({ ...c, valeur: valeurs[c.code] })) };
}

/** Contrôle d'appartenance : ce véhicule appartient-il bien à ce pro ? */
export async function vehiculeProAppartient(
  userId: number,
  annonceId: number,
): Promise<boolean> {
  const [ligne] = await db
    .select({ id: annonces.id })
    .from(annonces)
    .where(and(eq(annonces.id, annonceId), eq(annonces.ownerId, userId)))
    .limit(1);
  return !!ligne;
}

/** Statuts d'annonce réellement présents en base pour ce pro (filtres réels). */
export async function statutsProDe(userId: number): Promise<string[]> {
  const lignes = await db
    .selectDistinct({ status: annonces.status })
    .from(annonces)
    .where(eq(annonces.ownerId, userId));
  return lignes.map((l) => String(l.status));
}
