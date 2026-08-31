/**
 * Moteur d'Atelier — tables réellement écrites.
 *
 * Ces tables existent parce que trois boutons de l'atelier n'avaient AUCUNE
 * capacité serveur derrière eux : la validation interne, le contrôle qualité et
 * le stock de pièces du garage. Sans table, un « Validé » à l'écran n'est
 * opposable à personne et un stock affiché est un chiffre inventé.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

/** Validation d'atelier : qui a validé, quoi, quand, et sur quel dossier. */
export const atelierValidations = pgTable(
  "atelier_validations",
  {
    id: serial("id").primaryKey(),
    garageId: integer("garage_id"),
    /** Dossier concerné : plaque, n° d'ordre de réparation ou n° de RDV. */
    dossier: varchar("dossier", { length: 96 }).notNull(),
    /** `validation_interne` ou `controle_qualite`. */
    type: varchar("type", { length: 32 }).notNull(),
    etape: varchar("etape", { length: 96 }),
    conforme: boolean("conforme").notNull(),
    /** Points contrôlés réellement cochés : [{ libelle, conforme, remarque }]. */
    points: jsonb("points").notNull().default([]),
    remarque: text("remarque"),
    validePar: integer("valide_par").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dossierIdx: index("atelier_validations_dossier_idx").on(t.dossier),
    typeIdx: index("atelier_validations_type_idx").on(t.type),
  }),
);

/** Stock de pièces tenu par un garage (distinct du stock d'une boutique). */
export const atelierStock = pgTable(
  "atelier_stock",
  {
    id: serial("id").primaryKey(),
    garageId: integer("garage_id").notNull(),
    reference: varchar("reference", { length: 96 }).notNull(),
    designation: varchar("designation", { length: 200 }).notNull(),
    quantite: integer("quantite").notNull().default(0),
    seuil: integer("seuil").notNull().default(0),
    prixAchatCents: integer("prix_achat_cents"),
    prixVenteCents: integer("prix_vente_cents"),
    emplacement: varchar("emplacement", { length: 96 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    refUnique: unique("atelier_stock_garage_reference_unique").on(t.garageId, t.reference),
    garageIdx: index("atelier_stock_garage_idx").on(t.garageId),
  }),
);

/** Mouvement de stock : un stock sans mouvement n'est pas vérifiable. */
export const atelierStockMouvements = pgTable(
  "atelier_stock_mouvements",
  {
    id: serial("id").primaryKey(),
    stockId: integer("stock_id").notNull(),
    delta: integer("delta").notNull(),
    quantiteApres: integer("quantite_apres").notNull(),
    motif: varchar("motif", { length: 200 }),
    parUser: integer("par_user").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    stockIdx: index("atelier_stock_mouvements_stock_idx").on(t.stockId),
  }),
);

/** Report de rendez-vous atelier : ancienne date conservée, motif exigé. */
export const atelierRdvReports = pgTable(
  "atelier_rdv_reports",
  {
    id: serial("id").primaryKey(),
    rdvId: integer("rdv_id").notNull(),
    ancienneDate: timestamp("ancienne_date", { withTimezone: true }).notNull(),
    nouvelleDate: timestamp("nouvelle_date", { withTimezone: true }).notNull(),
    motif: varchar("motif", { length: 300 }).notNull(),
    parUser: integer("par_user").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    rdvIdx: index("atelier_rdv_reports_rdv_idx").on(t.rdvId),
  }),
);
