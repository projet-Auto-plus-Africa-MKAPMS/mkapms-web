// ===== MODULE: DÉPÔT-VENTE MKA.P-MS =====
// Le client confie son véhicule → MKA.P-MS s'occupe de tout (photos, annonce, négociation, vente).
// Commission automatique prélevée sur la vente.
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const depotVenteStatusEnum = pgEnum("depot_vente_status", [
  "demande",
  "expertise",
  "accepte",
  "photos_en_cours",
  "en_ligne",
  "negociation",
  "vendu",
  "paiement_client",
  "termine",
  "refuse",
  "annule",
]);

export const depotVente = pgTable("depot_vente", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  marque: varchar("marque", { length: 64 }).notNull(),
  modele: varchar("modele", { length: 128 }).notNull(),
  annee: integer("annee"),
  immatriculation: varchar("immatriculation", { length: 32 }),
  vin: varchar("vin", { length: 32 }),
  kilometrage: integer("kilometrage"),
  carburant: varchar("carburant", { length: 32 }),
  boiteVitesse: varchar("boite_vitesse", { length: 32 }),
  couleur: varchar("couleur", { length: 32 }),
  description: text("description"),
  prixSouhaite: numeric("prix_souhaite", { precision: 12, scale: 2 }),
  prixExpertise: numeric("prix_expertise", { precision: 12, scale: 2 }),
  prixVenteEffectif: numeric("prix_vente_effectif", { precision: 12, scale: 2 }),
  commissionPct: numeric("commission_pct", { precision: 5, scale: 2 }).default("10.00"),
  commissionMontant: numeric("commission_montant", { precision: 12, scale: 2 }),
  photos: text("photos"),
  status: depotVenteStatusEnum("status").notNull().default("demande"),
  annonceId: integer("annonce_id"),
  agentId: integer("agent_id"),
  siteId: integer("site_id"),
  notes: text("notes"),
  dateDepot: timestamp("date_depot"),
  dateVente: timestamp("date_vente"),
  datePaiement: timestamp("date_paiement"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
