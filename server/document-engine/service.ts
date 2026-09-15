/**
 * Document Engine — service (LOT 6 du Plan Maître Fournisseurs).
 *
 * Consomme le Document OS existant (server/document-os/) comme registre
 * unique des documents réels : ce moteur ne crée jamais une seconde table de
 * stockage de documents, seulement le registre des exigences et le suivi de
 * possession.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { docTypes, createDocument } from "../document-os/index.js";
import { emitSafe } from "../event-bus/service.js";
import {
  supplierDocuments,
  vehicleDocuments,
  custodyRecords,
  custodyRequirements,
  documentEngineAuditLog,
  documentEngineHealthLog,
} from "./schema.js";
import {
  SUPPLIER_DOCUMENT_TYPES,
  SUPPLIER_DOCUMENT_BASELINE,
  VEHICLE_DOCUMENT_TYPES,
  VEHICLE_EXPORT_BASELINE,
  CUSTODY_KINDS,
  DOCUMENT_ENGINE_META,
  type SupplierDocumentType,
  type VehicleDocumentType,
  type CustodyKind,
  type CustodyEntityType,
  type CustodyStepCheck,
} from "./contract.js";

async function audit(entityType: string | null, entityId: number | null, action: string, actorId: number | null, detail: Record<string, unknown>) {
  await db.insert(documentEngineAuditLog).values({ entityType, entityId, action, actorId, detail });
}

// ── Seed des types de documents (Document OS) ──────────────────────────────
const SEED_LABELS: Record<string, string> = {
  convention_cadre: "Convention cadre fournisseur",
  annexe_commerciale: "Annexe commerciale",
  annexe_technique: "Annexe technique",
  annexe_api: "Annexe API",
  annexe_territoires: "Annexe territoires",
  annexe_donnees: "Annexe données",
  autorisation_diffusion: "Autorisation de diffusion",
  rgpd: "Engagement RGPD",
  confidentialite: "Accord de confidentialité",
  facture_fournisseur: "Facture fournisseur",
  releve_fournisseur: "Relevé fournisseur",
  carte_grise: "Carte grise",
  controle_technique: "Contrôle technique",
  certificat_cession: "Certificat de cession",
  situation_administrative: "Situation administrative",
  coc: "Certificat de conformité (COC)",
  facture_vehicule: "Facture véhicule",
  entretien: "Carnet d'entretien",
  garantie: "Certificat de garantie",
  export: "Document d'export",
  douane: "Document douanier",
  document_pays: "Document réglementaire pays",
};

/** Idempotent : n'écrase jamais un type déjà personnalisé (même patron que payment-orchestrator/seedProviders). */
export async function seedDocumentTypes(): Promise<{ inserted: number }> {
  const codes = [...SUPPLIER_DOCUMENT_TYPES, ...VEHICLE_DOCUMENT_TYPES];
  let inserted = 0;
  for (const code of codes) {
    const existing = await db.select({ code: docTypes.code }).from(docTypes).where(eq(docTypes.code, code)).limit(1);
    if (existing.length > 0) continue;
    await db.insert(docTypes).values({
      code,
      labelFr: SEED_LABELS[code] ?? code,
      category: (SUPPLIER_DOCUMENT_TYPES as readonly string[]).includes(code) ? "fournisseur" : "vehicule",
      requiresSignature: ["convention_cadre", "rgpd", "confidentialite", "certificat_cession"].includes(code),
    });
    inserted += 1;
  }
  return { inserted };
}

// ── Supplier Document Engine (§33) ─────────────────────────────────────────
export interface RegisterSupplierDocumentInput {
  supplierProfileId: number;
  docType: SupplierDocumentType;
  ownerUserId?: number;
  amountTtc?: number;
  currency?: string;
  notes?: string;
  actorId: number;
}

export async function registerSupplierDocument(input: RegisterSupplierDocumentInput) {
  const doc = await createDocument({
    typeCode: input.docType,
    ownerUserId: input.ownerUserId,
    authorUserId: input.actorId,
    linkedEntityType: "supplier_profile",
    linkedEntityId: input.supplierProfileId,
    amountTtc: input.amountTtc,
    currency: input.currency,
  });
  const [row] = await db
    .insert(supplierDocuments)
    .values({
      supplierProfileId: input.supplierProfileId,
      docType: input.docType,
      docDocumentId: doc.id,
      notes: input.notes ?? null,
      createdBy: input.actorId,
    })
    .returning();
  await audit("supplier_profile", input.supplierProfileId, "supplier_document_registered", input.actorId, { docType: input.docType, docDocumentId: doc.id });
  await emitSafe({ source: "document_engine", type: "document.supplier.registered", payload: { supplierProfileId: input.supplierProfileId, docType: input.docType } });
  return row;
}

export async function listSupplierDocuments(supplierProfileId: number) {
  return db.select().from(supplierDocuments).where(eq(supplierDocuments.supplierProfileId, supplierProfileId)).orderBy(desc(supplierDocuments.createdAt));
}

/** Écart entre la liste minimale exigée (§33) et ce qui est réellement enregistré — jamais une simple case cochée par déclaration. */
export async function supplierDocumentGaps(supplierProfileId: number) {
  const rows = await listSupplierDocuments(supplierProfileId);
  const present = new Set(rows.map((r) => r.docType));
  return {
    required: SUPPLIER_DOCUMENT_BASELINE,
    present: [...present],
    missing: SUPPLIER_DOCUMENT_BASELINE.filter((t) => !present.has(t)),
  };
}

// ── Vehicle Document Engine (§34) ──────────────────────────────────────────
export interface RegisterVehicleDocumentInput {
  vehicleItemId: number;
  docType: VehicleDocumentType;
  ownerUserId?: number;
  notes?: string;
  actorId: number;
}

export async function registerVehicleDocument(input: RegisterVehicleDocumentInput) {
  const doc = await createDocument({
    typeCode: input.docType,
    ownerUserId: input.ownerUserId,
    authorUserId: input.actorId,
    linkedEntityType: "vehicle_item",
    linkedEntityId: input.vehicleItemId,
  });
  const [row] = await db
    .insert(vehicleDocuments)
    .values({
      vehicleItemId: input.vehicleItemId,
      docType: input.docType,
      docDocumentId: doc.id,
      notes: input.notes ?? null,
      createdBy: input.actorId,
    })
    .returning();
  await audit("vehicle_item", input.vehicleItemId, "vehicle_document_registered", input.actorId, { docType: input.docType, docDocumentId: doc.id });
  await emitSafe({ source: "document_engine", type: "document.vehicle.registered", payload: { vehicleItemId: input.vehicleItemId, docType: input.docType } });
  return row;
}

export async function listVehicleDocuments(vehicleItemId: number) {
  return db.select().from(vehicleDocuments).where(eq(vehicleDocuments.vehicleItemId, vehicleItemId)).orderBy(desc(vehicleDocuments.createdAt));
}

export async function vehicleDocumentGaps(vehicleItemId: number) {
  const rows = await listVehicleDocuments(vehicleItemId);
  const present = new Set(rows.map((r) => r.docType));
  return {
    required: VEHICLE_EXPORT_BASELINE,
    present: [...present],
    missing: VEHICLE_EXPORT_BASELINE.filter((t) => !present.has(t)),
  };
}

/**
 * Réponse réelle (pas déclarative) à la question posée par
 * `vehicle_territories.documentsReadyForExport` (LOT 2) : ce champ reste un
 * indicateur saisi par la Direction, mais peut désormais s'appuyer sur un
 * calcul vérifiable au lieu d'une estimation.
 */
export async function computeVehicleExportReadiness(vehicleItemId: number) {
  return checkStepBlocking({ entityType: "vehicle_item", entityId: vehicleItemId, step: "export" });
}

// ── Document Custody Engine (§35) ──────────────────────────────────────────
export interface ReceiveCustodyInput {
  entityType: CustodyEntityType;
  entityId: number;
  docType: string;
  kind?: CustodyKind;
  currentHolder: string;
  docDocumentId?: number;
  actorId: number;
}

/** Réception d'un document (original ou copie) — remplace toute possession "attendu" existante pour ce couple entité/type. */
export async function receiveCustody(input: ReceiveCustodyInput) {
  const kind = input.kind ?? "original";
  const [existing] = await db
    .select()
    .from(custodyRecords)
    .where(and(eq(custodyRecords.entityType, input.entityType), eq(custodyRecords.entityId, input.entityId), eq(custodyRecords.docType, input.docType), eq(custodyRecords.kind, kind)))
    .orderBy(desc(custodyRecords.createdAt))
    .limit(1);

  let row;
  if (existing && existing.status === "attendu") {
    [row] = await db
      .update(custodyRecords)
      .set({ status: "en_possession", currentHolder: input.currentHolder, docDocumentId: input.docDocumentId ?? existing.docDocumentId, receivedAt: new Date(), updatedAt: new Date() })
      .where(eq(custodyRecords.id, existing.id))
      .returning();
  } else {
    [row] = await db
      .insert(custodyRecords)
      .values({
        entityType: input.entityType,
        entityId: input.entityId,
        docType: input.docType,
        docDocumentId: input.docDocumentId ?? null,
        kind,
        status: "en_possession",
        currentHolder: input.currentHolder,
        receivedAt: new Date(),
        createdBy: input.actorId,
      })
      .returning();
  }
  await audit(input.entityType, input.entityId, "custody_received", input.actorId, { docType: input.docType, kind, currentHolder: input.currentHolder });
  await emitSafe({ source: "document_engine", type: "document.custody.received", payload: { entityType: input.entityType, entityId: input.entityId, docType: input.docType } });
  return row;
}

export interface HandOverCustodyInput {
  custodyId: number;
  recipient: string;
  proofOfHandover: string;
  actorId: number;
}

/** Remise — exige toujours une preuve, jamais une remise silencieuse (§35). */
export async function handOverCustody(input: HandOverCustodyInput) {
  const [current] = await db.select().from(custodyRecords).where(eq(custodyRecords.id, input.custodyId)).limit(1);
  if (!current) throw new Error(`Possession inconnue : ${input.custodyId}`);
  if (current.status !== "en_possession") throw new Error(`Statut actuel "${current.status}" : seul un document en possession peut être remis.`);
  const [row] = await db
    .update(custodyRecords)
    .set({ status: "remis", handedOverAt: new Date(), recipient: input.recipient, proofOfHandover: input.proofOfHandover, updatedAt: new Date() })
    .where(eq(custodyRecords.id, input.custodyId))
    .returning();
  await audit(current.entityType, current.entityId, "custody_handed_over", input.actorId, { docType: current.docType, recipient: input.recipient });
  await emitSafe({ source: "document_engine", type: "document.custody.handed_over", payload: { entityType: current.entityType as CustodyEntityType, entityId: current.entityId, docType: current.docType, recipient: input.recipient } });
  return row;
}

export async function listCustodyRecords(entityType: CustodyEntityType, entityId: number) {
  return db.select().from(custodyRecords).where(and(eq(custodyRecords.entityType, entityType), eq(custodyRecords.entityId, entityId))).orderBy(desc(custodyRecords.createdAt));
}

export interface DefineRequirementInput {
  entityType: CustodyEntityType;
  step: string;
  docType: string;
  mandatory?: boolean;
  actorId: number;
}

/** "Document requis par étape" (§35) — décision engageante : Direction uniquement (voir router). */
export async function defineCustodyRequirement(input: DefineRequirementInput) {
  const [row] = await db
    .insert(custodyRequirements)
    .values({ entityType: input.entityType, step: input.step, docType: input.docType, mandatory: input.mandatory ?? true, createdBy: input.actorId })
    .returning();
  await audit(input.entityType, null, "custody_requirement_defined", input.actorId, { step: input.step, docType: input.docType, mandatory: row.mandatory });
  return row;
}

export async function listCustodyRequirements(entityType: CustodyEntityType, step?: string) {
  const conditions = [eq(custodyRequirements.entityType, entityType), eq(custodyRequirements.active, true)];
  if (step) conditions.push(eq(custodyRequirements.step, step));
  return db.select().from(custodyRequirements).where(and(...conditions));
}

/**
 * "Blocage si document manquant" (§35) — la seule fonction que les autres
 * moteurs doivent appeler pour savoir s'ils peuvent avancer. Sans exigence
 * déclarée pour cette entité/étape, jamais de blocage inventé.
 */
export async function checkStepBlocking(input: { entityType: CustodyEntityType; entityId: number; step: string }): Promise<CustodyStepCheck> {
  const requirements = await listCustodyRequirements(input.entityType, input.step);
  const mandatory = requirements.filter((r) => r.mandatory);
  if (mandatory.length === 0) return { blocked: false, satisfied: [], missing: [] };

  const records = await listCustodyRecords(input.entityType, input.entityId);
  const heldTypes = new Set(records.filter((r) => r.status === "en_possession" || r.status === "remis").map((r) => r.docType));

  const satisfied = mandatory.filter((r) => heldTypes.has(r.docType)).map((r) => r.docType);
  const missing = mandatory.filter((r) => !heldTypes.has(r.docType)).map((r) => r.docType);
  const blocked = missing.length > 0;

  if (blocked) {
    await emitSafe({ source: "document_engine", type: "document.requirement.blocked", payload: { entityType: input.entityType, entityId: input.entityId, step: input.step, missing } });
  }
  return { blocked, satisfied, missing };
}

export async function auditLog(entityType?: string, entityId?: number, limit = 200) {
  const conditions = [
    entityType ? eq(documentEngineAuditLog.entityType, entityType) : undefined,
    entityId !== undefined ? eq(documentEngineAuditLog.entityId, entityId) : undefined,
  ].filter(Boolean) as any[];
  const query = db.select().from(documentEngineAuditLog).orderBy(desc(documentEngineAuditLog.createdAt)).limit(limit);
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

// ── MOS trio ────────────────────────────────────────────────────────────
export async function healthStatus() {
  const start = Date.now();
  const [supplierTotal] = await db.select({ n: sql<number>`count(*)::int` }).from(supplierDocuments);
  const [vehicleTotal] = await db.select({ n: sql<number>`count(*)::int` }).from(vehicleDocuments);
  const [custodyTotal] = await db
    .select({
      n: sql<number>`count(*)::int`,
      enPossession: sql<number>`count(*) filter (where ${custodyRecords.status} = 'en_possession')::int`,
    })
    .from(custodyRecords);
  const report = {
    engine: DOCUMENT_ENGINE_META.name,
    version: DOCUMENT_ENGINE_META.version,
    status: "ok" as const,
    checkedAt: new Date().toISOString(),
    message: null,
    metrics: {
      supplierDocuments: supplierTotal?.n ?? 0,
      vehicleDocuments: vehicleTotal?.n ?? 0,
      custodyRecords: custodyTotal?.n ?? 0,
      custodyEnPossession: custodyTotal?.enPossession ?? 0,
      responseMs: Date.now() - start,
    },
  };
  await db.insert(documentEngineHealthLog).values({ status: report.status, message: report.message, metrics: report.metrics });
  return report;
}

export async function controlCenterFeed() {
  const rows = await db.select().from(documentEngineAuditLog).orderBy(desc(documentEngineAuditLog.createdAt)).limit(20);
  return rows;
}

export async function dashboard() {
  const blocked = await db.select({ n: sql<number>`count(*)::int` }).from(custodyRecords).where(eq(custodyRecords.status, "attendu"));
  return { attendus: blocked[0]?.n ?? 0 };
}
