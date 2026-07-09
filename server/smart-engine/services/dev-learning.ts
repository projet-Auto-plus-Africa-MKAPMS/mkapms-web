/**
 * Partie 11 — Apprentissage des développements
 *
 * Lorsqu'un développeur ajoute un moteur, une table, une API, une page ou un
 * bouton, le Système Intelligent doit automatiquement :
 *   - analyser la nouveauté ;
 *   - comprendre sa fonction ;
 *   - l'ajouter dans sa surveillance ;
 *   - vérifier qu'une permission est bien définie (Permission Engine).
 *
 * Détection RÉELLE (pas de code factice) :
 *   - APIs      → introspection du routeur TRPC vivant (appRouter).
 *   - Tables    → introspection de information_schema (base réelle).
 *   - Modules   → rapprochement avec la matrice de permissions (shared).
 *
 * RÈGLE ABSOLUE : additif, isolé, jamais bloquant. Le scan ne modifie aucune
 * donnée de la plateforme ; il enregistre seulement ce qu'il détecte dans
 * smart_dev_registry et signale les permissions manquantes au PDG. Rien n'est
 * appliqué automatiquement : le PDG décide.
 */
import { db } from "../../db.js";
import { smartDevRegistry } from "../schema.js";
import { MODULE_ACCESS } from "../../../shared/permissions.js";
import type { PermissionModule } from "../../../shared/permissions.js";
import { eq, sql } from "drizzle-orm";

type DevKind = "moteur" | "table" | "api" | "page" | "bouton" | "formulaire";
type DevPermission = "definie" | "requise" | "publique" | "na";

interface DiscoveredItem {
  kind: DevKind;
  name: string;
  functionGuess: string;
  subtype?: string;
  permissionModule?: PermissionModule | null;
  permission: DevPermission;
  metadata?: Record<string, unknown>;
}

// Modules du routeur TRPC volontairement PUBLICS (aucune permission requise).
const PUBLIC_ROUTERS = new Set<string>([
  "auth",
  "meta",
  "currency",
  "modules",
  "platformMap",
  "seo",
]);

// Rapprochement routeur TRPC → module de permission (shared/permissions.ts).
// Ce qui n'est pas listé est considéré comme "à rattacher" (permission requise).
const ROUTER_PERMISSION_MODULE: Record<string, PermissionModule> = {
  annonces: "annonces",
  favoris: "favoris",
  searches: "recherches",
  reservations: "reservations",
  devis: "devis",
  abonnements: "abonnements",
  disputes: "litiges",
  loyalty: "rewards",
  documents: "coffre",
  dossiers: "dossiers",
  notifications: "notifications",
  messages: "messages",
  support: "support",
  reviews: "annonces",
  reviewsV2: "annonces",
  pro: "espace_pro",
  garages: "atelier",
  pieces: "catalogue_technique",
  vo: "vo_interne",
  comptabilite: "comptabilite",
  cabinets: "comptabilite",
  admin: "back_office",
  rbac: "back_office",
  coreEngine: "centre_pdg",
  smartEngine: "super_admin",
  permissionEngine: "super_admin",
  redirectionEngine: "super_admin",
  governance: "centre_pdg",
  platform: "centre_pdg",
  marketing: "publicites",
};

// Ensemble des modules réellement présents dans la matrice de permissions.
function definedPermissionModules(): Set<string> {
  const set = new Set<string>();
  for (const modules of Object.values(MODULE_ACCESS)) {
    for (const m of modules) set.add(m);
  }
  return set;
}

// Fonction déduite (heuristique lisible par un humain) d'après le nom d'API.
function guessApiFunction(proc: string, type: string): string {
  const leaf = proc.split(".").pop() || proc;
  const verbs: Record<string, string> = {
    list: "Lister",
    get: "Consulter",
    getAll: "Lister",
    create: "Créer",
    add: "Ajouter",
    update: "Modifier",
    edit: "Modifier",
    delete: "Supprimer",
    remove: "Supprimer",
    send: "Envoyer",
    open: "Ouvrir",
    search: "Rechercher",
    buyNow: "Acheter",
    reserve: "Réserver",
    pay: "Payer",
    validate: "Valider",
    approve: "Approuver",
    reject: "Refuser",
    stats: "Statistiques",
    count: "Compter",
  };
  for (const key of Object.keys(verbs)) {
    if (leaf.toLowerCase().startsWith(key.toLowerCase())) {
      return `${verbs[key]} — API ${type} « ${proc} »`;
    }
  }
  return `API ${type} « ${proc} »`;
}

function guessTableFunction(table: string): string {
  if (table.startsWith("smart_")) return "Table du Système Intelligent (surveillance/apprentissage)";
  if (table.startsWith("perm_")) return "Table du Permission Engine (sécurité/accès)";
  if (table.startsWith("redir_")) return "Table du Moteur de Redirection";
  return `Stockage des données « ${table} »`;
}

/**
 * Introspecte le routeur TRPC vivant pour lister toutes les procédures
 * (queries/mutations) réellement exposées. Import dynamique pour éviter toute
 * dépendance circulaire au chargement du module.
 */
async function discoverApis(): Promise<DiscoveredItem[]> {
  const items: DiscoveredItem[] = [];
  try {
    const mod = await import("../../router.js");
    const appRouter = mod.appRouter as unknown as {
      _def?: { procedures?: Record<string, unknown> };
    };
    const procedures = appRouter?._def?.procedures ?? {};
    const defined = definedPermissionModules();

    for (const [path, procUnknown] of Object.entries(procedures)) {
      const proc = procUnknown as { _def?: { type?: string; query?: boolean; mutation?: boolean } };
      const def = proc?._def ?? {};
      const type =
        def.type ?? (def.query ? "query" : def.mutation ? "mutation" : "query");
      const namespace = path.split(".")[0];

      let permission: DevPermission;
      let permissionModule: PermissionModule | null = null;
      if (PUBLIC_ROUTERS.has(namespace)) {
        permission = "publique";
      } else {
        const mapped = ROUTER_PERMISSION_MODULE[namespace];
        if (mapped && defined.has(mapped)) {
          permission = "definie";
          permissionModule = mapped;
        } else {
          permission = "requise";
          permissionModule = mapped ?? null;
        }
      }

      items.push({
        kind: "api",
        name: path,
        functionGuess: guessApiFunction(path, type),
        subtype: type,
        permissionModule,
        permission,
        metadata: { namespace },
      });
    }
  } catch (err) {
    console.error("[dev-learning] introspection API échouée:", err);
  }
  return items;
}

/**
 * Introspecte information_schema pour lister toutes les tables réelles de la
 * base (schéma public). Lecture seule.
 */
async function discoverTables(): Promise<DiscoveredItem[]> {
  const items: DiscoveredItem[] = [];
  try {
    const res = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`,
    );
    const rows = (res as unknown as { rows?: Array<{ table_name: string }> }).rows ??
      (res as unknown as Array<{ table_name: string }>);
    for (const row of rows) {
      const table = row.table_name;
      if (!table || table === "__drizzle_migrations") continue;
      items.push({
        kind: "table",
        name: table,
        functionGuess: guessTableFunction(table),
        permission: "na",
        metadata: {},
      });
    }
  } catch (err) {
    console.error("[dev-learning] introspection tables échouée:", err);
  }
  return items;
}

/**
 * Enregistre (upsert) un élément détecté dans le registre. Idempotent :
 * signature unique = kind|name. Un nouvel élément est "nouveau" ; un élément
 * déjà connu voit son compteur et sa date de dernière détection mis à jour,
 * sans écraser la décision du PDG (status).
 */
async function upsertItem(item: DiscoveredItem): Promise<"created" | "updated"> {
  const signature = `${item.kind}|${item.name}`;
  const [existing] = await db
    .select({ id: smartDevRegistry.id })
    .from(smartDevRegistry)
    .where(eq(smartDevRegistry.signature, signature))
    .limit(1);

  if (existing) {
    await db
      .update(smartDevRegistry)
      .set({
        functionGuess: item.functionGuess,
        subtype: item.subtype,
        permissionModule: item.permissionModule ?? null,
        permission: item.permission,
        lastSeenAt: new Date(),
        detections: sql`${smartDevRegistry.detections} + 1`,
        metadata: item.metadata ?? {},
      })
      .where(eq(smartDevRegistry.id, existing.id));
    return "updated";
  }

  await db.insert(smartDevRegistry).values({
    kind: item.kind,
    name: item.name,
    functionGuess: item.functionGuess,
    subtype: item.subtype,
    permissionModule: item.permissionModule ?? null,
    permission: item.permission,
    status: "nouveau",
    signature,
    metadata: item.metadata ?? {},
  });
  return "created";
}

export interface DevScanResult {
  scanned: number;
  created: number;
  updated: number;
  apis: number;
  tables: number;
  permissionsRequises: number;
}

/**
 * Scan complet : détecte APIs + tables réelles et les enregistre. Best-effort,
 * jamais bloquant — toute erreur est journalisée et ignorée.
 */
export async function scanDevelopments(): Promise<DevScanResult> {
  const [apis, tables] = await Promise.all([discoverApis(), discoverTables()]);
  const all = [...apis, ...tables];

  let created = 0;
  let updated = 0;
  for (const item of all) {
    try {
      const r = await upsertItem(item);
      if (r === "created") created++;
      else updated++;
    } catch (err) {
      console.error("[dev-learning] upsert échoué:", item.name, err);
    }
  }

  return {
    scanned: all.length,
    created,
    updated,
    apis: apis.length,
    tables: tables.length,
    permissionsRequises: all.filter((i) => i.permission === "requise").length,
  };
}

export interface DevLearningStats {
  total: number;
  parKind: Record<string, number>;
  permissionsRequises: number;
  permissionsDefinies: number;
  nouveaux: number;
  surveilles: number;
}

/**
 * Statistiques agrégées pour le centre de contrôle PDG.
 */
export async function getDevLearningStats(): Promise<DevLearningStats> {
  const rows = await db
    .select({
      kind: smartDevRegistry.kind,
      permission: smartDevRegistry.permission,
      status: smartDevRegistry.status,
    })
    .from(smartDevRegistry);

  const parKind: Record<string, number> = {};
  let permissionsRequises = 0;
  let permissionsDefinies = 0;
  let nouveaux = 0;
  let surveilles = 0;
  for (const r of rows) {
    parKind[r.kind] = (parKind[r.kind] ?? 0) + 1;
    if (r.permission === "requise") permissionsRequises++;
    if (r.permission === "definie") permissionsDefinies++;
    if (r.status === "nouveau") nouveaux++;
    if (r.status === "surveille") surveilles++;
  }

  return {
    total: rows.length,
    parKind,
    permissionsRequises,
    permissionsDefinies,
    nouveaux,
    surveilles,
  };
}

export interface DevListFilter {
  kind?: DevKind;
  permission?: DevPermission;
  status?: "nouveau" | "surveille" | "ignore";
  search?: string;
}

/**
 * Liste les éléments détectés (avec filtres), pour l'onglet « Développements ».
 */
export async function listDevItems(filter: DevListFilter = {}) {
  const rows = await db
    .select()
    .from(smartDevRegistry)
    .orderBy(smartDevRegistry.kind, smartDevRegistry.name);

  return rows.filter((r) => {
    if (filter.kind && r.kind !== filter.kind) return false;
    if (filter.permission && r.permission !== filter.permission) return false;
    if (filter.status && r.status !== filter.status) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (
        !r.name.toLowerCase().includes(q) &&
        !(r.functionGuess ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

/**
 * Décision PDG sur un élément : le mettre sous surveillance, l'ignorer, ou
 * marquer sa permission comme définie/publique une fois traitée côté Permission
 * Engine. Additif : ne touche à rien d'autre.
 */
export async function reviewDevItem(input: {
  id: number;
  status?: "nouveau" | "surveille" | "ignore";
  permission?: DevPermission;
  acknowledgedBy?: number;
}): Promise<{ ok: true }> {
  const patch: Record<string, unknown> = { lastSeenAt: new Date() };
  if (input.status) patch.status = input.status;
  if (input.permission) patch.permission = input.permission;
  if (input.acknowledgedBy != null) patch.acknowledgedBy = input.acknowledgedBy;

  await db.update(smartDevRegistry).set(patch).where(eq(smartDevRegistry.id, input.id));
  return { ok: true };
}
