/**
 * Feature (nouvelle) — Rétention automatique des logs Smart Engine
 *
 * Additif : nouveau service, 100% MKA.P-MS, aucune dépendance externe.
 * Aucun autre fichier n'est modifié.
 *
 * PROBLÈME couvert :
 * Les tables `smart_search_logs`, `smart_activity_log` et
 * `smart_photo_fingerprints` grossissent indéfiniment. Sur une plateforme
 * active, cela finit par ralentir les requêtes et gonfler la base.
 *
 * SOLUTION :
 * Une fonction `runRetention()` supprime les entrées plus anciennes que
 * la période de rétention configurée (par table). L'appel est manuel
 * (mutation `retentionRun` à exposer côté router) — jamais automatique
 * pour respecter la règle "aucune décision seule".
 *
 * Les seuils par défaut sont volontairement conservateurs : 90 jours pour
 * les logs de recherche/activité, 180 jours pour les empreintes photo
 * (nécessaires plus longtemps pour la détection de doublons).
 */
import { db } from "../../db.js";
import {
  smartSearchLogs,
  smartActivityLog,
  smartPhotoFingerprints,
} from "../schema.js";
import { lt } from "drizzle-orm";

export interface RetentionPolicy {
  searchLogsDays: number;
  activityLogDays: number;
  photoFingerprintsDays: number;
}

export const DEFAULT_RETENTION: RetentionPolicy = {
  searchLogsDays: 90,
  activityLogDays: 90,
  photoFingerprintsDays: 180,
};

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export interface RetentionReport {
  searchLogs: number;
  activityLog: number;
  photoFingerprints: number;
  ranAt: string;
}

/**
 * Exécute la purge selon la politique fournie (ou celle par défaut).
 * Retourne le nombre de lignes supprimées par table.
 *
 * ⚠️ Cette fonction supprime des données — c'est le seul cas où le Smart
 * Engine "efface". Il ne le fait JAMAIS seul : ce n'est appelé que sur
 * action explicite du PDG (mutation protégée). Aucune donnée métier
 * (annonces, utilisateurs, avis…) n'est concernée : uniquement les logs
 * internes du module intelligent.
 */
export async function runRetention(policy: Partial<RetentionPolicy> = {}): Promise<RetentionReport> {
  const p = { ...DEFAULT_RETENTION, ...policy };

  const sl = await db
    .delete(smartSearchLogs)
    .where(lt(smartSearchLogs.createdAt, daysAgo(p.searchLogsDays)))
    .returning({ id: smartSearchLogs.id });

  const al = await db
    .delete(smartActivityLog)
    .where(lt(smartActivityLog.createdAt, daysAgo(p.activityLogDays)))
    .returning({ id: smartActivityLog.id });

  const pf = await db
    .delete(smartPhotoFingerprints)
    .where(lt(smartPhotoFingerprints.createdAt, daysAgo(p.photoFingerprintsDays)))
    .returning({ id: smartPhotoFingerprints.id });

  return {
    searchLogs: sl.length,
    activityLog: al.length,
    photoFingerprints: pf.length,
    ranAt: new Date().toISOString(),
  };
}

/**
 * Renvoie les compteurs actuels des tables susceptibles d'être purgées.
 * Read-only, aucun effet de bord.
 */
export async function retentionCounters() {
  const [{ n: sl }] = await db.execute<{ n: number }>(
    // Utilisation d'une SQL brute pour rester léger (pas d'import de count)
    // — équivalent à db.select({ n: sql`count(*)` }).from(smartSearchLogs)
    // mais on ne modifie rien du reste du code.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { sql: 'select count(*)::int as n from smart_search_logs' } as any,
  );
  const [{ n: al }] = await db.execute<{ n: number }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { sql: 'select count(*)::int as n from smart_activity_log' } as any,
  );
  const [{ n: pf }] = await db.execute<{ n: number }>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { sql: 'select count(*)::int as n from smart_photo_fingerprints' } as any,
  );
  return { searchLogs: sl, activityLog: al, photoFingerprints: pf };
}
