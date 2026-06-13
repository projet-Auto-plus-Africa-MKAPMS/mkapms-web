// ===== MODULE: LIVRAISON (réseau logistique) =====
// Plan Partie 2 §7 + Partie 3 §10. Règle moto: 20 kg / 60x40x40 cm max.
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

export const deliveryVehicleTypeEnum = pgEnum("delivery_vehicle_type", [
  "moto",
  "scooter",
  "vehicule_leger",
  "utilitaire",
  "fourgon",
  "camion",
]);
export const deliveryMissionStatusEnum = pgEnum("delivery_mission_status", [
  "creee",
  "en_recherche",
  "acceptee",
  "refusee",
  "en_cours",
  "livree",
  "annulee",
  "litige",
]);

export const deliveryProfiles = pgTable("delivery_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  nom: varchar("nom", { length: 160 }).notNull(),
  type: deliveryVehicleTypeEnum("type").notNull().default("moto"),
  isSociete: boolean("is_societe").notNull().default(false),
  kbis: varchar("kbis", { length: 64 }),
  zone: text("zone"),
  countryCode: varchar("country_code", { length: 4 }),
  active: boolean("active").notNull().default(true),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const deliveryVehicles = pgTable("delivery_vehicles", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  type: deliveryVehicleTypeEnum("type").notNull(),
  immatriculation: varchar("immatriculation", { length: 32 }),
  capaciteKg: numeric("capacite_kg", { precision: 10, scale: 2 }),
  active: boolean("active").notNull().default(true),
});

export const deliveryPricing = pgTable("delivery_pricing", {
  id: serial("id").primaryKey(),
  type: deliveryVehicleTypeEnum("type").notNull(),
  countryCode: varchar("country_code", { length: 4 }),
  baseFee: numeric("base_fee", { precision: 12, scale: 2 }).notNull().default("0"),
  perKm: numeric("per_km", { precision: 12, scale: 2 }).notNull().default("0"),
  urgentMultiplier: numeric("urgent_multiplier", { precision: 5, scale: 2 }).default("1.50"),
  active: boolean("active").notNull().default(true),
});

export const deliveryMissions = pgTable("delivery_missions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  profileId: integer("profile_id"),
  status: deliveryMissionStatusEnum("status").notNull().default("creee"),
  typeColis: varchar("type_colis", { length: 96 }),
  poidsKg: numeric("poids_kg", { precision: 10, scale: 2 }),
  longueurCm: integer("longueur_cm"),
  largeurCm: integer("largeur_cm"),
  hauteurCm: integer("hauteur_cm"),
  adresseDepart: text("adresse_depart"),
  adresseArrivee: text("adresse_arrivee"),
  distanceKm: numeric("distance_km", { precision: 10, scale: 2 }),
  urgent: boolean("urgent").notNull().default(false),
  tarif: numeric("tarif", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  vehicleTypeRequis: deliveryVehicleTypeEnum("vehicle_type_requis"),
  paymentId: integer("payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const deliveryRoutes = pgTable("delivery_routes", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").notNull(),
  ordre: integer("ordre").notNull().default(0),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  label: varchar("label", { length: 160 }),
});

export const deliveryTracking = pgTable("delivery_tracking", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").notNull(),
  status: deliveryMissionStatusEnum("status").notNull(),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
