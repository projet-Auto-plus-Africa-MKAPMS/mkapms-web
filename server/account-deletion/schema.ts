/**
 * Suppression de compte — schéma isolé.
 *
 * Exigence de publication mobile (Google Play, App Store) et de la
 * réglementation de chaque pays : un titulaire doit pouvoir faire supprimer son
 * compte, y compris quand il n'a plus accès à l'application.
 *
 * Deux principes tenus par ce moteur :
 *  - une demande laisse une trace datée, même exécutée immédiatement ;
 *  - les pièces comptables et fiscales ne sont pas détruites, parce que la loi
 *    les impose. Elles sont dissociées de l'identité, jamais effacées en douce.
 */
import { integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/** Étapes d'une demande. Aucune n'est déduite : chacune est écrite. */
export const AD_STATUTS = ["recue", "en_verification", "effectuee", "refusee"] as const;
export type AdStatut = (typeof AD_STATUTS)[number];

/** Origine de la demande : le niveau de preuve d'identité n'est pas le même. */
export const AD_ORIGINES = ["compte_connecte", "formulaire_public"] as const;
export type AdOrigine = (typeof AD_ORIGINES)[number];

export const adRequests = pgTable("ad_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  email: varchar("email", { length: 255 }).notNull(),
  origine: varchar("origine", { length: 24 }).notNull().default("compte_connecte"),
  statut: varchar("statut", { length: 24 }).notNull().default("recue"),
  motif: text("motif").notNull().default(""),
  // Ce qui a réellement été fait, compté ligne par ligne : une suppression
  // annoncée sans inventaire n'est pas vérifiable.
  effets: jsonb("effets"),
  decision: text("decision").notNull().default(""),
  traiteePar: integer("traitee_par"),
  traiteeLe: timestamp("traitee_le"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
