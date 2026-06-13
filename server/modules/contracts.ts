// ===== MODULE: CONTRATS INTELLIGENTS =====
// Plan Partie 1 §12. Génération PDF + signature électronique + archivage.
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const contractTypeEnum = pgEnum("contract_type", [
  "vente_vehicule",
  "reservation",
  "location",
  "vtc_taxi",
  "depannage",
  "livraison",
  "paiement_fractionne",
  "import_export",
  "depot_vente",
  "partenariat_fournisseur",
]);
export const contractStatusEnum = pgEnum("contract_status", [
  "brouillon",
  "genere",
  "envoye",
  "signe",
  "archive",
  "annule",
]);

export const generatedDocuments = pgTable("generated_documents", {
  id: serial("id").primaryKey(),
  type: contractTypeEnum("type").notNull(),
  status: contractStatusEnum("status").notNull().default("brouillon"),
  userId: integer("user_id"),
  refType: varchar("ref_type", { length: 64 }), // table liée (annonce, location...)
  refId: integer("ref_id"),
  titre: varchar("titre", { length: 192 }),
  pdfUrl: text("pdf_url"),
  contenu: text("contenu"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documentSignatures = pgTable("document_signatures", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  signerId: integer("signer_id"),
  signerName: varchar("signer_name", { length: 160 }),
  signerEmail: varchar("signer_email", { length: 192 }),
  signedAt: timestamp("signed_at"),
  signatureData: text("signature_data"),
  ipAddress: varchar("ip_address", { length: 64 }),
  signed: boolean("signed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
