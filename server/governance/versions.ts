/**
 * MKA.P-MS Gouvernance — Registre de versions (règle permanente n°1 adoptée à
 * la clôture du LOT IA02B).
 *
 * Les applications réelles sont celles déjà déclarées dans mobile/variants.json
 * (source unique de vérité pour les identités d'application, utilisée aussi
 * par mobile/build-apps.mjs) — ce fichier ne les reliste pas, il les lit.
 *
 * État réel aujourd'hui : une seule version de dépôt (package.json) sert les
 * cinq applications, car elles partagent le même cœur Capacitor. Ce registre
 * n'invente donc pas cinq numéros de version indépendants tant que les
 * applications ne divergent pas réellement — il consigne une ligne par
 * release, avec les modules/moteurs/API réellement touchés, pour qu'une
 * future divergence de version par application se lise dans l'historique
 * plutôt que d'être supposée.
 */
import { readFileSync } from "node:fs";
import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { gvVersions } from "./schema.js";

export interface ApplicationDeclaree {
  appId: string;
  appName: string;
  distribution: string;
  description: string;
}

/** Les applications réelles du dépôt, lues depuis leur source unique de vérité. */
export function applications(): ApplicationDeclaree[] {
  const brut = JSON.parse(readFileSync(new URL("../../mobile/variants.json", import.meta.url), "utf8")) as Record<
    string,
    { appId: string; appName: string; distribution: string; description: string }
  >;
  return Object.entries(brut).map(([variante, v]) => ({
    appId: v.appId,
    appName: v.appName,
    distribution: v.distribution,
    description: `${variante} — ${v.description}`,
  }));
}

/** Version actuelle du dépôt (package.json) — le socle commun aux cinq applications aujourd'hui. */
export function versionDepot(): string {
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version: string };
  return pkg.version;
}

export const COMPATIBILITE = ["compatible", "compatible_avec_reserve", "incompatible", "non_evaluee"] as const;
export type CompatibiliteStatus = (typeof COMPATIBILITE)[number];

export interface EnregistrerReleaseInput {
  appId: string;
  currentVersion?: string;
  buildNumber?: number;
  releaseReason: string;
  affectedModules?: string[];
  engineChanges?: string[];
  apiChanges?: string[];
  intelligenceChanges?: string[];
  databaseMigrations?: string[];
  compatibilityStatus?: CompatibiliteStatus;
  releaseNotes?: string;
  actorId?: number | null;
}

/**
 * Consigne une release réelle. N'augmente jamais aveuglément toutes les
 * applications : seul l'appelant décide, au cas par cas, quelle(s)
 * application(s) une modification touche réellement (règle explicite du
 * PDG — une modification Intelligence seule ne fait pas bouger « pro »).
 */
export async function enregistrerRelease(input: EnregistrerReleaseInput): Promise<{ id: number }> {
  const [ligne] = await db
    .insert(gvVersions)
    .values({
      appId: input.appId,
      currentVersion: input.currentVersion ?? versionDepot(),
      buildNumber: input.buildNumber ?? 0,
      releaseReason: input.releaseReason,
      affectedModules: input.affectedModules ?? [],
      engineChanges: input.engineChanges ?? [],
      apiChanges: input.apiChanges ?? [],
      intelligenceChanges: input.intelligenceChanges ?? [],
      databaseMigrations: input.databaseMigrations ?? [],
      compatibilityStatus: input.compatibilityStatus ?? "compatible",
      releaseNotes: input.releaseNotes ?? "",
      actorId: input.actorId ?? null,
    })
    .returning({ id: gvVersions.id });
  return { id: ligne?.id ?? 0 };
}

/** Dernière release réellement enregistrée pour une application, ou null si aucune. */
export async function derniereRelease(appId: string) {
  const [ligne] = await db
    .select()
    .from(gvVersions)
    .where(eq(gvVersions.appId, appId))
    .orderBy(desc(gvVersions.createdAt))
    .limit(1);
  return ligne ?? null;
}

/** Vue d'ensemble : chaque application déclarée, avec sa dernière release réelle (ou « jamais enregistrée »). */
export async function registre(): Promise<
  (ApplicationDeclaree & { derniereRelease: Awaited<ReturnType<typeof derniereRelease>> })[]
> {
  const apps = applications();
  const sorties = [];
  for (const app of apps) {
    sorties.push({ ...app, derniereRelease: await derniereRelease(app.appId) });
  }
  return sorties;
}

export async function historique(appId: string, limit = 40) {
  return db.select().from(gvVersions).where(eq(gvVersions.appId, appId)).orderBy(desc(gvVersions.createdAt)).limit(limit);
}
