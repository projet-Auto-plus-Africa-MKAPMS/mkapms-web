/**
 * Point 123 — MKA.P-MS MEDIA AUTHENTICITY & DEEPFAKE DEFENSE ENGINE.
 *
 * Tables isolées (préfixe `ma_`). Le moteur ne lit ni n'écrit dans les tables
 * des autres moteurs : il enregistre ses propres constats et publie des
 * événements.
 *
 * Choix de conception assumé : aucune colonne ne dit « vrai » ou « faux ». Un
 * média porte un score, des raisons et des preuves ; un détecteur qui n'a pas pu
 * s'exécuter est enregistré comme `indisponible`, jamais comme rassurant.
 */
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Médias soumis au moteur d'authenticité. */
export const maMedias = pgTable(
  "ma_medias",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    /** Empreinte cryptographique de l'octet exact reçu (point 137). */
    sha256: varchar("sha256", { length: 64 }).notNull(),
    /** Empreinte perceptuelle : survit au recadrage et à la recompression (point 138). */
    phash: varchar("phash", { length: 64 }),
    /** image | video | audio | document | inconnu */
    kind: varchar("kind", { length: 16 }).notNull().default("inconnu"),
    mime: varchar("mime", { length: 96 }),
    bytes: integer("bytes").notNull().default(0),
    /** Là d'où vient le média : annonce, produit, message, document, avis… */
    contexte: varchar("contexte", { length: 32 }).notNull().default("inconnu"),
    contexteId: integer("contexte_id"),
    ownerId: integer("owner_id"),
    countryCode: varchar("country_code", { length: 8 }),
    /** Déclaration de la personne qui dépose (point 144). */
    declaration: varchar("declaration", { length: 24 }).notNull().default("non_declare"),
    /** Signaux de provenance réellement trouvés dans le fichier (point 131). */
    provenance: jsonb("provenance").default({}),
    /** en_attente | analyse | quarantaine | publie | bloque */
    statut: varchar("statut", { length: 16 }).notNull().default("en_attente"),
    /** 0 = aucun signe de manipulation constaté, 100 = faisceau de preuves accablant. */
    score: integer("score").notNull().default(0),
    /** faible | moyen | eleve | indetermine — « indetermine » n'est pas « faible ». */
    niveau: varchar("niveau", { length: 16 }).notNull().default("indetermine"),
    motif: text("motif").notNull().default(""),
    analyseAt: timestamp("analyse_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    sha: index("ma_medias_sha_idx").on(t.sha256),
    ph: index("ma_medias_phash_idx").on(t.phash),
    ctx: index("ma_medias_contexte_idx").on(t.contexte, t.contexteId),
    st: index("ma_medias_statut_idx").on(t.statut, t.createdAt),
  }),
);

/** Un passage de détecteur sur un média. Une ligne = un constat daté. */
export const maAnalyses = pgTable(
  "ma_analyses",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    mediaId: integer("media_id").notNull(),
    detecteur: varchar("detecteur", { length: 48 }).notNull(),
    /** indice | aucun_indice | indisponible — trois verdicts, jamais deux. */
    verdict: varchar("verdict", { length: 16 }).notNull(),
    /** Contribution au score, en points. Négatif pour un signal rassurant. */
    poids: integer("poids").notNull().default(0),
    raison: text("raison").notNull().default(""),
    /** Preuve brute conservée pour pouvoir être contestée. */
    preuve: jsonb("preuve").default({}),
    dureeMs: integer("duree_ms").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    m: index("ma_analyses_media_idx").on(t.mediaId),
    d: index("ma_analyses_detecteur_idx").on(t.detecteur, t.createdAt),
  }),
);

/** Étiquettes appliquées à un média (point 127, point 145). */
export const maLabels = pgTable(
  "ma_labels",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    mediaId: integer("media_id").notNull(),
    code: varchar("code", { length: 32 }).notNull(),
    /** declaration | detection | pdg — qui a posé l'étiquette. */
    origine: varchar("origine", { length: 16 }).notNull(),
    /** Étiquette montrée au public, ou seulement lisible par machine. */
    visible: boolean("visible").notNull().default(false),
    motif: text("motif").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    m: index("ma_labels_media_idx").on(t.mediaId),
  }),
);

/** Incidents ouverts sur un média (point 128). */
export const maIncidents = pgTable(
  "ma_incidents",
  {
    id: serial("id").primaryKey(),
    mediaId: integer("media_id"),
    type: varchar("type", { length: 32 }).notNull(),
    gravite: varchar("gravite", { length: 16 }).notNull().default("moyenne"),
    /** ouvert | en_analyse | tranche | classe */
    statut: varchar("statut", { length: 16 }).notNull().default("ouvert"),
    resume: text("resume").notNull().default(""),
    preuves: jsonb("preuves").default([]),
    /** Décision humaine, quand elle est requise. */
    decision: varchar("decision", { length: 24 }),
    decisionMotif: text("decision_motif").notNull().default(""),
    decidePar: integer("decide_par"),
    decideAt: timestamp("decide_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    s: index("ma_incidents_statut_idx").on(t.statut, t.createdAt),
  }),
);
