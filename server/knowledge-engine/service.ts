/**
 * Automotive Knowledge Engine — écriture et lecture du graphe (points 60, 63, 83).
 *
 * Toute écriture passe par `upsertNode` / `linkNodes`, jamais par un insert
 * direct : c'est ce qui garantit qu'un même fait appris par deux moteurs
 * différents devienne **une seule** connaissance, avec ses provenances
 * accumulées, au lieu de deux vérités concurrentes.
 */
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { akeEdges, akeNodes, akeProvenance, akeSources } from "./schema.js";

/** Domaines couverts par le point 60. */
export const AKE_DOMAINS: Record<string, string> = {
  vehicule: "Véhicules",
  constructeur: "Constructeurs",
  modele: "Modèles",
  moteur: "Moteurs",
  motorisation: "Motorisations",
  mecanique: "Mécanique",
  diagnostic: "Diagnostic",
  electronique: "Électronique automobile",
  calculateur: "Calculateurs",
  piece: "Pièces",
  compatibilite: "Compatibilités",
  entretien: "Entretien",
  reparation: "Réparation",
  carrosserie: "Carrosserie",
  pneumatique: "Pneumatiques",
  batterie: "Batteries",
  electrique: "Électrique",
  hybride: "Hybride",
  thermique: "Thermique",
  recharge: "Recharge",
  adas: "ADAS",
  telematique: "Télématique",
  logiciel: "Logiciels automobiles",
  mobilite: "Mobilité",
  reglementation: "Réglementation",
  norme: "Normes",
  securite: "Sécurité",
  technologie: "Technologies émergentes",
};

/** Classes de propriété des données (point 82). */
export const AKE_DATA_CLASSES: Record<string, string> = {
  publique: "Connaissance publique",
  licence: "Documentation sous licence",
  mkapms: "Propriété MKA.P-MS",
  fournisseur: "Données fournisseur",
  confidentielle: "Donnée confidentielle",
};

/** Licences reconnues (point 83). `inconnue` interdit toute publication. */
export const AKE_LICENSES: Record<string, string> = {
  publique: "Donnée publique",
  licence: "Sous licence",
  propriete_mkapms: "Propriété MKA.P-MS",
  fournisseur: "Fournie par un fournisseur",
  inconnue: "Licence inconnue — publication interdite",
};

function norm(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, " ");
}

function signatureOf(domain: string, kind: string, label: string): string {
  return `${norm(domain)}|${norm(kind)}|${norm(label)}`.slice(0, 400);
}

export interface ProvenanceInput {
  sourceCode: string;
  sourceRef?: string;
  license?: string;
  licenseRef?: string;
  countryCode?: string | null;
  reliability?: number;
  learnedByEngine?: string;
}

export interface UpsertNodeInput {
  domain: string;
  kind: string;
  label: string;
  summary?: string;
  attributes?: Record<string, unknown>;
  countryCode?: string | null;
  dataClass?: string;
  learnedByEngine?: string;
  provenance?: ProvenanceInput;
}

/**
 * Vérifie qu'une source autorise réellement l'absorption. Une source absente du
 * registre, interdite ou encore à vérifier bloque l'écriture de provenance :
 * mieux vaut une connaissance sans source déclarée qu'une source inventée.
 */
async function sourceAllows(code: string): Promise<{ ok: boolean; reason: string }> {
  const [row] = await db
    .select({ authorization: akeSources.authorization, status: akeSources.status })
    .from(akeSources)
    .where(eq(akeSources.code, code))
    .limit(1);
  if (!row) return { ok: false, reason: `Source « ${code} » absente du registre.` };
  if (row.authorization === "interdite") {
    return { ok: false, reason: `Source « ${code} » déclarée interdite.` };
  }
  if (row.authorization === "a_verifier") {
    return {
      ok: false,
      reason: `Autorisation de la source « ${code} » non confirmée : absorption refusée.`,
    };
  }
  return { ok: true, reason: "" };
}

/**
 * Crée ou enrichit un nœud. Un fait déjà connu n'est pas dupliqué : son compteur
 * d'observations augmente, et il passe `confirme` à partir de trois constats
 * indépendants — un fait vu une seule fois reste une proposition.
 */
export async function upsertNode(input: UpsertNodeInput): Promise<{
  id: number;
  created: boolean;
  provenanceRefusee: string | null;
}> {
  const signature = signatureOf(input.domain, input.kind, input.label);
  const now = new Date();

  const [existing] = await db
    .select({ id: akeNodes.id, observations: akeNodes.observations, status: akeNodes.status })
    .from(akeNodes)
    .where(eq(akeNodes.signature, signature))
    .limit(1);

  let nodeId: number;
  let created = false;

  if (existing) {
    const observations = existing.observations + 1;
    await db
      .update(akeNodes)
      .set({
        observations,
        status: existing.status === "propose" && observations >= 3 ? "confirme" : existing.status,
        summary: input.summary ?? undefined,
        attributes: input.attributes ?? undefined,
        updatedAt: now,
      })
      .where(eq(akeNodes.id, existing.id));
    nodeId = existing.id;
  } else {
    const [row] = await db
      .insert(akeNodes)
      .values({
        domain: input.domain,
        kind: input.kind,
        label: input.label,
        signature,
        summary: input.summary ?? null,
        attributes: input.attributes ?? {},
        countryCode: input.countryCode ?? null,
        dataClass: input.dataClass ?? "publique",
        learnedByEngine: input.learnedByEngine ?? null,
      })
      .returning({ id: akeNodes.id });
    nodeId = row.id;
    created = true;
  }

  let provenanceRefusee: string | null = null;
  if (input.provenance) {
    const check = await sourceAllows(input.provenance.sourceCode);
    if (!check.ok) {
      provenanceRefusee = check.reason;
    } else {
      await db.insert(akeProvenance).values({
        nodeId,
        sourceCode: input.provenance.sourceCode,
        sourceRef: input.provenance.sourceRef ?? null,
        license: input.provenance.license ?? "inconnue",
        licenseRef: input.provenance.licenseRef ?? null,
        countryCode: input.provenance.countryCode ?? null,
        reliability: input.provenance.reliability ?? null,
        learnedByEngine: input.provenance.learnedByEngine ?? input.learnedByEngine ?? null,
        lastCheckedAt: now,
      });
      await db
        .update(akeNodes)
        .set({ lastVerifiedAt: now, updatedAt: now })
        .where(eq(akeNodes.id, nodeId));
    }
  }

  return { id: nodeId, created, provenanceRefusee };
}

export interface LinkInput {
  fromNodeId: number;
  toNodeId: number;
  relation: string;
  origin?: string;
  confidence?: number;
  attributes?: Record<string, unknown>;
}

/** Relie deux nœuds. Un lien déjà présent n'est pas dupliqué. */
export async function linkNodes(input: LinkInput): Promise<{ created: boolean }> {
  if (input.fromNodeId === input.toNodeId) return { created: false };
  const signature = `${input.fromNodeId}|${norm(input.relation)}|${input.toNodeId}`.slice(0, 400);
  const res = await db
    .insert(akeEdges)
    .values({
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      relation: input.relation,
      signature,
      origin: input.origin ?? "manuel",
      confidence: input.confidence ?? null,
      attributes: input.attributes ?? {},
    })
    .onConflictDoNothing()
    .returning({ id: akeEdges.id });
  return { created: res.length > 0 };
}

export interface NodeNeighbour {
  relation: string;
  direction: "sortant" | "entrant";
  origin: string;
  node: {
    id: number;
    domain: string;
    kind: string;
    label: string;
    status: string;
    countryCode: string | null;
    dataClass: string;
  };
}

/**
 * Mémoire reliée d'un nœud : ce qu'on sait, d'où ça vient, et à quoi c'est
 * rattaché. Rien n'est déduit ici : seuls les liens réellement enregistrés
 * apparaissent.
 */
export async function nodeMemory(nodeId: number) {
  const [node] = await db.select().from(akeNodes).where(eq(akeNodes.id, nodeId)).limit(1);
  if (!node) return null;

  const edges = await db
    .select()
    .from(akeEdges)
    .where(or(eq(akeEdges.fromNodeId, nodeId), eq(akeEdges.toNodeId, nodeId)))
    .limit(500);

  const otherIds = [
    ...new Set(edges.map((e) => (e.fromNodeId === nodeId ? e.toNodeId : e.fromNodeId))),
  ];
  const others = otherIds.length
    ? await db
        .select({
          id: akeNodes.id,
          domain: akeNodes.domain,
          kind: akeNodes.kind,
          label: akeNodes.label,
          status: akeNodes.status,
          countryCode: akeNodes.countryCode,
          dataClass: akeNodes.dataClass,
        })
        .from(akeNodes)
        .where(inArray(akeNodes.id, otherIds))
    : [];
  const byId = new Map(others.map((o) => [o.id, o]));

  const neighbours: NodeNeighbour[] = [];
  for (const e of edges) {
    const otherId = e.fromNodeId === nodeId ? e.toNodeId : e.fromNodeId;
    const other = byId.get(otherId);
    if (!other) continue;
    neighbours.push({
      relation: e.relation,
      direction: e.fromNodeId === nodeId ? "sortant" : "entrant",
      origin: e.origin,
      node: other,
    });
  }

  const provenance = await db
    .select()
    .from(akeProvenance)
    .where(eq(akeProvenance.nodeId, nodeId))
    .orderBy(desc(akeProvenance.observedAt))
    .limit(50);

  return {
    node,
    neighbours,
    provenance,
    /**
     * Point 83 : sans provenance exploitable, la connaissance reste utilisable
     * en interne mais ne peut pas être publiée.
     */
    publiable:
      provenance.length > 0 &&
      provenance.some((p) => p.license === "publique" || p.license === "propriete_mkapms"),
  };
}

export interface SearchNodesInput {
  query?: string;
  domain?: string;
  countryCode?: string;
  status?: string;
  limit?: number;
}

export async function searchNodes(input: SearchNodesInput) {
  const conds = [];
  if (input.query && input.query.trim().length > 0) {
    conds.push(sql`${akeNodes.label} ILIKE ${`%${input.query.trim()}%`}`);
  }
  if (input.domain) conds.push(eq(akeNodes.domain, input.domain));
  if (input.countryCode) conds.push(eq(akeNodes.countryCode, input.countryCode));
  if (input.status) conds.push(eq(akeNodes.status, input.status));

  const rows = await db
    .select({
      id: akeNodes.id,
      domain: akeNodes.domain,
      kind: akeNodes.kind,
      label: akeNodes.label,
      summary: akeNodes.summary,
      countryCode: akeNodes.countryCode,
      dataClass: akeNodes.dataClass,
      status: akeNodes.status,
      observations: akeNodes.observations,
      learnedByEngine: akeNodes.learnedByEngine,
      lastVerifiedAt: akeNodes.lastVerifiedAt,
      updatedAt: akeNodes.updatedAt,
    })
    .from(akeNodes)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(akeNodes.observations), desc(akeNodes.updatedAt))
    .limit(input.limit ?? 60);
  return rows;
}

/** Compteurs réels du moteur — aucun chiffre estimé. */
export async function knowledgeStats() {
  const [nodes] = await db
    .select({
      total: sql<number>`count(*)::int`,
      confirmes: sql<number>`count(*) filter (where ${akeNodes.status} = 'confirme')::int`,
      proposes: sql<number>`count(*) filter (where ${akeNodes.status} = 'propose')::int`,
      contestes: sql<number>`count(*) filter (where ${akeNodes.status} = 'conteste')::int`,
      sansProvenance: sql<number>`count(*) filter (where ${akeNodes.lastVerifiedAt} is null)::int`,
      territoriaux: sql<number>`count(*) filter (where ${akeNodes.countryCode} is not null)::int`,
    })
    .from(akeNodes);
  const [edges] = await db.select({ total: sql<number>`count(*)::int` }).from(akeEdges);
  const [prov] = await db
    .select({
      total: sql<number>`count(*)::int`,
      licenceInconnue: sql<number>`count(*) filter (where ${akeProvenance.license} = 'inconnue')::int`,
    })
    .from(akeProvenance);

  const parDomaine = await db
    .select({
      domain: akeNodes.domain,
      total: sql<number>`count(*)::int`,
    })
    .from(akeNodes)
    .groupBy(akeNodes.domain)
    .orderBy(desc(sql`count(*)`));

  return {
    noeuds: nodes?.total ?? 0,
    confirmes: nodes?.confirmes ?? 0,
    proposes: nodes?.proposes ?? 0,
    contestes: nodes?.contestes ?? 0,
    sansProvenance: nodes?.sansProvenance ?? 0,
    territoriaux: nodes?.territoriaux ?? 0,
    liens: edges?.total ?? 0,
    provenances: prov?.total ?? 0,
    licenceInconnue: prov?.licenceInconnue ?? 0,
    parDomaine: parDomaine.map((d) => ({
      domain: d.domain,
      label: AKE_DOMAINS[d.domain] ?? d.domain,
      total: d.total,
    })),
  };
}

/** Santé du moteur pour le registre central. */
export async function knowledgeEngineHealth() {
  const stats = await knowledgeStats();
  const [sources] = await db
    .select({
      total: sql<number>`count(*)::int`,
      actives: sql<number>`count(*) filter (where ${akeSources.status} = 'actif')::int`,
      erreurs: sql<number>`count(*) filter (where ${akeSources.status} = 'erreur')::int`,
    })
    .from(akeSources);

  const anomalies: string[] = [];
  if (stats.licenceInconnue > 0) {
    anomalies.push(
      `${stats.licenceInconnue} provenance(s) sans licence identifiée : publication interdite pour ces connaissances.`,
    );
  }
  if ((sources?.erreurs ?? 0) > 0) {
    anomalies.push(`${sources?.erreurs} source(s) en erreur de synchronisation.`);
  }

  return {
    health: anomalies.length > 0 ? "degraded" : "ok",
    stats,
    sources: {
      total: sources?.total ?? 0,
      actives: sources?.actives ?? 0,
      erreurs: sources?.erreurs ?? 0,
    },
    anomalies,
  };
}
