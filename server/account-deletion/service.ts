/**
 * Suppression de compte — service.
 *
 * Avant ce moteur, le bouton « Supprimer mon compte » attendait 800 ms et
 * déconnectait la personne : le compte, les annonces et les messages restaient
 * en base. La politique de confidentialité promettait l'inverse. Une promesse
 * non tenue sur des données personnelles n'est pas un défaut d'affichage.
 *
 * Ce que fait la suppression, et rien de plus :
 *  - l'identité est effacée du compte (e-mail, nom, téléphone, adresse, photo,
 *    mots de passe, identifiant Google, codes de vérification) ;
 *  - les annonces sont retirées du public ;
 *  - les favoris et les notifications sont supprimés ;
 *  - les conversations sont fermées, sans détruire les messages reçus par
 *    l'autre partie : ils ne sont pas ses données à elle en moins.
 *
 * Ce qu'elle ne fait pas, et pourquoi :
 *  - les factures, paiements et écritures comptables restent en base. La loi
 *    impose leur conservation ; ils sont détachés de l'identité, pas effacés en
 *    douce. Le dire est plus honnête que promettre une suppression totale.
 */
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { annonces, conversations, favoris, notifications, users } from "../schema.js";
import { logAction } from "../audit.js";
import { adRequests, type AdOrigine, type AdStatut } from "./schema.js";

/** Inventaire de ce qui a réellement été touché. */
export interface EffetsSuppression {
  annoncesRetirees: number;
  favorisSupprimes: number;
  notificationsSupprimees: number;
  conversationsFermees: number;
  identiteEffacee: boolean;
  piecesComptablesConservees: string;
}

/** Ce que la plateforme conserve malgré la suppression, et pour quelle raison. */
export const CONSERVATIONS = [
  {
    element: "Factures, paiements et écritures comptables",
    raison:
      "Conservation imposée par la loi comptable et fiscale du pays de facturation. Détachés de votre identité, ils ne permettent plus de vous retrouver depuis la plateforme.",
  },
  {
    element: "Messages déjà reçus par votre interlocuteur",
    raison:
      "Ils font partie de sa conversation. Vos conversations sont fermées et votre nom retiré, mais nous ne supprimons pas le contenu qu'une autre personne a légitimement reçu.",
  },
  {
    element: "Journal des actions d'administration",
    raison:
      "Trace de sécurité obligatoire (qui a fait quoi, quand). Il conserve un numéro interne, plus votre nom ni votre e-mail.",
  },
] as const;

/**
 * Exécute la suppression. Idempotent : un compte déjà supprimé n'est pas
 * retouché, la demande est simplement refermée.
 */
export async function executerSuppression(
  userId: number,
  actorId: number | null,
): Promise<EffetsSuppression | null> {
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u || u.email.endsWith("@compte-supprime.invalid")) return null;

  const retirables = await db
    .select({ id: annonces.id })
    .from(annonces)
    .where(and(eq(annonces.ownerId, userId), inArray(annonces.status, ["publiee", "en_validation", "brouillon"])));
  if (retirables.length > 0) {
    await db
      .update(annonces)
      .set({ status: "archivee" })
      .where(
        inArray(
          annonces.id,
          retirables.map((a) => a.id),
        ),
      );
  }

  const favSupprimes = await db.delete(favoris).where(eq(favoris.userId, userId)).returning({ id: favoris.id });
  const notifSupprimees = await db
    .delete(notifications)
    .where(eq(notifications.userId, userId))
    .returning({ id: notifications.id });

  const convFermees = await db
    .update(conversations)
    .set({ status: "archived" })
    .where(
      and(
        or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)),
        eq(conversations.status, "active"),
      ),
    )
    .returning({ id: conversations.id });

  // L'identité est remplacée, pas la ligne : les références comptables qui
  // pointent vers ce numéro de compte resteraient orphelines si on la détruisait.
  await db
    .update(users)
    .set({
      email: `supprime-${userId}@compte-supprime.invalid`,
      passwordHash: null,
      googleId: null,
      name: "Compte supprimé",
      firstName: null,
      lastName: null,
      phone: null,
      avatarUrl: null,
      logoUrl: null,
      companyName: null,
      companySiret: null,
      companySiren: null,
      vatNumber: null,
      addressLine: null,
      city: null,
      postalCode: null,
      horaires: null,
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      twoFactorCode: null,
      twoFactorExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  const effets: EffetsSuppression = {
    annoncesRetirees: retirables.length,
    favorisSupprimes: favSupprimes.length,
    notificationsSupprimees: notifSupprimees.length,
    conversationsFermees: convFermees.length,
    identiteEffacee: true,
    piecesComptablesConservees:
      "Factures et paiements conservés sans lien d'identité, conformément aux obligations comptables.",
  };

  await logAction(actorId, "account.deleted", "user", userId, { ...effets });
  return effets;
}

/** Enregistre une demande, et l'exécute si l'identité est déjà prouvée. */
export async function enregistrerDemande(input: {
  userId: number | null;
  email: string;
  origine: AdOrigine;
  motif: string;
  executer: boolean;
  actorId: number | null;
}): Promise<{ id: number; statut: AdStatut; effets: EffetsSuppression | null }> {
  const effets = input.executer && input.userId ? await executerSuppression(input.userId, input.actorId) : null;
  // Une demande venue du formulaire public n'est pas exécutée : sans preuve
  // d'identité, supprimer le compte d'un tiers sur simple e-mail serait une
  // faille, pas un service.
  const statut: AdStatut = input.executer ? "effectuee" : "en_verification";

  const [r] = await db
    .insert(adRequests)
    .values({
      userId: input.userId,
      email: input.email.toLowerCase(),
      origine: input.origine,
      statut,
      motif: input.motif,
      effets: effets ?? null,
      traiteePar: input.executer ? input.actorId : null,
      traiteeLe: input.executer ? new Date() : null,
    })
    .returning({ id: adRequests.id });

  return { id: r.id, statut, effets };
}

/** File des demandes pour la direction. */
export async function listerDemandes(): Promise<
  {
    id: number;
    email: string;
    origine: string;
    statut: string;
    motif: string;
    decision: string;
    createdAt: Date;
    traiteeLe: Date | null;
    compteExiste: boolean;
  }[]
> {
  const rows = await db
    .select({
      id: adRequests.id,
      userId: adRequests.userId,
      email: adRequests.email,
      origine: adRequests.origine,
      statut: adRequests.statut,
      motif: adRequests.motif,
      decision: adRequests.decision,
      createdAt: adRequests.createdAt,
      traiteeLe: adRequests.traiteeLe,
    })
    .from(adRequests)
    .orderBy(sql`${adRequests.createdAt} desc`)
    .limit(500);

  const emails = rows.map((r) => r.email);
  const comptes = emails.length
    ? await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.email, emails))
    : [];
  const connus = new Set(comptes.map((c) => c.email));

  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    origine: r.origine,
    statut: r.statut,
    motif: r.motif,
    decision: r.decision,
    createdAt: r.createdAt,
    traiteeLe: r.traiteeLe,
    compteExiste: connus.has(r.email),
  }));
}

/** Décision de la direction sur une demande venue du formulaire public. */
export async function traiterDemande(input: {
  id: number;
  action: "effectuer" | "refuser";
  decision: string;
  actorId: number;
}): Promise<{ statut: AdStatut; effets: EffetsSuppression | null } | null> {
  const [r] = await db.select().from(adRequests).where(eq(adRequests.id, input.id)).limit(1);
  if (!r || r.statut === "effectuee") return null;

  if (input.action === "refuser") {
    await db
      .update(adRequests)
      .set({ statut: "refusee", decision: input.decision, traiteePar: input.actorId, traiteeLe: new Date() })
      .where(eq(adRequests.id, input.id));
    return { statut: "refusee", effets: null };
  }

  const [compte] = await db.select({ id: users.id }).from(users).where(eq(users.email, r.email)).limit(1);
  if (!compte) {
    // Refuser en le disant vaut mieux que marquer « effectuée » sans rien faire.
    await db
      .update(adRequests)
      .set({
        statut: "refusee",
        decision: `Aucun compte ne correspond à cette adresse. ${input.decision}`.trim(),
        traiteePar: input.actorId,
        traiteeLe: new Date(),
      })
      .where(eq(adRequests.id, input.id));
    return { statut: "refusee", effets: null };
  }

  const effets = await executerSuppression(compte.id, input.actorId);
  await db
    .update(adRequests)
    .set({
      statut: "effectuee",
      decision: input.decision,
      effets: effets ?? null,
      userId: compte.id,
      traiteePar: input.actorId,
      traiteeLe: new Date(),
    })
    .where(eq(adRequests.id, input.id));
  return { statut: "effectuee", effets };
}
