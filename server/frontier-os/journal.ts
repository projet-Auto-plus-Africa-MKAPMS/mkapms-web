/**
 * Centre Cyber-Électrique — journal, incidents, configuration (avec historique) et mémoire. Tout s'écrit dans la base PROPRE du centre.
 * Le journal est en ajout seul (verrou en base). Les détails ne portent jamais de secret : on y met des références, jamais des valeurs.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { dbFrontier, type BaseFrontier } from "./base/connexion.js";
import { auditLog, config, configHistory, incidents, memoryBlocks, type ProprietaireKind } from "./base/schema.js";

export interface Acteur {
  type: "pdg" | "system" | "engine" | "test";
  id?: string | number;
}
export const SYSTEME: Acteur = { type: "system" };
export const libelleActeur = (a: Acteur): string => (a.id === undefined ? a.type : `${a.type}:${a.id}`);

/** Troncature sans couper une paire de substitution (émoji) en deux. */
export function tronquer(texte: string, max: number): string {
  if (texte.length <= max) return texte;
  let fin = max;
  const c = texte.charCodeAt(fin - 1);
  if (c >= 0xd800 && c <= 0xdbff) fin -= 1;
  return texte.slice(0, fin);
}

export interface Proprietaire {
  kind: ProprietaireKind;
  code: string;
}
export const DU_CENTRE: Proprietaire = { kind: "center", code: "center" };

export interface EntreeAudit {
  acteur: Acteur;
  action: string;
  cible?: string;
  cibleId?: string | number;
  resultat: "ok" | "refused" | "error";
  erreur?: string;
  detail?: Record<string, unknown>;
  proprietaire?: Proprietaire;
}

/** Ne fait jamais échouer l'action qu'il trace : une erreur de journal est écrite sur la sortie d'erreur. */
export async function journaliser(e: EntreeAudit, base: BaseFrontier = dbFrontier()): Promise<void> {
  try {
    const p = e.proprietaire ?? DU_CENTRE;
    await base.insert(auditLog).values({
      actorType: e.acteur.type,
      actorId: e.acteur.id === undefined ? null : String(e.acteur.id),
      action: tronquer(e.action, 80),
      targetKind: tronquer(e.cible ?? "", 40),
      targetId: tronquer(String(e.cibleId ?? ""), 80),
      result: e.resultat,
      error: e.erreur ? tronquer(e.erreur, 400) : null,
      detail: e.detail ?? {},
      ownerKind: p.kind,
      ownerCode: p.code,
    });
  } catch (err) {
    console.error("[frontier] journal indisponible :", (err as Error).message);
  }
}

export interface EntreeIncident {
  severite: "info" | "warning" | "critical";
  kind: string;
  resume: string;
  ligneId?: number | null;
  coupureId?: number | null;
  moteur?: string | null;
  commandeId?: number | null;
  detail?: Record<string, unknown>;
  proprietaire?: Proprietaire;
}

/** Ouvre un incident, ou compte une récurrence si le même est déjà ouvert (pas d'inondation). Retourne son identifiant. */
export async function ouvrirIncident(e: EntreeIncident, base: BaseFrontier = dbFrontier()): Promise<number> {
  const p = e.proprietaire ?? DU_CENTRE;
  const conds = [eq(incidents.kind, e.kind), inArray(incidents.status, ["open", "diagnosed", "repairing"])];
  conds.push(e.ligneId == null ? sql`${incidents.lineId} is null` : eq(incidents.lineId, e.ligneId));
  conds.push(e.coupureId == null ? sql`${incidents.cutId} is null` : eq(incidents.cutId, e.coupureId));
  conds.push(e.moteur == null ? sql`${incidents.engineCode} is null` : eq(incidents.engineCode, e.moteur));
  const [existant] = await base.select({ id: incidents.id, detail: incidents.detail }).from(incidents).where(and(...conds)).limit(1);
  if (existant) {
    const n = Number((existant.detail as { occurrences?: number }).occurrences ?? 1) + 1;
    await base.update(incidents).set({ detail: { ...(existant.detail as object), ...(e.detail ?? {}), occurrences: n, derniere: new Date().toISOString() } }).where(eq(incidents.id, existant.id));
    return existant.id;
  }
  const [cree] = await base
    .insert(incidents)
    .values({
      severity: e.severite,
      kind: tronquer(e.kind, 60),
      summary: tronquer(e.resume, 400),
      lineId: e.ligneId ?? null,
      cutId: e.coupureId ?? null,
      engineCode: e.moteur ?? null,
      commandId: e.commandeId ?? null,
      detail: { occurrences: 1, ...(e.detail ?? {}) },
      ownerKind: p.kind,
      ownerCode: p.code,
    })
    .returning({ id: incidents.id });
  return cree!.id;
}

export async function lireConfig<T>(cle: string, defaut: T, base: BaseFrontier = dbFrontier()): Promise<T> {
  const [l] = await base.select({ value: config.value }).from(config).where(eq(config.key, cle)).limit(1);
  return l ? (l.value as T) : defaut;
}

/** Écrit une valeur de configuration et en garde l'historique (ancienne valeur, nouvelle, qui). */
export async function ecrireConfig(cle: string, valeur: unknown, acteur: Acteur, base: BaseFrontier = dbFrontier()): Promise<void> {
  const [avant] = await base.select({ value: config.value }).from(config).where(eq(config.key, cle)).limit(1);
  await base
    .insert(config)
    .values({ key: cle, value: valeur, updatedBy: libelleActeur(acteur) })
    .onConflictDoUpdate({ target: config.key, set: { value: valeur, updatedAt: new Date(), updatedBy: libelleActeur(acteur) } });
  await base.insert(configHistory).values({ entity: "config", entityId: cle, field: "value", oldValue: avant ? avant.value : null, newValue: valeur, actor: libelleActeur(acteur) });
}

export async function historiqueConfig(entite: string, entiteId: string, limite = 50, base: BaseFrontier = dbFrontier()) {
  return base.select().from(configHistory).where(and(eq(configHistory.entity, entite), eq(configHistory.entityId, entiteId))).orderBy(desc(configHistory.id)).limit(limite);
}

export async function ecrireMemoire(m: { cle: string; kind: string; contenu: Record<string, unknown>; importance?: number; securite?: number; proprietaire?: Proprietaire }, base: BaseFrontier = dbFrontier()): Promise<void> {
  const p = m.proprietaire ?? DU_CENTRE;
  await base.insert(memoryBlocks).values({ key: tronquer(m.cle, 120), kind: tronquer(m.kind, 60), content: m.contenu, importance: m.importance ?? 1, security: m.securite ?? 1, ownerKind: p.kind, ownerCode: p.code });
}
