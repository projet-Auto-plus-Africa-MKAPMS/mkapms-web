/** Tables du moteur intermédiaire Boutique (migration 0156_shop_link.sql). Aucun secret, aucun contenu de la Boutique hors boîte d'échange. */
import { bigint, bigserial, char, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const shopLinkCables = pgTable("shop_link_cables", {
  canal: varchar("canal", { length: 32 }).primaryKey(),
  etat: varchar("etat", { length: 10 }).notNull().default("coupe"), // connecte | coupe
  motif: varchar("motif", { length: 240 }).notNull().default(""),
  modifiePar: integer("modifie_par"),
  modifieLe: timestamp("modifie_le", { withTimezone: true }).notNull().defaultNow(),
});

export const shopLinkCles = pgTable(
  "shop_link_cles",
  {
    id: serial("id").primaryKey(),
    libelle: varchar("libelle", { length: 80 }).notNull(),
    clePublique: text("cle_publique").notNull(),
    empreinte: varchar("empreinte", { length: 64 }).notNull(),
    etat: varchar("etat", { length: 10 }).notNull().default("active"), // active | revoquee
    creePar: integer("cree_par"),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
    revoqueeLe: timestamp("revoquee_le", { withTimezone: true }),
  },
  (t) => [uniqueIndex("shop_link_cles_empreinte_idx").on(t.empreinte)],
);

export const shopLinkRejeu = pgTable(
  "shop_link_rejeu",
  {
    nonce: varchar("nonce", { length: 32 }).primaryKey(),
    canal: varchar("canal", { length: 32 }).notNull(),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shop_link_rejeu_canal_idx").on(t.canal, t.creeLe)],
);

export const shopLinkJournal = pgTable(
  "shop_link_journal",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    canal: varchar("canal", { length: 32 }).notNull(),
    sens: varchar("sens", { length: 10 }).notNull(), // sortant | entrant | systeme
    evenement: varchar("evenement", { length: 32 }).notNull(),
    resultat: varchar("resultat", { length: 16 }).notNull(), // ok | refuse | erreur
    statutHttp: integer("statut_http"),
    dureeMs: integer("duree_ms"),
    acteur: varchar("acteur", { length: 60 }).notNull().default(""),
    detail: varchar("detail", { length: 300 }).notNull().default(""),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shop_link_journal_date_idx").on(t.creeLe), index("shop_link_journal_canal_idx").on(t.canal, t.creeLe)],
);

export const shopLinkEtatBoutique = pgTable("shop_link_etat_boutique", {
  id: serial("id").primaryKey(),
  recuLe: timestamp("recu_le", { withTimezone: true }).notNull().defaultNow(),
  observeLe: timestamp("observe_le", { withTimezone: true }).notNull(),
  cleId: integer("cle_id"),
  contenu: jsonb("contenu").$type<Record<string, unknown>>().notNull(),
});

export const shopLinkDocuments = pgTable(
  "shop_link_documents",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 80 }).notNull(),
    statut: varchar("statut", { length: 40 }).notNull(),
    totalMinor: bigint("total_minor", { mode: "number" }),
    devise: char("devise", { length: 3 }),
    referenceCommande: varchar("reference_commande", { length: 80 }),
    emisLe: timestamp("emis_le", { withTimezone: true }),
    recuLe: timestamp("recu_le", { withTimezone: true }).notNull().defaultNow(),
    cleId: integer("cle_id"),
  },
  (t) => [uniqueIndex("shop_link_documents_reference_idx").on(t.reference)],
);

export const shopLinkIaBoite = pgTable(
  "shop_link_ia_boite",
  {
    id: serial("id").primaryKey(),
    sens: varchar("sens", { length: 10 }).notNull(), // entrant | sortant
    type: varchar("type", { length: 24 }).notNull(), // procedure | connaissance | erreur_solution
    titre: varchar("titre", { length: 160 }).notNull(),
    contenu: text("contenu").notNull(),
    source: varchar("source", { length: 120 }).notNull().default(""),
    empreinte: varchar("empreinte", { length: 64 }).notNull(),
    etat: varchar("etat", { length: 16 }).notNull().default("en_attente"), // en_attente | approuve | rejete | transmis | integre
    connaissanceId: integer("connaissance_id"),
    cleId: integer("cle_id"),
    creePar: integer("cree_par"),
    decidePar: integer("decide_par"),
    decideLe: timestamp("decide_le", { withTimezone: true }),
    transmisLe: timestamp("transmis_le", { withTimezone: true }),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("shop_link_ia_boite_empreinte_idx").on(t.sens, t.empreinte), index("shop_link_ia_boite_etat_idx").on(t.sens, t.etat, t.creeLe)],
);
