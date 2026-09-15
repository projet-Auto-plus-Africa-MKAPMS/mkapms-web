// ===== MODULE: PIÈCES AUTO (marketplace B2B/B2C) =====
// Plan Partie 2 §6 + Partie 3 §9. Univers indépendant.
//
// `partsShops`, `partsCatalog`, `partsStock`, `partsOrders`, `partsOrderItems`
// et leurs enums (`partsShopTypeEnum`, `partsOrderStatusEnum`) vivaient ici en
// double de leurs homonymes de `server/schema.ts` — même nom de table
// physique, colonnes différentes. Par les règles d'export ESM, la déclaration
// locale de `schema.ts` masquait silencieusement ce re-export : ces versions
// n'étaient donc jamais migrées ni atteignables via `../schema.js`, seulement
// par un import direct de ce fichier (fait par erreur dans
// `estimation-hub/service.ts` et `reputation-engine/{ownership,responses}.ts`,
// corrigé pour pointer vers `../schema.js`, la version réellement en base).
// Supprimées ici : code mort, jamais une capacité perdue (aucun de ces objets
// n'était accessible ni migré). Voir audit pré-LOT 3 (Plan Maître Fournisseurs).
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const partReferences = pgTable("part_references", {
  id: serial("id").primaryKey(),
  oemRef: varchar("oem_ref", { length: 96 }),
  equipmentierRef: varchar("equipmentier_ref", { length: 96 }),
  marque: varchar("marque", { length: 96 }),
  designation: varchar("designation", { length: 192 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const partCompatibilities = pgTable("part_compatibilities", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").notNull(),
  marque: varchar("marque", { length: 96 }),
  modele: varchar("modele", { length: 96 }),
  motorisation: varchar("motorisation", { length: 96 }),
  anneeDebut: integer("annee_debut"),
  anneeFin: integer("annee_fin"),
});
