/**
 * Vehicle Delivery Engine — schéma isolé.
 *
 * Moteur distinct de la livraison de pièces et colis (univers Livraison,
 * `delivery_*`) : un véhicule ne se transporte pas comme un colis (plateau,
 * porte-8, conteneur, convoyage, dédouanement), et les deux métiers doivent
 * pouvoir être vendus ou loués séparément.
 *
 * Règle du moteur : aucun prix n'est calculé sans barème enregistré. Un barème
 * non vérifié donne un prix « estimé », un barème absent donne « non mesuré ».
 */
import {
  bigserial,
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Modes de transport d'un véhicule. */
export const VD_MODES = [
  "plateau",
  "porte_engins",
  "camion_porte_voitures",
  "conteneur_maritime",
  "roro_maritime",
  "convoyage_chauffeur",
  "train",
  "avion_cargo",
] as const;
export type VdMode = (typeof VD_MODES)[number];

/** Catégories de véhicules livrables (le gabarit change le prix et le mode). */
export const VD_CATEGORIES = [
  "moto",
  "citadine",
  "berline",
  "suv",
  "utilitaire",
  "fourgon",
  "camion",
  "engin",
  "bus",
] as const;
export type VdCategorie = (typeof VD_CATEGORIES)[number];

/** Étapes possibles d'un acheminement. */
export const VD_ETAPES = [
  "enlevement",
  "preacheminement",
  "transport_principal",
  "dedouanement_export",
  "dedouanement_import",
  "post_acheminement",
  "livraison_finale",
  "remise_pv",
] as const;
export type VdEtape = (typeof VD_ETAPES)[number];

/**
 * Qualité d'un prix. `confirme` est réservé à un barème transporteur vérifié :
 * sans cela l'acheteur doit savoir que le chiffre peut bouger.
 */
export const VD_QUALITES = [
  "confirme",
  "estime",
  "confirmation_requise",
  "non_mesure",
  "indisponible",
] as const;
export type VdQualite = (typeof VD_QUALITES)[number];

/** Barèmes par mode, corridor de pays et catégorie. Gouvernés par la direction. */
export const vdTarifs = pgTable("vd_tarifs", {
  id: serial("id").primaryKey(),
  mode: varchar("mode", { length: 32 }).notNull(),
  categorie: varchar("categorie", { length: 24 }).notNull(),
  paysDepart: varchar("pays_depart", { length: 4 }),
  paysArrivee: varchar("pays_arrivee", { length: 4 }),
  etape: varchar("etape", { length: 32 }).notNull().default("transport_principal"),
  prixFixe: numeric("prix_fixe", { precision: 12, scale: 2 }).notNull().default("0"),
  prixParKm: numeric("prix_par_km", { precision: 10, scale: 4 }).notNull().default("0"),
  prixMinimum: numeric("prix_minimum", { precision: 12, scale: 2 }).notNull().default("0"),
  devise: varchar("devise", { length: 4 }).notNull().default("EUR"),
  delaiJoursMin: integer("delai_jours_min"),
  delaiJoursMax: integer("delai_jours_max"),
  /** `interne` = barème MKA.P-MS ; `transporteur` = grille contractuelle signée. */
  origine: varchar("origine", { length: 24 }).notNull().default("interne"),
  source: text("source").notNull().default(""),
  transporteur: varchar("transporteur", { length: 120 }),
  verifie: boolean("verifie").notNull().default(false),
  actif: boolean("actif").notNull().default(true),
  validDu: timestamp("valid_du"),
  validAu: timestamp("valid_au"),
  actorId: integer("actor_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Options facturables (premium, protection, délai garanti…). */
export const vdOptions = pgTable("vd_options", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 48 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  description: text("description").notNull().default(""),
  prixFixe: numeric("prix_fixe", { precision: 12, scale: 2 }),
  prixPourcent: numeric("prix_pourcent", { precision: 6, scale: 2 }),
  devise: varchar("devise", { length: 4 }).notNull().default("EUR"),
  premium: boolean("premium").notNull().default(false),
  actif: boolean("actif").notNull().default(false),
  verifie: boolean("verifie").notNull().default(false),
  motif: text("motif").notNull().default(""),
  actorId: integer("actor_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Devis émis : trace de ce qui a été montré au client, avec sa qualité. */
export const vdDevis = pgTable("vd_devis", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  annonceId: integer("annonce_id"),
  userId: integer("user_id"),
  mode: varchar("mode", { length: 32 }).notNull(),
  categorie: varchar("categorie", { length: 24 }).notNull(),
  paysDepart: varchar("pays_depart", { length: 4 }),
  paysArrivee: varchar("pays_arrivee", { length: 4 }),
  villeDepart: varchar("ville_depart", { length: 120 }),
  villeArrivee: varchar("ville_arrivee", { length: 120 }),
  distanceKm: numeric("distance_km", { precision: 10, scale: 2 }),
  total: numeric("total", { precision: 12, scale: 2 }),
  devise: varchar("devise", { length: 4 }).notNull().default("EUR"),
  qualite: varchar("qualite", { length: 24 }).notNull(),
  etapes: jsonb("etapes").notNull().default([]),
  options: jsonb("options").notNull().default([]),
  manques: jsonb("manques").notNull().default([]),
  resume: text("resume").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Expédition réelle acceptée par un client. */
export const vdExpeditions = pgTable("vd_expeditions", {
  id: serial("id").primaryKey(),
  devisId: integer("devis_id"),
  annonceId: integer("annonce_id"),
  clientId: integer("client_id").notNull(),
  reference: varchar("reference", { length: 32 }).notNull().unique(),
  mode: varchar("mode", { length: 32 }).notNull(),
  statut: varchar("statut", { length: 32 }).notNull().default("a_planifier"),
  etapeCourante: varchar("etape_courante", { length: 32 }),
  transporteur: varchar("transporteur", { length: 120 }),
  total: numeric("total", { precision: 12, scale: 2 }),
  devise: varchar("devise", { length: 4 }).notNull().default("EUR"),
  qualitePrix: varchar("qualite_prix", { length: 24 }).notNull().default("estime"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Suivi étape par étape, alimenté par des faits (pas par une estimation). */
export const vdSuivi = pgTable("vd_suivi", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  expeditionId: integer("expedition_id").notNull(),
  etape: varchar("etape", { length: 32 }).notNull(),
  statut: varchar("statut", { length: 24 }).notNull().default("attendu"),
  note: text("note").notNull().default(""),
  auteurId: integer("auteur_id"),
  constateAt: timestamp("constate_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
