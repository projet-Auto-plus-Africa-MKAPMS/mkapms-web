/**
 * Points 79-80-81-82 — MKA.P-MS AUTOMOTIVE R&D LAB.
 *
 * Ce que le laboratoire refuse de faire, volontairement :
 *  • il ne publie rien : aucune écriture dans une table de service commercial,
 *    aucune page publique alimentée depuis ici ;
 *  • il n'affiche jamais une chaîne industrielle complète alors que des maillons
 *    n'ont pas été renseignés : les manquants sont nommés (point 80) ;
 *  • il n'absorbe pas une documentation sous licence ou une donnée fournisseur
 *    comme si elle était publique : sans droit d'usage établi, l'actif reste
 *    dans le lab et le versement au graphe partagé est refusé (point 82) ;
 *  • il ne compte comme écosystème embarqué que ce qui existe réellement en
 *    base, et nomme ce qui manque — cartographie, trafic, itinéraires — plutôt
 *    que de laisser croire à une navigation prête (point 81).
 */
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { garagesPublics } from "../schema.js";
import { chargingPoints } from "../charging-engine/schema.js";
import { countryCountries } from "../country-os/index.js";
import { upsertNode } from "../knowledge-engine/service.js";
import { logActivity } from "../smart-engine/services/activity-log.js";
import { rdAssets, rdChainLinks, rdEcosystemSnapshots, rdProjects } from "./schema.js";

/** Point 79 — branches du laboratoire, séparées des univers commerciaux. */
export const RD_BRANCHES: Record<string, string> = {
  vehicule: "Architecture véhicule",
  electronique: "Électronique & capteurs",
  calculateurs: "Calculateurs & réseaux véhicule",
  propulsion: "Propulsion & énergie",
  navigation: "Navigation & systèmes embarqués",
  fabrication: "Fabrication & validation",
};

/** Domaines R&D, y compris ceux d'aucun service vendu aujourd'hui. */
export const RD_DOMAINS: { code: string; label: string; branch: string }[] = [
  { code: "architecture_vehicule", label: "Architecture véhicule", branch: "vehicule" },
  { code: "chassis", label: "Châssis & liaisons au sol", branch: "vehicule" },
  { code: "carrosserie", label: "Carrosserie & aérodynamique", branch: "vehicule" },
  { code: "securite_vehicule", label: "Sécurité véhicule & crash", branch: "vehicule" },

  { code: "electronique", label: "Électronique embarquée", branch: "electronique" },
  { code: "capteurs", label: "Capteurs", branch: "electronique" },
  { code: "adas", label: "ADAS & aide à la conduite", branch: "electronique" },
  { code: "infotainment", label: "Infotainment", branch: "electronique" },

  { code: "ecu", label: "ECU — calculateur moteur", branch: "calculateurs" },
  { code: "bms", label: "BMS — gestion batterie", branch: "calculateurs" },
  { code: "vcu", label: "VCU — calculateur véhicule", branch: "calculateurs" },
  { code: "reseaux_vehicule", label: "Réseaux véhicule (CAN, LIN, Ethernet)", branch: "calculateurs" },
  { code: "diagnostic_embarque", label: "Diagnostic embarqué", branch: "calculateurs" },
  { code: "logiciel_embarque", label: "Logiciels embarqués", branch: "calculateurs" },

  { code: "moteurs", label: "Moteurs", branch: "propulsion" },
  { code: "thermique", label: "Thermique", branch: "propulsion" },
  { code: "hybride", label: "Hybride", branch: "propulsion" },
  { code: "electrique", label: "Électrique", branch: "propulsion" },
  { code: "batterie", label: "Batterie & cellules", branch: "propulsion" },
  { code: "recharge", label: "Recharge & infrastructure", branch: "propulsion" },

  { code: "navigation", label: "Navigation & guidage", branch: "navigation" },
  { code: "cartographie", label: "Cartographie sous licence", branch: "navigation" },
  { code: "trafic", label: "Trafic temps réel", branch: "navigation" },
  { code: "itineraires", label: "Itinéraires & points d'intérêt", branch: "navigation" },
  { code: "telematique", label: "Télématique & connectivité", branch: "navigation" },

  { code: "fabrication", label: "Fabrication & industrialisation", branch: "fabrication" },
  { code: "fournisseurs", label: "Fournisseurs & composants", branch: "fabrication" },
  { code: "couts", label: "Coûts & industrialisation économique", branch: "fabrication" },
  { code: "reglementation_vehicule", label: "Réglementation & homologation", branch: "fabrication" },
  { code: "validation", label: "Validation & essais", branch: "fabrication" },
];

/** Point 80 — maillons de la chaîne industrielle, dans l'ordre. */
export const INDUSTRIAL_CHAIN = [
  "besoin_client",
  "marche",
  "reglementation",
  "architecture_vehicule",
  "composants",
  "fournisseurs",
  "couts",
  "performances",
  "securite",
  "fabrication",
  "tests",
] as const;

export type ChainLink = (typeof INDUSTRIAL_CHAIN)[number];

export const CHAIN_LABELS: Record<ChainLink, string> = {
  besoin_client: "Besoin client",
  marche: "Marché",
  reglementation: "Réglementation",
  architecture_vehicule: "Architecture véhicule",
  composants: "Composants",
  fournisseurs: "Fournisseurs",
  couts: "Coûts",
  performances: "Performances",
  securite: "Sécurité",
  fabrication: "Fabrication",
  tests: "Tests",
};

/** Point 82 — classes de données, et ce qu'elles autorisent réellement. */
export const RD_DATA_CLASSES: Record<string, { label: string; regime: string }> = {
  publique: {
    label: "Connaissance publique",
    regime: "Utilisable et versable au graphe partagé si la source est déclarée.",
  },
  licence: {
    label: "Documentation sous licence",
    regime:
      "Utilisable dans le lab selon le contrat. Versement au graphe seulement si la licence le permet et est référencée.",
  },
  mkapms: {
    label: "Propriété intellectuelle MKA.P-MS",
    regime: "Propriété de l'entreprise. Versable au graphe, non publiable sans décision.",
  },
  fournisseur: {
    label: "Donnée fournisseur",
    regime: "Reste dans le lab. Aucun versement sans accord écrit du fournisseur référencé.",
  },
  confidentielle: {
    label: "Donnée confidentielle",
    regime: "Ne quitte jamais le laboratoire. Aucun versement au graphe partagé.",
  },
};

/** Briques d'un système embarqué qui n'existent pas encore dans la plateforme. */
const EMBEDDED_MISSING = [
  "cartographie_sous_licence",
  "trafic_temps_reel",
  "calcul_itineraire",
  "guidage_embarque",
];

// ─── Point 79 — projets ──────────────────────────────────────────────────

export interface CreateProjectInput {
  code: string;
  title: string;
  branch: string;
  domain: string;
  objective: string;
  countryCode?: string | null;
  confidentiality?: "interne" | "confidentiel" | "secret";
  createdBy?: number;
}

export async function createProject(
  input: CreateProjectInput,
): Promise<{ ok: boolean; detail: string; id: number | null }> {
  if (!RD_BRANCHES[input.branch]) {
    return { ok: false, detail: `Branche « ${input.branch} » inconnue du laboratoire.`, id: null };
  }
  const domaine = RD_DOMAINS.find((d) => d.code === input.domain);
  if (!domaine) {
    return { ok: false, detail: `Domaine « ${input.domain} » inconnu du laboratoire.`, id: null };
  }
  if (domaine.branch !== input.branch) {
    return {
      ok: false,
      detail: `Le domaine « ${domaine.label} » appartient à la branche ${RD_BRANCHES[domaine.branch]}, pas à celle choisie.`,
      id: null,
    };
  }
  // Un pays cité doit être réellement activé : pas de portée fantôme.
  if (input.countryCode) {
    const [pays] = await db
      .select({ code: countryCountries.code })
      .from(countryCountries)
      .where(and(eq(countryCountries.code, input.countryCode.toUpperCase()), eq(countryCountries.active, true)))
      .limit(1);
    if (!pays) {
      return {
        ok: false,
        detail: `Pays « ${input.countryCode} » non activé : le projet ne peut pas lui être rattaché.`,
        id: null,
      };
    }
  }

  const code = input.code.trim().toUpperCase().slice(0, 48);
  const [existing] = await db
    .select({ id: rdProjects.id })
    .from(rdProjects)
    .where(eq(rdProjects.code, code))
    .limit(1);
  if (existing) {
    return { ok: false, detail: `Le projet « ${code} » existe déjà.`, id: existing.id };
  }

  const [row] = await db
    .insert(rdProjects)
    .values({
      code,
      title: input.title.slice(0, 240),
      branch: input.branch,
      domain: input.domain,
      objective: input.objective,
      countryCode: input.countryCode ? input.countryCode.toUpperCase() : null,
      confidentiality: input.confidentiality ?? "confidentiel",
      createdBy: input.createdBy ?? null,
    })
    .returning();

  await logActivity({
    action: "rd_projet_cree",
    userId: input.createdBy,
    targetType: "rd_project",
    targetId: row.id,
    result: "ok",
    proposedDecision: `Projet R&D ${code} — ${input.title}. Aucun service commercial impacté.`,
  });

  return {
    ok: true,
    detail: `Projet ${code} ouvert dans le laboratoire. Il reste séparé des services vendus.`,
    id: row.id,
  };
}

export async function listProjects(limit = 100) {
  return db.select().from(rdProjects).orderBy(desc(rdProjects.createdAt)).limit(limit);
}

export async function updateProject(input: {
  id: number;
  objective?: string;
  status?: "etude" | "en_cours" | "pause" | "archive";
  confidentiality?: "interne" | "confidentiel" | "secret";
  notes?: string;
}): Promise<{ ok: boolean; detail: string }> {
  const [projet] = await db.select().from(rdProjects).where(eq(rdProjects.id, input.id)).limit(1);
  if (!projet) return { ok: false, detail: "Projet introuvable." };
  await db
    .update(rdProjects)
    .set({
      objective: input.objective ?? projet.objective,
      status: input.status ?? projet.status,
      confidentiality: input.confidentiality ?? projet.confidentiality,
      notes: input.notes ?? projet.notes,
      updatedAt: new Date(),
    })
    .where(eq(rdProjects.id, input.id));
  return { ok: true, detail: "Projet mis à jour." };
}

// ─── Point 80 — chaîne industrielle ──────────────────────────────────────

export interface ChainState {
  link: ChainLink;
  label: string;
  status: "renseigne" | "a_confirmer" | "manquant";
  content: string | null;
  evidence: string | null;
  updatedAt: Date | null;
}

/**
 * État réel de la chaîne d'un projet. Un maillon jamais renseigné est
 * `manquant` : il n'est ni masqué ni supposé acquis.
 */
export async function projectChain(projectId: number): Promise<{
  links: ChainState[];
  renseignes: number;
  manquants: ChainLink[];
  complete: boolean;
}> {
  const rows = await db.select().from(rdChainLinks).where(eq(rdChainLinks.projectId, projectId));
  const parRef = new Map(rows.map((r) => [r.link, r]));

  const links: ChainState[] = INDUSTRIAL_CHAIN.map((link) => {
    const row = parRef.get(link);
    if (!row) {
      return { link, label: CHAIN_LABELS[link], status: "manquant", content: null, evidence: null, updatedAt: null };
    }
    return {
      link,
      label: CHAIN_LABELS[link],
      status: row.status === "renseigne" ? "renseigne" : "a_confirmer",
      content: row.content,
      evidence: row.evidence,
      updatedAt: row.updatedAt,
    };
  });

  const manquants = links.filter((l) => l.status === "manquant").map((l) => l.link);
  const renseignes = links.filter((l) => l.status === "renseigne").length;
  return { links, renseignes, manquants, complete: manquants.length === 0 && renseignes === links.length };
}

/**
 * Renseigne un maillon. Sans élément d'appui, le maillon reste « à confirmer » :
 * une affirmation sans preuve ne fait pas avancer un dossier industriel.
 */
export async function setChainLink(input: {
  projectId: number;
  link: ChainLink;
  content: string;
  evidence?: string;
  nodeId?: number | null;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string; status: string }> {
  if (!INDUSTRIAL_CHAIN.includes(input.link)) {
    return { ok: false, detail: `Maillon « ${input.link} » inconnu.`, status: "" };
  }
  const [projet] = await db
    .select({ id: rdProjects.id })
    .from(rdProjects)
    .where(eq(rdProjects.id, input.projectId))
    .limit(1);
  if (!projet) return { ok: false, detail: "Projet introuvable.", status: "" };

  const evidence = input.evidence?.trim() ?? "";
  const status = evidence.length >= 10 ? "renseigne" : "a_confirmer";
  const signature = `${input.projectId}|${input.link}`;
  const now = new Date();

  const [existing] = await db
    .select({ id: rdChainLinks.id })
    .from(rdChainLinks)
    .where(eq(rdChainLinks.signature, signature))
    .limit(1);

  if (existing) {
    await db
      .update(rdChainLinks)
      .set({
        content: input.content,
        evidence: evidence || null,
        nodeId: input.nodeId ?? null,
        status,
        updatedBy: input.actorId ?? null,
        updatedAt: now,
      })
      .where(eq(rdChainLinks.id, existing.id));
  } else {
    await db.insert(rdChainLinks).values({
      projectId: input.projectId,
      link: input.link,
      signature,
      content: input.content,
      evidence: evidence || null,
      nodeId: input.nodeId ?? null,
      status,
      updatedBy: input.actorId ?? null,
    });
  }

  return {
    ok: true,
    detail:
      status === "renseigne"
        ? `Maillon « ${CHAIN_LABELS[input.link]} » renseigné avec son élément d'appui.`
        : `Maillon « ${CHAIN_LABELS[input.link]} » enregistré mais laissé « à confirmer » : aucun élément d'appui n'a été fourni.`,
    status,
  };
}

// ─── Point 82 — actifs et droits d'usage ─────────────────────────────────

/** Le droit de partager au graphe partagé, déduit de la classe et de la licence. */
function shareability(dataClass: string, license: string, licenseRef: string | null): {
  shareable: boolean;
  reason: string | null;
} {
  if (dataClass === "confidentielle") {
    return { shareable: false, reason: "Donnée confidentielle : elle ne quitte pas le laboratoire." };
  }
  if (dataClass === "fournisseur") {
    return {
      shareable: false,
      reason: "Donnée fournisseur : aucun versement sans accord écrit référencé du fournisseur.",
    };
  }
  if (license === "inconnue") {
    return {
      shareable: false,
      reason:
        "Droit d'utilisation non établi. « Trouvé sur Internet » n'est pas une licence : l'actif reste interne.",
    };
  }
  if (license === "licence" && !licenseRef) {
    return {
      shareable: false,
      reason: "Licence invoquée sans référence de contrat : versement refusé jusqu'à ce qu'elle soit citée.",
    };
  }
  return { shareable: true, reason: null };
}

export interface DeclareAssetInput {
  title: string;
  branch: string;
  domain: string;
  summary?: string;
  dataClass: string;
  license: string;
  licenseRef?: string;
  sourceLabel?: string;
  sourceRef?: string;
  supplier?: string;
  countryCode?: string | null;
  projectId?: number | null;
  declaredBy?: number;
}

export async function declareAsset(
  input: DeclareAssetInput,
): Promise<{ ok: boolean; detail: string; id: number | null; shareable: boolean }> {
  if (!RD_DATA_CLASSES[input.dataClass]) {
    return { ok: false, detail: `Classe « ${input.dataClass} » inconnue.`, id: null, shareable: false };
  }
  if (!RD_DOMAINS.some((d) => d.code === input.domain)) {
    return { ok: false, detail: `Domaine « ${input.domain} » inconnu.`, id: null, shareable: false };
  }
  if (input.dataClass === "fournisseur" && !input.supplier) {
    return {
      ok: false,
      detail: "Une donnée fournisseur doit nommer son fournisseur : sinon son droit d'usage est intraçable.",
      id: null,
      shareable: false,
    };
  }

  const droit = shareability(input.dataClass, input.license, input.licenseRef ?? null);
  const [row] = await db
    .insert(rdAssets)
    .values({
      title: input.title.slice(0, 240),
      branch: input.branch,
      domain: input.domain,
      summary: input.summary ?? null,
      dataClass: input.dataClass,
      license: input.license,
      licenseRef: input.licenseRef ?? null,
      sourceLabel: input.sourceLabel?.slice(0, 160) ?? null,
      sourceRef: input.sourceRef ?? null,
      supplier: input.supplier?.slice(0, 160) ?? null,
      countryCode: input.countryCode ? input.countryCode.toUpperCase() : null,
      projectId: input.projectId ?? null,
      shareable: droit.shareable,
      blockedReason: droit.reason,
      declaredBy: input.declaredBy ?? null,
    })
    .returning();

  await logActivity({
    action: "rd_actif_declare",
    userId: input.declaredBy,
    targetType: "rd_asset",
    targetId: row.id,
    data: { dataClass: input.dataClass, license: input.license },
    result: droit.shareable ? "ok" : "restreint",
    proposedDecision: droit.reason ?? "Droit d'usage établi : versement au graphe possible.",
  });

  return {
    ok: true,
    detail: droit.shareable
      ? "Actif déclaré. Son droit d'usage est établi : il peut être versé au graphe partagé."
      : `Actif déclaré et gardé dans le laboratoire. ${droit.reason}`,
    id: row.id,
    shareable: droit.shareable,
  };
}

export async function listAssets(limit = 120) {
  return db.select().from(rdAssets).orderBy(desc(rdAssets.createdAt)).limit(limit);
}

/**
 * Verse un actif au graphe automobile partagé (point 63) — refusé si le droit
 * d'usage n'est pas établi. C'est le seul chemin par lequel une connaissance du
 * lab devient lisible par les autres moteurs.
 */
export async function shareAssetToGraph(input: {
  id: number;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string; nodeId: number | null }> {
  const [actif] = await db.select().from(rdAssets).where(eq(rdAssets.id, input.id)).limit(1);
  if (!actif) return { ok: false, detail: "Actif introuvable.", nodeId: null };
  if (actif.nodeId) {
    return {
      ok: false,
      detail: `Actif déjà versé au graphe (nœud #${actif.nodeId}).`,
      nodeId: actif.nodeId,
    };
  }
  if (!actif.shareable) {
    return {
      ok: false,
      detail:
        actif.blockedReason ??
        "Droit d'utilisation non établi : le versement au graphe partagé est refusé.",
      nodeId: null,
    };
  }

  const node = await upsertNode({
    domain: actif.domain,
    kind: "recherche",
    label: actif.title,
    summary: actif.summary ?? undefined,
    countryCode: actif.countryCode,
    dataClass: actif.dataClass === "licence" ? "licence" : actif.dataClass,
    learnedByEngine: "rd_lab",
  });

  await db
    .update(rdAssets)
    .set({ nodeId: node.id, updatedAt: new Date() })
    .where(eq(rdAssets.id, actif.id));

  await logActivity({
    action: "rd_actif_verse",
    userId: input.actorId,
    targetType: "rd_asset",
    targetId: actif.id,
    result: "ok",
    proposedDecision: `Actif versé au graphe partagé (nœud #${node.id}). Il reste non publié.`,
  });

  return {
    ok: true,
    detail: `Actif versé au graphe partagé (nœud #${node.id}). Il est lisible par les autres moteurs mais n'est pas publié.`,
    nodeId: node.id,
  };
}

// ─── Point 81 — écosystème pour un futur système embarqué ────────────────

/**
 * Compte ce que la plateforme peut déjà fournir dans un pays. Ce sont des
 * comptages réels ; les briques absentes sont nommées au lieu d'être passées
 * sous silence.
 */
export async function ecosystemSnapshot(
  countryCode: string,
  opts?: { save?: boolean },
): Promise<{
  countryCode: string;
  counts: Record<string, number>;
  missing: string[];
  detail: string;
}> {
  const code = countryCode.toUpperCase();
  const [pays] = await db
    .select({ code: countryCountries.code, name: countryCountries.nameFr })
    .from(countryCountries)
    .where(and(eq(countryCountries.code, code), eq(countryCountries.active, true)))
    .limit(1);
  if (!pays) {
    return {
      countryCode: code,
      counts: {},
      missing: EMBEDDED_MISSING,
      detail: `Pays ${code} non activé : aucun écosystème à relever. Aucun chiffre inventé.`,
    };
  }

  const [garagesRow] = await db
    .select({ n: count() })
    .from(garagesPublics)
    .where(and(eq(garagesPublics.country, code), eq(garagesPublics.status, "valide")));
  const [bornesRow] = await db
    .select({ n: count() })
    .from(chargingPoints)
    .where(eq(chargingPoints.countryCode, code));

  const counts: Record<string, number> = {
    garages_valides: Number(garagesRow?.n ?? 0),
    bornes_recharge: Number(bornesRow?.n ?? 0),
  };

  const detail =
    `Écosystème réellement disponible en ${pays.name} : ${counts.garages_valides} garage(s) validé(s), ` +
    `${counts.bornes_recharge} borne(s) de recharge. Manquent encore : ${EMBEDDED_MISSING.join(", ").replace(/_/g, " ")}. ` +
    `Aucune carte, aucun trafic et aucun itinéraire ne sont disponibles : aucune licence cartographique n'est enregistrée.`;

  if (opts?.save) {
    await db.insert(rdEcosystemSnapshots).values({
      countryCode: code,
      counts,
      missing: EMBEDDED_MISSING,
      detail,
    });
  }

  return { countryCode: code, counts, missing: EMBEDDED_MISSING, detail };
}

export async function listEcosystemSnapshots(limit = 40) {
  return db
    .select()
    .from(rdEcosystemSnapshots)
    .orderBy(desc(rdEcosystemSnapshots.createdAt))
    .limit(limit);
}

// ─── Statistiques & santé ────────────────────────────────────────────────

export async function rdStats() {
  const [projets] = await db
    .select({
      total: sql<number>`count(*)::int`,
      enCours: sql<number>`count(*) filter (where ${rdProjects.status} = 'en_cours')::int`,
      archives: sql<number>`count(*) filter (where ${rdProjects.status} = 'archive')::int`,
    })
    .from(rdProjects);

  const [actifs] = await db
    .select({
      total: sql<number>`count(*)::int`,
      partageables: sql<number>`count(*) filter (where ${rdAssets.shareable} = true)::int`,
      verses: sql<number>`count(*) filter (where ${rdAssets.nodeId} is not null)::int`,
      confidentiels: sql<number>`count(*) filter (where ${rdAssets.dataClass} in ('confidentielle','fournisseur'))::int`,
    })
    .from(rdAssets);

  const [maillons] = await db
    .select({
      total: sql<number>`count(*)::int`,
      renseignes: sql<number>`count(*) filter (where ${rdChainLinks.status} = 'renseigne')::int`,
    })
    .from(rdChainLinks);

  const attendus = (projets?.total ?? 0) * INDUSTRIAL_CHAIN.length;

  return {
    projets: projets ?? { total: 0, enCours: 0, archives: 0 },
    actifs: actifs ?? { total: 0, partageables: 0, verses: 0, confidentiels: 0 },
    chaines: {
      maillonsRenseignes: maillons?.renseignes ?? 0,
      maillonsEnregistres: maillons?.total ?? 0,
      maillonsAttendus: attendus,
      maillonsManquants: Math.max(0, attendus - (maillons?.total ?? 0)),
    },
    referentiels: {
      branches: Object.keys(RD_BRANCHES).length,
      domaines: RD_DOMAINS.length,
      maillons: INDUSTRIAL_CHAIN.length,
    },
  };
}

export async function rdLabHealth(): Promise<{ status: "ok" | "degraded" | "down"; detail: string }> {
  try {
    const s = await rdStats();
    return {
      status: "ok",
      detail:
        `${s.projets.total} projet(s) R&D, ${s.actifs.total} actif(s) déclaré(s) dont ` +
        `${s.actifs.confidentiels} non partageable(s) par nature et ${s.actifs.verses} versé(s) au graphe. ` +
        `${s.chaines.maillonsRenseignes}/${s.chaines.maillonsAttendus} maillon(s) industriel(s) réellement renseigné(s). ` +
        `Laboratoire séparé : aucune écriture dans les services commerciaux.`,
    };
  } catch (err) {
    return { status: "down", detail: (err as Error).message };
  }
}
