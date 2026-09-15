/**
 * Supplier Engine — service (LOT 1 du Plan Maître Fournisseurs).
 *
 * Toute décision qui engage la plateforme (validation KYB, validation
 * Direction, activation) est prise par un humain, jamais automatiquement —
 * même principe que `partner-engine` (candidatures) et `activation-audit`
 * (un moteur n'est jamais actif parce que son code existe).
 *
 * Un fournisseur DOIT déjà exister comme `partners` (type fournisseur_vehicules,
 * fournisseur_pieces ou transporteur) avant qu'un profil fournisseur ne soit
 * créé ici — ce moteur ne réinvente pas la création de partenaire (déjà dans
 * partner-engine).
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { partners } from "../modules/operations.js";
import { getCountry } from "../country-os/index.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";
import {
  supplierAuditLog,
  supplierConnections,
  supplierContacts,
  supplierHealthLog,
  supplierMappings,
  supplierOnboardingSteps,
  supplierProfiles,
} from "./schema.js";
import {
  CANONICAL_PART_FIELDS,
  CANONICAL_VEHICLE_FIELDS,
  CONNECTION_METHODS,
  SUPPLIER_ENGINE_META,
  findConnectionMethod,
  type ConnectionAuthType,
  type ConnectionEnvironment,
  type KybStatus,
  type MappingEntityType,
  type OnboardingStep,
  type OnboardingStepStatus,
  type SupplierStatus,
  type SupplierType,
} from "./contract.js";

export const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_1_minimal";

/** Types de partenaire (server/modules/operations.ts::partnerTypeEnum) compatibles avec un profil fournisseur. */
const SUPPLIER_COMPATIBLE_PARTNER_TYPES = ["fournisseur_vehicules", "fournisseur_pieces", "transporteur"];

function reference(): string {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SUP-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}

async function journaliser(input: {
  supplierProfileId: number;
  action: string;
  actorId?: number | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  detail?: Record<string, unknown>;
}) {
  await db.insert(supplierAuditLog).values({
    supplierProfileId: input.supplierProfileId,
    action: input.action,
    actorId: input.actorId ?? null,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? null,
    detail: input.detail ?? {},
  });
}

async function enregistrerEtape(input: {
  supplierProfileId: number;
  step: OnboardingStep;
  status: OnboardingStepStatus;
  completedBy?: number | null;
  note?: string | null;
}) {
  await db.insert(supplierOnboardingSteps).values({
    supplierProfileId: input.supplierProfileId,
    step: input.step,
    status: input.status,
    completedBy: input.status === "valide" ? input.completedBy ?? null : null,
    completedAt: input.status === "valide" ? new Date() : null,
    note: input.note ?? null,
  });
}

async function obtenirProfil(supplierProfileId: number) {
  const [row] = await db
    .select()
    .from(supplierProfiles)
    .where(eq(supplierProfiles.id, supplierProfileId))
    .limit(1);
  if (!row) throw new Error(`Fournisseur #${supplierProfileId} introuvable.`);
  return row;
}

// ───────────────────────── Registre (point 1) ─────────────────────────

export interface CreerFournisseurInput {
  partnerId: number;
  supplierType: SupplierType;
  companyLegalName: string;
  registrationNumber?: string | null;
  vatNumber?: string | null;
  countryCode: string;
  currency?: string;
  paymentTermsDays?: number;
  commercialTerms?: string | null;
  createdBy?: number | null;
}

/**
 * Crée le profil fournisseur détaillé au-dessus d'un partenaire déjà
 * existant. Refuse tout partenaire dont le type ne correspond pas à un
 * fournisseur ou un transporteur : ce moteur ne sert pas à transformer
 * n'importe quel partenaire en fournisseur sans le vouloir.
 */
export async function creerFournisseur(input: CreerFournisseurInput) {
  const [partenaire] = await db
    .select({ id: partners.id, type: partners.type, active: partners.active })
    .from(partners)
    .where(eq(partners.id, input.partnerId))
    .limit(1);
  if (!partenaire) throw new Error(`Partenaire #${input.partnerId} introuvable.`);
  if (!SUPPLIER_COMPATIBLE_PARTNER_TYPES.includes(partenaire.type)) {
    throw new Error(
      `Le partenaire #${input.partnerId} est de type "${partenaire.type}" : ce n'est ni un fournisseur ni un transporteur.`,
    );
  }
  const pays = await getCountry(input.countryCode);
  if (!pays) throw new Error(`Pays ${input.countryCode} inconnu du Country OS.`);

  const [row] = await db
    .insert(supplierProfiles)
    .values({
      reference: reference(),
      partnerId: input.partnerId,
      supplierType: input.supplierType,
      companyLegalName: input.companyLegalName,
      registrationNumber: input.registrationNumber ?? null,
      vatNumber: input.vatNumber ?? null,
      countryCode: pays.code,
      currency: input.currency ?? pays.defaultCurrency,
      paymentTermsDays: input.paymentTermsDays ?? 30,
      commercialTerms: input.commercialTerms ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  await enregistrerEtape({ supplierProfileId: row.id, step: "creation", status: "valide", completedBy: input.createdBy });
  await journaliser({
    supplierProfileId: row.id,
    action: "supplier.created",
    actorId: input.createdBy,
    toStatus: row.status,
    detail: { partnerId: input.partnerId, supplierType: input.supplierType },
  });
  return row;
}

export async function listerFournisseurs(filtres?: { status?: SupplierStatus; supplierType?: SupplierType }) {
  const conditions = [];
  if (filtres?.status) conditions.push(eq(supplierProfiles.status, filtres.status));
  if (filtres?.supplierType) conditions.push(eq(supplierProfiles.supplierType, filtres.supplierType));
  return db
    .select()
    .from(supplierProfiles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(supplierProfiles.createdAt))
    .limit(500);
}

export async function obtenirFournisseurDetail(supplierProfileId: number) {
  const profil = await obtenirProfil(supplierProfileId);
  const [contacts, etapes, connexions, mappings] = await Promise.all([
    db.select().from(supplierContacts).where(eq(supplierContacts.supplierProfileId, supplierProfileId)),
    db
      .select()
      .from(supplierOnboardingSteps)
      .where(eq(supplierOnboardingSteps.supplierProfileId, supplierProfileId))
      .orderBy(desc(supplierOnboardingSteps.createdAt)),
    db.select().from(supplierConnections).where(eq(supplierConnections.supplierProfileId, supplierProfileId)),
    db
      .select()
      .from(supplierMappings)
      .where(and(eq(supplierMappings.supplierProfileId, supplierProfileId), eq(supplierMappings.active, true))),
  ]);
  // Dernière ligne connue par étape (l'historique complet reste en base, jamais écrasé).
  const etapeParStep = new Map<string, (typeof etapes)[number]>();
  for (const e of etapes) if (!etapeParStep.has(e.step)) etapeParStep.set(e.step, e);
  return {
    profil,
    contacts,
    etapes: [...etapeParStep.values()],
    historiqueEtapes: etapes,
    connexions,
    mappings,
  };
}

export async function ajouterContact(input: {
  supplierProfileId: number;
  kind: "commercial" | "technique" | "comptabilite";
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  await obtenirProfil(input.supplierProfileId);
  const [row] = await db
    .insert(supplierContacts)
    .values({
      supplierProfileId: input.supplierProfileId,
      kind: input.kind,
      name: input.name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
    })
    .returning();
  return row;
}

// ─────────────────────── Onboarding (point 2) ───────────────────────

export async function verifierEntreprise(input: {
  supplierProfileId: number;
  decision: Exclude<KybStatus, "non_verifie">;
  actorId: number;
  note?: string | null;
}) {
  const profil = await obtenirProfil(input.supplierProfileId);
  await db
    .update(supplierProfiles)
    .set({
      kybStatus: input.decision,
      kybVerifiedBy: input.actorId,
      kybVerifiedAt: new Date(),
      kybNote: input.note ?? null,
      status: profil.status === "brouillon" ? "en_verification" : profil.status,
      updatedAt: new Date(),
    })
    .where(eq(supplierProfiles.id, input.supplierProfileId));
  await enregistrerEtape({
    supplierProfileId: input.supplierProfileId,
    step: "verification_entreprise",
    status: input.decision === "verifie" ? "valide" : input.decision === "refuse" ? "refuse" : "en_cours",
    completedBy: input.actorId,
    note: input.note,
  });
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.kyb_verified",
    actorId: input.actorId,
    fromStatus: profil.status,
    detail: { kybStatus: input.decision, note: input.note ?? null },
  });
  return obtenirProfil(input.supplierProfileId);
}

/** Décision Direction — jamais automatique, exige un KYB déjà vérifié. */
export async function validerParDirection(input: { supplierProfileId: number; actorId: number }) {
  const profil = await obtenirProfil(input.supplierProfileId);
  if (profil.kybStatus !== "verifie") {
    throw new Error("Vérification d'entreprise (KYB) non validée : impossible de valider par la Direction.");
  }
  if (profil.status !== "en_verification" && profil.status !== "brouillon") {
    throw new Error(`Statut actuel "${profil.status}" : la validation Direction n'est possible qu'après vérification.`);
  }
  const [row] = await db
    .update(supplierProfiles)
    .set({ status: "valide_direction", validatedByDirection: input.actorId, validatedAt: new Date(), updatedAt: new Date() })
    .where(eq(supplierProfiles.id, input.supplierProfileId))
    .returning();
  await enregistrerEtape({ supplierProfileId: input.supplierProfileId, step: "validation_direction", status: "valide", completedBy: input.actorId });
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.validated_by_direction",
    actorId: input.actorId,
    fromStatus: profil.status,
    toStatus: "valide_direction",
  });
  return row;
}

/**
 * Rattache le contrat déjà signé (Contract OS, `contract_terms.id` — parties
 * "fournisseur"/"transporteur"). Ne crée aucun document : Document OS et
 * Contract OS restent les seules sources de vérité pour le contrat lui-même.
 */
export async function enregistrerContratSigne(input: { supplierProfileId: number; contractTermsId: number; actorId: number }) {
  const profil = await obtenirProfil(input.supplierProfileId);
  if (profil.status !== "valide_direction") {
    throw new Error(`Statut actuel "${profil.status}" : le contrat ne peut être enregistré qu'après validation Direction.`);
  }
  const [row] = await db
    .update(supplierProfiles)
    .set({ status: "contrat_signe", contractTermsId: input.contractTermsId, updatedAt: new Date() })
    .where(eq(supplierProfiles.id, input.supplierProfileId))
    .returning();
  await enregistrerEtape({ supplierProfileId: input.supplierProfileId, step: "signature_contrat", status: "valide", completedBy: input.actorId });
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.contract_signed",
    actorId: input.actorId,
    fromStatus: "valide_direction",
    toStatus: "contrat_signe",
    detail: { contractTermsId: input.contractTermsId },
  });
  return row;
}

export interface DefinirTerritoiresResult {
  allowed: string[];
  excluded: string[];
  rejetes: string[];
}

/** Chaque code pays est vérifié auprès du Country OS — jamais deviné. */
export async function definirTerritoires(input: {
  supplierProfileId: number;
  allowed: string[];
  excluded: string[];
  actorId: number;
}): Promise<DefinirTerritoiresResult> {
  await obtenirProfil(input.supplierProfileId);
  const tousLesCodes = [...new Set([...input.allowed, ...input.excluded])];
  const rejetes: string[] = [];
  for (const code of tousLesCodes) {
    const pays = await getCountry(code);
    if (!pays || !pays.active) rejetes.push(code);
  }
  const allowedValides = input.allowed.filter((c) => !rejetes.includes(c));
  const excludedValides = input.excluded.filter((c) => !rejetes.includes(c));

  await db
    .update(supplierProfiles)
    .set({ territoriesAllowed: allowedValides, territoriesExcluded: excludedValides, updatedAt: new Date() })
    .where(eq(supplierProfiles.id, input.supplierProfileId));
  await enregistrerEtape({
    supplierProfileId: input.supplierProfileId,
    step: "selection_territoires",
    status: "valide",
    completedBy: input.actorId,
    note: rejetes.length ? `Rejetés (pays non ouvert) : ${rejetes.join(", ")}` : null,
  });
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.territories_set",
    actorId: input.actorId,
    detail: { allowed: allowedValides, excluded: excludedValides, rejetes },
  });
  return { allowed: allowedValides, excluded: excludedValides, rejetes };
}

// ─────────────────────── Connector Engine (point 4) ───────────────────────

export interface EnregistrerConnexionInput {
  supplierProfileId: number;
  method: string;
  authType?: ConnectionAuthType;
  environment?: ConnectionEnvironment;
  endpointUrl?: string | null;
  secretRef?: string | null;
  rateLimitPerMinute?: number | null;
  config?: Record<string, unknown>;
  actorId: number;
}

/**
 * Enregistre la méthode de connexion choisie. Sans secret réel configuré
 * pour une méthode qui en exige un, le statut reste honnêtement
 * "not_connected" : ça ne bloque jamais la suite de l'onboarding, seule
 * l'activation finale l'exige (voir `activerFournisseur`).
 */
export async function enregistrerConnexion(input: EnregistrerConnexionInput) {
  await obtenirProfil(input.supplierProfileId);
  const methode = findConnectionMethod(input.method);
  if (!methode) throw new Error(`Méthode de connexion inconnue : "${input.method}".`);

  const secretConfigure = !!input.secretRef && process.env[input.secretRef] !== undefined;
  const status = methode.requiresSecret ? (secretConfigure ? "configured" : "not_connected") : "configured";

  const [row] = await db
    .insert(supplierConnections)
    .values({
      supplierProfileId: input.supplierProfileId,
      method: methode.code,
      authType: input.authType ?? "none",
      environment: input.environment ?? "sandbox",
      status,
      endpointUrl: input.endpointUrl ?? null,
      secretRef: input.secretRef ?? null,
      rateLimitPerMinute: input.rateLimitPerMinute ?? null,
      config: input.config ?? {},
      lastHealthStatus: "not_connected",
    })
    .returning();

  await enregistrerEtape({ supplierProfileId: input.supplierProfileId, step: "selection_connexion", status: "valide", completedBy: input.actorId });
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.connection_configured",
    actorId: input.actorId,
    detail: { connectionId: row.id, method: methode.code, status },
  });
  return row;
}

export interface TestConnexionResult {
  ok: boolean;
  motif: string;
}

/**
 * Teste réellement ce qui peut l'être sans clé externe (fichier prêt à
 * recevoir un import, URL catalogue réellement interrogée). Pour une méthode
 * qui exige un secret non configuré, répond honnêtement NOT_CONNECTED —
 * jamais un succès fabriqué (même principe que la Passerelle d'Embeddings).
 */
export async function testerConnexion(connectionId: number, actorId: number): Promise<TestConnexionResult> {
  const [connexion] = await db.select().from(supplierConnections).where(eq(supplierConnections.id, connectionId)).limit(1);
  if (!connexion) throw new Error(`Connexion #${connectionId} introuvable.`);
  const methode = findConnectionMethod(connexion.method);
  if (!methode) throw new Error(`Méthode de connexion inconnue : "${connexion.method}".`);

  let result: TestConnexionResult;
  if (methode.requiresSecret && connexion.status === "not_connected") {
    result = { ok: false, motif: `NOT_CONNECTED : aucun secret réel configuré pour "${methode.label}".` };
  } else if (methode.code === "url_catalogue") {
    if (!connexion.endpointUrl) {
      result = { ok: false, motif: "URL catalogue non configurée." };
    } else {
      try {
        const res = await fetch(connexion.endpointUrl, { method: "GET", signal: AbortSignal.timeout(10_000) });
        result = res.ok
          ? { ok: true, motif: `URL catalogue accessible (HTTP ${res.status}).` }
          : { ok: false, motif: `URL catalogue a répondu HTTP ${res.status}.` };
      } catch (e) {
        result = { ok: false, motif: `URL catalogue injoignable : ${(e as Error).message}.` };
      }
    }
  } else if (["manuel", "formulaire_pro", "import_manuel_secours"].includes(methode.code)) {
    result = { ok: true, motif: "Saisie manuelle : toujours disponible, sans dépendance externe." };
  } else if (["csv", "xlsx", "xml", "json", "jsonl", "import_programme"].includes(methode.code)) {
    result = { ok: true, motif: "Connecteur fichier prêt à recevoir un import — aucun fichier réel testé pour l'instant." };
  } else {
    result = { ok: false, motif: `NOT_CONNECTED : "${methode.label}" nécessite une configuration réelle non encore fournie.` };
  }

  await db
    .update(supplierConnections)
    .set({
      lastHealthCheckAt: new Date(),
      lastHealthStatus: result.ok ? "ok" : "not_connected",
      lastHealthMessage: result.motif,
      updatedAt: new Date(),
    })
    .where(eq(supplierConnections.id, connectionId));
  await enregistrerEtape({
    supplierProfileId: connexion.supplierProfileId,
    step: "test_connexion",
    status: result.ok ? "valide" : "en_cours",
    completedBy: actorId,
    note: result.motif,
  });
  await journaliser({
    supplierProfileId: connexion.supplierProfileId,
    action: "supplier.connection_tested",
    actorId,
    detail: { connectionId, ok: result.ok, motif: result.motif },
  });
  return result;
}

// ─────────────────── Universal Mapping Engine (point 5) ───────────────────

export interface DefinirMappingInput {
  supplierProfileId: number;
  entityType: MappingEntityType;
  regles: { canonicalField: string; supplierField: string; transform?: Record<string, unknown> }[];
  actorId: number;
}

/** Nouvelle version toujours ajoutée, jamais d'écrasement : l'historique reste consultable. */
export async function definirMapping(input: DefinirMappingInput) {
  await obtenirProfil(input.supplierProfileId);
  const champsValides = input.entityType === "vehicule" ? CANONICAL_VEHICLE_FIELDS : CANONICAL_PART_FIELDS;
  const invalides = input.regles.filter((r) => !(champsValides as readonly string[]).includes(r.canonicalField));
  if (invalides.length > 0) {
    throw new Error(
      `Champ(s) canonique(s) inconnu(s) pour "${input.entityType}" : ${invalides.map((r) => r.canonicalField).join(", ")}.`,
    );
  }

  const [dernier] = await db
    .select({ v: sql<number>`coalesce(max(${supplierMappings.version}), 0)::int` })
    .from(supplierMappings)
    .where(and(eq(supplierMappings.supplierProfileId, input.supplierProfileId), eq(supplierMappings.entityType, input.entityType)));
  const version = (dernier?.v ?? 0) + 1;

  await db
    .update(supplierMappings)
    .set({ active: false })
    .where(and(eq(supplierMappings.supplierProfileId, input.supplierProfileId), eq(supplierMappings.entityType, input.entityType)));

  const lignes = input.regles.map((r) => ({
    supplierProfileId: input.supplierProfileId,
    entityType: input.entityType,
    canonicalField: r.canonicalField,
    supplierField: r.supplierField,
    transform: r.transform ?? {},
    version,
    active: true,
    createdBy: input.actorId,
  }));
  if (lignes.length > 0) await db.insert(supplierMappings).values(lignes);

  await enregistrerEtape({ supplierProfileId: input.supplierProfileId, step: "mapping_donnees", status: "valide", completedBy: input.actorId });
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.mapping_saved",
    actorId: input.actorId,
    detail: { entityType: input.entityType, version, regles: lignes.length },
  });
  return { entityType: input.entityType, version, regles: lignes.length };
}

// ───────────────────── Cycle de vie (activation) ─────────────────────

export async function avancerEtapeOnboarding(input: {
  supplierProfileId: number;
  step: OnboardingStep;
  status: OnboardingStepStatus;
  actorId: number;
  note?: string | null;
}) {
  await obtenirProfil(input.supplierProfileId);
  await enregistrerEtape({
    supplierProfileId: input.supplierProfileId,
    step: input.step,
    status: input.status,
    completedBy: input.actorId,
    note: input.note,
  });
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.onboarding_step_completed",
    actorId: input.actorId,
    detail: { step: input.step, status: input.status, note: input.note ?? null },
  });
}

/**
 * Active le fournisseur. Exige : contrat signé, KYB vérifié, et au moins une
 * méthode de connexion enregistrée (la saisie manuelle compte : elle ne
 * dépend d'aucune clé externe).
 */
export async function activerFournisseur(input: { supplierProfileId: number; actorId: number }) {
  const profil = await obtenirProfil(input.supplierProfileId);
  if (profil.status !== "contrat_signe" && profil.status !== "test_connexion") {
    throw new Error(`Statut actuel "${profil.status}" : l'activation exige un contrat signé.`);
  }
  if (profil.kybStatus !== "verifie") throw new Error("KYB non vérifié : activation refusée.");
  const [{ n: nbConnexions }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(supplierConnections)
    .where(eq(supplierConnections.supplierProfileId, input.supplierProfileId));
  if (Number(nbConnexions) === 0) throw new Error("Aucune méthode de connexion enregistrée : activation refusée.");

  const [row] = await db
    .update(supplierProfiles)
    .set({ status: "actif", activatedAt: new Date(), activatedBy: input.actorId, updatedAt: new Date() })
    .where(eq(supplierProfiles.id, input.supplierProfileId))
    .returning();
  await enregistrerEtape({ supplierProfileId: input.supplierProfileId, step: "activation", status: "valide", completedBy: input.actorId });
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.activated",
    actorId: input.actorId,
    fromStatus: profil.status,
    toStatus: "actif",
  });
  return row;
}

export async function suspendreFournisseur(input: { supplierProfileId: number; actorId: number; reason: string }) {
  const profil = await obtenirProfil(input.supplierProfileId);
  if (profil.status !== "actif") throw new Error(`Statut actuel "${profil.status}" : seul un fournisseur actif peut être suspendu.`);
  const [row] = await db
    .update(supplierProfiles)
    .set({ status: "suspendu", suspendedAt: new Date(), suspendedReason: input.reason, updatedAt: new Date() })
    .where(eq(supplierProfiles.id, input.supplierProfileId))
    .returning();
  await enregistrerEtape({ supplierProfileId: input.supplierProfileId, step: "suspension", status: "valide", completedBy: input.actorId, note: input.reason });
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.suspended",
    actorId: input.actorId,
    fromStatus: "actif",
    toStatus: "suspendu",
    detail: { reason: input.reason },
  });
  return row;
}

/** Un fournisseur suspendu reste réversible — seule la désactivation est terminale. */
export async function reactiverFournisseur(input: { supplierProfileId: number; actorId: number }) {
  const profil = await obtenirProfil(input.supplierProfileId);
  if (profil.status !== "suspendu") throw new Error(`Statut actuel "${profil.status}" : seul un fournisseur suspendu peut être réactivé.`);
  const [row] = await db
    .update(supplierProfiles)
    .set({ status: "actif", suspendedAt: null, suspendedReason: null, updatedAt: new Date() })
    .where(eq(supplierProfiles.id, input.supplierProfileId))
    .returning();
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.reactivated",
    actorId: input.actorId,
    fromStatus: "suspendu",
    toStatus: "actif",
  });
  return row;
}

export async function desactiverFournisseur(input: { supplierProfileId: number; actorId: number }) {
  const profil = await obtenirProfil(input.supplierProfileId);
  if (profil.status === "desactive") throw new Error("Ce fournisseur est déjà désactivé.");
  const [row] = await db
    .update(supplierProfiles)
    .set({ status: "desactive", deactivatedAt: new Date(), updatedAt: new Date() })
    .where(eq(supplierProfiles.id, input.supplierProfileId))
    .returning();
  await enregistrerEtape({ supplierProfileId: input.supplierProfileId, step: "desactivation", status: "valide", completedBy: input.actorId });
  await journaliser({
    supplierProfileId: input.supplierProfileId,
    action: "supplier.deactivated",
    actorId: input.actorId,
    fromStatus: profil.status,
    toStatus: "desactive",
  });
  return row;
}

export async function journalAudit(supplierProfileId: number, limit = 200) {
  return db
    .select()
    .from(supplierAuditLog)
    .where(eq(supplierAuditLog.supplierProfileId, supplierProfileId))
    .orderBy(desc(supplierAuditLog.createdAt))
    .limit(limit);
}

// ── Health + Dashboard + Feed (standards MOS) ───────────────────────────

export async function healthStatus() {
  const startedAt = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let message: string | undefined;
  let total = 0;
  let actifs = 0;
  try {
    const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(supplierProfiles);
    total = Number(t?.n ?? 0);
    const [a] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(supplierProfiles)
      .where(eq(supplierProfiles.status, "actif"));
    actifs = Number(a?.n ?? 0);
  } catch (e) {
    status = "degraded";
    message = (e as Error).message;
  }
  const result = {
    engine: SUPPLIER_ENGINE_META.name,
    version: VERSION,
    status,
    checkedAt: new Date().toISOString(),
    message,
    metrics: { total, actifs, responseMs: Date.now() - startedAt },
  };
  db.insert(supplierHealthLog).values({ status, message: message ?? null, metrics: result.metrics }).catch(() => {});
  return result;
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const h = await healthStatus();
  return {
    engine: SUPPLIER_ENGINE_META.name,
    label: SUPPLIER_ENGINE_META.label,
    version: VERSION,
    maturityLevel: MATURITY,
    health: h.status,
    load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - startedAt },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(),
    status: "staging",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const parStatut = await db
    .select({ status: supplierProfiles.status, n: sql<number>`count(*)::int` })
    .from(supplierProfiles)
    .groupBy(supplierProfiles.status);
  const parConnexion = await db
    .select({ status: supplierConnections.status, n: sql<number>`count(*)::int` })
    .from(supplierConnections)
    .groupBy(supplierConnections.status);
  const businessMetrics: Record<string, number | string | null> = {};
  for (const r of parStatut) businessMetrics[`fournisseurs_${r.status}`] = Number(r.n);
  for (const r of parConnexion) businessMetrics[`connexions_${r.status}`] = Number(r.n);
  return { ...feed, businessMetrics, recentEvents: [], recentErrors: [] };
}

export function connectionMethodsCatalog() {
  return CONNECTION_METHODS;
}
