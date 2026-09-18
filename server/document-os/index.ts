/**
 * Document OS — Registre unifié des documents MKA.P-MS (règle MOS #15).
 *
 * Consolide les tables existantes (`factures`, `devis`, `invoices`,
 * `quotes`, `devisItems`, `contrats`, etc.) SANS les modifier, en
 * ajoutant :
 *   • un registre des types de documents (facture, contrat, devis,
 *     bon_commande, attestation, CGV, mandat_vente, ...)
 *   • des templates HTML multi-langues par type + pays (branché sur
 *     Language OS + Country OS)
 *   • un journal unifié `doc_documents` (référence, propriétaire,
 *     contrepartie, montants HT/TTC, devise, statut, signature)
 *   • standards MOS (meta / healthStatus / controlCenterFeed / dashboard)
 *
 * Interconnexion :
 *   - Language OS → traduction dynamique des templates (fallback fr)
 *   - Country OS  → format d'adresse / TVA / devise par défaut
 *   - Notification OS → notifier propriétaire à l'émission
 *   - Identity OS → owner / counterparty via userId legacy
 */
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { bigserial, boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db.js";
import { getCountry } from "../country-os/index.js";
import { detectLanguage, getUserLanguagePref } from "../language-os/index.js";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

// ── Schéma ──────────────────────────────────────────────────────────────
export const docTypes = pgTable("doc_types", {
  code: varchar("code", { length: 48 }).primaryKey(),
  labelFr: varchar("label_fr", { length: 120 }).notNull(),
  labelEn: varchar("label_en", { length: 120 }),
  category: varchar("category", { length: 32 }).notNull(),
  requiresSignature: boolean("requires_signature").notNull().default(false),
  legalRetentionYears: integer("legal_retention_years").notNull().default(10),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const docTemplates = pgTable("doc_templates", {
  id: serial("id").primaryKey(),
  typeCode: varchar("type_code", { length: 48 }).notNull(),
  language: varchar("language", { length: 8 }).notNull(),
  countryCode: varchar("country_code", { length: 2 }),
  htmlBody: text("html_body").notNull(),
  variables: jsonb("variables").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: unique("doc_templates_unique").on(t.typeCode, t.language, t.countryCode) }));

/**
 * Registre des entités juridiques MKA.P-MS (règle maître documentaire #1/#2/#4/#6).
 *
 * MKA.P-MS est une identité internationale dont l'origine est la République
 * de Guinée : "guinee" est l'entité mère historique (isOriginEntity), jamais
 * un pays parmi d'autres. La France est une entité locale d'exploitation
 * comme les futures entités pays — elle n'est écrite nulle part comme valeur
 * par défaut mondiale. Architecture : global_brand → legal_entities[] →
 * countries[] → document_context, jamais "France → reste du monde".
 *
 * Un champ juridique non encore fourni reste NULL (jamais une valeur
 * inventée) : le rendu de document affiche alors "[À COMPLÉTER]" (règle #8),
 * et l'émission d'un document juridiquement engageant reste bloquée en
 * brouillon tant que l'entité n'est pas complète (règle #5).
 */
export const docLegalEntities = pgTable("doc_legal_entities", {
  code: varchar("code", { length: 32 }).primaryKey(), // "guinee", "france", futur : "senegal", "cote_ivoire"...
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  isOriginEntity: boolean("is_origin_entity").notNull().default(false),
  legalName: varchar("legal_name", { length: 200 }), // raison sociale exacte telle qu'enregistrée
  registrationNumber: varchar("registration_number", { length: 64 }), // RCCM (GN), SIREN/SIRET (FR), etc.
  taxId: varchar("tax_id", { length: 64 }), // NIF (GN), TVA intracommunautaire (FR), etc.
  address: text("address"), // siège social officiel
  legalRepresentative: varchar("legal_representative", { length: 160 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const docDocuments = pgTable("doc_documents", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  reference: varchar("reference", { length: 64 }).notNull().unique(),
  typeCode: varchar("type_code", { length: 48 }).notNull(),
  language: varchar("language", { length: 8 }).notNull().default("fr"),
  countryCode: varchar("country_code", { length: 2 }),
  // Entité juridique qui réalise réellement l'opération (règle #4). Jamais
  // déduite d'un pays par défaut : fournie explicitement par l'appelant, ou
  // absente — auquel cas le document reste en brouillon (règle #5).
  legalEntityCode: varchar("legal_entity_code", { length: 32 }),
  ownerUserId: integer("owner_user_id"),
  counterpartyUserId: integer("counterparty_user_id"),
  linkedEntityType: varchar("linked_entity_type", { length: 32 }),
  linkedEntityId: integer("linked_entity_id"),
  amountHt: numeric("amount_ht", { precision: 14, scale: 2 }),
  amountTtc: numeric("amount_ttc", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 4 }),
  status: varchar("status", { length: 16 }).notNull().default("brouillon"),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  storageKey: varchar("storage_key", { length: 255 }),
  // Phase 44 — traçabilité complète du document.
  authorUserId: integer("author_user_id"),
  version: integer("version").notNull().default(1),
  qrPayload: text("qr_payload"),
  signatureName: varchar("signature_name", { length: 160 }),
  signatureData: text("signature_data"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Historique des documents (Phase 44) — chaque changement d'état/version. */
export const docDocumentHistory = pgTable("doc_document_history", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  documentId: integer("document_id").notNull(),
  version: integer("version").notNull(),
  action: varchar("action", { length: 32 }).notNull(),
  actorUserId: integer("actor_user_id"),
  snapshot: jsonb("snapshot"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const docHealthLog = pgTable("doc_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Métadonnées ─────────────────────────────────────────────────────────
const V = "0.3.0";
const M: MaturityLevel = "sprint_3_automation";
export const DOCUMENT_OS_META = {
  name: "document-os" as const,
  label: "Document Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/document-os/index.ts",
};

// ── Service ─────────────────────────────────────────────────────────────
/** Génère une référence lisible (ex: FAC-2026-000123). */
export function makeDocRef(typeCode: string, seq: number): string {
  const year = new Date().getFullYear();
  const prefix = typeCode.slice(0, 3).toUpperCase();
  return `${prefix}-${year}-${String(seq).padStart(6, "0")}`;
}

/** URL publique de vérification d'un document (encodée dans le QR code). */
export function verificationUrl(reference: string): string {
  const base = process.env.PUBLIC_URL?.replace(/\/$/, "") ?? "https://mkapms.fr";
  return `${base}/verifier-document/${encodeURIComponent(reference)}`;
}

/** Enregistre une entrée d'historique (best-effort). */
async function recordHistory(documentId: number, version: number, action: string, actorUserId?: number | null, snapshot?: Record<string, unknown>) {
  try {
    await db.insert(docDocumentHistory).values({
      documentId, version, action,
      actorUserId: actorUserId ?? null,
      snapshot: (snapshot ?? {}) as any,
    });
  } catch { /* best-effort */ }
}

export async function listTypes(activeOnly = true) {
  const q = db.select().from(docTypes).orderBy(docTypes.code);
  return activeOnly ? q.where(eq(docTypes.active, true)) : q;
}

export async function getTemplate(typeCode: string, language: string, countryCode?: string) {
  const rows = await db.select().from(docTemplates)
    .where(and(eq(docTemplates.typeCode, typeCode), eq(docTemplates.active, true)));
  // Priorité : (langue+pays) → (langue seul) → (fr+pays) → (fr seul) → 1er dispo
  return (
    rows.find((r) => r.language === language && r.countryCode === (countryCode ?? null)) ??
    rows.find((r) => r.language === language && r.countryCode === null) ??
    rows.find((r) => r.language === "fr" && r.countryCode === (countryCode ?? null)) ??
    rows.find((r) => r.language === "fr" && r.countryCode === null) ??
    rows[0] ?? null
  );
}

export async function upsertTemplate(input: { typeCode: string; language: string; countryCode?: string | null; htmlBody: string; variables?: string[]; active?: boolean }) {
  const values = {
    typeCode: input.typeCode, language: input.language,
    countryCode: input.countryCode ?? null,
    htmlBody: input.htmlBody, variables: (input.variables ?? []) as any,
    active: input.active ?? true, updatedAt: new Date(),
  };
  const [row] = await db.insert(docTemplates).values(values as any)
    .onConflictDoUpdate({
      target: [docTemplates.typeCode, docTemplates.language, docTemplates.countryCode],
      set: { htmlBody: values.htmlBody, variables: values.variables, active: values.active, updatedAt: new Date() },
    }).returning();
  return row;
}

/**
 * Un document portant un montant est juridiquement engageant par nature
 * (règle #4 : "Facture, contrat, avoir, paiement..."). Les types de contrat
 * n'en portent pas mais engagent tout autant : listés explicitement plutôt
 * que déduits, pour ne jamais dépendre d'une convention de nommage fragile.
 */
const DOC_TYPES_ENGAGEANTS_SANS_MONTANT = new Set([
  "contrat", "contrat_vente", "contrat_location", "cgv", "cgu", "mandat_vente", "attestation", "proces_verbal",
]);

function estJuridiquementEngageant(doc: { typeCode: string; amountHt?: string | number | null; amountTtc?: string | number | null }): boolean {
  if (doc.amountHt != null || doc.amountTtc != null) return true;
  return DOC_TYPES_ENGAGEANTS_SANS_MONTANT.has(doc.typeCode);
}

/** Crée un document — retourne la ligne (référence auto-générée). */
export async function createDocument(input: {
  typeCode: string; language?: string; countryCode?: string;
  // Entité juridique réelle qui réalise l'opération (règle #4) — jamais déduite d'un pays par défaut.
  legalEntityCode?: string | null;
  ownerUserId?: number; counterpartyUserId?: number;
  authorUserId?: number;
  linkedEntityType?: string; linkedEntityId?: number;
  amountHt?: number; amountTtc?: number; currency?: string;
  metadata?: Record<string, unknown>;
}) {
  const [seqRow] = await db.select({ n: sql<number>`count(*)::int` })
    .from(docDocuments).where(and(
      eq(docDocuments.typeCode, input.typeCode),
      sql`extract(year from ${docDocuments.createdAt}) = ${new Date().getFullYear()}`,
    ));
  const reference = makeDocRef(input.typeCode, Number(seqRow?.n ?? 0) + 1);
  const pays = input.countryCode ? await getCountry(input.countryCode) : null;
  const prefLangue = input.ownerUserId ? await getUserLanguagePref(input.ownerUserId) : null;
  const language =
    input.language ??
    detectLanguage({
      userPref: prefLangue?.preferredLanguage ?? null,
      countryLanguages: pays ? [pays.defaultLanguage, ...(pays.availableLanguages ?? [])] : null,
    });
  const [row] = await db.insert(docDocuments).values({
    reference, typeCode: input.typeCode,
    language, countryCode: input.countryCode ?? null,
    legalEntityCode: input.legalEntityCode ?? null,
    ownerUserId: input.ownerUserId ?? null,
    counterpartyUserId: input.counterpartyUserId ?? null,
    authorUserId: input.authorUserId ?? input.ownerUserId ?? null,
    linkedEntityType: input.linkedEntityType ?? null,
    linkedEntityId: input.linkedEntityId ?? null,
    amountHt: input.amountHt !== undefined ? String(input.amountHt) : null,
    amountTtc: input.amountTtc !== undefined ? String(input.amountTtc) : null,
    currency: input.currency ?? pays?.defaultCurrency ?? null,
    status: "brouillon",
    version: 1,
    qrPayload: verificationUrl(reference),
    metadata: (input.metadata ?? {}) as any,
  }).returning();
  await recordHistory(row.id, 1, "created", input.authorUserId ?? input.ownerUserId ?? null, { reference, typeCode: input.typeCode });
  return row;
}

/**
 * Types de documents réellement édités depuis les écrans (feuille A4 ou export).
 * Une édition non listée est refusée : le registre ne doit pas se remplir de
 * codes inventés par un écran.
 */
export const DOC_EDITION_TYPES = [
  "facture", "devis", "contrat", "avoir", "recu", "bordereau_enchere",
  "rapport_historique", "carnet_entretien", "reservation", "rapport_comptable",
  "rapport_tva", "releve_bancaire", "rapport_analytique", "rapport_publicitaire",
  "attestation", "export_donnees",
] as const;
export type DocEditionType = (typeof DOC_EDITION_TYPES)[number];

/**
 * Trace une édition réelle de document produite par un écran (feuille A4
 * ouverte ou fichier enregistré). Sans cette trace, le Document OS ne voyait
 * passer aucun document alors que la plateforme en produisait : son état de
 * santé restait muet et le PDG n'avait aucune preuve de ce qui a été remis.
 *
 * Best-effort : une trace en échec ne doit jamais empêcher le client d'obtenir
 * son document.
 */
export async function recordEdition(input: {
  typeCode: DocEditionType;
  canal: "impression" | "fichier";
  ecran: string;
  titre: string;
  referenceEcran?: string;
  ownerUserId?: number;
  amountTtc?: number;
  currency?: string;
  lignes?: number;
  // Entité juridique réelle de l'opération, quand l'écran appelant la connaît déjà (chantier #35).
  legalEntityCode?: string | null;
}): Promise<{ ok: boolean; reference: string | null }> {
  try {
    const row = await createDocument({
      typeCode: input.typeCode,
      ownerUserId: input.ownerUserId,
      amountTtc: input.amountTtc,
      currency: input.currency,
      legalEntityCode: input.legalEntityCode ?? null,
      metadata: {
        canal: input.canal,
        ecran: input.ecran.slice(0, 160),
        titre: input.titre.slice(0, 160),
        referenceEcran: input.referenceEcran?.slice(0, 64) ?? null,
        lignes: input.lignes ?? null,
        origine: "edition_ecran",
      },
    });
    await updateDocumentStatus(row.id, "emis", input.ownerUserId);
    return { ok: true, reference: row.reference };
  } catch {
    return { ok: false, reference: null };
  }
}

/**
 * Règle maître documentaire #5 : jamais de finalisation silencieuse d'un
 * document engageant sans entité juridique réelle — le document reste en
 * brouillon (l'un des deux comportements explicitement autorisés par la
 * règle, avec le blocage). Jamais un remplacement par une entité par défaut.
 */
export async function updateDocumentStatus(id: number, next: "brouillon" | "emis" | "signe" | "annule" | "archive", actorUserId?: number) {
  const [current] = await db.select().from(docDocuments).where(eq(docDocuments.id, id)).limit(1);
  if (!current) return null;

  if ((next === "emis" || next === "signe") && estJuridiquementEngageant(current) && !current.legalEntityCode) {
    await recordHistory(current.id, current.version, "blocked_missing_legal_entity", actorUserId, { attempted: next });
    return current;
  }

  const patch: any = { status: next };
  if (next === "emis") patch.issuedAt = new Date();
  if (next === "signe") patch.signedAt = new Date();
  if (next === "annule") patch.cancelledAt = new Date();
  // Chaque transition incrémente la version (traçabilité Phase 44).
  patch.version = sql`${docDocuments.version} + 1`;
  const [row] = await db.update(docDocuments).set(patch).where(eq(docDocuments.id, id)).returning();
  if (row) await recordHistory(row.id, row.version, `status_${next}`, actorUserId, { status: next });
  return row ?? null;
}

/** Signature d'un document (nom + trace) → passe le statut à « signe ». Bloquée sans entité juridique (règle #5), voir updateDocumentStatus. */
export async function signDocument(id: number, signature: { name: string; data?: string }, actorUserId?: number) {
  const [current] = await db.select().from(docDocuments).where(eq(docDocuments.id, id)).limit(1);
  if (!current) return null;
  if (estJuridiquementEngageant(current) && !current.legalEntityCode) {
    await recordHistory(current.id, current.version, "blocked_missing_legal_entity", actorUserId, { attempted: "signe" });
    return current;
  }

  const [row] = await db.update(docDocuments).set({
    status: "signe",
    signedAt: new Date(),
    signatureName: signature.name.slice(0, 160),
    signatureData: signature.data ?? null,
    version: sql`${docDocuments.version} + 1`,
  }).where(eq(docDocuments.id, id)).returning();
  if (row) await recordHistory(row.id, row.version, "signed", actorUserId, { signatureName: signature.name });
  return row ?? null;
}

/** Vérification publique d'un document par sa référence (QR code). */
export async function verifyDocument(reference: string) {
  const [row] = await db.select({
    reference: docDocuments.reference,
    typeCode: docDocuments.typeCode,
    status: docDocuments.status,
    version: docDocuments.version,
    issuedAt: docDocuments.issuedAt,
    signedAt: docDocuments.signedAt,
    signatureName: docDocuments.signatureName,
  }).from(docDocuments).where(eq(docDocuments.reference, reference)).limit(1);
  if (!row) return { valid: false as const };
  return { valid: true as const, document: row };
}

export async function listHistory(documentId: number) {
  return db.select().from(docDocumentHistory)
    .where(eq(docDocumentHistory.documentId, documentId))
    .orderBy(desc(docDocumentHistory.createdAt));
}

/**
 * Marqueur visible d'une donnée obligatoire manquante (règle maître
 * documentaire #8) — jamais un champ silencieusement vide, jamais une
 * valeur inventée à sa place.
 */
export const CHAMP_A_COMPLETER = "[À COMPLÉTER]";

/**
 * Identité globale MKA.P-MS (règle #1) : marque internationale, origine
 * République de Guinée. Aucune valeur France ici — la France est une entité
 * locale d'exploitation comme les autres, jamais l'identité mondiale.
 */
const GLOBAL_BRAND_DEFAULTS: Record<string, string> = {
  logo_url: process.env.MKA_LOGO_URL ?? "/logo-closed.png",
  brand_name: "MKA.P-MS",
  brand_tagline: "Auto Plus Africa",
  brand_scope: "Plateforme internationale",
  brand_origin: "République de Guinée",
  currency: "EUR",
  doc_language: "fr",
  signature_block: "",
  legal_mentions: "Document généré par MKA.P-MS.",
};

/** Interpole {{variables}} d'un template avec un dict. N'injecte que
 *  l'identité de marque globale (logo, nom, origine) — jamais une identité
 *  légale de pays par défaut : voir renderDocumentPourEntite() pour ça.
 *
 *  Règle maître documentaire #8 : une variable réellement absente du dict
 *  (jamais fournie, même vide) est rendue "[À COMPLÉTER]", visible dans le
 *  document — jamais une case blanche silencieuse. Une chaîne vide fournie
 *  explicitement par l'appelant reste vide (c'est une valeur assumée, pas
 *  un oubli).
 */
export function renderDocument(html: string, vars: Record<string, string | number>): string {
  const merged: Record<string, string | number> = { ...GLOBAL_BRAND_DEFAULTS, ...vars };
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => (k in merged ? String(merged[k]) : CHAMP_A_COMPLETER));
}

// ── Registre des entités juridiques (règle #1/#2/#4/#6) ────────────────
export type LegalEntity = typeof docLegalEntities.$inferSelect;

/**
 * Entités connues à ce jour. "guinee" est l'entité mère d'origine : ses
 * champs légaux restent NULL tant que la direction ne fournit pas le
 * document officiel de création (jamais inventés — voir CHAMP_A_COMPLETER).
 * "france" reprend les valeurs déjà présentes dans le code AVANT cet audit :
 * leur authenticité n'a pas été vérifiée par ce lot, à confirmer par la
 * direction. N'écrase jamais une entité déjà en base (ensureDefaultLegalEntities
 * est un seed initial, pas une resynchronisation — une donnée juridique saisie
 * par la direction ne doit jamais être effacée par un redémarrage).
 */
export const DEFAULT_LEGAL_ENTITIES: {
  code: string; countryCode: string; isOriginEntity: boolean;
  legalName: string | null; registrationNumber: string | null; taxId: string | null;
  address: string | null; legalRepresentative: string | null;
}[] = [
  {
    code: "guinee", countryCode: "GN", isOriginEntity: true,
    legalName: null, registrationNumber: null, taxId: null, address: null, legalRepresentative: null,
  },
  {
    code: "france", countryCode: "FR", isOriginEntity: false,
    // Hérité du code existant avant cet audit — authenticité non vérifiée par ce lot.
    legalName: "MKA.P-MS SAS", registrationNumber: "123 456 789 00012", taxId: "FR 12 345678901",
    address: "12 Avenue des Champs-Élysées, 75008 Paris", legalRepresentative: null,
  },
];

export async function ensureDefaultLegalEntities(): Promise<{ inserted: number }> {
  let inserted = 0;
  for (const e of DEFAULT_LEGAL_ENTITIES) {
    const [existing] = await db.select({ code: docLegalEntities.code }).from(docLegalEntities).where(eq(docLegalEntities.code, e.code)).limit(1);
    if (existing) continue;
    await db.insert(docLegalEntities).values(e);
    inserted += 1;
  }
  return { inserted };
}

export async function listLegalEntities(activeOnly = true): Promise<LegalEntity[]> {
  const q = db.select().from(docLegalEntities).orderBy(docLegalEntities.code);
  return activeOnly ? q.where(eq(docLegalEntities.active, true)) : q;
}

export async function resolveLegalEntity(code?: string | null): Promise<LegalEntity | null> {
  if (!code) return null;
  const [row] = await db.select().from(docLegalEntities)
    .where(and(eq(docLegalEntities.code, code), eq(docLegalEntities.active, true))).limit(1);
  return row ?? null;
}

/**
 * La direction saisit ici les données réelles quand elles arrivent (ex.
 * document officiel de création de MKA.P-MS Guinée) — jamais un champ rempli
 * par ce moteur lui-même. Ne crée jamais silencieusement une entité inconnue
 * du registre : le code doit être l'un des deux existants ou un nouveau code
 * pays explicitement ajouté au registre.
 */
export async function upsertLegalEntity(input: {
  code: string; countryCode: string; isOriginEntity?: boolean;
  legalName?: string | null; registrationNumber?: string | null; taxId?: string | null;
  address?: string | null; legalRepresentative?: string | null; active?: boolean;
}): Promise<LegalEntity> {
  const [row] = await db.insert(docLegalEntities).values({
    code: input.code, countryCode: input.countryCode.toUpperCase(),
    isOriginEntity: input.isOriginEntity ?? false,
    legalName: input.legalName ?? null, registrationNumber: input.registrationNumber ?? null,
    taxId: input.taxId ?? null, address: input.address ?? null,
    legalRepresentative: input.legalRepresentative ?? null, active: input.active ?? true,
  }).onConflictDoUpdate({
    target: docLegalEntities.code,
    set: {
      countryCode: input.countryCode.toUpperCase(),
      isOriginEntity: input.isOriginEntity ?? false,
      legalName: input.legalName ?? null, registrationNumber: input.registrationNumber ?? null,
      taxId: input.taxId ?? null, address: input.address ?? null,
      legalRepresentative: input.legalRepresentative ?? null, active: input.active ?? true,
      updatedAt: new Date(),
    },
  }).returning();
  return row;
}

/**
 * Ligne d'identifiants légaux formatée selon le pays de l'entité — jamais un
 * libellé "SIRET"/"TVA" (France) ni "RCCM"/"NIF" (Guinée) codé en dur dans le
 * HTML du template : c'est ce qui empêchait la France de rester une entité
 * locale comme une autre. Un pays sans convention connue reste générique.
 */
function formatIssuerLegalLine(entity: LegalEntity | null): string {
  if (!entity) return CHAMP_A_COMPLETER;
  const reg = entity.registrationNumber ?? CHAMP_A_COMPLETER;
  const tax = entity.taxId ?? CHAMP_A_COMPLETER;
  if (entity.countryCode === "FR") return `SIRET : ${reg} · TVA : ${tax}`;
  if (entity.countryCode === "GN") return `RCCM : ${reg} · NIF : ${tax}`;
  return `Immatriculation : ${reg} · Identifiant fiscal : ${tax}`;
}

/**
 * Rend un template pour l'entité juridique réelle de l'opération (règle #4).
 * Sans legalEntityCode, ou si l'entité est inconnue/inactive, les champs
 * légaux restent "[À COMPLÉTER]" — jamais un repli silencieux vers la France
 * ou une autre entité par défaut.
 */
export async function renderDocumentPourEntite(
  html: string,
  vars: Record<string, string | number>,
  legalEntityCode?: string | null,
): Promise<string> {
  const entity = await resolveLegalEntity(legalEntityCode);
  const entityVars: Record<string, string> = {
    issuer_name: entity?.legalName ?? CHAMP_A_COMPLETER,
    issuer_address: entity?.address ?? CHAMP_A_COMPLETER,
    issuer_legal_line: formatIssuerLegalLine(entity),
  };
  // L'entité résolue est la source de vérité légale : elle prime sur toute
  // valeur issuer_* que l'appelant aurait fournie par erreur.
  return renderDocument(html, { ...vars, ...entityVars });
}

export async function listDocuments(ownerUserId?: number, limit = 100) {
  const q = db.select().from(docDocuments).orderBy(desc(docDocuments.createdAt)).limit(limit);
  return typeof ownerUserId === "number" ? q.where(eq(docDocuments.ownerUserId, ownerUserId)) : q;
}

// ── Health / Feed / Dashboard ───────────────────────────────────────────
export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let types = 0, templates = 0, docs24h = 0, signed24h = 0;
  try {
    const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(docTypes).where(eq(docTypes.active, true));
    types = Number(a?.n ?? 0);
    const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(docTemplates).where(eq(docTemplates.active, true));
    templates = Number(b?.n ?? 0);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(docDocuments).where(gt(docDocuments.createdAt, since));
    docs24h = Number(c?.n ?? 0);
    const [d] = await db.select({ n: sql<number>`count(*)::int` }).from(docDocuments).where(and(gt(docDocuments.createdAt, since), eq(docDocuments.status, "signe")));
    signed24h = Number(d?.n ?? 0);
  } catch { status = "degraded"; }
  return {
    engine: "document-os" as const, version: V, status,
    checkedAt: new Date().toISOString(),
    metrics: { typesActive: types, templatesActive: templates, docs24h, signed24h, responseMs: Date.now() - s },
  };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: DOCUMENT_OS_META.name, label: DOCUMENT_OS_META.label,
    version: V, maturityLevel: M, health: h.status,
    load: { events5m: 0, events24h: h.metrics.docs24h },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const h = await healthStatus();
  return {
    ...feed,
    businessMetrics: {
      types_active: h.metrics.typesActive,
      templates_active: h.metrics.templatesActive,
      documents_24h: h.metrics.docs24h,
      documents_signed_24h: h.metrics.signed24h,
    },
    recentEvents: [], recentErrors: [],
  };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const documentOsRouter = router({
  meta: publicProcedure.query(() => DOCUMENT_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  types: publicProcedure
    .input(z.object({ activeOnly: z.boolean().default(true) }).optional())
    .query(({ input }) => listTypes(input?.activeOnly ?? true)),

  templates: router({
    get: publicProcedure
      .input(z.object({
        typeCode: z.string().min(1).max(48),
        language: z.string().min(2).max(8),
        countryCode: z.string().length(2).optional(),
      }))
      .query(({ input }) => getTemplate(input.typeCode, input.language, input.countryCode)),
    upsert: adminProcedure
      .input(z.object({
        typeCode: z.string().min(1).max(48),
        language: z.string().min(2).max(8),
        countryCode: z.string().length(2).nullable().optional(),
        htmlBody: z.string().min(1).max(100000),
        variables: z.array(z.string()).default([]),
        active: z.boolean().default(true),
      }))
      .mutation(({ input }) => upsertTemplate(input)),
  }),

  legalEntities: router({
    list: publicProcedure
      .input(z.object({ activeOnly: z.boolean().default(true) }).optional())
      .query(({ input }) => listLegalEntities(input?.activeOnly ?? true)),
    upsert: adminProcedure
      .input(z.object({
        code: z.string().min(1).max(32),
        countryCode: z.string().length(2),
        isOriginEntity: z.boolean().optional(),
        legalName: z.string().max(200).nullable().optional(),
        registrationNumber: z.string().max(64).nullable().optional(),
        taxId: z.string().max(64).nullable().optional(),
        address: z.string().max(2000).nullable().optional(),
        legalRepresentative: z.string().max(160).nullable().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(({ input }) => upsertLegalEntity(input)),
  }),

  documents: router({
    create: protectedProcedure
      .input(z.object({
        typeCode: z.string().min(1).max(48),
        language: z.string().min(2).max(8).default("fr"),
        countryCode: z.string().length(2).optional(),
        legalEntityCode: z.string().min(1).max(32).optional(),
        counterpartyUserId: z.number().int().positive().optional(),
        linkedEntityType: z.string().max(32).optional(),
        linkedEntityId: z.number().int().positive().optional(),
        amountHt: z.number().nonnegative().optional(),
        amountTtc: z.number().nonnegative().optional(),
        currency: z.string().max(4).optional(),
        metadata: z.record(z.unknown()).optional(),
      }))
      .mutation(({ ctx, input }) => createDocument({ ...input, ownerUserId: ctx.user.uid })),
    mine: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(({ ctx, input }) => listDocuments(ctx.user.uid, input?.limit ?? 100)),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["brouillon", "emis", "signe", "annule", "archive"]),
      }))
      .mutation(({ ctx, input }) => updateDocumentStatus(input.id, input.status, ctx.user.uid)),
    sign: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        name: z.string().min(2).max(160),
        data: z.string().max(200000).optional(),
      }))
      .mutation(({ ctx, input }) => signDocument(input.id, { name: input.name, data: input.data }, ctx.user.uid)),
    history: protectedProcedure
      .input(z.object({ documentId: z.number().int().positive() }))
      .query(({ input }) => listHistory(input.documentId)),
  }),

  /**
   * Édition tracée : appelée par les écrans dès qu'un document est réellement
   * produit (feuille A4 ouverte, fichier enregistré). Publique car un visiteur
   * non connecté peut éditer un récapitulatif ; le propriétaire est renseigné
   * quand la session existe.
   */
  editions: router({
    record: publicProcedure
      .input(z.object({
        typeCode: z.enum(DOC_EDITION_TYPES),
        canal: z.enum(["impression", "fichier"]),
        ecran: z.string().min(1).max(160),
        titre: z.string().min(1).max(160),
        referenceEcran: z.string().max(64).optional(),
        amountTtc: z.number().nonnegative().optional(),
        currency: z.string().max(4).optional(),
        lignes: z.number().int().nonnegative().optional(),
        legalEntityCode: z.string().min(1).max(32).optional(),
      }))
      .mutation(({ ctx, input }) =>
        recordEdition({ ...input, ownerUserId: ctx.user?.uid })),
  }),

  // Vérification publique via QR code (Phase 44).
  verify: publicProcedure
    .input(z.object({ reference: z.string().min(3).max(64) }))
    .query(({ input }) => verifyDocument(input.reference)),

  render: adminProcedure
    .input(z.object({
      typeCode: z.string().min(1).max(48),
      language: z.string().min(2).max(8),
      countryCode: z.string().length(2).optional(),
      legalEntityCode: z.string().min(1).max(32).optional(),
      variables: z.record(z.union([z.string(), z.number()])),
    }))
    .query(async ({ input }) => {
      const tpl = await getTemplate(input.typeCode, input.language, input.countryCode);
      if (!tpl) return { ok: false as const, reason: "template_not_found" };
      const html = await renderDocumentPourEntite(tpl.htmlBody, input.variables, input.legalEntityCode);
      return { ok: true as const, html, template: { typeCode: tpl.typeCode, language: tpl.language, countryCode: tpl.countryCode } };
    }),
});
