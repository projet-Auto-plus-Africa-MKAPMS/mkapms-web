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

/**
 * Réglages de réapprovisionnement d'un garage : plafond d'engagement mensuel
 * (aucune commande fournisseur ne le dépasse) et fournisseur habituel.
 */
export const atelierReapproReglages = pgTable("atelier_reappro_reglages", {
  id: serial("id").primaryKey(),
  garageId: integer("garage_id").notNull().unique(),
  /** 0 = aucune commande possible tant que l'atelier n'a pas fixé son plafond. */
  plafondMensuelCents: integer("plafond_mensuel_cents").notNull().default(0),
  /** Les ruptures de stock ouvrent une proposition toutes seules (jamais une commande). */
  propositionAuto: boolean("proposition_auto").notNull().default(true),
  fournisseurNom: varchar("fournisseur_nom", { length: 160 }),
  fournisseurEmail: varchar("fournisseur_email", { length: 200 }),
  fournisseurTelephone: varchar("fournisseur_telephone", { length: 40 }),
  parUser: integer("par_user").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Proposition de réapprovisionnement : ouverte par le seuil ou à la main,
 * décidée par un humain de l'atelier, puis rattachée à une commande.
 */
export const atelierReapproPropositions = pgTable(
  "atelier_reappro_propositions",
  {
    id: serial("id").primaryKey(),
    garageId: integer("garage_id").notNull(),
    stockId: integer("stock_id").notNull(),
    reference: varchar("reference", { length: 96 }).notNull(),
    designation: varchar("designation", { length: 200 }).notNull(),
    quantiteConstatee: integer("quantite_constatee").notNull(),
    seuil: integer("seuil").notNull(),
    quantiteProposee: integer("quantite_proposee").notNull(),
    prixUnitaireCents: integer("prix_unitaire_cents"),
    /** `seuil_auto` (événement atelier.stock_bas) ou `manuelle`. */
    origine: varchar("origine", { length: 24 }).notNull(),
    /** proposee → validee | refusee → commandee → (receptionnee via la commande). */
    statut: varchar("statut", { length: 24 }).notNull().default("proposee"),
    decidePar: integer("decide_par"),
    decideAt: timestamp("decide_at", { withTimezone: true }),
    motifDecision: varchar("motif_decision", { length: 300 }),
    commandeId: integer("commande_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    garageIdx: index("atelier_reappro_prop_garage_idx").on(t.garageId),
    stockStatutIdx: index("atelier_reappro_prop_stock_statut_idx").on(t.stockId, t.statut),
  }),
);

/** Commande fournisseur : engagement financier réel, sous plafond, réceptionnée dans le stock. */
export interface LigneCommandeFournisseur {
  propositionId: number;
  stockId: number;
  reference: string;
  designation: string;
  quantite: number;
  prixUnitaireCents: number;
}

export const atelierCommandesFournisseur = pgTable(
  "atelier_commandes_fournisseur",
  {
    id: serial("id").primaryKey(),
    garageId: integer("garage_id").notNull(),
    numero: varchar("numero", { length: 40 }).notNull().unique(),
    fournisseurNom: varchar("fournisseur_nom", { length: 160 }).notNull(),
    fournisseurEmail: varchar("fournisseur_email", { length: 200 }),
    fournisseurTelephone: varchar("fournisseur_telephone", { length: 40 }),
    /** [{ propositionId, stockId, reference, designation, quantite, prixUnitaireCents }] */
    lignes: jsonb("lignes").$type<LigneCommandeFournisseur[]>().notNull().default([]),
    totalCents: integer("total_cents").notNull(),
    /** a_transmettre (bon émis, email non parti) | envoyee | receptionnee | annulee */
    statut: varchar("statut", { length: 24 }).notNull().default("a_transmettre"),
    emailEnvoye: boolean("email_envoye").notNull().default(false),
    passeePar: integer("passee_par").notNull(),
    receptionneePar: integer("receptionnee_par"),
    receptionneeAt: timestamp("receptionnee_at", { withTimezone: true }),
    annuleePar: integer("annulee_par"),
    annuleeAt: timestamp("annulee_at", { withTimezone: true }),
    motifAnnulation: varchar("motif_annulation", { length: 300 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    garageIdx: index("atelier_cmd_fourn_garage_idx").on(t.garageId),
    statutIdx: index("atelier_cmd_fourn_statut_idx").on(t.statut),
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
