/**
 * Point 62 — connecteurs de sources externes autorisées.
 *
 * Le registre déclare ce que la plateforme **a le droit** d'utiliser, pas ce
 * qu'elle pourrait techniquement récupérer. Deux règles tenues ici :
 *
 *  • une source déclarée ne prétend jamais être active : elle reste
 *    `non_configure` tant qu'aucun identifiant n'est enregistré, puis
 *    `configure_non_confirme` tant qu'aucune synchronisation n'a abouti ;
 *  • Google figure comme source de découverte via ses interfaces officielles.
 *    Aucun contournement de protection, aucune extraction interdite : c'est
 *    pour cela que le catalogue distingue `moteur_recherche` (API officielle)
 *    d'une quelconque collecte sauvage, absente par construction.
 */
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { akeSources } from "./schema.js";

export const AKE_SOURCE_KINDS: Record<string, string> = {
  moteur_recherche: "Moteur de recherche (API officielle)",
  api: "API",
  base_licence: "Base automobile sous licence",
  constructeur: "Constructeur",
  fournisseur: "Fournisseur",
  documentation: "Documentation technique",
  donnees_publiques: "Données publiques",
  tendances: "Tendances",
  reglementation: "Réglementation",
  reseau_social: "Réseau social",
  mkapms: "Données MKA.P-MS",
};

export const AKE_AUTHORIZATIONS: Record<string, string> = {
  publique: "Donnée publique réutilisable",
  api_officielle: "API officielle du fournisseur",
  licence: "Sous licence contractuelle",
  propriete_mkapms: "Propriété MKA.P-MS",
  a_verifier: "Autorisation à vérifier — absorption bloquée",
  interdite: "Interdite — absorption refusée",
};

/**
 * Catalogue des connecteurs prévus. Aucun n'est marqué actif : l'état réel
 * dépend d'identifiants et d'une synchronisation qui n'existent pas encore.
 */
interface SourceSeed {
  code: string;
  label: string;
  kind: string;
  authorization: string;
  apiEndpoint?: string;
  rateLimit?: string;
  note?: string;
}

const SOURCE_CATALOG: SourceSeed[] = [
  {
    code: "mkapms_interne",
    label: "Données MKA.P-MS (annonces, pièces, garages, recherches)",
    kind: "mkapms",
    authorization: "propriete_mkapms",
    note: "Seule source déjà disponible : la plateforme apprend d'abord de ses propres données.",
  },
  {
    code: "google_search_console",
    label: "Google Search Console (API officielle)",
    kind: "moteur_recherche",
    authorization: "api_officielle",
    apiEndpoint: "https://searchconsole.googleapis.com",
    rateLimit: "Quotas Google par propriété",
    note: "Canal de découverte autorisé : requêtes et pages réellement vues par Google.",
  },
  {
    code: "google_business_profile",
    label: "Google Business Profile (API officielle)",
    kind: "api",
    authorization: "api_officielle",
    apiEndpoint: "https://mybusinessbusinessinformation.googleapis.com",
    note: "Déjà exposé par le connecteur dédié (point 52). Aucun avis Google recopié.",
  },
  {
    code: "donnees_publiques_pays",
    label: "Portails de données publiques par pays",
    kind: "donnees_publiques",
    authorization: "publique",
    note: "Immatriculations, parc roulant, rappels officiels — selon ce que chaque pays publie.",
  },
  {
    code: "rappels_officiels",
    label: "Rappels et alertes de sécurité officiels",
    kind: "reglementation",
    authorization: "publique",
    note: "Classés critiques par défaut : un rappel concerne la sécurité des personnes.",
  },
  {
    code: "reglementation_pays",
    label: "Réglementation et normes par pays",
    kind: "reglementation",
    authorization: "a_verifier",
    note: "Chaque juridiction doit être confirmée séparément (points 65-66).",
  },
  {
    code: "constructeurs_documentation",
    label: "Documentation constructeurs",
    kind: "constructeur",
    authorization: "a_verifier",
    note: "Souvent sous licence : bloquée jusqu'à accord écrit.",
  },
  {
    code: "base_technique_licence",
    label: "Base technique automobile sous licence",
    kind: "base_licence",
    authorization: "a_verifier",
    note: "Nécessite un contrat. Aucune donnée absorbée avant signature.",
  },
  {
    code: "catalogues_fournisseurs",
    label: "Catalogues fournisseurs de pièces",
    kind: "fournisseur",
    authorization: "a_verifier",
    note: "Données fournisseur : classées `fournisseur`, jamais republiées telles quelles.",
  },
  {
    code: "tendances_marche",
    label: "Tendances et études de marché",
    kind: "tendances",
    authorization: "a_verifier",
  },
  {
    code: "reseaux_sociaux_publics",
    label: "Publications publiques sur réseaux sociaux",
    kind: "reseau_social",
    authorization: "a_verifier",
    note: "Chaque plateforme a ses conditions : autorisation à confirmer réseau par réseau.",
  },
];

/** Enregistre le catalogue sans écraser les autorisations déjà décidées. */
export async function seedSources(): Promise<{ crees: number; existants: number }> {
  let crees = 0;
  let existants = 0;
  for (const s of SOURCE_CATALOG) {
    const res = await db
      .insert(akeSources)
      .values({
        code: s.code,
        label: s.label,
        kind: s.kind,
        authorization: s.authorization,
        authorizationRef: s.note ?? null,
        apiEndpoint: s.apiEndpoint ?? null,
        rateLimit: s.rateLimit ?? null,
        status: s.code === "mkapms_interne" ? "actif" : "non_configure",
        everSynced: s.code === "mkapms_interne",
      })
      .onConflictDoNothing()
      .returning({ id: akeSources.id });
    if (res.length > 0) crees += 1;
    else existants += 1;
  }
  return { crees, existants };
}

/**
 * État affiché d'une source : la formule dit exactement ce qui est vérifié.
 * Une source configurée mais jamais synchronisée n'est pas annoncée active.
 */
function displayStatus(row: {
  status: string;
  everSynced: boolean;
  apiEndpoint: string | null;
  authorization: string;
}): string {
  if (row.authorization === "interdite") return "interdite";
  if (row.authorization === "a_verifier") return "autorisation_non_confirmee";
  if (row.status === "erreur") return "erreur";
  if (!row.apiEndpoint && row.status === "non_configure") return "non_configure";
  if (!row.everSynced) return "configure_non_confirme";
  return row.status;
}

export async function listSources() {
  const rows = await db.select().from(akeSources).orderBy(desc(akeSources.updatedAt));
  return rows.map((r) => ({
    ...r,
    kindLabel: AKE_SOURCE_KINDS[r.kind] ?? r.kind,
    authorizationLabel: AKE_AUTHORIZATIONS[r.authorization] ?? r.authorization,
    etatAffiche: displayStatus(r),
    /** Une source ne peut alimenter le graphe que si son autorisation est établie. */
    absorptionAutorisee: r.authorization !== "interdite" && r.authorization !== "a_verifier",
  }));
}

export interface DeclareSourceInput {
  code: string;
  label: string;
  kind: string;
  authorization: string;
  authorizationRef?: string;
  countryCode?: string;
  apiEndpoint?: string;
  rateLimit?: string;
  declaredBy: number;
}

export async function declareSource(input: DeclareSourceInput) {
  const [row] = await db
    .insert(akeSources)
    .values({
      code: input.code,
      label: input.label,
      kind: input.kind,
      authorization: input.authorization,
      authorizationRef: input.authorizationRef ?? null,
      countryCode: input.countryCode ?? null,
      apiEndpoint: input.apiEndpoint ?? null,
      rateLimit: input.rateLimit ?? null,
      declaredBy: input.declaredBy,
    })
    .onConflictDoUpdate({
      target: akeSources.code,
      set: {
        label: input.label,
        kind: input.kind,
        authorization: input.authorization,
        authorizationRef: input.authorizationRef ?? null,
        countryCode: input.countryCode ?? null,
        apiEndpoint: input.apiEndpoint ?? null,
        rateLimit: input.rateLimit ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

/**
 * Enregistre le résultat d'une synchronisation réelle. `everSynced` ne passe à
 * vrai que sur un succès : c'est ce qui empêche d'afficher « actif » sans preuve.
 */
export async function recordSync(input: {
  code: string;
  ok: boolean;
  detail: string;
  reliability?: number;
}) {
  const now = new Date();
  const [row] = await db
    .update(akeSources)
    .set({
      status: input.ok ? "actif" : "erreur",
      lastSyncAt: now,
      lastSyncDetail: input.detail,
      everSynced: input.ok ? true : sql`${akeSources.everSynced}`,
      reliability: input.reliability ?? sql`${akeSources.reliability}`,
      updatedAt: now,
    })
    .where(eq(akeSources.code, input.code))
    .returning();
  return row ?? null;
}
