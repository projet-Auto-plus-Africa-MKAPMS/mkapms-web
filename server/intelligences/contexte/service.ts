/**
 * MKA.P-MS Intelligences — Context Engine central.
 *
 * Assemble en un seul appel ce qu'Intelligence doit savoir avant de répondre,
 * pour ne jamais faire réexpliquer son contexte à l'utilisateur : qui il est,
 * dans quel univers il se trouve, avec quel pays/langue/devise, quel projet
 * Chantier actif, quels moteurs et outils lui sont réellement ouverts.
 *
 * Chaque champ vient d'une lecture réelle (utilisateur, pays, session,
 * Universe Registry) — un champ non qualifiable dans ce lot est rendu tel
 * quel avec son motif exact, jamais deviné ou fabriqué.
 *
 * Trois notions d'« univers » coexistent aujourd'hui dans le dépôt, non
 * encore unifiées (hors périmètre de ce lot, qui ne doit pas reconstruire de
 * moteur métier) : (1) le Universe Registry construit ici
 * (server/intelligences/univers/) — cartographie complète des 89 moteurs ;
 * (2) `universEnum` (server/schema.ts) — 6 catégories de facturation
 * (vente_pro, garage, location, vtc_taxi, pieces, livraison) ; (3)
 * `country_countries.universes_enabled` — un seul code par défaut (« auto »),
 * un mécanisme plus ancien qui n'a pas suivi les deux autres. Ce fichier lit
 * les trois honnêtement, sans prétendre les avoir réconciliés.
 */
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { users } from "../../schema.js";
import { getCountry } from "../../country-os/index.js";
import { canAccessModule, type PermissionModule } from "../../../shared/permissions.js";
import { inSessions } from "../schema.js";
import { ouvrirProjet as ouvrirProjetChantier } from "../chantier/service.js";
import type { Projet } from "../chantier/projets.js";
import { trouver as trouverOutil } from "../outils/registre.js";
import { universDeRoute, type UniversConstate } from "../univers/registre.js";

export interface ContexteResolu {
  utilisateur: {
    id: number | null;
    role: string | null;
    email: string | null;
    countryCode: string | null;
    currency: string | null;
  };
  pays: {
    code: string | null;
    nom: string | null;
    langueParDefaut: string | null;
    deviseParDefaut: string | null;
    tauxTva: string | null;
    universAutorisesPays: string[];
    ouvert: boolean;
    motif: string;
  };
  application: string | null;
  route: string | null;
  univers: {
    resolu: UniversConstate | null;
    motif: string;
  };
  permissionsModules: PermissionModule[];
  projetActif: Projet | null;
  historiquePertinent: { role: string; contenu: string }[];
  moteursDisponibles: string[];
  outilsDisponibles: { toolId: string; enabled: boolean; implementationStatus: string }[];
}

export interface EntreeContexte {
  userId?: number | null;
  role?: string | null;
  application?: string | null;
  route?: string | null;
  countryCode?: string | null;
  sessionId?: number | null;
  objet?: { type: string; id: string | number } | null;
}

/** Ligne d'historique récente d'une session Intelligence — jamais une autre table de messagerie. */
async function historiquePertinent(sessionId: number | null | undefined): Promise<{ role: string; contenu: string }[]> {
  if (!sessionId) return [];
  const { inMessages } = await import("../schema.js");
  const lignes = await db
    .select({ role: inMessages.role, contenu: inMessages.contenu })
    .from(inMessages)
    .where(eq(inMessages.sessionId, sessionId))
    .orderBy(inMessages.id)
    .limit(50);
  return lignes.slice(-8);
}

export async function resoudreContexte(entree: EntreeContexte): Promise<ContexteResolu> {
  let utilisateur: ContexteResolu["utilisateur"] = {
    id: entree.userId ?? null,
    role: entree.role ?? null,
    email: null,
    countryCode: entree.countryCode ?? null,
    currency: null,
  };

  if (entree.userId) {
    const [ligne] = await db
      .select({ id: users.id, email: users.email, role: users.role, country: users.country, currency: users.currency })
      .from(users)
      .where(eq(users.id, entree.userId))
      .limit(1);
    if (ligne) {
      utilisateur = {
        id: ligne.id,
        role: entree.role ?? ligne.role,
        email: ligne.email,
        countryCode: entree.countryCode ?? ligne.country ?? null,
        currency: ligne.currency ?? null,
      };
    }
  }

  let pays: ContexteResolu["pays"] = {
    code: utilisateur.countryCode,
    nom: null,
    langueParDefaut: null,
    deviseParDefaut: null,
    tauxTva: null,
    universAutorisesPays: [],
    ouvert: false,
    motif: utilisateur.countryCode ? "" : "Aucun pays connu pour ce contexte (ni fourni, ni sur le compte).",
  };
  if (utilisateur.countryCode) {
    const trouve = await getCountry(utilisateur.countryCode);
    pays = trouve
      ? {
          code: trouve.code,
          nom: trouve.nameFr,
          langueParDefaut: trouve.defaultLanguage,
          deviseParDefaut: trouve.defaultCurrency,
          tauxTva: trouve.tvaRate,
          universAutorisesPays: trouve.universesEnabled,
          ouvert: trouve.active,
          motif: trouve.active ? "" : "Pays connu mais fermé au Country Engine.",
        }
      : { ...pays, motif: `Pays ${utilisateur.countryCode} inconnu du Country Engine.` };
  }

  const universResolu = entree.route ? universDeRoute(entree.route) : null;
  const univers: ContexteResolu["univers"] = {
    resolu: universResolu,
    motif: entree.route
      ? universResolu
        ? ""
        : `Aucun univers du registre ne déclare la route « ${entree.route} » — route non cartographiée ou hors périmètre applicatif.`
      : "Aucune route fournie : univers non résolu.",
  };

  const permissionsModules = (
    ["annonces", "favoris", "recherches", "reservations", "devis", "abonnements", "litiges", "rewards", "coffre", "dossiers", "rapports", "notifications", "messages", "profil", "support", "espace_pro", "stock_pro", "atelier", "catalogue_technique", "suivi_vehicule", "vo_interne", "comptabilite", "employes", "dossier_client", "journal_activite", "toutes_annonces", "publicites", "centre_pdg", "back_office", "super_admin"] as PermissionModule[]
  ).filter((m) => canAccessModule(utilisateur.role ?? undefined, m));

  let projetActif: Projet | null = null;
  if (entree.sessionId) {
    const [session] = await db
      .select({ projetActifId: inSessions.projetActifId })
      .from(inSessions)
      .where(eq(inSessions.id, entree.sessionId))
      .limit(1);
    if (session?.projetActifId && utilisateur.id) {
      projetActif = await ouvrirProjetChantier(session.projetActifId, utilisateur.id);
    }
  }

  const moteursDisponibles = universResolu?.engineIds ?? [];
  const outilsDisponibles = (universResolu?.outilsActifs ?? [])
    .map((toolId) => trouverOutil(toolId))
    .filter((o): o is NonNullable<typeof o> => o !== null)
    .filter((o) => o.allowedRoles.includes(utilisateur.role ?? ""))
    .map((o) => ({ toolId: o.toolId, enabled: o.enabled, implementationStatus: o.implementationStatus }));

  return {
    utilisateur,
    pays,
    application: entree.application ?? null,
    route: entree.route ?? null,
    univers,
    permissionsModules,
    projetActif,
    historiquePertinent: await historiquePertinent(entree.sessionId),
    moteursDisponibles,
    outilsDisponibles,
  };
}

